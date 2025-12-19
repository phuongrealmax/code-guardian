/**
 * Unit tests for PolicyPackService
 *
 * @module tests/unit/policy-pack/service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PolicyPackService, createPolicyPackService } from '../../../src/modules/policy-pack/policy-pack.service.js';
import { generateKeyPair, signPolicy } from '../../../src/modules/policy-pack/signature.js';
import type { PolicyPack } from '../../../src/modules/policy-pack/policy-pack.types.js';
import { POLICY_SCHEMA_URL, DEFAULT_POLICY_RULES } from '../../../src/modules/policy-pack/policy-pack.types.js';

// Mock fs
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

describe('PolicyPackService', () => {
  const createTestPolicy = (overrides?: Partial<PolicyPack>): PolicyPack => ({
    $schema: POLICY_SCHEMA_URL,
    name: 'test-policy',
    version: '1.0.0',
    rules: {
      tdi: { maxBudget: 50, failOnExceed: true },
      coverage: { minDelta: 0, minTotal: 80 },
    },
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPolicy', () => {
    it('should return default policy when no local policy exists', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const service = new PolicyPackService();
      const policy = await service.getPolicy('test-repo');

      expect(policy).toBeDefined();
      expect(policy?.name).toBe('default');
    });

    it('should load local policy when it exists', async () => {
      const testPolicy = createTestPolicy();
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(testPolicy));

      const service = new PolicyPackService();
      const policy = await service.getPolicy('test-repo');

      expect(policy?.name).toBe('test-policy');
      expect(policy?.rules.tdi?.maxBudget).toBe(50);
    });

    it('should cache policy and return from cache', async () => {
      const testPolicy = createTestPolicy();
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(testPolicy));

      const service = new PolicyPackService();

      await service.getPolicy('test-repo');
      await service.getPolicy('test-repo');

      expect(readFile).toHaveBeenCalledTimes(1);
    });

    it('should fallback to default on invalid local policy', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFile).mockRejectedValue(new Error('Invalid JSON'));

      const service = new PolicyPackService();
      const policy = await service.getPolicy('test-repo');

      expect(policy?.name).toBe('default');
    });
  });

  describe('validatePolicy', () => {
    it('should validate valid policy', async () => {
      const service = new PolicyPackService();
      const policy = createTestPolicy();

      const result = await service.validatePolicy(policy);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject policy without name', async () => {
      const service = new PolicyPackService();
      const policy = createTestPolicy({ name: '' });

      const result = await service.validatePolicy(policy);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path === 'name')).toBe(true);
    });

    it('should reject policy without version', async () => {
      const service = new PolicyPackService();
      const policy = createTestPolicy({ version: '' });

      const result = await service.validatePolicy(policy);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path === 'version')).toBe(true);
    });

    it('should reject invalid semver version', async () => {
      const service = new PolicyPackService();
      const policy = createTestPolicy({ version: 'invalid' });

      const result = await service.validatePolicy(policy);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_FORMAT')).toBe(true);
    });

    it('should accept valid semver versions', async () => {
      const service = new PolicyPackService();

      for (const version of ['1.0.0', '2.3.4', '0.0.1', '1.0.0-beta', '1.0.0+build']) {
        const policy = createTestPolicy({ version });
        const result = await service.validatePolicy(policy);
        expect(result.valid).toBe(true);
      }
    });

    it('should warn on deprecated policy', async () => {
      const service = new PolicyPackService();
      const policy = createTestPolicy({ deprecated: true, replacedBy: 'new-policy' });

      const result = await service.validatePolicy(policy);

      expect(result.warnings.some((w) => w.code === 'DEPRECATED')).toBe(true);
    });

    it('should reject negative TDI maxBudget', async () => {
      const service = new PolicyPackService();
      const policy = createTestPolicy({
        rules: { tdi: { maxBudget: -10, failOnExceed: true } },
      });

      const result = await service.validatePolicy(policy);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path === 'rules.tdi.maxBudget')).toBe(true);
    });

    it('should warn on unusually high TDI maxBudget', async () => {
      const service = new PolicyPackService();
      const policy = createTestPolicy({
        rules: { tdi: { maxBudget: 150, failOnExceed: true } },
      });

      const result = await service.validatePolicy(policy);

      expect(result.warnings.some((w) => w.code === 'UNUSUAL_VALUE')).toBe(true);
    });

    it('should reject coverage minTotal out of range', async () => {
      const service = new PolicyPackService();
      const policy = createTestPolicy({
        rules: { coverage: { minDelta: 0, minTotal: 150 } },
      });

      const result = await service.validatePolicy(policy);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'OUT_OF_RANGE')).toBe(true);
    });

    it('should validate guard rules', async () => {
      const service = new PolicyPackService();
      const policy = createTestPolicy({
        rules: {
          guards: [
            { id: 'rule1', enabled: true, severity: 'error' },
            { id: '', enabled: true, severity: 'error' }, // Invalid
          ],
        },
      });

      const result = await service.validatePolicy(policy);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('guards'))).toBe(true);
    });
  });

  describe('verifySignature', () => {
    it('should verify valid signature', async () => {
      const keyPair = generateKeyPair();
      const policy = createTestPolicy();
      const signedPolicy = signPolicy(policy, keyPair.privateKey, keyPair.publicKey);

      const service = new PolicyPackService();
      const result = await service.verifySignature(signedPolicy);

      expect(result.valid).toBe(true);
    });

    it('should reject unsigned policy', async () => {
      const policy = createTestPolicy();

      const service = new PolicyPackService();
      const result = await service.verifySignature(policy);

      expect(result.valid).toBe(false);
    });

    it('should reject untrusted publisher when trustedPublicKeys configured', async () => {
      const keyPair = generateKeyPair();
      const otherKeyPair = generateKeyPair();
      const policy = createTestPolicy();
      const signedPolicy = signPolicy(policy, keyPair.privateKey, keyPair.publicKey);

      const service = new PolicyPackService({
        trustedPublicKeys: [otherKeyPair.publicKey],
      });
      const result = await service.verifySignature(signedPolicy);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('untrusted');
    });

    it('should accept trusted publisher', async () => {
      const keyPair = generateKeyPair();
      const policy = createTestPolicy();
      const signedPolicy = signPolicy(policy, keyPair.privateKey, keyPair.publicKey);

      const service = new PolicyPackService({
        trustedPublicKeys: [keyPair.publicKey],
      });
      const result = await service.verifySignature(signedPolicy);

      expect(result.valid).toBe(true);
    });
  });

  describe('mergeWithDefaults', () => {
    it('should merge policy rules with defaults', () => {
      const service = new PolicyPackService();
      const policy = createTestPolicy({
        rules: { tdi: { maxBudget: 30, failOnExceed: true } },
      });

      const merged = service.mergeWithDefaults(policy);

      expect(merged.tdi?.maxBudget).toBe(30);
      expect(merged.coverage).toBeDefined();
      expect(merged.complexity).toBeDefined();
    });

    it('should use default values for missing rules', () => {
      const service = new PolicyPackService();
      const policy = createTestPolicy({ rules: {} });

      const merged = service.mergeWithDefaults(policy);

      expect(merged.tdi?.maxBudget).toBe(DEFAULT_POLICY_RULES.tdi?.maxBudget);
    });
  });

  describe('clearCache', () => {
    it('should clear specific repository cache', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(createTestPolicy()));

      const service = new PolicyPackService();
      await service.getPolicy('repo1');
      await service.getPolicy('repo2');

      service.clearCache('repo1');

      expect(service.getCacheStatus().entries).not.toContain('repo1');
      expect(service.getCacheStatus().entries).toContain('repo2');
    });

    it('should clear all cache', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(createTestPolicy()));

      const service = new PolicyPackService();
      await service.getPolicy('repo1');
      await service.getPolicy('repo2');

      service.clearCache();

      expect(service.getCacheStatus().size).toBe(0);
    });
  });

  describe('getFingerprint', () => {
    it('should return policy fingerprint', () => {
      const service = new PolicyPackService();
      const policy = createTestPolicy();

      const fp = service.getFingerprint(policy);

      expect(fp.length).toBe(16);
    });
  });

  describe('listPolicies', () => {
    it('should list available policies', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(createTestPolicy()));

      const service = new PolicyPackService();
      const policies = await service.listPolicies();

      expect(policies.length).toBeGreaterThanOrEqual(1);
      expect(policies.some((p) => p.name === 'default')).toBe(true);
    });
  });

  describe('createPolicyPackService', () => {
    it('should create service instance', () => {
      const service = createPolicyPackService();

      expect(service).toBeInstanceOf(PolicyPackService);
    });

    it('should accept custom config', () => {
      const service = createPolicyPackService({
        cloudEnabled: true,
        localPolicyPath: 'custom/policy.json',
      });

      expect(service).toBeInstanceOf(PolicyPackService);
    });
  });
});
