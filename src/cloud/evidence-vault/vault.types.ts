/**
 * Evidence Vault Types
 *
 * Cloud storage for tamper-evident Proof Packs with:
 * - Append-only storage
 * - Hash verification
 * - Retention policies
 *
 * @module cloud/evidence-vault
 * @since v2.1.0
 */

import type { ProofPack } from '../../modules/proof-pack/proof-pack.types.js';

// ============================================================================
// Cloud Configuration
// ============================================================================

/**
 * Cloud configuration interface
 * SECURITY: API key MUST be stored in environment variable, NOT in config file
 */
export interface CloudConfig {
  /** Enable cloud features */
  enabled: boolean;

  /** Cloud API endpoint */
  endpoint: string;

  /**
   * API key storage method
   * - 'env': Use process.env.CCG_CLOUD_API_KEY (recommended)
   * - 'keychain': Use system keychain (macOS/Windows)
   * - 'file': Store in file (NOT recommended, development only)
   */
  keyStorage: 'env' | 'keychain' | 'file';

  /** Organization ID for multi-tenant isolation */
  organizationId?: string;

  /** Request timeout in milliseconds */
  timeout?: number;
}

// ============================================================================
// Evidence Vault Types
// ============================================================================

/**
 * Stored Proof Pack with vault metadata
 */
export interface StoredProofPack {
  /** Proof Pack data */
  proofPack: ProofPack;

  /** Vault-assigned ID */
  vaultId: string;

  /** Storage timestamp (ISO 8601) */
  storedAt: string;

  /** Expiration timestamp based on retention policy */
  expiresAt?: string;

  /** Verification status */
  verified: boolean;

  /** Storage region (for compliance) */
  region?: string;

  /** Encryption status */
  encrypted: boolean;
}

/**
 * Proof Pack upload request
 */
export interface UploadRequest {
  /** Proof Pack to upload */
  proofPack: ProofPack;

  /** Optional tags for organization */
  tags?: string[];

  /** Custom retention period in days (default: 90) */
  retentionDays?: number;

  /** Repository context */
  repository?: {
    owner: string;
    name: string;
    ref?: string;
  };
}

/**
 * Proof Pack upload response
 */
export interface UploadResponse {
  /** Success status */
  success: boolean;

  /** Vault-assigned ID */
  vaultId: string;

  /** Hash verification passed */
  hashVerified: boolean;

  /** Storage timestamp */
  storedAt: string;

  /** Expiration timestamp */
  expiresAt: string;

  /** Error message if failed */
  error?: string;
}

/**
 * Query parameters for searching Proof Packs
 */
export interface QueryParams {
  /** Filter by repository */
  repository?: string;

  /** Filter by actor ID */
  actorId?: string;

  /** Filter by trust level */
  trustLevel?: 'LOCAL_UNSIGNED' | 'LOCAL_SIGNED' | 'CI_SIGNED';

  /** Filter by date range */
  dateRange?: {
    from: string;
    to: string;
  };

  /** Filter by TDI budget exceeded */
  budgetExceeded?: boolean;

  /** Filter by tags */
  tags?: string[];

  /** Pagination */
  limit?: number;
  offset?: number;

  /** Sort order */
  sortBy?: 'createdAt' | 'tdiScore' | 'repository';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Query response with pagination
 */
export interface QueryResponse {
  /** Matching Proof Packs */
  items: StoredProofPack[];

  /** Total count */
  total: number;

  /** Pagination info */
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Export format options
 */
export type ExportFormat = 'json' | 'csv' | 'pdf';

/**
 * Export request
 */
export interface ExportRequest {
  /** Query parameters to filter exports */
  query: QueryParams;

  /** Export format */
  format: ExportFormat;

  /** Include full Proof Pack data or summary only */
  includeFullData?: boolean;
}

/**
 * Export response
 */
export interface ExportResponse {
  /** Download URL (signed, expires in 1 hour) */
  downloadUrl: string;

  /** Export format */
  format: ExportFormat;

  /** Number of records exported */
  recordCount: number;

  /** File size in bytes */
  fileSize: number;

  /** Expiration timestamp for download URL */
  expiresAt: string;
}

// ============================================================================
// Retention Policy
// ============================================================================

/**
 * Retention policy configuration
 */
export interface RetentionPolicy {
  /** Default retention in days */
  defaultDays: number;

  /** Maximum retention in days */
  maxDays: number;

  /** Minimum retention in days (compliance) */
  minDays: number;

  /** Auto-delete expired records */
  autoDelete: boolean;

  /** Custom retention per repository pattern */
  overrides?: Record<string, number>;
}

// ============================================================================
// API Error Types
// ============================================================================

/**
 * API error response
 */
export interface ApiError {
  /** Error code */
  code:
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'HASH_MISMATCH'
    | 'QUOTA_EXCEEDED'
    | 'RATE_LIMITED'
    | 'VALIDATION_ERROR'
    | 'INTERNAL_ERROR';

  /** Human-readable message */
  message: string;

  /** Additional details */
  details?: Record<string, unknown>;

  /** Request ID for support */
  requestId?: string;
}

// ============================================================================
// Service Interface
// ============================================================================

/**
 * Evidence Vault Service Interface
 */
export interface IVaultService {
  /**
   * Upload a Proof Pack to the vault
   */
  upload(request: UploadRequest): Promise<UploadResponse>;

  /**
   * Verify a Proof Pack exists and is valid
   */
  verify(vaultId: string): Promise<{ valid: boolean; proofPack?: StoredProofPack }>;

  /**
   * Query stored Proof Packs
   */
  query(params: QueryParams): Promise<QueryResponse>;

  /**
   * Get a single Proof Pack by vault ID
   */
  get(vaultId: string): Promise<StoredProofPack | null>;

  /**
   * Export Proof Packs
   */
  export(request: ExportRequest): Promise<ExportResponse>;

  /**
   * Check vault connection and authentication
   */
  healthCheck(): Promise<{ healthy: boolean; latencyMs: number }>;
}
