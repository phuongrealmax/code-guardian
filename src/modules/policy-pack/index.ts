/**
 * Policy Pack Module
 *
 * Provides Policy Pack management for configuring Guard rules
 * across organizations, teams, and repositories.
 *
 * @module modules/policy-pack
 * @since v2.1.0
 */

// Types
export type {
  PolicyPack,
  PolicyRules,
  TDIRule,
  CoverageRule,
  ComplexityRule,
  GuardRule,
  PolicyIntegrity,
  PolicyPublisher,
  PolicyScope,
  PolicyRollout,
  IPolicyProvider,
  PolicyValidationResult,
  PolicyValidationError,
  PolicyValidationWarning,
  SignatureVerificationResult,
  PolicyEventType,
  PolicyLoadedEvent,
  PolicyAppliedEvent,
} from './policy-pack.types.js';

// Constants
export {
  POLICY_SCHEMA_URL,
  POLICY_VERSION,
  DEFAULT_POLICY_RULES,
  createDefaultPolicy,
} from './policy-pack.types.js';

// Signature utilities
export {
  generateKeyPair,
  signPolicy,
  verifyPolicySignature,
  isTrustedPolicy,
  isSigned,
  getPolicyFingerprint,
  computePolicyHash,
  canonicalize,
  sha256,
} from './signature.js';

export type { Ed25519KeyPair } from './signature.js';

// Service
export {
  PolicyPackService,
  createPolicyPackService,
} from './policy-pack.service.js';

export type { PolicyPackServiceConfig } from './policy-pack.service.js';
