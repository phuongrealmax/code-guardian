/**
 * ErrorMemory Service
 *
 * Specialized memory for errors and their fixes.
 * Learns from past errors to prevent repetition and
 * suggest fixes based on similar errors.
 */
import { Logger } from '../../core/logger.js';
import { EventBus } from '../../core/event-bus.js';
import { AutoAgentModuleConfig, ErrorMemoryEntry, ErrorPattern, RecallErrorsParams, RecallErrorsResult, StoreErrorParams } from './auto-agent.types.js';
export declare class ErrorMemory {
    private config;
    private logger;
    private eventBus;
    private errors;
    private patterns;
    private stats;
    constructor(config: AutoAgentModuleConfig['errorMemory'], logger: Logger, eventBus: EventBus);
    /**
     * Store error and its fix
     */
    store(params: StoreErrorParams): Promise<ErrorMemoryEntry>;
    /**
     * Recall errors similar to given error or matching tags
     */
    recall(params: RecallErrorsParams): Promise<RecallErrorsResult>;
    /**
     * Get all stored errors
     */
    getAll(): ErrorMemoryEntry[];
    /**
     * Get patterns
     */
    getPatterns(): ErrorPattern[];
    /**
     * Get statistics
     */
    getStats(): {
        errorCount: number;
        patternCount: number;
        totalStored: number;
        totalRecalled: number;
        duplicatesAvoided: number;
    };
    /**
     * Clear all errors
     */
    clear(): void;
    /**
     * Find most similar error
     */
    private findSimilar;
    /**
     * Find errors above similarity threshold
     */
    private findSimilarErrors;
    /**
     * Calculate similarity between two errors
     */
    private calculateSimilarity;
    /**
     * Simple string similarity (Jaccard-like)
     */
    private stringSimilarity;
    /**
     * Update error patterns based on new entry
     */
    private updatePatterns;
    /**
     * Extract pattern from error message
     */
    private extractPattern;
    /**
     * Find matching pattern
     */
    private findMatchingPattern;
    /**
     * Evict oldest entry
     */
    private evictOldest;
}
//# sourceMappingURL=error-memory.d.ts.map