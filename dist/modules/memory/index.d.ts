import { MemoryModuleConfig } from '../../core/types.js';
import { EventBus } from '../../core/event-bus.js';
import { Logger } from '../../core/logger.js';
import { MCPTool } from './memory.tools.js';
import { StoreMemoryParams, RecallMemoryParams } from './memory.types.js';
export declare class MemoryModule {
    private config;
    private eventBus;
    private service;
    private logger;
    constructor(config: MemoryModuleConfig, eventBus: EventBus, parentLogger: Logger);
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
    getTools(): MCPTool[];
    /**
     * Handle MCP tool call
     */
    handleTool(toolName: string, args: Record<string, unknown>): Promise<unknown>;
    private handleStore;
    private handleRecall;
    private handleForget;
    private handleSummary;
    private handleList;
    /**
     * Get memory summary
     */
    getSummary(): Promise<import("./memory.types.js").MemorySummary>;
    /**
     * Get module status
     */
    getStatus(): import("./memory.types.js").MemoryModuleStatus;
    /**
     * Load from persistent storage
     */
    loadPersistent(): Promise<number>;
    /**
     * Save to persistent storage
     */
    savePersistent(): Promise<void>;
    /**
     * Get memory snapshot
     */
    getSnapshot(): import("./memory.types.js").Memory[];
    /**
     * Load from snapshot
     */
    loadSnapshot(memories: import('../../core/types.js').Memory[]): Promise<void>;
    /**
     * Store a memory (wrapper for service.store)
     */
    store(params: StoreMemoryParams): Promise<import("./memory.types.js").Memory>;
    /**
     * Recall memories (wrapper for service.recall)
     */
    recall(params: RecallMemoryParams): Promise<import("./memory.types.js").Memory[]>;
}
export { MemoryService } from './memory.service.js';
export * from './memory.types.js';
export * from './memory.tools.js';
export { ProjectMemoryService, createProjectMemoryService, DOMAIN_PRINCIPLES, } from './project-memory.js';
export type { ProjectMemory, ProjectFacts, ProjectDomain, BusinessPrinciples, BusinessRule, ApiConventions, ReportConfig, } from './project-memory.js';
//# sourceMappingURL=index.d.ts.map