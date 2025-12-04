/**
 * Latent Chain Mode Types
 *
 * Implements "Latent Chain Mode" - Stanford/Princeton/UIUC paper style
 * for hidden-state reasoning with MCP tools.
 *
 * Goals:
 * - Reduce token usage by 70-80%
 * - Speed up 3-4x with multi-agent
 * - Use context_delta instead of full text
 */
/**
 * Phase in Latent Chain workflow
 */
export type LatentPhase = 'analysis' | 'plan' | 'impl' | 'review';
/**
 * Decision made during task execution
 */
export interface LatentDecision {
    /** Unique decision ID (e.g., "D001") */
    id: string;
    /** Brief summary (1-2 sentences max) */
    summary: string;
    /** Short rationale */
    rationale: string;
    /** Phase when decision was made */
    phase: LatentPhase;
    /** Timestamp */
    createdAt: Date;
}
/**
 * Code map for tracking files and hot spots
 */
export interface CodeMap {
    /** Files involved in the task */
    files: string[];
    /** Hot spots - areas requiring attention */
    hotSpots: string[];
    /** Components/modules affected */
    components: string[];
}
/**
 * Task artifacts generated during execution
 */
export interface TaskArtifacts {
    /** Test files created/modified */
    tests: string[];
    /** API endpoints created/modified */
    endpoints: string[];
    /** Patches applied */
    patches: AppliedPatch[];
    /** Other artifacts */
    other: Record<string, unknown>;
}
/**
 * Applied patch record
 */
export interface AppliedPatch {
    /** Target file */
    target: string;
    /** Patch content (unified diff format) */
    patch: string;
    /** Applied at timestamp */
    appliedAt: Date;
    /** Success status */
    success: boolean;
    /** Error message if failed */
    error?: string;
}
/**
 * AgentLatentContext - KV cache-like structure for hidden state
 *
 * This is the core data structure that agents read from and write to.
 * Agents communicate via context_delta updates instead of full text.
 */
export interface AgentLatentContext {
    /** Unique task identifier */
    taskId: string;
    /** Current phase */
    phase: LatentPhase;
    /** Code map tracking files and hot spots */
    codeMap: CodeMap;
    /** Constraints/rules to follow */
    constraints: string[];
    /** Identified risks */
    risks: string[];
    /** Decisions made during execution */
    decisions: LatentDecision[];
    /** Generated artifacts */
    artifacts: TaskArtifacts;
    /** Additional metadata */
    metadata: LatentMetadata;
    /** Creation timestamp */
    createdAt: Date;
    /** Last update timestamp */
    updatedAt: Date;
    /** Version for concurrency control */
    version: number;
}
/**
 * Metadata for latent context
 */
export interface LatentMetadata {
    /** Agent that created this context */
    createdBy?: string;
    /** Last agent to update */
    lastUpdatedBy?: string;
    /** Token count estimate */
    estimatedTokens?: number;
    /** Actual token count used */
    actualTokens?: number;
    /** Parent task ID (for subtasks) */
    parentTaskId?: string;
    /** Custom data */
    custom: Record<string, unknown>;
}
/**
 * ContextDelta - Only the changes, not full context
 *
 * MCP will merge this into the main AgentLatentContext.
 * This is key to reducing token usage.
 */
export interface ContextDelta {
    /** Phase update (optional) */
    phase?: LatentPhase;
    /** Code map updates (partial) */
    codeMap?: Partial<CodeMap>;
    /** New constraints to add */
    constraints?: string[];
    /** New risks to add */
    risks?: string[];
    /** New decisions to add */
    decisions?: Omit<LatentDecision, 'createdAt'>[];
    /** Artifact updates */
    artifacts?: Partial<TaskArtifacts>;
    /** Metadata updates */
    metadata?: Partial<LatentMetadata>;
    /** Items to remove (by ID or value) */
    remove?: {
        constraints?: string[];
        risks?: string[];
        decisions?: string[];
        files?: string[];
        hotSpots?: string[];
    };
}
/**
 * Action types for Latent Chain
 */
export type LatentActionType = 'edit_file' | 'create_file' | 'delete_file' | 'apply_patch' | 'run_command' | 'run_tests' | 'refactor' | 'add_dependency' | 'custom';
/**
 * Action to be executed
 */
export interface LatentAction {
    /** Action type */
    type: LatentActionType;
    /** Target (file path, command, etc.) */
    target: string;
    /** Brief description */
    description: string;
    /** Patch content (for apply_patch) */
    patch?: string;
    /** Command to run (for run_command) */
    command?: string;
    /** Priority order */
    order?: number;
    /** Additional parameters */
    params?: Record<string, unknown>;
}
/**
 * LatentResponse - Standard output format from Claude
 *
 * This is what Claude outputs instead of long text.
 * Summary is max 2 sentences. All details go into context_delta.
 */
export interface LatentResponse {
    /** Brief summary (1-2 sentences max) */
    summary: string;
    /** Context changes to merge */
    contextDelta: ContextDelta;
    /** Actions to execute */
    actions: LatentAction[];
    /** Phase completed */
    phaseCompleted?: LatentPhase;
    /** Next phase to enter */
    nextPhase?: LatentPhase;
    /** Whether task is complete */
    taskComplete?: boolean;
    /** Error if something went wrong */
    error?: string;
}
/**
 * Latent module configuration
 */
export interface LatentModuleConfig {
    /** Whether module is enabled */
    enabled: boolean;
    /** Maximum contexts to keep in memory */
    maxContexts: number;
    /** Auto-merge context deltas */
    autoMerge: boolean;
    /** Persist contexts to disk */
    persist: boolean;
    /** Path for persisted contexts */
    persistPath?: string;
    /** Enable strict validation */
    strictValidation: boolean;
    /** Max summary length (chars) */
    maxSummaryLength: number;
    /** Max decisions per context */
    maxDecisions: number;
    /** Auto-cleanup completed contexts after (ms) */
    cleanupAfterMs: number;
    /** Auto-attach latent context when workflow task is active */
    autoAttach: boolean;
    /** Tools that trigger auto-attach when called */
    autoAttachTriggerTools: string[];
}
/**
 * Module status
 */
export interface LatentModuleStatus {
    /** Whether module is enabled */
    enabled: boolean;
    /** Active contexts count */
    activeContexts: number;
    /** Total contexts created */
    totalCreated: number;
    /** Total deltas merged */
    totalDeltasMerged: number;
    /** Total patches applied */
    totalPatchesApplied: number;
    /** Statistics by phase */
    phaseStats: Record<LatentPhase, number>;
    /** Average tokens saved (estimate) */
    avgTokensSaved: number;
}
/**
 * Parameters for creating a new latent context
 */
export interface CreateContextParams {
    /** Task ID (required) */
    taskId: string;
    /** Initial phase (default: analysis) */
    phase?: LatentPhase;
    /** Initial constraints */
    constraints?: string[];
    /** Initial files */
    files?: string[];
    /** Creating agent */
    agentId?: string;
}
/**
 * Parameters for updating context
 */
export interface UpdateContextParams {
    /** Task ID */
    taskId: string;
    /** Context delta to merge */
    delta: ContextDelta;
    /** Agent making update */
    agentId?: string;
    /** Force update even if version mismatch */
    force?: boolean;
}
/**
 * Parameters for applying a patch
 */
export interface ApplyPatchParams {
    /** Task ID */
    taskId: string;
    /** Target file */
    target: string;
    /** Patch content (unified diff) */
    patch: string;
    /** Dry run only */
    dryRun?: boolean;
}
/**
 * Parameters for getting context
 */
export interface GetContextParams {
    /** Task ID */
    taskId: string;
    /** Include full history */
    includeHistory?: boolean;
    /** Fields to include (empty = all) */
    fields?: (keyof AgentLatentContext)[];
}
/**
 * Parameters for phase transition
 */
export interface TransitionPhaseParams {
    /** Task ID */
    taskId: string;
    /** Target phase */
    toPhase: LatentPhase;
    /** Summary of phase completion */
    summary?: string;
    /** Agent making transition */
    agentId?: string;
}
/**
 * Parameters for step logging (Observer Pattern)
 */
export interface StepLogParams {
    /** Task ID (creates context if not exists) */
    taskId: string;
    /** Current phase of reasoning */
    phase: LatentPhase;
    /** Brief description of the reasoning step */
    description: string;
    /** Files affected or being considered */
    affectedFiles?: string[];
    /** Decisions made in this step (format: "D001: summary") */
    decisions?: string[];
    /** Risks identified in this step */
    risks?: string[];
    /** What Claude will do next */
    nextAction?: string;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}
/**
 * History entry for context changes
 */
export interface ContextHistoryEntry {
    /** Entry ID */
    id: string;
    /** Task ID */
    taskId: string;
    /** Operation type */
    operation: 'create' | 'update' | 'transition' | 'patch' | 'complete';
    /** Delta applied */
    delta?: ContextDelta;
    /** Agent responsible */
    agentId?: string;
    /** Phase at time of change */
    phase: LatentPhase;
    /** Timestamp */
    timestamp: Date;
    /** Version after change */
    version: number;
}
/**
 * Full context with history
 */
export interface LatentContextWithHistory {
    /** Current context */
    context: AgentLatentContext;
    /** Change history */
    history: ContextHistoryEntry[];
}
/**
 * Validation result for latent response
 */
export interface LatentValidationResult {
    /** Is valid */
    valid: boolean;
    /** Validation errors */
    errors: LatentValidationError[];
    /** Warnings (non-blocking) */
    warnings: string[];
}
/**
 * Validation error
 */
export interface LatentValidationError {
    /** Field with error */
    field: string;
    /** Error message */
    message: string;
    /** Suggested fix */
    suggestion?: string;
}
/**
 * Latent module events
 */
export interface LatentEvents {
    'latent:context:created': {
        taskId: string;
        context: AgentLatentContext;
    };
    'latent:context:updated': {
        taskId: string;
        delta: ContextDelta;
        version: number;
    };
    'latent:phase:transition': {
        taskId: string;
        from: LatentPhase;
        to: LatentPhase;
    };
    'latent:patch:applied': {
        taskId: string;
        target: string;
        success: boolean;
    };
    'latent:task:completed': {
        taskId: string;
        summary: string;
    };
    'latent:validation:failed': {
        taskId: string;
        errors: LatentValidationError[];
    };
}
//# sourceMappingURL=latent.types.d.ts.map