// src/modules/memory/index.ts
import { MemoryService } from './memory.service.js';
import { getMemoryTools, formatMemoryResult, formatMemoryList, formatSummary, } from './memory.tools.js';
// ═══════════════════════════════════════════════════════════════
//                      MEMORY MODULE CLASS
// ═══════════════════════════════════════════════════════════════
export class MemoryModule {
    config;
    eventBus;
    service;
    logger;
    constructor(config, eventBus, parentLogger) {
        this.config = config;
        this.eventBus = eventBus;
        this.logger = parentLogger.child('Memory');
        this.service = new MemoryService(config, eventBus, this.logger);
    }
    /**
     * Initialize the module
     */
    async initialize() {
        await this.service.initialize();
    }
    /**
     * Shutdown the module
     */
    async shutdown() {
        await this.service.shutdown();
    }
    /**
     * Get MCP tool definitions
     */
    getTools() {
        if (!this.config.enabled) {
            return [];
        }
        return getMemoryTools();
    }
    /**
     * Handle MCP tool call
     */
    async handleTool(toolName, args) {
        if (!this.config.enabled) {
            return { error: 'Memory module is disabled' };
        }
        switch (toolName) {
            case 'store':
                return this.handleStore(args);
            case 'recall':
                return this.handleRecall(args);
            case 'forget':
                return this.handleForget(args);
            case 'summary':
                return this.handleSummary();
            case 'list':
                return this.handleList(args);
            default:
                throw new Error(`Unknown memory tool: ${toolName}`);
        }
    }
    // ═══════════════════════════════════════════════════════════════
    //                      TOOL HANDLERS
    // ═══════════════════════════════════════════════════════════════
    async handleStore(args) {
        const params = {
            content: args.content,
            type: args.type,
            importance: args.importance,
            tags: args.tags,
            metadata: args.metadata,
        };
        const memory = await this.service.store(params);
        return {
            success: true,
            memory: {
                id: memory.id,
                type: memory.type,
                importance: memory.importance,
                tags: memory.tags,
            },
            message: `Memory stored successfully with ID: ${memory.id}`,
            formatted: formatMemoryResult(memory),
        };
    }
    async handleRecall(args) {
        const params = {
            query: args.query,
            type: args.type,
            limit: args.limit,
            minImportance: args.minImportance,
            tags: args.tags,
        };
        const memories = await this.service.recall(params);
        if (memories.length === 0) {
            return {
                success: true,
                count: 0,
                memories: [],
                message: `No memories found matching "${params.query}"`,
            };
        }
        return {
            success: true,
            count: memories.length,
            memories: memories.map(m => ({
                id: m.id,
                content: m.content,
                type: m.type,
                importance: m.importance,
                tags: m.tags,
                accessCount: m.accessCount,
            })),
            formatted: formatMemoryList(memories),
        };
    }
    async handleForget(args) {
        const id = args.id;
        const success = await this.service.forget(id);
        if (!success) {
            return {
                success: false,
                message: `Memory with ID "${id}" not found`,
            };
        }
        return {
            success: true,
            message: `Memory "${id}" has been forgotten`,
        };
    }
    async handleSummary() {
        const summary = await this.service.getSummary();
        return {
            success: true,
            summary,
            formatted: formatSummary(summary),
        };
    }
    async handleList(args) {
        const type = args.type;
        const limit = args.limit || 20;
        const sortBy = args.sortBy || 'importance';
        let memories = await this.service.getAll();
        // Filter by type
        if (type) {
            memories = memories.filter(m => m.type === type);
        }
        // Sort
        switch (sortBy) {
            case 'importance':
                memories.sort((a, b) => b.importance - a.importance);
                break;
            case 'recent':
                memories.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                break;
            case 'accessed':
                memories.sort((a, b) => b.accessedAt.getTime() - a.accessedAt.getTime());
                break;
            case 'created':
                memories.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                break;
        }
        // Limit
        memories = memories.slice(0, limit);
        return {
            success: true,
            count: memories.length,
            memories: memories.map(m => ({
                id: m.id,
                content: m.content,
                type: m.type,
                importance: m.importance,
                tags: m.tags,
                createdAt: m.createdAt.toISOString(),
            })),
            formatted: formatMemoryList(memories),
        };
    }
    // ═══════════════════════════════════════════════════════════════
    //                      PUBLIC SERVICE METHODS
    // ═══════════════════════════════════════════════════════════════
    /**
     * Get memory summary
     */
    async getSummary() {
        return this.service.getSummary();
    }
    /**
     * Get module status
     */
    getStatus() {
        return this.service.getStatus();
    }
    /**
     * Load from persistent storage
     */
    async loadPersistent() {
        return this.service.loadPersistent();
    }
    /**
     * Save to persistent storage
     */
    async savePersistent() {
        await this.service.savePersistent();
    }
    /**
     * Get memory snapshot
     */
    getSnapshot() {
        return this.service.getSnapshot();
    }
    /**
     * Load from snapshot
     */
    async loadSnapshot(memories) {
        return this.service.loadSnapshot(memories);
    }
    /**
     * Store a memory (wrapper for service.store)
     */
    async store(params) {
        return this.service.store(params);
    }
    /**
     * Recall memories (wrapper for service.recall)
     */
    async recall(params) {
        return this.service.recall(params);
    }
}
// ═══════════════════════════════════════════════════════════════
//                      EXPORTS
// ═══════════════════════════════════════════════════════════════
export { MemoryService } from './memory.service.js';
export * from './memory.types.js';
export * from './memory.tools.js';
// Project-Scoped Memory
export { ProjectMemoryService, createProjectMemoryService, DOMAIN_PRINCIPLES, } from './project-memory.js';
//# sourceMappingURL=index.js.map