// src/modules/auto-agent/auto-fix-loop.ts
/**
 * AutoFixLoop Service
 *
 * Implements self-healing error correction loop.
 * When errors occur, automatically attempts to fix them
 * up to a configured number of retries.
 */
import { v4 as uuid } from 'uuid';
// Common error patterns and their fix templates
const ERROR_FIX_PATTERNS = [
    // TypeScript errors
    {
        pattern: /Cannot find name '(\w+)'/,
        errorType: 'ts-missing-name',
        fixGenerator: (match, error) => ({
            type: 'patch',
            target: error.file || '',
            description: `Import or declare missing name: ${match[1]}`,
            patch: `// TODO: Import ${match[1]} from appropriate module`,
        }),
    },
    {
        pattern: /Property '(\w+)' does not exist on type/,
        errorType: 'ts-missing-property',
        fixGenerator: (match, error) => ({
            type: 'patch',
            target: error.file || '',
            description: `Add missing property: ${match[1]}`,
        }),
    },
    {
        pattern: /Type '(.+)' is not assignable to type '(.+)'/,
        errorType: 'ts-type-mismatch',
        fixGenerator: (match, error) => ({
            type: 'patch',
            target: error.file || '',
            description: `Fix type mismatch: ${match[1]} -> ${match[2]}`,
        }),
    },
    // Build errors
    {
        pattern: /Module not found: Can't resolve '(.+)'/,
        errorType: 'module-not-found',
        fixGenerator: (match) => ({
            type: 'dependency',
            target: match[1],
            description: `Install missing dependency: ${match[1]}`,
            command: `npm install ${match[1]}`,
        }),
    },
    // Test errors
    {
        pattern: /expect\(.+\)\.toBe\(.+\)/,
        errorType: 'test-assertion-failed',
        fixGenerator: (match, error) => ({
            type: 'patch',
            target: error.file || '',
            description: 'Fix failing test assertion',
        }),
    },
    // Guard errors
    {
        pattern: /Guard blocked: (.+)/,
        errorType: 'guard-blocked',
        fixGenerator: (match, error) => ({
            type: 'patch',
            target: error.file || '',
            description: `Fix guard issue: ${match[1]}`,
        }),
    },
];
export class AutoFixLoop {
    config;
    logger;
    eventBus;
    status = 'idle';
    currentAttempts = [];
    // Statistics
    stats = {
        totalLoops: 0,
        successfulFixes: 0,
        failedFixes: 0,
        rollbacks: 0,
    };
    constructor(config, logger, eventBus) {
        this.config = config;
        this.logger = logger;
        this.eventBus = eventBus;
    }
    // ═══════════════════════════════════════════════════════════════
    //                      MAIN METHODS
    // ═══════════════════════════════════════════════════════════════
    /**
     * Start fix loop for an error
     */
    async startFixLoop(params) {
        if (this.status === 'running') {
            throw new Error('Fix loop already running');
        }
        this.status = 'running';
        this.currentAttempts = [];
        const maxRetries = params.maxRetries || this.config.maxRetries;
        this.logger.info(`Starting fix loop for error: ${params.error.type}`);
        // Emit start event
        this.eventBus.emit({
            type: 'auto-agent:fix:started',
            timestamp: new Date(),
            data: {
                error: params.error,
                maxRetries,
            },
        });
        let lastError = params.error;
        // Fix loop
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const startTime = Date.now();
            // Generate fix action
            const fixAction = this.generateFix(lastError);
            if (!fixAction) {
                this.logger.warn(`No fix available for error: ${lastError.type}`);
                break;
            }
            // Create attempt record
            const attemptRecord = {
                id: uuid(),
                attemptNumber: attempt,
                timestamp: new Date(),
                error: lastError,
                fix: fixAction,
                result: 'failed',
                durationMs: 0,
            };
            this.logger.info(`Fix attempt ${attempt}/${maxRetries}: ${fixAction.description}`);
            // Emit attempt event
            this.eventBus.emit({
                type: 'auto-agent:fix:attempt',
                timestamp: new Date(),
                data: {
                    attempt,
                    fix: fixAction,
                },
            });
            try {
                // Apply fix
                const success = await this.applyFix(fixAction, params.context);
                attemptRecord.durationMs = Date.now() - startTime;
                if (success) {
                    attemptRecord.result = 'success';
                    this.currentAttempts.push(attemptRecord);
                    // Success!
                    this.status = 'success';
                    this.stats.totalLoops++;
                    this.stats.successfulFixes++;
                    this.eventBus.emit({
                        type: 'auto-agent:fix:success',
                        timestamp: new Date(),
                        data: {
                            attempts: attempt,
                            fix: fixAction,
                        },
                    });
                    this.logger.info(`Fix successful after ${attempt} attempt(s)`);
                    return {
                        success: true,
                        status: 'success',
                        attempts: this.currentAttempts,
                        totalAttempts: attempt,
                        rolledBack: false,
                    };
                }
                // Fix didn't work, continue loop
                attemptRecord.result = 'failed';
                this.currentAttempts.push(attemptRecord);
                // Wait before retry
                if (attempt < maxRetries) {
                    await this.delay(this.config.retryDelayMs);
                }
            }
            catch (error) {
                attemptRecord.result = 'failed';
                attemptRecord.durationMs = Date.now() - startTime;
                this.currentAttempts.push(attemptRecord);
                // Update error for next attempt
                lastError = {
                    type: 'fix-error',
                    message: error instanceof Error ? error.message : String(error),
                    file: params.error.file,
                };
            }
        }
        // All attempts failed
        this.stats.totalLoops++;
        this.stats.failedFixes++;
        // Rollback if configured
        let rolledBack = false;
        if (this.config.autoRollbackOnFail) {
            rolledBack = await this.rollback(params.context);
            if (rolledBack) {
                this.stats.rollbacks++;
                this.status = 'rolled_back';
                this.eventBus.emit({
                    type: 'auto-agent:fix:rollback',
                    timestamp: new Date(),
                    data: {
                        taskId: params.context.taskId,
                    },
                });
            }
        }
        this.status = rolledBack ? 'rolled_back' : 'failed';
        this.eventBus.emit({
            type: 'auto-agent:fix:failed',
            timestamp: new Date(),
            data: {
                attempts: this.currentAttempts.length,
                rolledBack,
            },
        });
        this.logger.warn(`Fix loop failed after ${this.currentAttempts.length} attempts`);
        return {
            success: false,
            status: this.status,
            attempts: this.currentAttempts,
            totalAttempts: this.currentAttempts.length,
            finalError: lastError,
            rolledBack,
        };
    }
    /**
     * Get current status
     */
    getStatus() {
        return this.status;
    }
    /**
     * Get current attempts
     */
    getCurrentAttempts() {
        return [...this.currentAttempts];
    }
    /**
     * Get statistics
     */
    getStats() {
        const total = this.stats.successfulFixes + this.stats.failedFixes;
        return {
            ...this.stats,
            successRate: total > 0 ? Math.round((this.stats.successfulFixes / total) * 100) : 0,
        };
    }
    /**
     * Reset status (for new task)
     */
    reset() {
        this.status = 'idle';
        this.currentAttempts = [];
    }
    // ═══════════════════════════════════════════════════════════════
    //                      PRIVATE METHODS
    // ═══════════════════════════════════════════════════════════════
    /**
     * Generate fix action for error
     */
    generateFix(error) {
        // Try to match against known patterns
        for (const pattern of ERROR_FIX_PATTERNS) {
            const match = error.message.match(pattern.pattern);
            if (match) {
                return pattern.fixGenerator(match, error);
            }
        }
        // Generic fix based on error type
        if (error.type === 'build') {
            return {
                type: 'patch',
                target: error.file || '',
                description: `Fix build error at ${error.file}:${error.line || '?'}`,
            };
        }
        if (error.type === 'test') {
            return {
                type: 'patch',
                target: error.file || '',
                description: 'Fix failing test',
            };
        }
        if (error.type === 'guard') {
            return {
                type: 'patch',
                target: error.file || '',
                description: `Fix guard violation: ${error.message}`,
            };
        }
        return null;
    }
    /**
     * Apply fix action
     * Returns true if fix was successful (error resolved)
     */
    async applyFix(fix, context) {
        // In a real implementation, this would:
        // 1. Apply the patch/run the command
        // 2. Re-run the validation/test
        // 3. Return whether the error is fixed
        // For now, we'll simulate with a success rate
        // In production, this should actually apply the fix
        this.logger.debug(`Applying fix: ${fix.type} on ${fix.target}`);
        switch (fix.type) {
            case 'dependency':
                // Would run: npm install <package>
                this.logger.info(`[SIMULATED] Would run: ${fix.command}`);
                return true;
            case 'patch':
                // Would apply patch via latent_apply_patch
                this.logger.info(`[SIMULATED] Would patch: ${fix.target}`);
                // Simulate 50% success rate for testing
                return Math.random() > 0.5;
            case 'rollback':
                return await this.rollback(context);
            default:
                return false;
        }
    }
    /**
     * Rollback changes
     */
    async rollback(context) {
        this.logger.info('Rolling back changes...');
        // In production, this would:
        // 1. Use git stash or checkpoint restore
        // 2. Revert to last known good state
        if (context?.taskId) {
            this.logger.info(`[SIMULATED] Would rollback task: ${context.taskId}`);
        }
        return true;
    }
    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=auto-fix-loop.js.map