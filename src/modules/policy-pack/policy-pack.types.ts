/**
 * Policy Pack Types & Interfaces
 *
 * Defines the schema for Policy Packs used to configure Guard rules
 * across organizations, teams, and repositories.
 *
 * Schema Version: 1.1
 *
 * @module modules/policy-pack/types
 * @since v2.1.0
 */

// ============================================================================
// Policy Rules
// ============================================================================

/**
 * TDI (Technical Debt Index) rule configuration
 */
export interface TDIRule {
  /** Maximum allowed TDI score */
  maxBudget: number;
  /** Whether to fail CI if budget exceeded */
  failOnExceed: boolean;
  /** Per-path budget overrides */
  pathBudgets?: Record<string, number>;
}

/**
 * Code coverage rule configuration
 */
export interface CoverageRule {
  /** Minimum coverage delta (can be negative to allow decrease) */
  minDelta: number;
  /** Minimum total coverage percentage */
  minTotal: number;
  /** Fail CI if coverage decreases */
  failOnDecrease?: boolean;
}

/**
 * Complexity rule configuration
 */
export interface ComplexityRule {
  /** Maximum allowed complexity score */
  maxScore: number;
  /** Maximum nesting depth */
  maxNesting?: number;
  /** Maximum cyclomatic complexity */
  maxCyclomatic?: number;
}

/**
 * Guard rule configuration
 */
export interface GuardRule {
  /** Rule ID */
  id: string;
  /** Whether rule is enabled */
  enabled: boolean;
  /** Severity: error blocks, warning allows */
  severity: 'error' | 'warning';
  /** Rule-specific options */
  options?: Record<string, unknown>;
}

/**
 * All policy rules combined
 */
export interface PolicyRules {
  /** TDI budget rules */
  tdi?: TDIRule;
  /** Coverage rules */
  coverage?: CoverageRule;
  /** Complexity rules */
  complexity?: ComplexityRule;
  /** Individual guard rules */
  guards?: GuardRule[];
  /** Custom rules (extensible) */
  custom?: Record<string, unknown>;
}

// ============================================================================
// Policy Integrity
// ============================================================================

/**
 * Cryptographic integrity for Policy Pack
 */
export interface PolicyIntegrity {
  /** Hash algorithm used */
  hashAlgorithm: 'SHA-256';
  /** Signature algorithm */
  signatureAlgorithm: 'Ed25519';
  /** Base64-encoded signature */
  signature: string;
  /** Publisher public key (base64) */
  publicKey?: string;
  /** Signing timestamp */
  signedAt?: string;
}

// ============================================================================
// Policy Metadata
// ============================================================================

/**
 * Policy Pack publisher information
 */
export interface PolicyPublisher {
  /** Publisher ID */
  id: string;
  /** Display name */
  name: string;
  /** Verified publisher flag */
  verified?: boolean;
  /** Publisher URL */
  url?: string;
}

/**
 * Policy Pack scope (where it applies)
 */
export interface PolicyScope {
  /** Organization IDs */
  organizations?: string[];
  /** Team IDs */
  teams?: string[];
  /** Repository patterns (glob) */
  repositories?: string[];
  /** Branch patterns (glob) */
  branches?: string[];
}

/**
 * Policy Pack rollout configuration
 */
export interface PolicyRollout {
  /** Rollout strategy */
  strategy: 'immediate' | 'staged' | 'canary';
  /** Staged rollout percentage (0-100) */
  percentage?: number;
  /** Start date for staged rollout */
  startDate?: string;
  /** End date for staged rollout */
  endDate?: string;
}

// ============================================================================
// Policy Pack
// ============================================================================

/**
 * Policy Pack - Complete configuration for Guard rules
 *
 * @example
 * ```json
 * {
 *   "$schema": "https://codeguardian.studio/schemas/policy-pack-v1.1.json",
 *   "name": "typescript-strict",
 *   "version": "1.2.0",
 *   "rules": {
 *     "tdi": { "maxBudget": 40, "failOnExceed": true },
 *     "coverage": { "minDelta": 0, "minTotal": 80 }
 *   }
 * }
 * ```
 */
export interface PolicyPack {
  /** Schema URL for validation */
  $schema?: string;

  /** Unique policy pack name */
  name: string;

  /** Semantic version (e.g., "1.2.0") */
  version: string;

  /** Human-readable description */
  description?: string;

  /** Policy rules configuration */
  rules: PolicyRules;

  /** Cryptographic integrity (required for cloud policies) */
  integrity?: PolicyIntegrity;

  /** Publisher information */
  publisher?: PolicyPublisher;

  /** Scope where policy applies */
  scope?: PolicyScope;

  /** Rollout configuration */
  rollout?: PolicyRollout;

  /** Policy creation timestamp */
  createdAt?: string;

  /** Policy last update timestamp */
  updatedAt?: string;

  /** Whether this policy is deprecated */
  deprecated?: boolean;

  /** Replacement policy if deprecated */
  replacedBy?: string;

  /** Tags for categorization */
  tags?: string[];
}

// ============================================================================
// Policy Provider Interface
// ============================================================================

/**
 * Interface for policy providers (cloud or local)
 */
export interface IPolicyProvider {
  /** Get active policy for a repository */
  getPolicy(repository: string): Promise<PolicyPack | null>;

  /** List available policies */
  listPolicies(): Promise<PolicyPack[]>;

  /** Validate a policy pack */
  validatePolicy(policy: PolicyPack): Promise<PolicyValidationResult>;

  /** Check if policy is signed and valid */
  verifySignature(policy: PolicyPack): Promise<SignatureVerificationResult>;
}

/**
 * Policy validation result
 */
export interface PolicyValidationResult {
  valid: boolean;
  errors: PolicyValidationError[];
  warnings: PolicyValidationWarning[];
}

export interface PolicyValidationError {
  path: string;
  message: string;
  code: string;
}

export interface PolicyValidationWarning {
  path: string;
  message: string;
  code: string;
}

/**
 * Signature verification result
 */
export interface SignatureVerificationResult {
  valid: boolean;
  signer?: PolicyPublisher;
  signedAt?: string;
  error?: string;
}

// ============================================================================
// Policy Events
// ============================================================================

/**
 * Policy-related event types for EventBus
 */
export type PolicyEventType =
  | 'policy:loaded'
  | 'policy:updated'
  | 'policy:validated'
  | 'policy:signature_verified'
  | 'policy:signature_failed'
  | 'policy:applied'
  | 'policy:rollback';

/**
 * Policy loaded event payload
 */
export interface PolicyLoadedEvent {
  policy: PolicyPack;
  source: 'cloud' | 'local' | 'default';
  repository?: string;
}

/**
 * Policy applied event payload
 */
export interface PolicyAppliedEvent {
  policy: PolicyPack;
  previousPolicy?: PolicyPack;
  scope: PolicyScope;
}

// ============================================================================
// Constants
// ============================================================================

export const POLICY_SCHEMA_URL = 'https://codeguardian.studio/schemas/policy-pack-v1.1.json';
export const POLICY_VERSION = '1.1';

/**
 * Default policy rules (used when no policy is configured)
 */
export const DEFAULT_POLICY_RULES: PolicyRules = {
  tdi: {
    maxBudget: 70,
    failOnExceed: false,
  },
  coverage: {
    minDelta: 0,
    minTotal: 0,
  },
  complexity: {
    maxScore: 100,
  },
};

/**
 * Create a default policy pack
 */
export function createDefaultPolicy(name = 'default'): PolicyPack {
  return {
    $schema: POLICY_SCHEMA_URL,
    name,
    version: '1.0.0',
    description: 'Default CCG policy',
    rules: DEFAULT_POLICY_RULES,
    createdAt: new Date().toISOString(),
  };
}
