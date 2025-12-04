import { Memory, MemoryModuleConfig } from '../../core/types.js';
import { EventBus } from '../../core/event-bus.js';
import { Logger } from '../../core/logger.js';
import { StoreMemoryParams, RecallMemoryParams, MemorySummary, MemoryModuleStatus } from './memory.types.js';
export declare class MemoryService {
    private config;
    private eventBus;
    private logger;
    private db;
    private memories;
    private initialized;
    constructor(config: MemoryModuleConfig, eventBus: EventBus, logger: Logger);
    /**
     * Initialize the memory service
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the memory service
     */
    shutdown(): Promise<void>;
    /**
     * Store a new memory
     */
    store(params: StoreMemoryParams): Promise<Memory>;
    /**
     * Recall memories based on query
     */
    recall(params: RecallMemoryParams): Promise<Memory[]>;
    /**
     * Forget (delete) a memory
     */
    forget(id: string): Promise<boolean>;
    /**
     * Get memory by ID
     */
    get(id: string): Promise<Memory | undefined>;
    /**
     * Get all memories
     */
    getAll(): Promise<Memory[]>;
    /**
     * Get memory summary
     */
    getSummary(): Promise<MemorySummary>;
    /**
     * Get module status
     */
    getStatus(): MemoryModuleStatus;
    /**
     * Get snapshot of all memories
     */
    getSnapshot(): Memory[];
    /**
     * Load memories from snapshot
     */
    loadSnapshot(memories: Memory[]): Promise<void>;
    /**
     * Save all memories to persistent storage
     */
    savePersistent(): Promise<number>;
    /**
     * Load memories from persistent storage
     */
    loadPersistent(): Promise<number>;
    private ensureInitialized;
    private createTables;
    private loadFromDb;
    private insertToDb;
    private updateInDb;
    private findSimilar;
    private calculateOverlap;
    private enforceLimit;
    /**
     * Apply retention policy - delete memories older than configured days
     * GDPR/Compliance: Automatic data cleanup
     */
    private applyRetentionPolicy;
    /**
     * Check if running in zero retention mode
     */
    isZeroRetentionMode(): boolean;
}
//# sourceMappingURL=memory.service.d.ts.map