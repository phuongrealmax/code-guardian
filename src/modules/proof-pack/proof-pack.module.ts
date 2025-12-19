// src/modules/proof-pack/proof-pack.module.ts
import { EventBus } from '../../core/event-bus.js';
import { Logger } from '../../core/logger.js';
import { DefaultProofPackService, ProofPackService } from './proof-pack.service.js';
import {
  ProofPackModuleConfig,
  ProofPack,
  ProofPackVerifyResult,
  ProofTrustLevel,
  MetricsDelta,
} from './proof-pack.types.js';
import { TDIService, getTDIService } from './tdi.service.js';
import { ValidationResult } from '../../core/types.js';

// ═══════════════════════════════════════════════════════════════
//                      MCP TOOL DEFINITION
// ═══════════════════════════════════════════════════════════════

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
//                      PROOF PACK MODULE
// ═══════════════════════════════════════════════════════════════

export class ProofPackModule {
  private service: ProofPackService;
  private logger: Logger;
  private tdiService: TDIService;
  private projectRoot: string;

  constructor(
    private config: ProofPackModuleConfig,
    private eventBus: EventBus,
    parentLogger: Logger,
    projectRoot: string
  ) {
    this.logger = parentLogger.child('ProofPack');
    this.projectRoot = projectRoot;
    this.tdiService = getTDIService(projectRoot);

    // Create service with minimal dependencies for now
    // wrapValidation requires GuardService, but create/verify work standalone
    this.service = new DefaultProofPackService({
      eventBus: this.eventBus,
      guard: {
        // Placeholder - wrapValidation not used directly by MCP tools
        validate: async () => ({ valid: false, issues: [], blocked: false, suggestions: [] }),
      },
      metrics: {
        // Placeholder - wrapValidation not used directly by MCP tools
        compute: async () => this.createDefaultMetricsDelta(),
      },
      now: () => new Date().toISOString(),
      id: () => `pp_${Math.random().toString(16).slice(2)}_${Date.now()}`,
      trustLevel: () => this.config.trustLevel || 'LOCAL_UNSIGNED',
    });
  }

  /**
   * Initialize the module
   */
  async initialize(): Promise<void> {
    this.logger.info('ProofPack module initialized');
    await this.tdiService.loadBudgets();
  }

  /**
   * Shutdown the module
   */
  async shutdown(): Promise<void> {
    this.logger.info('ProofPack module shutdown');
  }

  /**
   * Get MCP tool definitions
   */
  getTools(): MCPTool[] {
    if (!this.config.enabled) {
      return [];
    }

    return [
      {
        name: 'proof_pack_create',
        description:
          'Create a tamper-evident Proof Pack with SHA-256 hash and chain-of-custody. Use this to create an immutable record of code validation.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            filename: {
              type: 'string',
              description: 'Target filename being validated',
            },
            validation: {
              type: 'object',
              description: 'Validation result from guard module',
            },
            metricsDelta: {
              type: 'object',
              description: 'Metrics delta (TDI, coverage, etc.)',
            },
            actor: {
              type: 'object',
              description: 'Actor info: { type: "user"|"ci", id: string, displayName?: string }',
            },
            environment: {
              type: 'object',
              description: 'Environment info: { os: string, ccgVersion: string, ... }',
            },
            trustLevel: {
              type: 'string',
              enum: ['LOCAL_UNSIGNED', 'LOCAL_SIGNED', 'CI_SIGNED'],
              description: 'Trust level for the proof pack',
            },
            persist: {
              type: 'boolean',
              description: 'Persist proof pack to .ccg/proofpacks/',
              default: false,
            },
          },
          required: ['filename', 'validation', 'actor', 'environment', 'trustLevel'],
        },
      },
      {
        name: 'proof_pack_verify',
        description:
          'Verify a Proof Pack hash integrity. Returns verification result with reason if failed.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            proofPack: {
              type: 'object',
              description: 'Inline proof pack object to verify',
            },
            filePath: {
              type: 'string',
              description: 'Path to proof pack JSON file',
            },
          },
        },
      },
      {
        name: 'proof_tdi_calculate',
        description:
          'Calculate TDI (Technical Debt Index) for code metrics. Returns TDI score and budget check result.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            filename: {
              type: 'string',
              description: 'File path to calculate TDI for',
            },
            metrics: {
              type: 'object',
              description: 'Code metrics: { lines, complexity, nesting, issues, coverage }',
              properties: {
                lines: { type: 'number' },
                complexity: { type: 'number' },
                nesting: { type: 'number', description: 'Max nesting depth' },
                issues: { type: 'number', description: 'Number of issues found' },
                coverage: { type: 'number', description: 'Test coverage (0-100)' },
              },
              required: ['lines', 'complexity'],
            },
          },
          required: ['filename', 'metrics'],
        },
      },
      {
        name: 'proof_tdi_check_budget',
        description:
          'Check if TDI score exceeds budget for a given path. Use this in CI to block PRs.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            path: {
              type: 'string',
              description: 'File or folder path',
            },
            tdiScore: {
              type: 'number',
              description: 'TDI score to check against budget',
            },
          },
          required: ['path', 'tdiScore'],
        },
      },
    ];
  }

  /**
   * Handle MCP tool call
   */
  async handleTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    if (!this.config.enabled) {
      return { error: 'ProofPack module is disabled' };
    }

    // Extract action from tool name (proof_pack_create -> pack_create)
    const action = toolName.replace('proof_', '');

    switch (action) {
      case 'pack_create':
        return this.handleCreate(args);

      case 'pack_verify':
        return this.handleVerify(args);

      case 'tdi_calculate':
        return this.handleTDICalculate(args);

      case 'tdi_check_budget':
        return this.handleTDICheckBudget(args);

      default:
        throw new Error(`Unknown proof-pack tool: ${toolName}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //                      TOOL HANDLERS
  // ═══════════════════════════════════════════════════════════════

  private async handleCreate(args: Record<string, unknown>): Promise<unknown> {
    const filename = args.filename as string;
    const validation = args.validation as ValidationResult;
    const metricsDelta = (args.metricsDelta as MetricsDelta) || this.createDefaultMetricsDelta();
    const actor = args.actor as { type: 'user' | 'ci'; id: string; displayName?: string };
    const environment = args.environment as { os: string; ccgVersion: string; runnerId?: string; nodeVersion?: string; gitSha?: string };
    const trustLevel = args.trustLevel as ProofTrustLevel;
    const persist = args.persist as boolean | undefined;

    const createdAt = new Date().toISOString();
    const id = `pp_${Math.random().toString(16).slice(2)}_${Date.now()}`;

    const proofPack = await this.service.create({
      id,
      createdAt,
      filename,
      actor,
      environment,
      timestamp: createdAt,
      validation,
      metricsDelta,
      trustLevel,
    });

    let persistResult = { persisted: false, filePath: undefined as string | undefined };
    if (persist) {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const dir = path.join(this.projectRoot, '.ccg', 'proofpacks');
      await fs.mkdir(dir, { recursive: true });
      const filePath = path.join(dir, `${proofPack.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(proofPack, null, 2), 'utf8');
      persistResult = { persisted: true, filePath };
    }

    this.logger.info(`Created ProofPack: ${proofPack.id} for ${filename}`);

    return {
      ok: true,
      proofPack,
      ...persistResult,
    };
  }

  private async handleVerify(args: Record<string, unknown>): Promise<unknown> {
    let proofPack: ProofPack;

    if (args.proofPack) {
      proofPack = args.proofPack as ProofPack;
    } else if (typeof args.filePath === 'string') {
      const fs = await import('node:fs/promises');
      const raw = await fs.readFile(args.filePath, 'utf8');
      proofPack = JSON.parse(raw) as ProofPack;
    } else {
      throw new Error('Provide either proofPack or filePath');
    }

    const result: ProofPackVerifyResult = await this.service.verify({ proofPack });

    this.logger.info(`Verified ProofPack: ${proofPack.id} - ${result.verified ? 'VALID' : 'INVALID'}`);

    return {
      ok: true,
      result,
    };
  }

  private async handleTDICalculate(args: Record<string, unknown>): Promise<unknown> {
    const filename = args.filename as string;
    const metrics = args.metrics as {
      lines: number;
      complexity: number;
      nesting?: number;
      issues?: number;
      coverage?: number;
    };

    const result = this.tdiService.calculateTDI({
      lines: metrics.lines,
      complexity: metrics.complexity,
      nesting: metrics.nesting || 0,
      issues: metrics.issues || 0,
      coverage: metrics.coverage,
    });

    const budgetCheck = this.tdiService.checkBudget(filename, result.score);

    return {
      ok: true,
      filename,
      tdi: result,
      budget: budgetCheck,
    };
  }

  private async handleTDICheckBudget(args: Record<string, unknown>): Promise<unknown> {
    const filePath = args.path as string;
    const score = args.tdiScore as number;

    const result = this.tdiService.checkBudget(filePath, score);

    return {
      ok: true,
      ...result,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  //                      HELPERS
  // ═══════════════════════════════════════════════════════════════

  private createDefaultMetricsDelta(): MetricsDelta {
    return {
      tdi: {
        before: 0,
        after: 0,
        delta: 0,
        budgetExceeded: false,
      },
    };
  }

  /**
   * Get the underlying service for advanced use cases
   */
  getService(): ProofPackService {
    return this.service;
  }

  /**
   * Get TDI service
   */
  getTDIService(): TDIService {
    return this.tdiService;
  }
}
