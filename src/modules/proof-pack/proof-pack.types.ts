// src/modules/proof-pack/proof-pack.types.ts
import { ValidationResult } from '../../core/types.js';

export type ProofTrustLevel = 'LOCAL_UNSIGNED' | 'LOCAL_SIGNED' | 'CI_SIGNED';

export interface ProofActor {
  type: 'user' | 'ci';
  id: string;
  displayName?: string;
}

export interface ProofEnvironment {
  runnerId?: string;
  os: string;
  ccgVersion: string;
  nodeVersion?: string;
  gitSha?: string;
}

export interface ChainOfCustody {
  actor: ProofActor;
  environment: ProofEnvironment;
  timestamp: string; // ISO 8601
}

// ═══════════════════════════════════════════════════════════════
//                 METRICS DELTA (REFINED for CI Gates)
// ═══════════════════════════════════════════════════════════════

export interface TDIMetrics {
  before: number;
  after: number;
  delta: number;
  budget?: number;          // From .ccg/budgets.yaml
  budgetExceeded: boolean;  // REQUIRED for CI gate
}

export interface CoverageMetrics {
  before: number;
  after: number;
  delta: number;
}

export interface HotspotMetrics {
  resolved: number;
  added: number;
  touched: string[];  // file paths
}

export interface IssueMetrics {
  before: number;
  after: number;
  delta: number;
}

export interface MetricsDelta {
  tdi: TDIMetrics;
  coverage?: CoverageMetrics;
  hotspots?: HotspotMetrics;
  issues?: IssueMetrics;
}

export interface ProofPack {
  version: '1.1';
  id: string;
  createdAt: string;
  target: { filename: string };

  // Integrity
  hashAlgorithm: 'SHA-256';
  canonicalization: 'json-stable-stringify@1';
  hash: string;

  // Signing (Sprint 1: optional local; required for CI/Cloud later)
  signatureAlgorithm?: 'Ed25519';
  signature?: string; // base64
  trustLevel: ProofTrustLevel;

  chainOfCustody: ChainOfCustody;

  // Payload - Use actual ValidationResult type
  validation: ValidationResult;
  metricsDelta: MetricsDelta;
}

export interface ProofPackVerifyInput {
  proofPack: ProofPack;
}

export interface ProofPackVerifyResult {
  verified: boolean;
  reason?: 'HASH_MISMATCH' | 'INVALID_SIGNATURE' | 'SCHEMA_INVALID';
  expectedHash?: string;
  actualHash?: string;
}

export interface ProofPackCreateInput {
  id: string;
  createdAt: string;
  filename: string;
  actor: ProofActor;
  environment: ProofEnvironment;
  timestamp: string; // chain timestamp
  validation: ValidationResult;
  metricsDelta: MetricsDelta;
  trustLevel: ProofTrustLevel;
  signatureAlgorithm?: 'Ed25519';
  signature?: string;
}

// ═══════════════════════════════════════════════════════════════
//                 MODULE CONFIG
// ═══════════════════════════════════════════════════════════════

export interface ProofPackModuleConfig {
  enabled: boolean;
  trustLevel: ProofTrustLevel;
  persistPath: string;
  autoGenerate: boolean;
}
