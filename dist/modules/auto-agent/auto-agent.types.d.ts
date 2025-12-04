/**
 * Auto-Agent Module Types
 *
 * Types for autonomous agent capabilities:
 * - TaskDecomposer: Break complex tasks into subtasks
 * - ToolRouter: Auto-select appropriate tools
 * - AutoFixLoop: Self-healing error correction
 * - ErrorMemory: Learn from errors
 */
export interface AutoAgentModuleConfig {
    enabled: boolean;
    decomposer: {
        maxSubtasks: number;
        autoDecompose: boolean;
        minComplexityForDecompose: number;
    };
    router: {
        enabled: boolean;
        routingRules: ToolRoutingRule[];
        fallbackAgent?: string;
    };
    fixLoop: {
        enabled: boolean;
        maxRetries: number;
        retryDelayMs: number;
        autoRollbackOnFail: boolean;
    };
    errorMemory: {
        enabled: boolean;
        maxErrors: number;
        deduplicateThreshold: number;
        autoRecall: boolean;
    };
}
export interface TaskComplexityAnalysis {
    score: number;
    factors: ComplexityFactor[];
    suggestDecompose: boolean;
    estimatedSubtasks: number;
}
export interface ComplexityFactor {
    name: string;
    weight: number;
    description: string;
}
export interface SubtaskDefinition {
    id: string;
    name: string;
    description: string;
    order: number;
    dependsOn: string[];
    estimatedTokens: number;
    phase: 'analysis' | 'plan' | 'impl' | 'review';
    tools: string[];
    files?: string[];
}
export interface DecomposeResult {
    success: boolean;
    taskId: string;
    complexity: TaskComplexityAnalysis;
    subtasks: SubtaskDefinition[];
    suggestedOrder: string[];
}
export interface DecomposeParams {
    taskName: string;
    taskDescription?: string;
    context?: {
        files?: string[];
        constraints?: string[];
        domain?: string;
    };
    forceDecompose?: boolean;
}
export interface ToolRoutingRule {
    id: string;
    name: string;
    pattern: string;
    matchType: 'keyword' | 'regex' | 'file_pattern' | 'domain';
    tools: string[];
    priority: number;
    conditions?: RoutingCondition[];
}
export interface RoutingCondition {
    type: 'file_exists' | 'has_content' | 'phase' | 'custom';
    value: string;
    negate?: boolean;
}
export interface ToolRouteResult {
    success: boolean;
    suggestedTools: SuggestedTool[];
    matchedRules: string[];
    confidence: number;
}
export interface SuggestedTool {
    name: string;
    reason: string;
    priority: number;
    params?: Record<string, unknown>;
}
export interface RouteToolParams {
    action: string;
    context?: {
        phase?: string;
        files?: string[];
        currentTask?: string;
        domain?: string;
    };
}
export type FixLoopStatus = 'idle' | 'running' | 'success' | 'failed' | 'rolled_back';
export interface FixAttempt {
    id: string;
    attemptNumber: number;
    timestamp: Date;
    error: ErrorInfo;
    fix: FixAction;
    result: 'success' | 'failed' | 'partial';
    durationMs: number;
}
export interface ErrorInfo {
    type: string;
    message: string;
    file?: string;
    line?: number;
    code?: string;
    stackTrace?: string;
}
export interface FixAction {
    type: 'patch' | 'rollback' | 'config' | 'dependency' | 'custom';
    target: string;
    description: string;
    patch?: string;
    command?: string;
}
export interface FixLoopResult {
    success: boolean;
    status: FixLoopStatus;
    attempts: FixAttempt[];
    totalAttempts: number;
    finalError?: ErrorInfo;
    rolledBack: boolean;
}
export interface StartFixLoopParams {
    error: ErrorInfo;
    context: {
        taskId?: string;
        latentContextId?: string;
        files?: string[];
    };
    maxRetries?: number;
}
export interface ErrorMemoryEntry {
    id: string;
    error: ErrorInfo;
    fix: FixAction;
    success: boolean;
    createdAt: Date;
    accessCount: number;
    lastAccessedAt: Date;
    tags: string[];
    similarity?: number;
}
export interface ErrorPattern {
    id: string;
    pattern: string;
    errorType: string;
    fixTemplate: FixAction;
    occurrences: number;
    successRate: number;
}
export interface RecallErrorsParams {
    error?: ErrorInfo;
    tags?: string[];
    limit?: number;
    minSimilarity?: number;
}
export interface RecallErrorsResult {
    matches: ErrorMemoryEntry[];
    suggestedFix?: FixAction;
    confidence: number;
}
export interface StoreErrorParams {
    error: ErrorInfo;
    fix: FixAction;
    success: boolean;
    tags?: string[];
}
export interface AutoAgentStatus {
    enabled: boolean;
    decomposer: {
        enabled: boolean;
        totalDecomposed: number;
        avgSubtasks: number;
    };
    router: {
        enabled: boolean;
        rulesCount: number;
        totalRouted: number;
    };
    fixLoop: {
        enabled: boolean;
        currentStatus: FixLoopStatus;
        totalLoops: number;
        successRate: number;
    };
    errorMemory: {
        enabled: boolean;
        errorCount: number;
        patternCount: number;
    };
}
export type AutoAgentEventType = 'auto-agent:task:decomposed' | 'auto-agent:tool:routed' | 'auto-agent:fix:started' | 'auto-agent:fix:attempt' | 'auto-agent:fix:success' | 'auto-agent:fix:failed' | 'auto-agent:fix:rollback' | 'auto-agent:error:stored' | 'auto-agent:error:recalled';
//# sourceMappingURL=auto-agent.types.d.ts.map