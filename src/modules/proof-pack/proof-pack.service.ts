// src/modules/proof-pack/proof-pack.service.ts
import { EventBus } from '../../core/event-bus.js';
import { ValidationResult } from '../../core/types.js';
import { ValidateOptions } from '../guard/guard.types.js';
import {
  ProofPack,
  ProofPackCreateInput,
  ProofPackVerifyInput,
  ProofPackVerifyResult,
  MetricsDelta,
  ProofActor,
  ProofEnvironment,
  ProofTrustLevel,
} from './proof-pack.types.js';
import { computeProofPackHash, verifyProofPackHash } from './integrity.js';

// ═══════════════════════════════════════════════════════════════
//                 SERVICE INTERFACE
// ═══════════════════════════════════════════════════════════════

export interface ProofPackService {
  wrapValidation(input: WrapValidationInput): Promise<WrapValidationOutput>;
  create(input: ProofPackCreateInput): Promise<ProofPack>;
  verify(input: ProofPackVerifyInput): Promise<ProofPackVerifyResult>;
}

export interface WrapValidationInput {
  code: string;
  filename: string;
  validateOptions?: ValidateOptions;  // Use actual type
  actor: ProofActor;
  environment: ProofEnvironment;
  sessionId?: string;
}

export interface WrapValidationOutput {
  validationResult: ValidationResult;  // Use actual type
  proofPack: ProofPack;
}

// ═══════════════════════════════════════════════════════════════
//                 GUARD INTERFACE (Match actual signature)
// ═══════════════════════════════════════════════════════════════

/**
 * Guard service interface matching actual guard.service.ts:209-213
 */
export interface GuardLike {
  validate(
    code: string,
    filename: string,
    options?: ValidateOptions
  ): Promise<ValidationResult>;
}

export interface MetricsDeltaProvider {
  compute(input: {
    code: string;
    filename: string;
    validationResult: ValidationResult;
  }): Promise<MetricsDelta>;
}

// ═══════════════════════════════════════════════════════════════
//                 SERVICE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════

export class DefaultProofPackService implements ProofPackService {
  constructor(
    private readonly deps: {
      eventBus: EventBus;
      guard: GuardLike;
      metrics: MetricsDeltaProvider;
      now: () => string; // ISO clock
      id: () => string;  // id generator
      trustLevel: () => ProofTrustLevel;
    }
  ) {}

  async wrapValidation(input: WrapValidationInput): Promise<WrapValidationOutput> {
    try {
      // CORRECT: Direct positional call matching guard.service.ts signature
      const validationResult = await this.deps.guard.validate(
        input.code,
        input.filename,
        input.validateOptions ?? {}
      );

      const metricsDelta = await this.deps.metrics.compute({
        code: input.code,
        filename: input.filename,
        validationResult,
      });

      const createdAt = this.deps.now();
      const proofPack = await this.create({
        id: this.deps.id(),
        createdAt,
        filename: input.filename,
        actor: input.actor,
        environment: input.environment,
        timestamp: createdAt,
        validation: validationResult,
        metricsDelta,
        trustLevel: this.deps.trustLevel(),
      });

      // Emit event using CCGEvent format
      this.deps.eventBus.emit({
        type: 'proofpack:created',
        timestamp: new Date(),
        data: {
          proofPackId: proofPack.id,
          filename: input.filename,
          hash: proofPack.hash,
          trustLevel: proofPack.trustLevel,
          sessionId: input.sessionId,
        },
        source: 'ProofPackService',
      });

      return { validationResult, proofPack };
    } catch (e: unknown) {
      const error = e as Error;
      this.deps.eventBus.emit({
        type: 'proofpack:failed',
        timestamp: new Date(),
        data: {
          stage: 'WRAP_VALIDATION' as const,
          errorCode: 'WRAP_VALIDATION_FAILED',
          message: error?.message ?? String(e),
          filename: input.filename,
          sessionId: input.sessionId,
        },
        source: 'ProofPackService',
      });
      throw e;
    }
  }

  async create(input: ProofPackCreateInput): Promise<ProofPack> {
    const packNoHash: Omit<ProofPack, 'hash'> = {
      version: '1.1',
      id: input.id,
      createdAt: input.createdAt,
      target: { filename: input.filename },

      hashAlgorithm: 'SHA-256',
      canonicalization: 'json-stable-stringify@1',

      trustLevel: input.trustLevel,
      signatureAlgorithm: input.signatureAlgorithm,
      signature: input.signature,

      chainOfCustody: {
        actor: input.actor,
        environment: input.environment,
        timestamp: input.timestamp,
      },

      validation: input.validation,
      metricsDelta: input.metricsDelta,
    };

    const hash = computeProofPackHash(packNoHash as Record<string, unknown>);
    const pack: ProofPack = { ...packNoHash, hash };

    return pack;
  }

  async verify(input: ProofPackVerifyInput): Promise<ProofPackVerifyResult> {
    try {
      const { ok, expected, actual } = verifyProofPackHash(input.proofPack as unknown as Record<string, unknown>);

      if (!ok) {
        const res: ProofPackVerifyResult = {
          verified: false,
          reason: 'HASH_MISMATCH',
          expectedHash: expected,
          actualHash: actual,
        };
        this.deps.eventBus.emit({
          type: 'proofpack:verified',
          timestamp: new Date(),
          data: {
            proofPackId: input.proofPack.id,
            verified: false,
            reason: 'HASH_MISMATCH' as const,
          },
          source: 'ProofPackService',
        });
        return res;
      }

      this.deps.eventBus.emit({
        type: 'proofpack:verified',
        timestamp: new Date(),
        data: {
          proofPackId: input.proofPack.id,
          verified: true,
        },
        source: 'ProofPackService',
      });

      return { verified: true };
    } catch (e: unknown) {
      const error = e as Error;
      this.deps.eventBus.emit({
        type: 'proofpack:failed',
        timestamp: new Date(),
        data: {
          stage: 'VERIFY' as const,
          errorCode: 'VERIFY_FAILED',
          message: error?.message ?? String(e),
        },
        source: 'ProofPackService',
      });
      throw e;
    }
  }
}
