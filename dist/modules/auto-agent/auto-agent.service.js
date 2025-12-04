// src/modules/auto-agent/auto-agent.service.ts
/**
 * AutoAgent Service
 *
 * Main orchestrator for autonomous agent capabilities.
 * Coordinates TaskDecomposer, ToolRouter, AutoFixLoop, and ErrorMemory.
 */
import { TaskDecomposer } from './task-decomposer.js';
import { ToolRouter } from './tool-router.js';
import { AutoFixLoop } from './auto-fix-loop.js';
import { ErrorMemory } from './error-memory.js';
export class AutoAgentService {
    config;
    logger;
    eventBus;
    // Sub-services
    decomposer;
    router;
    fixLoop;
    errorMemory;
    constructor(config, eventBus, logger) {
        this.config = config;
        this.logger = logger;
        this.eventBus = eventBus;
        // Initialize sub-services
        this.decomposer = new TaskDecomposer(config.decomposer, logger, eventBus);
        this.router = new ToolRouter(config.router, logger, eventBus);
        this.fixLoop = new AutoFixLoop(config.fixLoop, logger, eventBus);
        this.errorMemory = new ErrorMemory(config.errorMemory, logger, eventBus);
    }
    // ═══════════════════════════════════════════════════════════════
    //                      LIFECYCLE
    // ═══════════════════════════════════════════════════════════════
    async initialize() {
        if (!this.config.enabled) {
            this.logger.info('AutoAgent module is disabled');
            return;
        }
        this.logger.info('Initializing AutoAgent service...');
        // Setup event listeners for auto-features
        this.setupEventListeners();
        this.logger.info('AutoAgent service initialized');
    }
    async shutdown() {
        this.logger.info('Shutting down AutoAgent service...');
        // Cleanup if needed
        this.logger.info('AutoAgent service shutdown complete');
    }
    // ═══════════════════════════════════════════════════════════════
    //                      TASK DECOMPOSITION
    // ═══════════════════════════════════════════════════════════════
    /**
     * Decompose a task into subtasks
     */
    async decomposeTask(params) {
        if (!this.config.decomposer.autoDecompose && !params.forceDecompose) {
            return {
                success: false,
                taskId: '',
                complexity: { score: 0, factors: [], suggestDecompose: false, estimatedSubtasks: 0 },
                subtasks: [],
                suggestedOrder: [],
            };
        }
        return this.decomposer.decompose(params);
    }
    /**
     * Analyze task complexity
     */
    analyzeComplexity(params) {
        return this.decomposer.analyzeComplexity(params);
    }
    // ═══════════════════════════════════════════════════════════════
    //                      TOOL ROUTING
    // ═══════════════════════════════════════════════════════════════
    /**
     * Route to appropriate tools
     */
    routeTools(params) {
        if (!this.config.router.enabled) {
            return {
                success: false,
                suggestedTools: [],
                matchedRules: [],
                confidence: 0,
            };
        }
        return this.router.route(params);
    }
    /**
     * Get best tool for action
     */
    getBestTool(params) {
        return this.router.getBestTool(params);
    }
    // ═══════════════════════════════════════════════════════════════
    //                      AUTO FIX LOOP
    // ═══════════════════════════════════════════════════════════════
    /**
     * Start fix loop
     */
    async startFixLoop(params) {
        if (!this.config.fixLoop.enabled) {
            return {
                success: false,
                status: 'idle',
                attempts: [],
                totalAttempts: 0,
                rolledBack: false,
            };
        }
        // First, recall similar errors
        if (this.config.errorMemory.autoRecall) {
            const recalled = await this.errorMemory.recall({ error: params.error });
            if (recalled.suggestedFix && recalled.confidence > 0.7) {
                this.logger.info(`Found high-confidence fix from memory (${recalled.confidence})`);
                // Could inject suggested fix here
            }
        }
        return this.fixLoop.startFixLoop(params);
    }
    /**
     * Get fix loop status
     */
    getFixLoopStatus() {
        return this.fixLoop.getStatus();
    }
    /**
     * Reset fix loop
     */
    resetFixLoop() {
        this.fixLoop.reset();
    }
    // ═══════════════════════════════════════════════════════════════
    //                      ERROR MEMORY
    // ═══════════════════════════════════════════════════════════════
    /**
     * Store error and fix
     */
    async storeError(params) {
        return this.errorMemory.store(params);
    }
    /**
     * Recall similar errors
     */
    async recallErrors(params) {
        return this.errorMemory.recall(params);
    }
    /**
     * Get all stored errors
     */
    getAllErrors() {
        return this.errorMemory.getAll();
    }
    // ═══════════════════════════════════════════════════════════════
    //                      STATUS
    // ═══════════════════════════════════════════════════════════════
    /**
     * Get module status
     */
    getStatus() {
        const decomposerStats = this.decomposer.getStats();
        const routerStats = this.router.getStats();
        const fixLoopStats = this.fixLoop.getStats();
        const errorMemoryStats = this.errorMemory.getStats();
        return {
            enabled: this.config.enabled,
            decomposer: {
                enabled: this.config.decomposer.autoDecompose,
                totalDecomposed: decomposerStats.totalDecomposed,
                avgSubtasks: decomposerStats.avgSubtasks,
            },
            router: {
                enabled: this.config.router.enabled,
                rulesCount: routerStats.rulesCount,
                totalRouted: routerStats.totalRouted,
            },
            fixLoop: {
                enabled: this.config.fixLoop.enabled,
                currentStatus: this.fixLoop.getStatus(),
                totalLoops: fixLoopStats.totalLoops,
                successRate: fixLoopStats.successRate,
            },
            errorMemory: {
                enabled: this.config.errorMemory.enabled,
                errorCount: errorMemoryStats.errorCount,
                patternCount: errorMemoryStats.patternCount,
            },
        };
    }
    // ═══════════════════════════════════════════════════════════════
    //                      PRIVATE METHODS
    // ═══════════════════════════════════════════════════════════════
    /**
     * Setup event listeners for auto-features
     */
    setupEventListeners() {
        // Auto-store errors from fix loop
        this.eventBus.on('auto-agent:fix:success', async (event) => {
            const data = event.data;
            await this.errorMemory.store({
                error: { type: 'fix', message: 'Auto-fixed error' },
                fix: {
                    type: 'patch',
                    target: data.fix.target,
                    description: data.fix.description,
                },
                success: true,
                tags: ['auto-fix'],
            });
        });
        this.eventBus.on('auto-agent:fix:failed', async (event) => {
            const data = event.data;
            if (data.attempts > 0) {
                await this.errorMemory.store({
                    error: { type: 'fix', message: 'Failed to auto-fix' },
                    fix: { type: 'custom', target: '', description: 'No fix found' },
                    success: false,
                    tags: ['auto-fix-failed'],
                });
            }
        });
        // Auto-decompose on task creation (if enabled)
        this.eventBus.on('task:create', async (event) => {
            if (this.config.decomposer.autoDecompose) {
                const data = event.data;
                const task = data?.task;
                if (task) {
                    await this.decomposeTask({
                        taskName: task.name,
                        taskDescription: task.description,
                    });
                }
            }
        });
        this.logger.debug('AutoAgent event listeners registered');
    }
}
//# sourceMappingURL=auto-agent.service.js.map