/**
 * Evidence Vault Service
 *
 * API client for storing and retrieving tamper-evident Proof Packs.
 *
 * Features:
 * - Append-only storage (immutable audit trail)
 * - Hash verification on upload
 * - Query and export capabilities
 * - Retention policy enforcement
 *
 * @module cloud/evidence-vault/vault
 * @since v2.1.0
 */

import type {
  CloudConfig,
  IVaultService,
  UploadRequest,
  UploadResponse,
  QueryParams,
  QueryResponse,
  ExportRequest,
  ExportResponse,
  StoredProofPack,
} from './vault.types.js';
import { AuthService, createAuthService } from './auth.service.js';
import { HttpClient, createHttpClient } from '../api/client.js';
import { verifyProofPackHash } from '../../modules/proof-pack/integrity.js';

// ============================================================================
// Constants
// ============================================================================

const API_VERSION = 'v1';
const ENDPOINTS = {
  upload: `/${API_VERSION}/proofpacks`,
  query: `/${API_VERSION}/proofpacks`,
  get: (id: string) => `/${API_VERSION}/proofpacks/${id}`,
  verify: (id: string) => `/${API_VERSION}/proofpacks/${id}/verify`,
  export: `/${API_VERSION}/proofpacks/export`,
  health: `/${API_VERSION}/health`,
};

// ============================================================================
// Vault Service
// ============================================================================

/**
 * Evidence Vault Service implementation
 */
export class VaultService implements IVaultService {
  private config: CloudConfig;
  private authService: AuthService;
  private httpClient: HttpClient;
  private initialized = false;

  constructor(config: CloudConfig) {
    this.config = config;
    this.authService = createAuthService(config);
    this.httpClient = createHttpClient({
      cloudConfig: config,
      authService: this.authService,
    });
  }

  /**
   * Initialize service (validate config and auth)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (!this.config.enabled) {
      throw new Error('Cloud features are disabled. Set cloud.enabled = true in config.');
    }

    if (!this.config.endpoint) {
      throw new Error('Cloud endpoint not configured');
    }

    // Test authentication
    const authResult = await this.authService.testAuth();
    if (!authResult.success) {
      throw new Error(`Authentication failed: ${authResult.error?.message}`);
    }

    this.initialized = true;
  }

  /**
   * Upload a Proof Pack to the vault
   */
  async upload(request: UploadRequest): Promise<UploadResponse> {
    await this.initialize();

    // Verify hash locally before upload
    const hashResult = verifyProofPackHash(request.proofPack as unknown as Record<string, unknown>);
    if (!hashResult.ok) {
      return {
        success: false,
        vaultId: '',
        hashVerified: false,
        storedAt: '',
        expiresAt: '',
        error: `Hash verification failed. Expected: ${hashResult.expected}, Actual: ${hashResult.actual}`,
      };
    }

    const response = await this.httpClient.post<UploadResponse>(ENDPOINTS.upload, {
      proofPack: request.proofPack,
      tags: request.tags,
      retentionDays: request.retentionDays,
      repository: request.repository,
    });

    if (!response.success || !response.data) {
      return {
        success: false,
        vaultId: '',
        hashVerified: false,
        storedAt: '',
        expiresAt: '',
        error: response.error?.message || 'Upload failed',
      };
    }

    return response.data;
  }

  /**
   * Verify a Proof Pack exists and is valid in the vault
   */
  async verify(
    vaultId: string
  ): Promise<{ valid: boolean; proofPack?: StoredProofPack; error?: string }> {
    await this.initialize();

    const response = await this.httpClient.get<{
      valid: boolean;
      proofPack?: StoredProofPack;
    }>(ENDPOINTS.verify(vaultId));

    if (!response.success) {
      return {
        valid: false,
        error: response.error?.message || 'Verification failed',
      };
    }

    return {
      valid: response.data?.valid ?? false,
      proofPack: response.data?.proofPack,
    };
  }

  /**
   * Query stored Proof Packs
   */
  async query(params: QueryParams): Promise<QueryResponse> {
    await this.initialize();

    // Build query string
    const queryParams = new URLSearchParams();

    if (params.repository) queryParams.set('repository', params.repository);
    if (params.actorId) queryParams.set('actorId', params.actorId);
    if (params.trustLevel) queryParams.set('trustLevel', params.trustLevel);
    if (params.budgetExceeded !== undefined)
      queryParams.set('budgetExceeded', String(params.budgetExceeded));
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.offset) queryParams.set('offset', String(params.offset));
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    if (params.tags?.length) queryParams.set('tags', params.tags.join(','));
    if (params.dateRange) {
      queryParams.set('from', params.dateRange.from);
      queryParams.set('to', params.dateRange.to);
    }

    const path = `${ENDPOINTS.query}?${queryParams.toString()}`;
    const response = await this.httpClient.get<QueryResponse>(path);

    if (!response.success || !response.data) {
      return {
        items: [],
        total: 0,
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
        hasMore: false,
      };
    }

    return response.data;
  }

  /**
   * Get a single Proof Pack by vault ID
   */
  async get(vaultId: string): Promise<StoredProofPack | null> {
    await this.initialize();

    const response = await this.httpClient.get<StoredProofPack>(ENDPOINTS.get(vaultId));

    if (!response.success || !response.data) {
      return null;
    }

    return response.data;
  }

  /**
   * Export Proof Packs
   */
  async export(request: ExportRequest): Promise<ExportResponse> {
    await this.initialize();

    const response = await this.httpClient.post<ExportResponse>(ENDPOINTS.export, request);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Export failed');
    }

    return response.data;
  }

  /**
   * Check vault connection and authentication
   */
  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    try {
      await this.initialize();

      const response = await this.httpClient.get<{ status: string }>(ENDPOINTS.health);

      return {
        healthy: response.success && response.data?.status === 'ok',
        latencyMs: response.latencyMs,
        error: response.error?.message,
      };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: 0,
        error: error instanceof Error ? error.message : 'Health check failed',
      };
    }
  }

  /**
   * Get service status
   */
  getStatus(): {
    initialized: boolean;
    enabled: boolean;
    endpoint: string;
  } {
    return {
      initialized: this.initialized,
      enabled: this.config.enabled,
      endpoint: this.config.endpoint,
    };
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create vault service instance
 */
export function createVaultService(config: CloudConfig): VaultService {
  return new VaultService(config);
}

/**
 * Default cloud config (disabled)
 */
export const DEFAULT_CLOUD_CONFIG: CloudConfig = {
  enabled: false,
  endpoint: 'https://api.codeguardian.studio',
  keyStorage: 'env',
  timeout: 30000,
};
