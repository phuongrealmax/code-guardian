/**
 * Unit tests for VaultService
 *
 * @module tests/unit/cloud/vault.service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VaultService, createVaultService, DEFAULT_CLOUD_CONFIG } from '../../../src/cloud/evidence-vault/vault.service.js';
import type { CloudConfig, ProofPack } from '../../../src/cloud/evidence-vault/vault.types.js';

// Mock the HttpClient and AuthService
vi.mock('../../../src/cloud/api/client.js', () => ({
  createHttpClient: vi.fn(() => ({
    get: vi.fn(),
    post: vi.fn(),
  })),
  HttpClient: vi.fn(),
}));

vi.mock('../../../src/cloud/evidence-vault/auth.service.js', () => ({
  createAuthService: vi.fn(() => ({
    testAuth: vi.fn().mockResolvedValue({ success: true, token: 'test-token' }),
    getAuthHeader: vi.fn().mockResolvedValue('Bearer test-token'),
  })),
  AuthService: vi.fn(),
}));

// Mock integrity module
vi.mock('../../../src/modules/proof-pack/integrity.js', () => ({
  verifyProofPackHash: vi.fn(() => ({ ok: true, expected: 'hash', actual: 'hash' })),
}));

import { createHttpClient } from '../../../src/cloud/api/client.js';
import { verifyProofPackHash } from '../../../src/modules/proof-pack/integrity.js';

describe('VaultService', () => {
  const validApiKey = 'ccg_1234567890abcdef1234567890abcdef';

  const createConfig = (overrides: Partial<CloudConfig> = {}): CloudConfig => ({
    enabled: true,
    endpoint: 'https://api.codeguardian.studio',
    keyStorage: 'env',
    timeout: 30000,
    ...overrides,
  });

  const createMockProofPack = (): ProofPack => ({
    version: '1.1',
    id: 'pp_test123',
    createdAt: new Date().toISOString(),
    target: { filename: 'test.ts' },
    hashAlgorithm: 'SHA-256',
    canonicalization: 'json-stable-stringify@1',
    hash: 'testhash123',
    trustLevel: 'LOCAL_UNSIGNED',
    chainOfCustody: {
      actor: { type: 'user', id: 'u_123' },
      environment: {
        os: 'linux',
        ccgVersion: '2.1.0',
        nodeVersion: '20.0.0',
      },
      timestamp: new Date().toISOString(),
    },
    validation: { valid: true, errors: [], warnings: [] },
    metricsDelta: {
      tdi: { before: 50, after: 48, delta: -2, budgetExceeded: false },
    },
  });

  let mockHttpClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CCG_CLOUD_API_KEY = validApiKey;

    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
    };
    vi.mocked(createHttpClient).mockReturnValue(mockHttpClient as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully with valid config', async () => {
      const service = new VaultService(createConfig());

      await expect(service.initialize()).resolves.not.toThrow();
    });

    it('should throw error if cloud is disabled', async () => {
      const service = new VaultService(createConfig({ enabled: false }));

      await expect(service.initialize()).rejects.toThrow('Cloud features are disabled');
    });

    it('should throw error if endpoint not configured', async () => {
      const service = new VaultService(createConfig({ endpoint: '' }));

      await expect(service.initialize()).rejects.toThrow('Cloud endpoint not configured');
    });

    it('should not re-initialize if already initialized', async () => {
      const service = new VaultService(createConfig());

      await service.initialize();
      await service.initialize(); // Second call should not throw

      expect(service.getStatus().initialized).toBe(true);
    });
  });

  describe('upload', () => {
    it('should upload proof pack successfully', async () => {
      const proofPack = createMockProofPack();
      const uploadResponse = {
        success: true,
        vaultId: 'vault_123',
        hashVerified: true,
        storedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      };

      mockHttpClient.post.mockResolvedValueOnce({
        success: true,
        data: uploadResponse,
      });

      const service = new VaultService(createConfig());
      const result = await service.upload({ proofPack });

      expect(result.success).toBe(true);
      expect(result.vaultId).toBe('vault_123');
      expect(verifyProofPackHash).toHaveBeenCalled();
    });

    it('should fail upload if hash verification fails', async () => {
      vi.mocked(verifyProofPackHash).mockReturnValueOnce({
        ok: false,
        expected: 'expected-hash',
        actual: 'actual-hash',
      });

      const service = new VaultService(createConfig());
      const result = await service.upload({ proofPack: createMockProofPack() });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Hash verification failed');
    });

    it('should handle upload API error', async () => {
      mockHttpClient.post.mockResolvedValueOnce({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Server error' },
      });

      const service = new VaultService(createConfig());
      const result = await service.upload({ proofPack: createMockProofPack() });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
    });
  });

  describe('verify', () => {
    it('should verify proof pack successfully', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        success: true,
        data: { valid: true, proofPack: createMockProofPack() },
      });

      const service = new VaultService(createConfig());
      const result = await service.verify('vault_123');

      expect(result.valid).toBe(true);
      expect(result.proofPack).toBeDefined();
    });

    it('should handle verification failure', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Proof pack not found' },
      });

      const service = new VaultService(createConfig());
      const result = await service.verify('invalid_id');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Proof pack not found');
    });
  });

  describe('query', () => {
    it('should query proof packs with params', async () => {
      const mockItems = [createMockProofPack()];
      mockHttpClient.get.mockResolvedValueOnce({
        success: true,
        data: { items: mockItems, total: 1, limit: 20, offset: 0, hasMore: false },
      });

      const service = new VaultService(createConfig());
      const result = await service.query({
        repository: 'test-repo',
        limit: 20,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should build query string with all params', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        success: true,
        data: { items: [], total: 0, limit: 10, offset: 0, hasMore: false },
      });

      const service = new VaultService(createConfig());
      await service.query({
        repository: 'test-repo',
        actorId: 'user_123',
        trustLevel: 'CI_SIGNED',
        budgetExceeded: true,
        limit: 10,
        offset: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        tags: ['production', 'critical'],
        dateRange: { from: '2024-01-01', to: '2024-12-31' },
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('repository=test-repo')
      );
    });

    it('should return empty result on API error', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Query failed' },
      });

      const service = new VaultService(createConfig());
      const result = await service.query({});

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('get', () => {
    it('should get single proof pack by id', async () => {
      const proofPack = createMockProofPack();
      mockHttpClient.get.mockResolvedValueOnce({
        success: true,
        data: proofPack,
      });

      const service = new VaultService(createConfig());
      const result = await service.get('vault_123');

      expect(result).toBeDefined();
      expect(result?.id).toBe(proofPack.id);
    });

    it('should return null if not found', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Not found' },
      });

      const service = new VaultService(createConfig());
      const result = await service.get('invalid_id');

      expect(result).toBeNull();
    });
  });

  describe('export', () => {
    it('should export proof packs', async () => {
      mockHttpClient.post.mockResolvedValueOnce({
        success: true,
        data: {
          format: 'json',
          downloadUrl: 'https://storage.example.com/export.json',
          expiresAt: new Date().toISOString(),
          recordCount: 10,
        },
      });

      const service = new VaultService(createConfig());
      const result = await service.export({
        format: 'json',
        query: { repository: 'test-repo' },
      });

      expect(result.format).toBe('json');
      expect(result.downloadUrl).toBeDefined();
    });

    it('should throw error on export failure', async () => {
      mockHttpClient.post.mockResolvedValueOnce({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Export failed' },
      });

      const service = new VaultService(createConfig());

      await expect(service.export({ format: 'json', query: {} })).rejects.toThrow('Export failed');
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        success: true,
        data: { status: 'ok' },
        latencyMs: 50,
      });

      const service = new VaultService(createConfig());
      const result = await service.healthCheck();

      expect(result.healthy).toBe(true);
      expect(result.latencyMs).toBeDefined();
    });

    it('should return unhealthy on API failure', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Service unavailable' },
        latencyMs: 0,
      });

      const service = new VaultService(createConfig());
      const result = await service.healthCheck();

      expect(result.healthy).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle exception during health check', async () => {
      mockHttpClient.get.mockRejectedValueOnce(new Error('Network error'));

      const service = new VaultService(createConfig());
      const result = await service.healthCheck();

      expect(result.healthy).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('getStatus', () => {
    it('should return service status', () => {
      const config = createConfig();
      const service = new VaultService(config);
      const status = service.getStatus();

      expect(status.initialized).toBe(false);
      expect(status.enabled).toBe(true);
      expect(status.endpoint).toBe(config.endpoint);
    });
  });

  describe('createVaultService', () => {
    it('should create VaultService instance', () => {
      const service = createVaultService(createConfig());

      expect(service).toBeInstanceOf(VaultService);
    });
  });

  describe('DEFAULT_CLOUD_CONFIG', () => {
    it('should have cloud disabled by default', () => {
      expect(DEFAULT_CLOUD_CONFIG.enabled).toBe(false);
    });

    it('should use env for key storage by default', () => {
      expect(DEFAULT_CLOUD_CONFIG.keyStorage).toBe('env');
    });
  });
});
