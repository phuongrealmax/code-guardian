/**
 * TaskDecomposer Service
 *
 * Automatically breaks down complex tasks into manageable subtasks.
 * Uses heuristics and patterns to analyze task complexity and
 * suggest optimal decomposition.
 */
import { Logger } from '../../core/logger.js';
import { EventBus } from '../../core/event-bus.js';
import { AutoAgentModuleConfig, TaskComplexityAnalysis, DecomposeResult, DecomposeParams } from './auto-agent.types.js';
export declare class TaskDecomposer {
    private config;
    private logger;
    private eventBus;
    private stats;
    constructor(config: AutoAgentModuleConfig['decomposer'], logger: Logger, eventBus: EventBus);
    /**
     * Analyze task complexity
     */
    analyzeComplexity(params: DecomposeParams): TaskComplexityAnalysis;
    /**
     * Decompose task into subtasks
     */
    decompose(params: DecomposeParams): Promise<DecomposeResult>;
    /**
     * Get decomposition statistics
     */
    getStats(): {
        avgSubtasks: number;
        totalDecomposed: number;
        totalSubtasksCreated: number;
    };
    /**
     * Detect task type from name/description
     */
    private detectTaskType;
}
//# sourceMappingURL=task-decomposer.d.ts.map