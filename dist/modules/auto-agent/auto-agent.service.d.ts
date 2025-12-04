/**
 * AutoAgent Service
 *
 * Main orchestrator for autonomous agent capabilities.
 * Coordinates TaskDecomposer, ToolRouter, AutoFixLoop, and ErrorMemory.
 */
import { Logger } from '../../core/logger.js';
import { EventBus } from '../../core/event-bus.js';
import { AutoAgentModuleConfig, AutoAgentStatus, DecomposeParams, DecomposeResult, RouteToolParams, ToolRouteResult, StartFixLoopParams, FixLoopResult, StoreErrorParams, RecallErrorsParams, RecallErrorsResult, ErrorMemoryEntry } from './auto-agent.types.js';
export declare class AutoAgentService {
    private config;
    private logger;
    private eventBus;
    private decomposer;
    private router;
    private fixLoop;
    private errorMemory;
    constructor(config: AutoAgentModuleConfig, eventBus: EventBus, logger: Logger);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    /**
     * Decompose a task into subtasks
     */
    decomposeTask(params: DecomposeParams): Promise<DecomposeResult>;
    /**
     * Analyze task complexity
     */
    analyzeComplexity(params: DecomposeParams): import("./auto-agent.types.js").TaskComplexityAnalysis;
    /**
     * Route to appropriate tools
     */
    routeTools(params: RouteToolParams): ToolRouteResult;
    /**
     * Get best tool for action
     */
    getBestTool(params: RouteToolParams): import("./auto-agent.types.js").SuggestedTool | null;
    /**
     * Start fix loop
     */
    startFixLoop(params: StartFixLoopParams): Promise<FixLoopResult>;
    /**
     * Get fix loop status
     */
    getFixLoopStatus(): import("./auto-agent.types.js").FixLoopStatus;
    /**
     * Reset fix loop
     */
    resetFixLoop(): void;
    /**
     * Store error and fix
     */
    storeError(params: StoreErrorParams): Promise<ErrorMemoryEntry>;
    /**
     * Recall similar errors
     */
    recallErrors(params: RecallErrorsParams): Promise<RecallErrorsResult>;
    /**
     * Get all stored errors
     */
    getAllErrors(): ErrorMemoryEntry[];
    /**
     * Get module status
     */
    getStatus(): AutoAgentStatus;
    /**
     * Setup event listeners for auto-features
     */
    private setupEventListeners;
}
//# sourceMappingURL=auto-agent.service.d.ts.map