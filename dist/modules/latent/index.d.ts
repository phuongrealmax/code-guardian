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
import { LatentModuleConfig, LatentModuleStatus } from './latent.types.js';
export * from './latent.types.js';
export { LatentService } from './latent.service.js';
/**
 * Default configuration for Latent Module
 */
export declare const DEFAULT_LATENT_CONFIG: LatentModuleConfig;
/**
 * Latent Module - Implements Latent Chain Mode
 */
export declare class LatentModule implements ICCGModule {
    private service;
    private config;
    private eventBus;
    private logger;
    constructor(config: Partial<LatentModuleConfig>, eventBus: EventBus, logger: Logger, projectRoot: string);
    /**
     * Initialize the module
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the module
     */
    shutdown(): Promise<void>;
    /**
     * Get MCP tool definitions
     */
    getTools(): Array<{
        name: string;
        description: string;
        inputSchema: Record<string, unknown>;
    }>;
    /**
     * Handle MCP tool call
     */
    handleTool(toolName: string, args: Record<string, unknown>): Promise<unknown>;
    /**
     * Get module status
     */
    getStatus(): Record<string, unknown>;
    /**
     * Get typed module status
     */
    getTypedStatus(): LatentModuleStatus;
    /**
     * Get the underlying service (for direct access if needed)
     */
    getService(): LatentService;
}
//# sourceMappingURL=index.d.ts.map