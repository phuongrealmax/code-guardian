/**
 * Unit tests for AuthService
 *
 * @module tests/unit/cloud/auth.service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService, createAuthService } from '../../../src/cloud/evidence-vault/auth.service.js';
import type { CloudConfig } from '../../../src/cloud/evidence-vault/vault.types.js';

describe('AuthService', () => {
  const validApiKey = 'ccg_1234567890abcdef1234567890abcdef';
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createConfig = (overrides: Partial<CloudConfig> = {}): CloudConfig => ({
    enabled: true,
    endpoint: 'https://api.codeguardian.studio',
    keyStorage: 'env',
    timeout: 30000,
    ...overrides,
  });

  describe('getApiKey', () => {
    it('should get API key from environment variable', async () => {
      process.env.CCG_CLOUD_API_KEY = validApiKey;
      const service = new AuthService({ cloudConfig: createConfig() });

      const key = await service.getApiKey();

      expect(key).toBe(validApiKey);
    });

    it('should throw error if API key not found in env', async () => {
      delete process.env.CCG_CLOUD_API_KEY;
      const service = new AuthService({ cloudConfig: createConfig() });

      await expect(service.getApiKey()).rejects.toThrow(
        'API key not found. Set CCG_CLOUD_API_KEY environment variable'
      );
    });

    it('should throw error for invalid key prefix', async () => {
      process.env.CCG_CLOUD_API_KEY = 'invalid_1234567890abcdef1234567890';
      const service = new AuthService({ cloudConfig: createConfig() });

      await expect(service.getApiKey()).rejects.toThrow(
        'Invalid API key format. Key must start with "ccg_"'
      );
    });

    it('should throw error for key too short', async () => {
      process.env.CCG_CLOUD_API_KEY = 'ccg_short';
      const service = new AuthService({ cloudConfig: createConfig() });

      await expect(service.getApiKey()).rejects.toThrow(
        'Invalid API key format. Key must be at least 32 characters'
      );
    });

    it('should throw error for keychain storage (not implemented)', async () => {
      const service = new AuthService({
        cloudConfig: createConfig({ keyStorage: 'keychain' }),
      });

      await expect(service.getApiKey()).rejects.toThrow('Keychain storage not yet implemented');
    });

    it('should throw error for file storage (not implemented)', async () => {
      const service = new AuthService({
        cloudConfig: createConfig({ keyStorage: 'file' }),
      });

      await expect(service.getApiKey()).rejects.toThrow('File-based key storage not yet implemented');
    });

    it('should throw error for unknown storage method', async () => {
      const service = new AuthService({
        cloudConfig: createConfig({ keyStorage: 'unknown' as 'env' }),
      });

      await expect(service.getApiKey()).rejects.toThrow('Unknown key storage method: unknown');
    });
  });

  describe('hasValidToken', () => {
    it('should return false when no token cached', () => {
      const service = new AuthService({ cloudConfig: createConfig() });

      expect(service.hasValidToken()).toBe(false);
    });

    it('should return false after clearCache', () => {
      const service = new AuthService({ cloudConfig: createConfig() });
      service.clearCache();

      expect(service.hasValidToken()).toBe(false);
    });
  });

  describe('getAuthHeader', () => {
    it('should return Bearer token with API key', async () => {
      process.env.CCG_CLOUD_API_KEY = validApiKey;
      const service = new AuthService({ cloudConfig: createConfig() });

      const header = await service.getAuthHeader();

      expect(header).toBe(`Bearer ${validApiKey}`);
    });
  });

  describe('storeApiKey', () => {
    it('should validate key before storing for env storage', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const service = new AuthService({ cloudConfig: createConfig() });

      await service.storeApiKey(validApiKey, 'env');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('CCG_CLOUD_API_KEY='));
      consoleSpy.mockRestore();
    });

    it('should throw error for invalid key format when storing', async () => {
      const service = new AuthService({ cloudConfig: createConfig() });

      await expect(service.storeApiKey('short', 'env')).rejects.toThrow(
        'Invalid API key format'
      );
    });

    it('should throw error for keychain storage (not implemented)', async () => {
      const service = new AuthService({ cloudConfig: createConfig() });

      await expect(service.storeApiKey(validApiKey, 'keychain')).rejects.toThrow(
        'Keychain storage not yet implemented'
      );
    });
  });

  describe('testAuth', () => {
    it('should return success when API key is valid', async () => {
      process.env.CCG_CLOUD_API_KEY = validApiKey;
      const service = new AuthService({ cloudConfig: createConfig() });

      const result = await service.testAuth();

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
    });

    it('should return failure when API key is missing', async () => {
      delete process.env.CCG_CLOUD_API_KEY;
      const service = new AuthService({ cloudConfig: createConfig() });

      const result = await service.testAuth();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('UNAUTHORIZED');
    });

    it('should call onAuthFailure callback on failure', async () => {
      delete process.env.CCG_CLOUD_API_KEY;
      const onAuthFailure = vi.fn();
      const service = new AuthService({
        cloudConfig: createConfig(),
        onAuthFailure,
      });

      await service.testAuth();

      expect(onAuthFailure).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'UNAUTHORIZED' })
      );
    });
  });

  describe('createAuthService', () => {
    it('should create AuthService instance', () => {
      const service = createAuthService(createConfig());

      expect(service).toBeInstanceOf(AuthService);
    });
  });
});
