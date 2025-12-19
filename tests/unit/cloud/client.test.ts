/**
 * Unit tests for HttpClient
 *
 * @module tests/unit/cloud/client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient, createHttpClient } from '../../../src/cloud/api/client.js';
import { AuthService } from '../../../src/cloud/evidence-vault/auth.service.js';
import type { CloudConfig } from '../../../src/cloud/evidence-vault/vault.types.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('HttpClient', () => {
  const validApiKey = 'ccg_1234567890abcdef1234567890abcdef';

  const createConfig = (): CloudConfig => ({
    enabled: true,
    endpoint: 'https://api.codeguardian.studio',
    keyStorage: 'env',
    timeout: 5000,
  });

  const createMockAuthService = (): AuthService => {
    const mockAuth = {
      getAuthHeader: vi.fn().mockResolvedValue(`Bearer ${validApiKey}`),
    } as unknown as AuthService;
    return mockAuth;
  };

  beforeEach(() => {
    mockFetch.mockReset();
    process.env.CCG_CLOUD_API_KEY = validApiKey;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('request', () => {
    it('should make successful GET request', async () => {
      const responseData = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['x-request-id', 'req-123']]),
        json: () => Promise.resolve(responseData),
      });

      const client = new HttpClient({
        cloudConfig: createConfig(),
        authService: createMockAuthService(),
      });

      const response = await client.get<typeof responseData>('/test');

      expect(response.success).toBe(true);
      expect(response.data).toEqual(responseData);
      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.codeguardian.studio/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${validApiKey}`,
          }),
        })
      );
    });

    it('should make successful POST request with body', async () => {
      const requestBody = { name: 'test' };
      const responseData = { id: 1 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Map(),
        json: () => Promise.resolve(responseData),
      });

      const client = new HttpClient({
        cloudConfig: createConfig(),
        authService: createMockAuthService(),
      });

      const response = await client.post<typeof responseData>('/test', requestBody);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.codeguardian.studio/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );
    });

    it('should handle 401 unauthorized error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Map(),
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      });

      const client = new HttpClient({
        cloudConfig: createConfig(),
        authService: createMockAuthService(),
      });

      const response = await client.get('/test');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('UNAUTHORIZED');
      expect(response.status).toBe(401);
    });

    it('should handle 404 not found error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Map(),
        json: () => Promise.resolve({ message: 'Not found' }),
      });

      const client = new HttpClient({
        cloudConfig: createConfig(),
        authService: createMockAuthService(),
      });

      const response = await client.get('/test');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('NOT_FOUND');
    });

    it('should handle 429 rate limit with retry', async () => {
      // First call returns 429, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Map(),
          json: () => Promise.resolve({ message: 'Rate limited' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map(),
          json: () => Promise.resolve({ data: 'success' }),
        });

      const client = new HttpClient({
        cloudConfig: createConfig(),
        authService: createMockAuthService(),
      });

      const response = await client.request({
        method: 'GET',
        path: '/test',
        retries: 1,
      });

      expect(response.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    }, 10000);

    it('should handle 500 server error with retry', async () => {
      // All calls return 500
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Map(),
        json: () => Promise.resolve({ message: 'Server error' }),
      });

      const client = new HttpClient({
        cloudConfig: createConfig(),
        authService: createMockAuthService(),
      });

      const response = await client.request({
        method: 'GET',
        path: '/test',
        retries: 2,
      });

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('INTERNAL_ERROR');
      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    }, 15000);

    it('should not retry 400 client errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Map(),
        json: () => Promise.resolve({ code: 'VALIDATION_ERROR', message: 'Invalid input' }),
      });

      const client = new HttpClient({
        cloudConfig: createConfig(),
        authService: createMockAuthService(),
      });

      const response = await client.request({
        method: 'POST',
        path: '/test',
        retries: 3,
      });

      expect(response.success).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retries for 400
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const client = new HttpClient({
        cloudConfig: createConfig(),
        authService: createMockAuthService(),
      });

      const response = await client.request({
        method: 'GET',
        path: '/test',
        retries: 0,
      });

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('INTERNAL_ERROR');
      expect(response.error?.message).toBe('Network error');
    });

    it('should handle timeout via AbortError', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      const client = new HttpClient({
        cloudConfig: createConfig(),
        authService: createMockAuthService(),
      });

      const response = await client.request({
        method: 'GET',
        path: '/test',
        retries: 0,
        timeout: 100,
      });

      expect(response.success).toBe(false);
      expect(response.error?.message).toBe('Request timeout');
    });

    it('should include latencyMs in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: () => Promise.resolve({ data: 'test' }),
      });

      const client = new HttpClient({
        cloudConfig: createConfig(),
        authService: createMockAuthService(),
      });

      const response = await client.get('/test');

      expect(response.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map(),
        json: () => Promise.resolve({}),
      });
    });

    it('should call PUT method', async () => {
      const client = new HttpClient({
        cloudConfig: createConfig(),
        authService: createMockAuthService(),
      });

      await client.put('/test', { data: 'test' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should call DELETE method', async () => {
      const client = new HttpClient({
        cloudConfig: createConfig(),
        authService: createMockAuthService(),
      });

      await client.delete('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('createHttpClient', () => {
    it('should create HttpClient instance', () => {
      const client = createHttpClient({
        cloudConfig: createConfig(),
        authService: createMockAuthService(),
      });

      expect(client).toBeInstanceOf(HttpClient);
    });
  });
});
