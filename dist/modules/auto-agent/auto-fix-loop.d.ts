/**
 * AutoFixLoop Service
 *
 * Implements self-healing error correction loop.
 * When errors occur, automatically attempts to fix them
 * up to a configured number of retries.
 */
import { Logger } from '../../core/logger.js';
import { EventBus } from '../../core/event-bus.js';
import { AutoAgentModuleConfig, FixLoopStatus, FixAttempt, FixLoopResult, StartFixLoopParams } from './auto-agent.types.js';
export declare class AutoFixLoop {
    private config;
    private logger;
    private eventBus;
    private status;
    private currentAttempts;
    private stats;
    constructor(config: AutoAgentModuleConfig['fixLoop'], logger: Logger, eventBus: EventBus);
    /**
     * Start fix loop for an error
     */
    startFixLoop(params: StartFixLoopParams): Promise<FixLoopResult>;
    /**
     * Get current status
     */
    getStatus(): FixLoopStatus;
    /**
     * Get current attempts
     */
    getCurrentAttempts(): FixAttempt[];
    /**
     * Get statistics
     */
    getStats(): {
        successRate: number;
        totalLoops: number;
        successfulFixes: number;
        failedFixes: number;
        rollbacks: number;
    };
    /**
     * Reset status (for new task)
     */
    reset(): void;
    /**
     * Generate fix action for error
     */
    private generateFix;
    /**
     * Apply fix action
     * Returns true if fix was successful (error resolved)
     */
    private applyFix;
    /**
     * Rollback changes
     */
    private rollback;
    /**
     * Delay helper
     */
    private delay;
}
//# sourceMappingURL=auto-fix-loop.d.ts.map