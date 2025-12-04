// src/modules/latent/index.ts
import { LatentService } from './latent.service.js';
import { createLatentTools, handleLatentTool } from './latent.tools.js';
// Re-export types
export * from './latent.types.js';
export { LatentService } from './latent.service.js';
/**
 * Default configuration for Latent Module
 */
export const DEFAULT_LATENT_CONFIG = {
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
export class LatentModule {
    service;
    config;
    eventBus;
    logger;
    constructor(config, eventBus, logger, projectRoot) {
        this.config = { ...DEFAULT_LATENT_CONFIG, ...config };
        this.eventBus = eventBus;
        this.logger = logger;
        // Initialize service
        this.service = new LatentService(this.config, eventBus, logger, projectRoot);
    }
    /**
     * Initialize the module
     */
    async initialize() {
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
    async shutdown() {
        await this.service.shutdown();
        this.logger.info('Latent Module shutdown complete');
    }
    /**
     * Get MCP tool definitions
     */
    getTools() {
        if (!this.config.enabled) {
            return [];
        }
        return createLatentTools(this.service);
    }
    /**
     * Handle MCP tool call
     */
    async handleTool(toolName, args) {
        if (!this.config.enabled) {
            throw new Error('Latent Module is disabled');
        }
        return handleLatentTool(this.service, toolName, args);
    }
    /**
     * Get module status
     */
    getStatus() {
        return this.service.getStatus();
    }
    /**
     * Get typed module status
     */
    getTypedStatus() {
        return this.service.getStatus();
    }
    /**
     * Get the underlying service (for direct access if needed)
     */
    getService() {
        return this.service;
    }
}
//# sourceMappingURL=index.js.map