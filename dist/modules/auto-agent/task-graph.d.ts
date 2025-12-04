/**
 * TaskGraph - DAG-based Task Orchestration
 *
 * Replaces linear TaskDecomposer with a Directed Acyclic Graph
 * for better parallelism and dependency management.
 *
 * Key Features:
 * - Parallel task execution
 * - Critical path calculation
 * - Topological sorting
 * - Dynamic task insertion
 * - Execution state tracking
 */
import { Logger } from '../../core/logger.js';
import { EventBus } from '../../core/event-bus.js';
export type TaskNodeStatus = 'pending' | 'ready' | 'running' | 'completed' | 'failed' | 'skipped';
export type TaskPhase = 'analysis' | 'plan' | 'impl' | 'review' | 'test';
export interface TaskNode {
    id: string;
    name: string;
    description: string;
    phase: TaskPhase;
    status: TaskNodeStatus;
    dependsOn: string[];
    dependents: string[];
    estimatedTokens: number;
    actualTokens?: number;
    tools: string[];
    result?: unknown;
    error?: string;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    files?: string[];
    priority: number;
    retryCount: number;
    maxRetries: number;
}
export interface TaskGraph {
    id: string;
    name: string;
    description?: string;
    rootId: string;
    nodes: Map<string, TaskNode>;
    edges: Map<string, string[]>;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
    currentPhase: TaskPhase;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    totalEstimatedTokens: number;
    actualTokensUsed: number;
}
export interface GraphAnalysis {
    totalNodes: number;
    completedNodes: number;
    pendingNodes: number;
    runningNodes: number;
    failedNodes: number;
    criticalPath: string[];
    criticalPathLength: number;
    parallelizableGroups: string[][];
    progress: number;
    estimatedRemainingTokens: number;
}
export interface CreateGraphParams {
    name: string;
    description?: string;
    taskType: 'feature' | 'bugfix' | 'refactor' | 'review' | 'custom';
    files?: string[];
    constraints?: string[];
    customNodes?: Partial<TaskNode>[];
}
export declare class TaskGraphService {
    private graphs;
    private logger;
    private eventBus;
    constructor(logger: Logger, eventBus: EventBus);
    /**
     * Create a new task graph from template
     */
    createGraph(params: CreateGraphParams): TaskGraph;
    /**
     * Get a graph by ID
     */
    getGraph(graphId: string): TaskGraph | undefined;
    /**
     * Delete a graph
     */
    deleteGraph(graphId: string): boolean;
    /**
     * List all graphs
     */
    listGraphs(): TaskGraph[];
    /**
     * Get next executable nodes (ready nodes with no pending dependencies)
     */
    getNextNodes(graphId: string): TaskNode[];
    /**
     * Start a node execution
     */
    startNode(graphId: string, nodeId: string): TaskNode | undefined;
    /**
     * Complete a node
     */
    completeNode(graphId: string, nodeId: string, result?: unknown, tokensUsed?: number): TaskNode | undefined;
    /**
     * Fail a node
     */
    failNode(graphId: string, nodeId: string, error: string): TaskNode | undefined;
    /**
     * Skip all nodes that depend on a failed node
     */
    private skipDependents;
    /**
     * Analyze graph state
     */
    analyzeGraph(graphId: string): GraphAnalysis | undefined;
    /**
     * Find critical path (longest path by tokens)
     */
    private findCriticalPath;
    /**
     * Topological sort
     */
    private topologicalSort;
    /**
     * Find groups of nodes that can run in parallel
     */
    private findParallelGroups;
    /**
     * Get graph statistics
     */
    getStats(): {
        totalGraphs: number;
        completedGraphs: number;
        activeGraphs: number;
        totalNodes: number;
        completedNodes: number;
    };
}
//# sourceMappingURL=task-graph.d.ts.map