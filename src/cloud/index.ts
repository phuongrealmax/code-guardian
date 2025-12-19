/**
 * Cloud Module
 *
 * Provides cloud connectivity for CCG features:
 * - Evidence Vault: Tamper-evident Proof Pack storage
 * - Policy Hub: Centralized policy management (Sprint 3)
 * - Insights: Anonymized analytics (Sprint 4)
 *
 * @module cloud
 * @since v2.1.0
 */

// Evidence Vault
export type {
  CloudConfig,
  StoredProofPack,
  UploadRequest,
  UploadResponse,
  QueryParams,
  QueryResponse,
  ExportFormat,
  ExportRequest,
  ExportResponse,
  RetentionPolicy,
  ApiError,
  IVaultService,
} from './evidence-vault/vault.types.js';

export { VaultService, createVaultService, DEFAULT_CLOUD_CONFIG } from './evidence-vault/vault.service.js';

export { AuthService, createAuthService } from './evidence-vault/auth.service.js';
export type { AuthResult, AuthServiceConfig } from './evidence-vault/auth.service.js';

// API Client
export { HttpClient, createHttpClient } from './api/client.js';
export type { RequestOptions, ApiResponse, ClientConfig } from './api/client.js';

// ============================================================================
// Cloud Module Class
// ============================================================================

import type { CloudConfig } from './evidence-vault/vault.types.js';
import { VaultService, createVaultService, DEFAULT_CLOUD_CONFIG } from './evidence-vault/vault.service.js';

/**
 * Cloud Module - manages all cloud services
 */
export class CloudModule {
  private config: CloudConfig;
  private vaultService: VaultService | null = null;

  constructor(config: Partial<CloudConfig> = {}) {
    this.config = { ...DEFAULT_CLOUD_CONFIG, ...config };
  }

  /**
   * Get Evidence Vault service
   */
  getVaultService(): VaultService {
    if (!this.vaultService) {
      this.vaultService = createVaultService(this.config);
    }
    return this.vaultService;
  }

  /**
   * Check if cloud features are enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get cloud configuration
   */
  getConfig(): CloudConfig {
    return { ...this.config };
  }

  /**
   * Update cloud configuration
   */
  updateConfig(config: Partial<CloudConfig>): void {
    this.config = { ...this.config, ...config };
    // Reset services to use new config
    this.vaultService = null;
  }

  /**
   * Get module status
   */
  getStatus(): {
    enabled: boolean;
    endpoint: string;
    vaultInitialized: boolean;
  } {
    return {
      enabled: this.config.enabled,
      endpoint: this.config.endpoint,
      vaultInitialized: this.vaultService?.getStatus().initialized ?? false,
    };
  }
}

/**
 * Create cloud module instance
 */
export function createCloudModule(config?: Partial<CloudConfig>): CloudModule {
  return new CloudModule(config);
}
