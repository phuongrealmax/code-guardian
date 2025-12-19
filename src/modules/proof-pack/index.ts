// src/modules/proof-pack/index.ts

// Re-export all public types
export type {
  ProofPack,
  ProofPackCreateInput,
  ProofPackVerifyInput,
  ProofPackVerifyResult,
  ProofTrustLevel,
  ProofActor,
  ProofEnvironment,
  ChainOfCustody,
  MetricsDelta,
  TDIMetrics,
  CoverageMetrics,
  HotspotMetrics,
  IssueMetrics,
  ProofPackModuleConfig,
} from './proof-pack.types.js';

// Re-export service
export {
  DefaultProofPackService,
} from './proof-pack.service.js';

export type {
  ProofPackService,
  WrapValidationInput,
  WrapValidationOutput,
  GuardLike,
  MetricsDeltaProvider,
} from './proof-pack.service.js';

// Re-export integrity utilities
export {
  stableStringify,
  sha256Hex,
  computeProofPackHash,
  verifyProofPackHash,
  canonicalizeForProofPackHash,
} from './integrity.js';

export type { HashAlgorithm } from './integrity.js';

// Re-export tools
export { getProofPackTools } from './proof-pack.tools.js';

export type { ToolDefinition, ToolContext } from './proof-pack.tools.js';

// Re-export TDI service
export {
  TDIService,
  getTDIService,
  resetTDIService,
} from './tdi.service.js';

export type {
  BudgetConfig,
  TDICalculationInput,
  TDICalculationResult,
  BudgetCheckResult,
} from './tdi.service.js';

// Re-export module class
export { ProofPackModule } from './proof-pack.module.js';

// Default config
export const DEFAULT_PROOF_PACK_CONFIG = {
  enabled: true,
  trustLevel: 'LOCAL_UNSIGNED' as const,
  persistPath: '.ccg/proofpacks',
  autoGenerate: false,
};
