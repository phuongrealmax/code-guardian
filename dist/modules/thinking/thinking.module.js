// src/modules/thinking/thinking.module.ts
import { ThinkingService } from './thinking.service.js';
import { getThinkingTools, createThinkingToolHandlers } from './thinking.tools.js';
// ═══════════════════════════════════════════════════════════════
//                      THINKING MODULE
// ═══════════════════════════════════════════════════════════════
export class ThinkingModule {
    config;
    eventBus;
    logger;
    service;
    toolHandlers = null;
    constructor(config, eventBus, logger, projectRoot = process.cwd()) {
        this.config = config;
        this.eventBus = eventBus;
        this.logger = logger;
        this.service = new ThinkingService(config, eventBus, logger, projectRoot);
    }
    // ═══════════════════════════════════════════════════════════════
    //                      LIFECYCLE
    // ═══════════════════════════════════════════════════════════════
    async initialize() {
        await this.service.initialize();
        this.toolHandlers = createThinkingToolHandlers(this.service);
    }
    async shutdown() {
        await this.service.shutdown();
        this.toolHandlers = null;
    }
    // ═══════════════════════════════════════════════════════════════
    //                      MCP INTERFACE
    // ═══════════════════════════════════════════════════════════════
    getTools() {
        if (!this.config.enabled)
            return [];
        return getThinkingTools();
    }
    async handleTool(toolName, args) {
        if (!this.toolHandlers) {
            throw new Error('Thinking module not initialized');
        }
        const handler = this.toolHandlers[toolName];
        if (!handler) {
            throw new Error(`Unknown tool: ${toolName}`);
        }
        // Handle async and sync handlers
        return handler(args);
    }
    getStatus() {
        return this.service.getStatus();
    }
    // ═══════════════════════════════════════════════════════════════
    //                      PUBLIC API
    // ═══════════════════════════════════════════════════════════════
    /**
     * Get the underlying service for direct access
     */
    getService() {
        return this.service;
    }
}
//# sourceMappingURL=thinking.module.js.map