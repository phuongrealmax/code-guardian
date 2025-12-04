/**
 * TaskGraph MCP Tools
 */
import { z } from 'zod';
import { TaskGraphService, CreateGraphParams, TaskPhase } from './task-graph.js';
/**
 * Create TaskGraph MCP tools
 */
export declare function createTaskGraphTools(taskGraphService: TaskGraphService): {
    auto_create_graph: {
        description: string;
        parameters: z.ZodObject<{
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            taskType: z.ZodEnum<{
                custom: "custom";
                feature: "feature";
                refactor: "refactor";
                review: "review";
                bugfix: "bugfix";
            }>;
            files: z.ZodOptional<z.ZodArray<z.ZodString>>;
            constraints: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>;
        handler: (params: CreateGraphParams) => Promise<{
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
        parameters: z.ZodObject<{
            graphId: z.ZodString;
        }, z.core.$strip>;
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
                phase: TaskPhase;
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
        parameters: z.ZodObject<{
            graphId: z.ZodString;
            nodeId: z.ZodString;
        }, z.core.$strip>;
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
                phase: TaskPhase;
                tools: string[];
                files: string[] | undefined;
            };
            message: string;
        }>;
    };
    auto_complete_node: {
        description: string;
        parameters: z.ZodObject<{
            graphId: z.ZodString;
            nodeId: z.ZodString;
            result: z.ZodOptional<z.ZodAny>;
            tokensUsed: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
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
        parameters: z.ZodObject<{
            graphId: z.ZodString;
            nodeId: z.ZodString;
            error: z.ZodString;
        }, z.core.$strip>;
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
        parameters: z.ZodObject<{
            graphId: z.ZodString;
        }, z.core.$strip>;
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
                currentPhase: TaskPhase;
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
        parameters: z.ZodObject<{}, z.core.$strip>;
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
        parameters: z.ZodObject<{}, z.core.$strip>;
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
        parameters: z.ZodObject<{
            graphId: z.ZodString;
        }, z.core.$strip>;
        handler: (params: {
            graphId: string;
        }) => Promise<{
            success: boolean;
            message: string;
        }>;
    };
    auto_run_graph: {
        description: string;
        parameters: z.ZodObject<{
            graphId: z.ZodString;
            maxParallel: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
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
export declare const TASK_GRAPH_TOOL_DEFINITIONS: {
    name: string;
    description: string;
}[];
//# sourceMappingURL=task-graph.tools.d.ts.map