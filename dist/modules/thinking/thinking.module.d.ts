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
export declare class ThinkingModule implements ICCGModule {
    private config;
    private eventBus;
    private logger;
    private service;
    private toolHandlers;
    constructor(config: ThinkingModuleConfig, eventBus: EventBus, logger: Logger, projectRoot?: string);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    getTools(): Array<{
        name: string;
        description: string;
        inputSchema: Record<string, unknown>;
    }>;
    handleTool(toolName: string, args: Record<string, unknown>): Promise<unknown>;
    getStatus(): Record<string, unknown>;
    /**
     * Get the underlying service for direct access
     */
    getService(): ThinkingService;
}
//# sourceMappingURL=thinking.module.d.ts.map