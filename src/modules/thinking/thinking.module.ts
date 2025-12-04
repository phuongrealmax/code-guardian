// src/modules/thinking/thinking.module.ts

/**
 * Thinking Module
 *
 * MCP Module wrapper for thinking models, workflows, and code snippets.
 * Implements the ICCGModule interface for integration with the MCP server.
 */

import { EventBus } from '../../core/event-bus.js';
import { Logger } from '../../core/logger.js';
import { ICCGModule } from '../index.js';
import { ThinkingService } from './thinking.service.js';
import { ThinkingModuleConfig } from './thinking.types.js';
import { getThinkingTools, createThinkingToolHandlers } from './thinking.tools.js';

// ═══════════════════════════════════════════════════════════════
//                      THINKING MODULE
// ═══════════════════════════════════════════════════════════════

export class ThinkingModule implements ICCGModule {
  private service: ThinkingService;
  private toolHandlers: ReturnType<typeof createThinkingToolHandlers> | null = null;

  constructor(
    private config: ThinkingModuleConfig,
    private eventBus: EventBus,
    private logger: Logger,
    projectRoot: string = process.cwd()
  ) {
    this.service = new ThinkingService(config, eventBus, logger, projectRoot);
  }

  // ═══════════════════════════════════════════════════════════════
  //                      LIFECYCLE
  // ═══════════════════════════════════════════════════════════════

  async initialize(): Promise<void> {
    await this.service.initialize();
    this.toolHandlers = createThinkingToolHandlers(this.service);
  }

  async shutdown(): Promise<void> {
    await this.service.shutdown();
    this.toolHandlers = null;
  }

  // ═══════════════════════════════════════════════════════════════
  //                      MCP INTERFACE
  // ═══════════════════════════════════════════════════════════════

  getTools(): Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  }> {
    if (!this.config.enabled) return [];
    return getThinkingTools();
  }

  async handleTool(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    if (!this.toolHandlers) {
      throw new Error('Thinking module not initialized');
    }

    const handler = this.toolHandlers[toolName as keyof typeof this.toolHandlers];
    if (!handler) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    // Handle async and sync handlers
    return handler(args as never);
  }

  getStatus(): Record<string, unknown> {
    return this.service.getStatus() as unknown as Record<string, unknown>;
  }

  // ═══════════════════════════════════════════════════════════════
  //                      PUBLIC API
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get the underlying service for direct access
   */
  getService(): ThinkingService {
    return this.service;
  }
}
