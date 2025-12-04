/**
 * AutoAgent Module v3.0
 *
 * Provides autonomous agent capabilities:
 * - TaskDecomposer: Break complex tasks into subtasks (linear)
 * - TaskGraph: DAG-based task orchestration (NEW - parallel execution)
 * - ToolRouter: Auto-select appropriate tools
 * - AutoFixLoop: Self-healing error correction
 * - ErrorMemory: Learn from errors
 */
import { EventBus } from '../../core/event-bus.js';
import { Logger } from '../../core/logger.js';
import { AutoAgentModuleConfig } from './auto-agent.types.js';
import { AutoAgentService } from './auto-agent.service.js';
import { TaskGraphService } from './task-graph.js';
export * from './auto-agent.types.js';
export { AutoAgentService } from './auto-agent.service.js';
export { TaskDecomposer } from './task-decomposer.js';
export { ToolRouter } from './tool-router.js';
export { AutoFixLoop } from './auto-fix-loop.js';
export { ErrorMemory } from './error-memory.js';
export { TaskGraphService } from './task-graph.js';
export type { TaskGraph, TaskNode, GraphAnalysis, CreateGraphParams } from './task-graph.js';
export { createTaskGraphTools, TASK_GRAPH_TOOL_DEFINITIONS } from './task-graph.tools.js';
export declare const DEFAULT_AUTO_AGENT_CONFIG: AutoAgentModuleConfig;
/**
 * AutoAgent Module Class v3.0
 */
export declare class AutoAgentModule {
    private service;
    private taskGraphService;
    private config;
    private logger;
    constructor(config: Partial<AutoAgentModuleConfig>, eventBus: EventBus, logger: Logger);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    getService(): AutoAgentService;
    getTaskGraphService(): TaskGraphService;
    getTools(): ({
        name: string;
        description: string;
        inputSchema: import("zod").ZodObject<{
            taskName: import("zod").ZodString;
            taskDescription: import("zod").ZodOptional<import("zod").ZodString>;
            files: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
            constraints: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
            domain: import("zod").ZodOptional<import("zod").ZodString>;
            forceDecompose: import("zod").ZodOptional<import("zod").ZodBoolean>;
        }, import("zod/v4/core").$strip>;
        handler: (input: import("zod").infer<import("zod").ZodObject<{
            taskName: import("zod").ZodString;
            taskDescription: import("zod").ZodOptional<import("zod").ZodString>;
            files: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
            constraints: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
            domain: import("zod").ZodOptional<import("zod").ZodString>;
            forceDecompose: import("zod").ZodOptional<import("zod").ZodBoolean>;
        }, import("zod/v4/core").$strip>>) => Promise<{
            success: boolean;
            taskId: string;
            complexity: {
                score: number;
                suggestDecompose: boolean;
                factors: string[];
            };
            subtasks: {
                id: string;
                name: string;
                description: string;
                order: number;
                phase: "analysis" | "review" | "plan" | "impl";
                tools: string[];
                estimatedTokens: number;
            }[];
            suggestedOrder: string[];
        }>;
    } | {
        name: string;
        description: string;
        inputSchema: import("zod").ZodObject<{
            domain: import("zod").ZodOptional<import("zod").ZodString>;
            files: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
            constraints: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
            taskName: import("zod").ZodString;
            taskDescription: import("zod").ZodOptional<import("zod").ZodString>;
        }, import("zod/v4/core").$strip>;
        handler: (input: import("zod").infer<import("zod").ZodObject<{
            taskName: import("zod").ZodString;
            taskDescription: import("zod").ZodOptional<import("zod").ZodString>;
            files: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
            constraints: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
            domain: import("zod").ZodOptional<import("zod").ZodString>;
            forceDecompose: import("zod").ZodOptional<import("zod").ZodBoolean>;
        }, import("zod/v4/core").$strip>>) => Promise<{
            score: number;
            suggestDecompose: boolean;
            estimatedSubtasks: number;
            factors: {
                name: string;
                weight: number;
                description: string;
            }[];
        }>;
    } | {
        name: string;
        description: string;
        inputSchema: import("zod").ZodObject<{
            action: import("zod").ZodString;
            phase: import("zod").ZodOptional<import("zod").ZodString>;
            files: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
            currentTask: import("zod").ZodOptional<import("zod").ZodString>;
            domain: import("zod").ZodOptional<import("zod").ZodString>;
        }, import("zod/v4/core").$strip>;
        handler: (input: import("zod").infer<import("zod").ZodObject<{
            action: import("zod").ZodString;
            phase: import("zod").ZodOptional<import("zod").ZodString>;
            files: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
            currentTask: import("zod").ZodOptional<import("zod").ZodString>;
            domain: import("zod").ZodOptional<import("zod").ZodString>;
        }, import("zod/v4/core").$strip>>) => Promise<{
            success: boolean;
            suggestedTools: {
                name: string;
                reason: string;
                priority: number;
            }[];
            matchedRules: string[];
            confidence: number;
        }>;
    } | {
        name: string;
        description: string;
        inputSchema: import("zod").ZodObject<{
            errorType: import("zod").ZodString;
            errorMessage: import("zod").ZodString;
            file: import("zod").ZodOptional<import("zod").ZodString>;
            line: import("zod").ZodOptional<import("zod").ZodNumber>;
            code: import("zod").ZodOptional<import("zod").ZodString>;
            taskId: import("zod").ZodOptional<import("zod").ZodString>;
            maxRetries: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod/v4/core").$strip>;
        handler: (input: import("zod").infer<import("zod").ZodObject<{
            errorType: import("zod").ZodString;
            errorMessage: import("zod").ZodString;
            file: import("zod").ZodOptional<import("zod").ZodString>;
            line: import("zod").ZodOptional<import("zod").ZodNumber>;
            code: import("zod").ZodOptional<import("zod").ZodString>;
            taskId: import("zod").ZodOptional<import("zod").ZodString>;
            maxRetries: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod/v4/core").$strip>>) => Promise<{
            success: boolean;
            status: import("./auto-agent.types.js").FixLoopStatus;
            totalAttempts: number;
            rolledBack: boolean;
            attempts: {
                attemptNumber: number;
                fix: string;
                result: "failed" | "partial" | "success";
                durationMs: number;
            }[];
            finalError: {
                type: string;
                message: string;
            } | undefined;
        }>;
    } | {
        name: string;
        description: string;
        inputSchema: import("zod").ZodObject<{}, import("zod/v4/core").$strip>;
        handler: () => Promise<{
            status: import("./auto-agent.types.js").FixLoopStatus;
        }>;
    } | {
        name: string;
        description: string;
        inputSchema: import("zod").ZodObject<{
            errorType: import("zod").ZodString;
            errorMessage: import("zod").ZodString;
            file: import("zod").ZodOptional<import("zod").ZodString>;
            fixType: import("zod").ZodEnum<{
                config: "config";
                custom: "custom";
                patch: "patch";
                rollback: "rollback";
                dependency: "dependency";
            }>;
            fixTarget: import("zod").ZodString;
            fixDescription: import("zod").ZodString;
            success: import("zod").ZodBoolean;
            tags: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
        }, import("zod/v4/core").$strip>;
        handler: (input: import("zod").infer<import("zod").ZodObject<{
            errorType: import("zod").ZodString;
            errorMessage: import("zod").ZodString;
            file: import("zod").ZodOptional<import("zod").ZodString>;
            fixType: import("zod").ZodEnum<{
                config: "config";
                custom: "custom";
                patch: "patch";
                rollback: "rollback";
                dependency: "dependency";
            }>;
            fixTarget: import("zod").ZodString;
            fixDescription: import("zod").ZodString;
            success: import("zod").ZodBoolean;
            tags: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
        }, import("zod/v4/core").$strip>>) => Promise<{
            success: boolean;
            errorId: string;
            message: string;
        }>;
    } | {
        name: string;
        description: string;
        inputSchema: import("zod").ZodObject<{
            errorType: import("zod").ZodOptional<import("zod").ZodString>;
            errorMessage: import("zod").ZodOptional<import("zod").ZodString>;
            tags: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
            limit: import("zod").ZodOptional<import("zod").ZodNumber>;
            minSimilarity: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod/v4/core").$strip>;
        handler: (input: import("zod").infer<import("zod").ZodObject<{
            errorType: import("zod").ZodOptional<import("zod").ZodString>;
            errorMessage: import("zod").ZodOptional<import("zod").ZodString>;
            tags: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
            limit: import("zod").ZodOptional<import("zod").ZodNumber>;
            minSimilarity: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod/v4/core").$strip>>) => Promise<{
            matchCount: number;
            matches: {
                errorType: string;
                errorMessage: string;
                fixDescription: string;
                success: boolean;
                similarity: number | undefined;
            }[];
            suggestedFix: {
                type: "config" | "custom" | "patch" | "rollback" | "dependency";
                target: string;
                description: string;
            } | undefined;
            confidence: number;
        }>;
    } | {
        name: string;
        description: string;
        inputSchema: import("zod").ZodObject<{}, import("zod/v4/core").$strip>;
        handler: () => Promise<import("./auto-agent.types.js").AutoAgentStatus>;
    })[];
    /**
     * Get TaskGraph tools for MCP registration
     */
    getTaskGraphTools(): {
        auto_create_graph: {
            description: string;
            parameters: import("zod").ZodObject<{
                name: import("zod").ZodString;
                description: import("zod").ZodOptional<import("zod").ZodString>;
                taskType: import("zod").ZodEnum<{
                    custom: "custom";
                    feature: "feature";
                    refactor: "refactor";
                    review: "review";
                    bugfix: "bugfix";
                }>;
                files: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
                constraints: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
            }, import("zod/v4/core").$strip>;
            handler: (params: import("./task-graph.js").CreateGraphParams) => Promise<{
                success: boolean;
                graphId: string;
                name: string;
                nodeCount: number;
                estimatedTokens: number;
                parallelGroups: number;
                criticalPathLength: number;
                message: string;
            }>;
        };
        auto_get_next_nodes: {
            description: string;
            parameters: import("zod").ZodObject<{
                graphId: import("zod").ZodString;
            }, import("zod/v4/core").$strip>;
            handler: (params: {
                graphId: string;
            }) => Promise<{
                success: boolean;
                nodes: never[];
                message: string;
                count?: undefined;
                canParallelize?: undefined;
            } | {
                success: boolean;
                count: number;
                nodes: {
                    id: string;
                    name: string;
                    phase: import("./task-graph.js").TaskPhase;
                    tools: string[];
                    estimatedTokens: number;
                    priority: number;
                }[];
                canParallelize: boolean;
                message: string;
            }>;
        };
        auto_start_node: {
            description: string;
            parameters: import("zod").ZodObject<{
                graphId: import("zod").ZodString;
                nodeId: import("zod").ZodString;
            }, import("zod/v4/core").$strip>;
            handler: (params: {
                graphId: string;
                nodeId: string;
            }) => Promise<{
                success: boolean;
                message: string;
                node?: undefined;
            } | {
                success: boolean;
                node: {
                    id: string;
                    name: string;
                    phase: import("./task-graph.js").TaskPhase;
                    tools: string[];
                    files: string[] | undefined;
                };
                message: string;
            }>;
        };
        auto_complete_node: {
            description: string;
            parameters: import("zod").ZodObject<{
                graphId: import("zod").ZodString;
                nodeId: import("zod").ZodString;
                result: import("zod").ZodOptional<import("zod").ZodAny>;
                tokensUsed: import("zod").ZodOptional<import("zod").ZodNumber>;
            }, import("zod/v4/core").$strip>;
            handler: (params: {
                graphId: string;
                nodeId: string;
                result?: unknown;
                tokensUsed?: number;
            }) => Promise<{
                success: boolean;
                message: string;
                completed?: undefined;
                nextNodesReady?: undefined;
                nextNodes?: undefined;
            } | {
                success: boolean;
                completed: {
                    id: string;
                    name: string;
                };
                nextNodesReady: number;
                nextNodes: {
                    id: string;
                    name: string;
                    priority: number;
                }[];
                message: string;
            }>;
        };
        auto_fail_node: {
            description: string;
            parameters: import("zod").ZodObject<{
                graphId: import("zod").ZodString;
                nodeId: import("zod").ZodString;
                error: import("zod").ZodString;
            }, import("zod/v4/core").$strip>;
            handler: (params: {
                graphId: string;
                nodeId: string;
                error: string;
            }) => Promise<{
                success: boolean;
                message: string;
                node?: undefined;
                willRetry?: undefined;
            } | {
                success: boolean;
                node: {
                    id: string;
                    name: string;
                    status: import("./task-graph.js").TaskNodeStatus;
                    retryCount: number;
                    maxRetries: number;
                };
                willRetry: boolean;
                message: string;
            }>;
        };
        auto_analyze_graph: {
            description: string;
            parameters: import("zod").ZodObject<{
                graphId: import("zod").ZodString;
            }, import("zod/v4/core").$strip>;
            handler: (params: {
                graphId: string;
            }) => Promise<{
                success: boolean;
                message: string;
                graph?: undefined;
                analysis?: undefined;
                tokens?: undefined;
            } | {
                success: boolean;
                graph: {
                    id: string;
                    name: string;
                    status: "pending" | "paused" | "completed" | "failed" | "running";
                    currentPhase: import("./task-graph.js").TaskPhase;
                };
                analysis: {
                    progress: string;
                    nodes: {
                        total: number;
                        completed: number;
                        pending: number;
                        running: number;
                        failed: number;
                    };
                    criticalPath: {
                        length: number;
                        estimatedTokens: number;
                        nodeIds: string[];
                    };
                    parallelGroups: number;
                    maxParallelism: number;
                    estimatedRemainingTokens: number;
                };
                tokens: {
                    estimated: number;
                    actual: number;
                };
                message?: undefined;
            }>;
        };
        auto_list_graphs: {
            description: string;
            parameters: import("zod").ZodObject<{}, import("zod/v4/core").$strip>;
            handler: () => Promise<{
                success: boolean;
                count: number;
                graphs: {
                    id: string;
                    name: string;
                    status: "pending" | "paused" | "completed" | "failed" | "running";
                    progress: string;
                    nodes: number;
                    createdAt: string;
                }[];
            }>;
        };
        auto_graph_status: {
            description: string;
            parameters: import("zod").ZodObject<{}, import("zod/v4/core").$strip>;
            handler: () => Promise<{
                success: boolean;
                stats: {
                    totalGraphs: number;
                    completedGraphs: number;
                    activeGraphs: number;
                    totalNodes: number;
                    completedNodes: number;
                };
                formatted: string;
            }>;
        };
        auto_delete_graph: {
            description: string;
            parameters: import("zod").ZodObject<{
                graphId: import("zod").ZodString;
            }, import("zod/v4/core").$strip>;
            handler: (params: {
                graphId: string;
            }) => Promise<{
                success: boolean;
                message: string;
            }>;
        };
        auto_run_graph: {
            description: string;
            parameters: import("zod").ZodObject<{
                graphId: import("zod").ZodString;
                maxParallel: import("zod").ZodOptional<import("zod").ZodNumber>;
            }, import("zod/v4/core").$strip>;
            handler: (params: {
                graphId: string;
                maxParallel?: number;
            }) => Promise<{
                success: boolean;
                message: string;
                graphId?: undefined;
                totalBatches?: undefined;
                estimatedTokens?: undefined;
                executionPlan?: undefined;
                criticalPath?: undefined;
            } | {
                success: boolean;
                graphId: string;
                totalBatches: number;
                estimatedTokens: number;
                executionPlan: {
                    batch: number;
                    nodes: {
                        id: string;
                        name: string;
                        phase: string;
                    }[];
                }[];
                criticalPath: string[];
                message?: undefined;
            }>;
        };
    };
    /**
     * Get all tool definitions for MCP
     */
    getAllToolDefinitions(): {
        name: string;
        description: string;
    }[];
    isEnabled(): boolean;
    /**
     * Handle MCP tool calls routed from server
     */
    handleTool(name: string, args: Record<string, unknown>): Promise<unknown>;
}
//# sourceMappingURL=index.d.ts.map