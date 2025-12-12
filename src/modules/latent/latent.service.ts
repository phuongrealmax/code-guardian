// src/modules/latent/latent.service.ts

/**
 * Latent Context Service
 *
 * Manages AgentLatentContext - the KV cache-like structure for
 * hidden-state reasoning in Latent Chain Mode.
 *
 * Key features:
 * - Context CRUD operations
 * - Delta merging (not full replacement)
 * - Phase transitions
 * - Patch application
 * - History tracking
 */

import { EventBus } from '../../core/event-bus.js';
import { Logger } from '../../core/logger.js';
import { v4 as uuid } from 'uuid';

import { PatchApplicator } from './latent-patch.js';
import { DeltaMerger } from './latent-delta.js';
import { ContextPersistence } from './latent-persistence.js';
import {
  DiffEditor,
  DiffEditResult,
  DiffEditorConfig,
  ConfirmRequest,
} from './diff-editor.js';

import {
  AgentLatentContext,
  LatentPhase,
  LatentDecision,
  LatentResponse,
  LatentModuleConfig,
  LatentModuleStatus,
  CreateContextParams,
  UpdateContextParams,
  ApplyPatchParams,
  GetContextParams,
  TransitionPhaseParams,
  ContextHistoryEntry,
  LatentContextWithHistory,
  LatentValidationResult,
  LatentValidationError,
  AppliedPatch,
} from './latent.types.js';

/**
 * LatentService - Core service for Latent Chain Mode
 */
export class LatentService {
  private contexts: Map<string, AgentLatentContext> = new Map();
  private history: Map<string, ContextHistoryEntry[]> = new Map();
  private config: LatentModuleConfig;
  private eventBus: EventBus;
  private logger: Logger;
  private projectRoot: string;

  // Extracted helpers
  private patchApplicator: PatchApplicator;
  private deltaMerger: DeltaMerger;
  private persistence?: ContextPersistence;
  private diffEditor: DiffEditor;

  // Cleanup interval reference (to clear on shutdown)
  private cleanupInterval?: ReturnType<typeof setInterval>;

  // Statistics
  private stats = {
    totalCreated: 0,
    totalDeltasMerged: 0,
    totalPatchesApplied: 0,
    phaseStats: {
      analysis: 0,
      plan: 0,
      impl: 0,
      review: 0,
    } as Record<LatentPhase, number>,
  };

  constructor(
    config: LatentModuleConfig,
    eventBus: EventBus,
    logger: Logger,
    projectRoot: string
  ) {
    this.config = config;
    this.eventBus = eventBus;
    this.logger = logger;
    this.projectRoot = projectRoot;

    // Initialize extracted helpers
    this.patchApplicator = new PatchApplicator(projectRoot, logger);
    this.deltaMerger = new DeltaMerger();
    this.diffEditor = new DiffEditor(projectRoot, logger);
    if (config.persist && config.persistPath) {
      this.persistence = new ContextPersistence(config.persistPath, logger);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //                      LIFECYCLE
  // ═══════════════════════════════════════════════════════════════

  async initialize(): Promise<void> {
    this.logger.info('Initializing Latent Service...');

    // Load persisted contexts if enabled
    if (this.persistence) {
      const data = await this.persistence.load();
      if (data) {
        for (const [taskId, context] of data.contexts) {
          this.contexts.set(taskId, context);
        }
        for (const [taskId, entries] of data.history) {
          this.history.set(taskId, entries);
        }
        if (data.stats) {
          this.stats = data.stats as typeof this.stats;
        }
      }
    }

    // Setup cleanup interval (unref to not block process exit)
    if (this.config.cleanupAfterMs > 0) {
      this.cleanupInterval = setInterval(
        () => this.cleanupOldContexts(),
        this.config.cleanupAfterMs
      );
      this.cleanupInterval.unref();
    }

    this.logger.info('Latent Service initialized');
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Latent Service...');

    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }

    // Persist contexts if enabled
    if (this.persistence) {
      await this.persistence.save(this.contexts, this.history, this.stats);
    }

    this.contexts.clear();
    this.history.clear();
    this.logger.info('Latent Service shutdown complete');
  }

  // ═══════════════════════════════════════════════════════════════
  //                      CONTEXT OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Create a new latent context
   */
  async createContext(params: CreateContextParams): Promise<AgentLatentContext> {
    const { taskId, phase = 'analysis', constraints = [], files = [], agentId } = params;

    // Check if context already exists
    if (this.contexts.has(taskId)) {
      throw new Error(`Context already exists for task: ${taskId}`);
    }

    // Check max contexts limit
    if (this.contexts.size >= this.config.maxContexts) {
      // Remove oldest completed context
      await this.evictOldestContext();
    }

    const now = new Date();
    const context: AgentLatentContext = {
      taskId,
      phase,
      codeMap: {
        files,
        hotSpots: [],
        components: [],
      },
      constraints,
      risks: [],
      decisions: [],
      artifacts: {
        tests: [],
        endpoints: [],
        patches: [],
        other: {},
      },
      metadata: {
        createdBy: agentId,
        lastUpdatedBy: agentId,
        estimatedTokens: 0,
        actualTokens: 0,
        custom: {},
      },
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    this.contexts.set(taskId, context);
    this.history.set(taskId, []);

    // Record history
    this.addHistoryEntry(taskId, {
      operation: 'create',
      agentId,
      phase,
    });

    // Update stats
    this.stats.totalCreated++;
    this.stats.phaseStats[phase]++;

    // Emit event
    this.eventBus.emit({
      type: 'latent:context:created',
      timestamp: new Date(),
      data: { taskId, context },
    });

    this.logger.info(`Created latent context: ${taskId}`);
    return context;
  }

  /**
   * Get latent context
   */
  async getContext(params: GetContextParams): Promise<AgentLatentContext | null> {
    const { taskId, fields } = params;
    const context = this.contexts.get(taskId);

    if (!context) {
      return null;
    }

    // If specific fields requested, return partial
    if (fields && fields.length > 0) {
      const partial: Partial<AgentLatentContext> = {};
      for (const field of fields) {
        (partial as Record<string, unknown>)[field] = context[field];
      }
      return partial as AgentLatentContext;
    }

    return context;
  }

  /**
   * Get context with history
   */
  async getContextWithHistory(taskId: string): Promise<LatentContextWithHistory | null> {
    const context = this.contexts.get(taskId);
    if (!context) {
      return null;
    }

    return {
      context,
      history: this.history.get(taskId) || [],
    };
  }

  /**
   * Update context with delta (merge, not replace)
   */
  async updateContext(params: UpdateContextParams): Promise<AgentLatentContext> {
    const { taskId, delta, agentId, force = false } = params;

    const context = this.contexts.get(taskId);
    if (!context) {
      throw new Error(`Context not found: ${taskId}`);
    }

    // Auto-merge is the key feature of Latent Chain Mode
    if (this.config.autoMerge) {
      this.deltaMerger.merge(context, delta);
    } else if (!force) {
      throw new Error('Auto-merge disabled. Use force=true to update.');
    }

    // Update metadata
    context.metadata.lastUpdatedBy = agentId;
    context.updatedAt = new Date();
    context.version++;

    // Record history
    this.addHistoryEntry(taskId, {
      operation: 'update',
      delta,
      agentId,
      phase: context.phase,
    });

    // Update stats
    this.stats.totalDeltasMerged++;

    // Emit event
    this.eventBus.emit({
      type: 'latent:context:updated',
      timestamp: new Date(),
      data: { taskId, delta, version: context.version },
    });

    this.logger.debug(`Updated context: ${taskId} (v${context.version})`);
    return context;
  }

  /**
   * Transition to new phase
   */
  async transitionPhase(params: TransitionPhaseParams): Promise<AgentLatentContext> {
    const { taskId, toPhase, summary, agentId } = params;

    const context = this.contexts.get(taskId);
    if (!context) {
      throw new Error(`Context not found: ${taskId}`);
    }

    const fromPhase = context.phase;

    // Validate transition
    if (!this.isValidTransition(fromPhase, toPhase)) {
      throw new Error(`Invalid phase transition: ${fromPhase} -> ${toPhase}`);
    }

    // Update phase
    context.phase = toPhase;
    context.metadata.lastUpdatedBy = agentId;
    context.updatedAt = new Date();
    context.version++;

    // Add decision if summary provided
    if (summary) {
      const decision: LatentDecision = {
        id: `D${String(context.decisions.length + 1).padStart(3, '0')}`,
        summary: `Phase ${fromPhase} completed: ${summary}`,
        rationale: `Transitioning from ${fromPhase} to ${toPhase}`,
        phase: fromPhase,
        createdAt: new Date(),
      };
      context.decisions.push(decision);
    }

    // Record history
    this.addHistoryEntry(taskId, {
      operation: 'transition',
      agentId,
      phase: toPhase,
    });

    // Update stats
    this.stats.phaseStats[toPhase]++;

    // Emit event
    this.eventBus.emit({
      type: 'latent:phase:transition',
      timestamp: new Date(),
      data: { taskId, from: fromPhase, to: toPhase },
    });

    this.logger.info(`Phase transition: ${taskId} ${fromPhase} -> ${toPhase}`);
    return context;
  }

  /**
   * Apply a patch to a file
   */
  async applyPatch(params: ApplyPatchParams): Promise<AppliedPatch> {
    const { taskId, target, patch, dryRun = false } = params;

    const context = this.contexts.get(taskId);
    if (!context) {
      throw new Error(`Context not found: ${taskId}`);
    }

    // Use extracted patch applicator
    const result = await this.patchApplicator.applyPatch({ target, patch, dryRun });

    if (result.success) {
      // Record in artifacts
      context.artifacts.patches.push(result);

      // Add file to code map if not present
      if (!context.codeMap.files.includes(target)) {
        context.codeMap.files.push(target);
      }

      // Update stats
      this.stats.totalPatchesApplied++;

      // Record history
      this.addHistoryEntry(taskId, {
        operation: 'patch',
        phase: context.phase,
      });
    }

    // Emit event
    this.eventBus.emit({
      type: 'latent:patch:applied',
      timestamp: new Date(),
      data: { taskId, target, success: result.success },
    });

    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  //                      DIFF-BASED EDITING
  // ═══════════════════════════════════════════════════════════════

  /**
   * Apply a diff with fuzzy conflict detection
   */
  async applyDiff(
    target: string,
    diffContent: string,
    options?: { dryRun?: boolean; forceApply?: boolean }
  ): Promise<DiffEditResult> {
    return this.diffEditor.applyDiff(target, diffContent, options);
  }

  /**
   * Confirm a pending diff edit
   */
  async confirmDiff(target: string): Promise<DiffEditResult> {
    return this.diffEditor.confirmEdit(target);
  }

  /**
   * Reject a pending diff edit
   */
  rejectDiff(target: string): boolean {
    return this.diffEditor.rejectEdit(target);
  }

  /**
   * Rollback a file to backup
   */
  async rollbackDiff(target: string): Promise<boolean> {
    return this.diffEditor.rollback(target);
  }

  /**
   * Configure diff editor
   */
  configureDiffEditor(config: Partial<DiffEditorConfig>): void {
    this.diffEditor.setConfig(config);
  }

  /**
   * Get diff editor config
   */
  getDiffEditorConfig(): DiffEditorConfig {
    return this.diffEditor.getConfig();
  }

  /**
   * Get pending diff confirmations
   */
  getPendingDiffConfirms(): Map<string, ConfirmRequest> {
    return this.diffEditor.getPendingConfirms();
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string, summary: string): Promise<void> {
    const context = this.contexts.get(taskId);
    if (!context) {
      throw new Error(`Context not found: ${taskId}`);
    }

    // Add final decision
    const decision: LatentDecision = {
      id: `D${String(context.decisions.length + 1).padStart(3, '0')}`,
      summary: `Task completed: ${summary}`,
      rationale: 'All phases completed successfully',
      phase: context.phase,
      createdAt: new Date(),
    };
    context.decisions.push(decision);

    // Record history
    this.addHistoryEntry(taskId, {
      operation: 'complete',
      phase: context.phase,
    });

    // Emit event
    this.eventBus.emit({
      type: 'latent:task:completed',
      timestamp: new Date(),
      data: { taskId, summary },
    });

    this.logger.info(`Task completed: ${taskId}`);
  }

  /**
   * Delete a context
   */
  async deleteContext(taskId: string): Promise<boolean> {
    const deleted = this.contexts.delete(taskId);
    this.history.delete(taskId);
    return deleted;
  }

  /**
   * List all contexts
   */
  async listContexts(): Promise<AgentLatentContext[]> {
    return Array.from(this.contexts.values());
  }

  // ═══════════════════════════════════════════════════════════════
  //                      VALIDATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Validate a latent response
   */
  validateResponse(response: LatentResponse): LatentValidationResult {
    const errors: LatentValidationError[] = [];
    const warnings: string[] = [];

    // Validate summary length
    if (response.summary.length > this.config.maxSummaryLength) {
      errors.push({
        field: 'summary',
        message: `Summary too long: ${response.summary.length} > ${this.config.maxSummaryLength}`,
        suggestion: 'Keep summary to 1-2 sentences max',
      });
    }

    // Validate actions
    for (const action of response.actions) {
      if (!action.target) {
        errors.push({
          field: 'actions.target',
          message: 'Action missing target',
          suggestion: 'Specify target file or command',
        });
      }
      if (!action.description) {
        warnings.push(`Action ${action.type} missing description`);
      }
    }

    // Validate context delta
    if (response.contextDelta) {
      const delta = response.contextDelta;

      // Check for decisions limit
      if (delta.decisions && delta.decisions.length > this.config.maxDecisions) {
        warnings.push(`Too many decisions in delta: ${delta.decisions.length}`);
      }
    }

    // Emit event if validation failed
    if (errors.length > 0) {
      this.eventBus.emit({
        type: 'latent:validation:failed',
        timestamp: new Date(),
        data: { taskId: 'unknown', errors },
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  //                      STATUS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get module status
   */
  getStatus(): LatentModuleStatus {
    return {
      enabled: this.config.enabled,
      activeContexts: this.contexts.size,
      totalCreated: this.stats.totalCreated,
      totalDeltasMerged: this.stats.totalDeltasMerged,
      totalPatchesApplied: this.stats.totalPatchesApplied,
      phaseStats: { ...this.stats.phaseStats },
      avgTokensSaved: this.calculateAvgTokensSaved(),
    };
  }

  // ═══════════════════════════════════════════════════════════════
  //                      PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Check if phase transition is valid
   */
  private isValidTransition(from: LatentPhase, to: LatentPhase): boolean {
    const transitions: Record<LatentPhase, LatentPhase[]> = {
      analysis: ['plan', 'impl'], // Can skip plan for simple tasks
      plan: ['impl', 'review'], // Can skip impl if plan revealed issues
      impl: ['review', 'plan'], // Can go back to plan if impl shows issues
      review: ['impl', 'analysis'], // Can go back for fixes
    };
    return transitions[from]?.includes(to) ?? false;
  }

  /**
   * Add history entry
   */
  private addHistoryEntry(
    taskId: string,
    entry: Omit<ContextHistoryEntry, 'id' | 'taskId' | 'timestamp' | 'version'>
  ): void {
    const context = this.contexts.get(taskId);
    const history = this.history.get(taskId) || [];

    history.push({
      ...entry,
      id: uuid(),
      taskId,
      timestamp: new Date(),
      version: context?.version || 1,
    });

    this.history.set(taskId, history);
  }

  /**
   * Evict oldest context when limit reached
   */
  private async evictOldestContext(): Promise<void> {
    let oldest: AgentLatentContext | null = null;
    for (const context of this.contexts.values()) {
      if (!oldest || context.updatedAt < oldest.updatedAt) {
        oldest = context;
      }
    }
    if (oldest) {
      this.logger.info(`Evicting oldest context: ${oldest.taskId}`);
      await this.deleteContext(oldest.taskId);
    }
  }

  /**
   * Cleanup old completed contexts
   */
  private async cleanupOldContexts(): Promise<void> {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const context of this.contexts.values()) {
      const age = now - context.updatedAt.getTime();
      if (age > this.config.cleanupAfterMs && context.phase === 'review') {
        toDelete.push(context.taskId);
      }
    }

    for (const taskId of toDelete) {
      await this.deleteContext(taskId);
      this.logger.debug(`Cleaned up old context: ${taskId}`);
    }
  }

  /**
   * Calculate average tokens saved
   */
  private calculateAvgTokensSaved(): number {
    // Estimate: each delta merge saves ~500 tokens vs full context
    // Each context update without delta would be ~1000 tokens
    const tokensSaved = this.stats.totalDeltasMerged * 500;
    const contexts = this.stats.totalCreated || 1;
    return Math.round(tokensSaved / contexts);
  }
}
