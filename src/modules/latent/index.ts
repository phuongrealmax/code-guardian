// src/modules/latent/index.ts

/**
 * Latent Chain Mode Module
 *
 * Implements "Latent Chain Mode" for hidden-state reasoning with MCP.
 * Based on Stanford/Princeton/UIUC paper patterns.
 *
 * Key Features:
 * - AgentLatentContext: KV-cache like structure for hidden state
 * - Context Delta: Send only changes, not full context (70-80% token reduction)
 * - 4-Phase Workflow: analysis -> plan -> impl -> review
 * - Patch Application: Apply code changes during impl phase
 */

import { EventBus } from '../../core/event-bus.js';
import { Logger } from '../../core/logger.js';
import { ICCGModule } from '../index.js';
import { LatentService } from './latent.service.js';
import { createLatentTools, handleLatentTool } from './latent.tools.js';
import { LatentModuleConfig, LatentModuleStatus } from './latent.types.js';

// Re-export types
export * from './latent.types.js';
export { LatentService } from './latent.service.js';

// Re-export diff editor types
export {
  DiffEditor,
  DiffEditResult,
  DiffEditorConfig,
  DiffHunk,
  DiffLine,
  ConflictInfo,
  ConfirmRequest,
  ConfirmPolicy,
  DEFAULT_DIFF_EDITOR_CONFIG,
  createDiffEditor,
} from './diff-editor.js';

/**
 * Default configuration for Latent Module
 */
export const DEFAULT_LATENT_CONFIG: LatentModuleConfig = {
  enabled: true,
  maxContexts: 50,
  autoMerge: true,
  persist: true,
  persistPath: '.ccg/latent-contexts.json',
  strictValidation: false,
  maxSummaryLength: 200,
  maxDecisions: 100,
  cleanupAfterMs: 24 * 60 * 60 * 1000, // 24 hours
  autoAttach: true,
  autoAttachTriggerTools: ['workflow_task_start', 'workflow_task_create'],
};

/**
 * Latent Module - Implements Latent Chain Mode
 */
export class LatentModule implements ICCGModule {
  private service: LatentService;
  private config: LatentModuleConfig;
  private eventBus: EventBus;
  private logger: Logger;

  constructor(
    config: Partial<LatentModuleConfig>,
    eventBus: EventBus,
    logger: Logger,
    projectRoot: string
  ) {
    this.config = { ...DEFAULT_LATENT_CONFIG, ...config };
    this.eventBus = eventBus;
    this.logger = logger;

    // Initialize service
    this.service = new LatentService(
      this.config,
      eventBus,
      logger,
      projectRoot
    );
  }

  /**
   * Initialize the module
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      this.logger.info('Latent Module disabled');
      return;
    }

    await this.service.initialize();
    this.logger.info('Latent Module initialized');
  }

  /**
   * Shutdown the module
   */
  async shutdown(): Promise<void> {
    await this.service.shutdown();
    this.logger.info('Latent Module shutdown complete');
  }

  /**
   * Get MCP tool definitions
   */
  getTools(): Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  }> {
    if (!this.config.enabled) {
      return [];
    }
    return createLatentTools(this.service);
  }

  /**
   * Handle MCP tool call
   */
  async handleTool(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    if (!this.config.enabled) {
      throw new Error('Latent Module is disabled');
    }
    return handleLatentTool(this.service, toolName, args);
  }

  /**
   * Get module status
   */
  getStatus(): Record<string, unknown> {
    return this.service.getStatus() as unknown as Record<string, unknown>;
  }

  /**
   * Get typed module status
   */
  getTypedStatus(): LatentModuleStatus {
    return this.service.getStatus();
  }

  /**
   * Get the underlying service (for direct access if needed)
   */
  getService(): LatentService {
    return this.service;
  }
}
