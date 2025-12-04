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
import { AgentLatentContext, LatentResponse, LatentModuleConfig, LatentModuleStatus, CreateContextParams, UpdateContextParams, ApplyPatchParams, GetContextParams, TransitionPhaseParams, LatentContextWithHistory, LatentValidationResult, AppliedPatch } from './latent.types.js';
/**
 * LatentService - Core service for Latent Chain Mode
 */
export declare class LatentService {
    private contexts;
    private history;
    private config;
    private eventBus;
    private logger;
    private projectRoot;
    private stats;
    constructor(config: LatentModuleConfig, eventBus: EventBus, logger: Logger, projectRoot: string);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    /**
     * Create a new latent context
     */
    createContext(params: CreateContextParams): Promise<AgentLatentContext>;
    /**
     * Get latent context
     */
    getContext(params: GetContextParams): Promise<AgentLatentContext | null>;
    /**
     * Get context with history
     */
    getContextWithHistory(taskId: string): Promise<LatentContextWithHistory | null>;
    /**
     * Update context with delta (merge, not replace)
     */
    updateContext(params: UpdateContextParams): Promise<AgentLatentContext>;
    /**
     * Transition to new phase
     */
    transitionPhase(params: TransitionPhaseParams): Promise<AgentLatentContext>;
    /**
     * Apply a patch to a file
     */
    applyPatch(params: ApplyPatchParams): Promise<AppliedPatch>;
    /**
     * Complete a task
     */
    completeTask(taskId: string, summary: string): Promise<void>;
    /**
     * Delete a context
     */
    deleteContext(taskId: string): Promise<boolean>;
    /**
     * List all contexts
     */
    listContexts(): Promise<AgentLatentContext[]>;
    /**
     * Validate a latent response
     */
    validateResponse(response: LatentResponse): LatentValidationResult;
    /**
     * Get module status
     */
    getStatus(): LatentModuleStatus;
    /**
     * Merge delta into context (key feature!)
     */
    private mergeDelta;
    /**
     * Check if phase transition is valid
     */
    private isValidTransition;
    /**
     * Add history entry
     */
    private addHistoryEntry;
    /**
     * Apply patch to file (simplified version)
     */
    private applyPatchToFile;
    /**
     * Manual patch application (simplified)
     */
    private manualPatch;
    /**
     * Evict oldest context when limit reached
     */
    private evictOldestContext;
    /**
     * Cleanup old completed contexts
     */
    private cleanupOldContexts;
    /**
     * Calculate average tokens saved
     */
    private calculateAvgTokensSaved;
    /**
     * Persist contexts to disk
     */
    private persistContexts;
    /**
     * Load persisted contexts
     */
    private loadPersistedContexts;
}
//# sourceMappingURL=latent.service.d.ts.map