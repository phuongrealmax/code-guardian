/**
 * TaskGraph MCP Tools
 */
import { z } from 'zod';
/**
 * Create TaskGraph MCP tools
 */
export function createTaskGraphTools(taskGraphService) {
    return {
        // Create a new task graph
        auto_create_graph: {
            description: 'Create a new DAG-based task graph for complex multi-step tasks. Supports parallel execution and dependency management.',
            parameters: z.object({
                name: z.string().describe('Name of the task graph'),
                description: z.string().optional().describe('Task description'),
                taskType: z.enum(['feature', 'bugfix', 'refactor', 'review', 'custom']).describe('Type of task (determines template)'),
                files: z.array(z.string()).optional().describe('Files involved in the task'),
                constraints: z.array(z.string()).optional().describe('Constraints to follow'),
            }),
            handler: async (params) => {
                const graph = taskGraphService.createGraph(params);
                const analysis = taskGraphService.analyzeGraph(graph.id);
                return {
                    success: true,
                    graphId: graph.id,
                    name: graph.name,
                    nodeCount: graph.nodes.size,
                    estimatedTokens: graph.totalEstimatedTokens,
                    parallelGroups: analysis?.parallelizableGroups.length || 0,
                    criticalPathLength: analysis?.criticalPathLength || 0,
                    message: `Created task graph "${params.name}" with ${graph.nodes.size} nodes`,
                };
            },
        },
        // Get next executable nodes
        auto_get_next_nodes: {
            description: 'Get the next nodes that are ready to execute. Returns nodes with all dependencies completed.',
            parameters: z.object({
                graphId: z.string().describe('Graph ID'),
            }),
            handler: async (params) => {
                const nodes = taskGraphService.getNextNodes(params.graphId);
                if (nodes.length === 0) {
                    return {
                        success: true,
                        nodes: [],
                        message: 'No nodes ready for execution',
                    };
                }
                return {
                    success: true,
                    count: nodes.length,
                    nodes: nodes.map(n => ({
                        id: n.id,
                        name: n.name,
                        phase: n.phase,
                        tools: n.tools,
                        estimatedTokens: n.estimatedTokens,
                        priority: n.priority,
                    })),
                    canParallelize: nodes.length > 1,
                    message: `${nodes.length} nodes ready for execution`,
                };
            },
        },
        // Start executing a node
        auto_start_node: {
            description: 'Mark a node as started/running.',
            parameters: z.object({
                graphId: z.string().describe('Graph ID'),
                nodeId: z.string().describe('Node ID to start'),
            }),
            handler: async (params) => {
                const node = taskGraphService.startNode(params.graphId, params.nodeId);
                if (!node) {
                    return {
                        success: false,
                        message: 'Node not found or not ready',
                    };
                }
                return {
                    success: true,
                    node: {
                        id: node.id,
                        name: node.name,
                        phase: node.phase,
                        tools: node.tools,
                        files: node.files,
                    },
                    message: `Started node "${node.name}"`,
                };
            },
        },
        // Complete a node
        auto_complete_node: {
            description: 'Mark a node as completed. Updates dependent nodes to ready state.',
            parameters: z.object({
                graphId: z.string().describe('Graph ID'),
                nodeId: z.string().describe('Node ID to complete'),
                result: z.any().optional().describe('Result data from execution'),
                tokensUsed: z.number().optional().describe('Actual tokens consumed'),
            }),
            handler: async (params) => {
                const node = taskGraphService.completeNode(params.graphId, params.nodeId, params.result, params.tokensUsed);
                if (!node) {
                    return {
                        success: false,
                        message: 'Node not found',
                    };
                }
                const nextNodes = taskGraphService.getNextNodes(params.graphId);
                return {
                    success: true,
                    completed: {
                        id: node.id,
                        name: node.name,
                    },
                    nextNodesReady: nextNodes.length,
                    nextNodes: nextNodes.slice(0, 3).map(n => ({
                        id: n.id,
                        name: n.name,
                        priority: n.priority,
                    })),
                    message: `Completed "${node.name}", ${nextNodes.length} nodes now ready`,
                };
            },
        },
        // Fail a node
        auto_fail_node: {
            description: 'Mark a node as failed. Will retry if under max retries, otherwise skip dependents.',
            parameters: z.object({
                graphId: z.string().describe('Graph ID'),
                nodeId: z.string().describe('Node ID that failed'),
                error: z.string().describe('Error message'),
            }),
            handler: async (params) => {
                const node = taskGraphService.failNode(params.graphId, params.nodeId, params.error);
                if (!node) {
                    return {
                        success: false,
                        message: 'Node not found',
                    };
                }
                return {
                    success: true,
                    node: {
                        id: node.id,
                        name: node.name,
                        status: node.status,
                        retryCount: node.retryCount,
                        maxRetries: node.maxRetries,
                    },
                    willRetry: node.status === 'ready',
                    message: node.status === 'ready'
                        ? `Will retry "${node.name}" (${node.retryCount}/${node.maxRetries})`
                        : `Node "${node.name}" failed permanently`,
                };
            },
        },
        // Analyze graph
        auto_analyze_graph: {
            description: 'Get detailed analysis of task graph including critical path, parallelization opportunities, and progress.',
            parameters: z.object({
                graphId: z.string().describe('Graph ID'),
            }),
            handler: async (params) => {
                const graph = taskGraphService.getGraph(params.graphId);
                const analysis = taskGraphService.analyzeGraph(params.graphId);
                if (!graph || !analysis) {
                    return {
                        success: false,
                        message: 'Graph not found',
                    };
                }
                return {
                    success: true,
                    graph: {
                        id: graph.id,
                        name: graph.name,
                        status: graph.status,
                        currentPhase: graph.currentPhase,
                    },
                    analysis: {
                        progress: `${analysis.progress}%`,
                        nodes: {
                            total: analysis.totalNodes,
                            completed: analysis.completedNodes,
                            pending: analysis.pendingNodes,
                            running: analysis.runningNodes,
                            failed: analysis.failedNodes,
                        },
                        criticalPath: {
                            length: analysis.criticalPath.length,
                            estimatedTokens: analysis.criticalPathLength,
                            nodeIds: analysis.criticalPath,
                        },
                        parallelGroups: analysis.parallelizableGroups.length,
                        maxParallelism: Math.max(...analysis.parallelizableGroups.map(g => g.length)),
                        estimatedRemainingTokens: analysis.estimatedRemainingTokens,
                    },
                    tokens: {
                        estimated: graph.totalEstimatedTokens,
                        actual: graph.actualTokensUsed,
                    },
                };
            },
        },
        // List all graphs
        auto_list_graphs: {
            description: 'List all task graphs with their status.',
            parameters: z.object({}),
            handler: async () => {
                const graphs = taskGraphService.listGraphs();
                return {
                    success: true,
                    count: graphs.length,
                    graphs: graphs.map(g => {
                        const analysis = taskGraphService.analyzeGraph(g.id);
                        return {
                            id: g.id,
                            name: g.name,
                            status: g.status,
                            progress: analysis ? `${analysis.progress}%` : '0%',
                            nodes: g.nodes.size,
                            createdAt: g.createdAt.toISOString(),
                        };
                    }),
                };
            },
        },
        // Get graph status summary
        auto_graph_status: {
            description: 'Get overall TaskGraph service statistics.',
            parameters: z.object({}),
            handler: async () => {
                const stats = taskGraphService.getStats();
                return {
                    success: true,
                    stats,
                    formatted: [
                        `Total Graphs: ${stats.totalGraphs}`,
                        `Active: ${stats.activeGraphs}`,
                        `Completed: ${stats.completedGraphs}`,
                        `Total Nodes: ${stats.totalNodes}`,
                        `Completed Nodes: ${stats.completedNodes}`,
                    ].join('\n'),
                };
            },
        },
        // Delete a graph
        auto_delete_graph: {
            description: 'Delete a task graph.',
            parameters: z.object({
                graphId: z.string().describe('Graph ID to delete'),
            }),
            handler: async (params) => {
                const success = taskGraphService.deleteGraph(params.graphId);
                return {
                    success,
                    message: success ? 'Graph deleted' : 'Graph not found',
                };
            },
        },
        // Run graph (orchestrate execution)
        auto_run_graph: {
            description: 'Get execution plan for running the entire graph. Returns ordered batches of nodes.',
            parameters: z.object({
                graphId: z.string().describe('Graph ID'),
                maxParallel: z.number().optional().describe('Max parallel nodes (default: 3)'),
            }),
            handler: async (params) => {
                const analysis = taskGraphService.analyzeGraph(params.graphId);
                if (!analysis) {
                    return {
                        success: false,
                        message: 'Graph not found',
                    };
                }
                const graph = taskGraphService.getGraph(params.graphId);
                const maxParallel = params.maxParallel || 3;
                // Build execution plan
                const executionPlan = [];
                analysis.parallelizableGroups.forEach((group, batchIndex) => {
                    const nodes = group
                        .map(id => graph.nodes.get(id))
                        .filter(n => n.status !== 'completed' && n.status !== 'skipped')
                        .slice(0, maxParallel);
                    if (nodes.length > 0) {
                        executionPlan.push({
                            batch: batchIndex + 1,
                            nodes: nodes.map(n => ({
                                id: n.id,
                                name: n.name,
                                phase: n.phase,
                            })),
                        });
                    }
                });
                return {
                    success: true,
                    graphId: params.graphId,
                    totalBatches: executionPlan.length,
                    estimatedTokens: analysis.estimatedRemainingTokens,
                    executionPlan,
                    criticalPath: analysis.criticalPath.map(id => {
                        const node = graph.nodes.get(id);
                        return node ? node.name : id;
                    }),
                };
            },
        },
    };
}
export const TASK_GRAPH_TOOL_DEFINITIONS = [
    { name: 'auto_create_graph', description: 'Create a DAG-based task graph' },
    { name: 'auto_get_next_nodes', description: 'Get next executable nodes' },
    { name: 'auto_start_node', description: 'Start executing a node' },
    { name: 'auto_complete_node', description: 'Complete a node' },
    { name: 'auto_fail_node', description: 'Mark a node as failed' },
    { name: 'auto_analyze_graph', description: 'Analyze graph structure and progress' },
    { name: 'auto_list_graphs', description: 'List all task graphs' },
    { name: 'auto_graph_status', description: 'Get TaskGraph service stats' },
    { name: 'auto_delete_graph', description: 'Delete a graph' },
    { name: 'auto_run_graph', description: 'Get execution plan for a graph' },
];
//# sourceMappingURL=task-graph.tools.js.map