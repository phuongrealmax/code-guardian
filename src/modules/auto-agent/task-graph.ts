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

import { v4 as uuid } from 'uuid';
import { Logger } from '../../core/logger.js';
import { EventBus } from '../../core/event-bus.js';

// ═══════════════════════════════════════════════════════════════
//                         TYPES
// ═══════════════════════════════════════════════════════════════

export type TaskNodeStatus = 'pending' | 'ready' | 'running' | 'completed' | 'failed' | 'skipped';
export type TaskPhase = 'analysis' | 'plan' | 'impl' | 'review' | 'test';

export interface TaskNode {
  id: string;
  name: string;
  description: string;
  phase: TaskPhase;
  status: TaskNodeStatus;

  // Dependencies
  dependsOn: string[];       // IDs of nodes this depends on
  dependents: string[];      // IDs of nodes that depend on this

  // Execution
  estimatedTokens: number;
  actualTokens?: number;
  tools: string[];           // MCP tools to use
  result?: unknown;
  error?: string;

  // Timing
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;

  // Metadata
  files?: string[];
  priority: number;          // Higher = more important
  retryCount: number;
  maxRetries: number;
}

export interface TaskGraph {
  id: string;
  name: string;
  description?: string;
  rootId: string;            // Entry point node

  nodes: Map<string, TaskNode>;
  edges: Map<string, string[]>;  // adjacency list: nodeId -> [dependentIds]

  // State
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  currentPhase: TaskPhase;

  // Metadata
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

  criticalPath: string[];      // IDs of nodes on critical path
  criticalPathLength: number;  // Sum of estimated tokens
  parallelizableGroups: string[][]; // Groups that can run in parallel

  progress: number;            // 0-100
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

// ═══════════════════════════════════════════════════════════════
//                      TASK TEMPLATES
// ═══════════════════════════════════════════════════════════════

const TASK_TEMPLATES: Record<string, Partial<TaskNode>[]> = {
  feature: [
    { name: 'Analyze Requirements', phase: 'analysis', tools: ['documents_search', 'memory_recall', 'rag_query'], estimatedTokens: 500, priority: 10 },
    { name: 'Search Related Code', phase: 'analysis', tools: ['rag_query', 'rag_related_code'], estimatedTokens: 400, priority: 9 },
    { name: 'Design Solution', phase: 'plan', tools: ['thinking_get_model', 'memory_recall'], estimatedTokens: 800, priority: 8 },
    { name: 'Create Interface', phase: 'plan', tools: ['thinking_get_style'], estimatedTokens: 400, priority: 7 },
    { name: 'Implement Core', phase: 'impl', tools: ['latent_apply_patch', 'guard_validate'], estimatedTokens: 2000, priority: 10 },
    { name: 'Implement Helpers', phase: 'impl', tools: ['latent_apply_patch', 'guard_validate'], estimatedTokens: 1000, priority: 6 },
    { name: 'Write Unit Tests', phase: 'test', tools: ['testing_run'], estimatedTokens: 1000, priority: 8 },
    { name: 'Integration Test', phase: 'test', tools: ['testing_run'], estimatedTokens: 600, priority: 7 },
    { name: 'Final Review', phase: 'review', tools: ['guard_validate', 'testing_run'], estimatedTokens: 500, priority: 9 },
  ],
  bugfix: [
    { name: 'Reproduce Bug', phase: 'analysis', tools: ['memory_recall', 'testing_run'], estimatedTokens: 400, priority: 10 },
    { name: 'Analyze Root Cause', phase: 'analysis', tools: ['rag_query', 'rag_related_code'], estimatedTokens: 600, priority: 9 },
    { name: 'Plan Fix', phase: 'plan', tools: ['thinking_get_model'], estimatedTokens: 300, priority: 8 },
    { name: 'Apply Fix', phase: 'impl', tools: ['latent_apply_patch', 'guard_validate'], estimatedTokens: 800, priority: 10 },
    { name: 'Write Regression Test', phase: 'test', tools: ['testing_run'], estimatedTokens: 500, priority: 9 },
    { name: 'Verify Fix', phase: 'review', tools: ['testing_run_affected'], estimatedTokens: 400, priority: 10 },
  ],
  refactor: [
    { name: 'Map Current Structure', phase: 'analysis', tools: ['rag_query', 'documents_search'], estimatedTokens: 600, priority: 9 },
    { name: 'Identify Patterns', phase: 'analysis', tools: ['rag_related_code', 'thinking_get_style'], estimatedTokens: 500, priority: 8 },
    { name: 'Plan Transformation', phase: 'plan', tools: ['thinking_get_model', 'thinking_get_workflow'], estimatedTokens: 800, priority: 10 },
    { name: 'Add Safety Tests', phase: 'test', tools: ['testing_run'], estimatedTokens: 1000, priority: 10 },
    { name: 'Apply Refactoring', phase: 'impl', tools: ['latent_apply_patch', 'guard_validate'], estimatedTokens: 1500, priority: 9 },
    { name: 'Update Tests', phase: 'test', tools: ['testing_run'], estimatedTokens: 500, priority: 8 },
    { name: 'Verify No Regressions', phase: 'review', tools: ['testing_run', 'guard_validate'], estimatedTokens: 400, priority: 10 },
  ],
  review: [
    { name: 'Load Context', phase: 'analysis', tools: ['memory_recall', 'documents_search'], estimatedTokens: 400, priority: 8 },
    { name: 'Analyze Code Structure', phase: 'analysis', tools: ['rag_query'], estimatedTokens: 500, priority: 9 },
    { name: 'Security Check', phase: 'analysis', tools: ['guard_validate'], estimatedTokens: 600, priority: 10 },
    { name: 'Quality Check', phase: 'analysis', tools: ['guard_validate', 'thinking_get_style'], estimatedTokens: 500, priority: 9 },
    { name: 'Generate Report', phase: 'review', tools: ['memory_store', 'documents_create'], estimatedTokens: 400, priority: 8 },
  ],
};

// DAG dependency templates (which nodes depend on which)
const DEPENDENCY_TEMPLATES: Record<string, number[][]> = {
  // [dependentIndex, dependsOnIndex] pairs
  feature: [
    [2, 0], [2, 1],   // Design depends on Analyze + Search
    [3, 2],           // Interface depends on Design
    [4, 3],           // Core depends on Interface
    [5, 4],           // Helpers depends on Core
    [6, 4],           // Unit Tests depends on Core (parallel with Helpers)
    [7, 5], [7, 6],   // Integration depends on Helpers + Unit Tests
    [8, 7],           // Review depends on Integration
  ],
  bugfix: [
    [1, 0],           // Analyze depends on Reproduce
    [2, 1],           // Plan depends on Analyze
    [3, 2],           // Fix depends on Plan
    [4, 3],           // Test depends on Fix
    [5, 4],           // Verify depends on Test
  ],
  refactor: [
    [1, 0],           // Patterns depends on Map
    [2, 0], [2, 1],   // Plan depends on Map + Patterns
    [3, 2],           // Safety Tests depends on Plan
    [4, 3],           // Apply depends on Safety Tests
    [5, 4],           // Update Tests depends on Apply
    [6, 5],           // Verify depends on Update Tests
  ],
  review: [
    [1, 0],           // Analyze depends on Load
    [2, 1],           // Security depends on Analyze
    [3, 1],           // Quality depends on Analyze (parallel with Security)
    [4, 2], [4, 3],   // Report depends on Security + Quality
  ],
};

// ═══════════════════════════════════════════════════════════════
//                      TASK GRAPH SERVICE
// ═══════════════════════════════════════════════════════════════

export class TaskGraphService {
  private graphs: Map<string, TaskGraph> = new Map();
  private logger: Logger;
  private eventBus: EventBus;

  constructor(logger: Logger, eventBus: EventBus) {
    this.logger = logger;
    this.eventBus = eventBus;
  }

  // ─────────────────────────────────────────────────────────────
  //                    CREATE & MANAGE
  // ─────────────────────────────────────────────────────────────

  /**
   * Create a new task graph from template
   */
  createGraph(params: CreateGraphParams): TaskGraph {
    const graphId = uuid();
    const nodes = new Map<string, TaskNode>();
    const edges = new Map<string, string[]>();

    // Get template
    const template = params.taskType === 'custom' && params.customNodes
      ? params.customNodes
      : TASK_TEMPLATES[params.taskType] || TASK_TEMPLATES.feature;

    const dependencies = DEPENDENCY_TEMPLATES[params.taskType] || [];

    // Create nodes
    const nodeIds: string[] = [];
    template.forEach((t, index) => {
      const nodeId = uuid();
      nodeIds.push(nodeId);

      const node: TaskNode = {
        id: nodeId,
        name: t.name || `Task ${index + 1}`,
        description: t.description || '',
        phase: t.phase || 'impl',
        status: 'pending',
        dependsOn: [],
        dependents: [],
        estimatedTokens: t.estimatedTokens || 500,
        tools: t.tools || [],
        files: params.files,
        priority: t.priority || 5,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
      };

      nodes.set(nodeId, node);
      edges.set(nodeId, []);
    });

    // Apply dependencies
    dependencies.forEach(([dependent, dependsOn]) => {
      if (nodeIds[dependent] && nodeIds[dependsOn]) {
        const dependentNode = nodes.get(nodeIds[dependent])!;
        const dependsOnNode = nodes.get(nodeIds[dependsOn])!;

        dependentNode.dependsOn.push(nodeIds[dependsOn]);
        dependsOnNode.dependents.push(nodeIds[dependent]);

        edges.get(nodeIds[dependsOn])!.push(nodeIds[dependent]);
      }
    });

    // Mark root nodes as ready
    nodes.forEach(node => {
      if (node.dependsOn.length === 0) {
        node.status = 'ready';
      }
    });

    // Find root (first node with no dependencies)
    const rootId = nodeIds.find(id => nodes.get(id)!.dependsOn.length === 0) || nodeIds[0];

    // Calculate total estimated tokens
    let totalEstimated = 0;
    nodes.forEach(n => totalEstimated += n.estimatedTokens);

    const graph: TaskGraph = {
      id: graphId,
      name: params.name,
      description: params.description,
      rootId,
      nodes,
      edges,
      status: 'pending',
      currentPhase: 'analysis',
      createdAt: new Date(),
      totalEstimatedTokens: totalEstimated,
      actualTokensUsed: 0,
    };

    this.graphs.set(graphId, graph);

    this.eventBus.emit({
      type: 'taskgraph:created',
      timestamp: new Date(),
      data: { graphId, name: params.name, nodeCount: nodes.size },
    });

    this.logger.info(`Created TaskGraph "${params.name}" with ${nodes.size} nodes`);

    return graph;
  }

  /**
   * Get a graph by ID
   */
  getGraph(graphId: string): TaskGraph | undefined {
    return this.graphs.get(graphId);
  }

  /**
   * Delete a graph
   */
  deleteGraph(graphId: string): boolean {
    return this.graphs.delete(graphId);
  }

  /**
   * List all graphs
   */
  listGraphs(): TaskGraph[] {
    return Array.from(this.graphs.values());
  }

  // ─────────────────────────────────────────────────────────────
  //                    EXECUTION
  // ─────────────────────────────────────────────────────────────

  /**
   * Get next executable nodes (ready nodes with no pending dependencies)
   */
  getNextNodes(graphId: string): TaskNode[] {
    const graph = this.graphs.get(graphId);
    if (!graph) return [];

    const readyNodes: TaskNode[] = [];

    graph.nodes.forEach(node => {
      if (node.status === 'ready') {
        // Check all dependencies are completed
        const allDepsCompleted = node.dependsOn.every(depId => {
          const dep = graph.nodes.get(depId);
          return dep && dep.status === 'completed';
        });

        if (allDepsCompleted || node.dependsOn.length === 0) {
          readyNodes.push(node);
        }
      }
    });

    // Sort by priority (highest first)
    return readyNodes.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Start a node execution
   */
  startNode(graphId: string, nodeId: string): TaskNode | undefined {
    const graph = this.graphs.get(graphId);
    if (!graph) return undefined;

    const node = graph.nodes.get(nodeId);
    if (!node || node.status !== 'ready') return undefined;

    node.status = 'running';
    node.startedAt = new Date();

    if (graph.status === 'pending') {
      graph.status = 'running';
      graph.startedAt = new Date();
    }

    this.eventBus.emit({
      type: 'taskgraph:node:started',
      timestamp: new Date(),
      data: { graphId, nodeId, name: node.name },
    });

    return node;
  }

  /**
   * Complete a node
   */
  completeNode(
    graphId: string,
    nodeId: string,
    result?: unknown,
    tokensUsed?: number
  ): TaskNode | undefined {
    const graph = this.graphs.get(graphId);
    if (!graph) return undefined;

    const node = graph.nodes.get(nodeId);
    if (!node) return undefined;

    node.status = 'completed';
    node.completedAt = new Date();
    node.result = result;
    if (tokensUsed) {
      node.actualTokens = tokensUsed;
      graph.actualTokensUsed += tokensUsed;
    }

    // Update dependents to ready if all their deps are done
    node.dependents.forEach(depId => {
      const dependent = graph.nodes.get(depId);
      if (dependent && dependent.status === 'pending') {
        const allDepsCompleted = dependent.dependsOn.every(d => {
          const dep = graph.nodes.get(d);
          return dep && dep.status === 'completed';
        });
        if (allDepsCompleted) {
          dependent.status = 'ready';
        }
      }
    });

    // Check if graph is complete
    let allDone = true;
    graph.nodes.forEach(n => {
      if (n.status !== 'completed' && n.status !== 'skipped') {
        allDone = false;
      }
    });

    if (allDone) {
      graph.status = 'completed';
      graph.completedAt = new Date();

      this.eventBus.emit({
        type: 'taskgraph:completed',
        timestamp: new Date(),
        data: { graphId, tokensUsed: graph.actualTokensUsed },
      });
    }

    this.eventBus.emit({
      type: 'taskgraph:node:completed',
      timestamp: new Date(),
      data: { graphId, nodeId, name: node.name },
    });

    return node;
  }

  /**
   * Fail a node
   */
  failNode(graphId: string, nodeId: string, error: string): TaskNode | undefined {
    const graph = this.graphs.get(graphId);
    if (!graph) return undefined;

    const node = graph.nodes.get(nodeId);
    if (!node) return undefined;

    node.retryCount++;

    if (node.retryCount < node.maxRetries) {
      // Retry - set back to ready
      node.status = 'ready';
      node.error = error;
      this.logger.warn(`Node "${node.name}" failed, retrying (${node.retryCount}/${node.maxRetries})`);
    } else {
      // Max retries reached
      node.status = 'failed';
      node.error = error;
      node.completedAt = new Date();

      // Skip dependent nodes
      this.skipDependents(graph, nodeId);

      this.eventBus.emit({
        type: 'taskgraph:node:failed',
        timestamp: new Date(),
        data: { graphId, nodeId, name: node.name, error },
      });
    }

    return node;
  }

  /**
   * Skip all nodes that depend on a failed node
   */
  private skipDependents(graph: TaskGraph, nodeId: string): void {
    const node = graph.nodes.get(nodeId);
    if (!node) return;

    node.dependents.forEach(depId => {
      const dep = graph.nodes.get(depId);
      if (dep && dep.status === 'pending') {
        dep.status = 'skipped';
        this.skipDependents(graph, depId);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  //                    ANALYSIS
  // ─────────────────────────────────────────────────────────────

  /**
   * Analyze graph state
   */
  analyzeGraph(graphId: string): GraphAnalysis | undefined {
    const graph = this.graphs.get(graphId);
    if (!graph) return undefined;

    let completed = 0, pending = 0, running = 0, failed = 0;

    graph.nodes.forEach(node => {
      switch (node.status) {
        case 'completed': completed++; break;
        case 'pending':
        case 'ready': pending++; break;
        case 'running': running++; break;
        case 'failed': failed++; break;
      }
    });

    // Calculate critical path (longest path by estimated tokens)
    const criticalPath = this.findCriticalPath(graph);

    // Find parallelizable groups
    const parallelGroups = this.findParallelGroups(graph);

    // Calculate remaining tokens
    let remainingTokens = 0;
    graph.nodes.forEach(node => {
      if (node.status !== 'completed' && node.status !== 'skipped') {
        remainingTokens += node.estimatedTokens;
      }
    });

    return {
      totalNodes: graph.nodes.size,
      completedNodes: completed,
      pendingNodes: pending,
      runningNodes: running,
      failedNodes: failed,
      criticalPath: criticalPath.map(n => n.id),
      criticalPathLength: criticalPath.reduce((sum, n) => sum + n.estimatedTokens, 0),
      parallelizableGroups: parallelGroups,
      progress: Math.round((completed / graph.nodes.size) * 100),
      estimatedRemainingTokens: remainingTokens,
    };
  }

  /**
   * Find critical path (longest path by tokens)
   */
  private findCriticalPath(graph: TaskGraph): TaskNode[] {
    const distances = new Map<string, number>();
    const parents = new Map<string, string>();

    // Initialize
    graph.nodes.forEach(node => {
      distances.set(node.id, node.dependsOn.length === 0 ? node.estimatedTokens : -Infinity);
    });

    // Topological sort order
    const sorted = this.topologicalSort(graph);

    // Calculate longest paths
    sorted.forEach(nodeId => {
      const node = graph.nodes.get(nodeId)!;
      const currentDist = distances.get(nodeId)!;

      node.dependents.forEach(depId => {
        const dep = graph.nodes.get(depId)!;
        const newDist = currentDist + dep.estimatedTokens;

        if (newDist > (distances.get(depId) || -Infinity)) {
          distances.set(depId, newDist);
          parents.set(depId, nodeId);
        }
      });
    });

    // Find end node with maximum distance
    let maxDist = -Infinity;
    let endNode = '';
    distances.forEach((dist, nodeId) => {
      if (dist > maxDist) {
        maxDist = dist;
        endNode = nodeId;
      }
    });

    // Reconstruct path
    const path: TaskNode[] = [];
    let current = endNode;
    while (current) {
      path.unshift(graph.nodes.get(current)!);
      current = parents.get(current)!;
    }

    return path;
  }

  /**
   * Topological sort
   */
  private topologicalSort(graph: TaskGraph): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = graph.nodes.get(nodeId)!;
      node.dependsOn.forEach(depId => visit(depId));
      result.push(nodeId);
    };

    graph.nodes.forEach((_, id) => visit(id));

    return result;
  }

  /**
   * Find groups of nodes that can run in parallel
   */
  private findParallelGroups(graph: TaskGraph): string[][] {
    const groups: string[][] = [];
    const processed = new Set<string>();

    // Group by "level" (distance from root)
    const levels = new Map<string, number>();

    const calculateLevel = (nodeId: string): number => {
      if (levels.has(nodeId)) return levels.get(nodeId)!;

      const node = graph.nodes.get(nodeId)!;
      if (node.dependsOn.length === 0) {
        levels.set(nodeId, 0);
        return 0;
      }

      const maxDepLevel = Math.max(...node.dependsOn.map(d => calculateLevel(d)));
      levels.set(nodeId, maxDepLevel + 1);
      return maxDepLevel + 1;
    };

    graph.nodes.forEach((_, id) => calculateLevel(id));

    // Group by level
    const levelGroups = new Map<number, string[]>();
    levels.forEach((level, nodeId) => {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(nodeId);
    });

    // Convert to array sorted by level
    const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
    sortedLevels.forEach(level => {
      groups.push(levelGroups.get(level)!);
    });

    return groups;
  }

  /**
   * Get graph statistics
   */
  getStats() {
    let totalGraphs = 0;
    let completedGraphs = 0;
    let totalNodes = 0;
    let completedNodes = 0;

    this.graphs.forEach(graph => {
      totalGraphs++;
      if (graph.status === 'completed') completedGraphs++;

      graph.nodes.forEach(node => {
        totalNodes++;
        if (node.status === 'completed') completedNodes++;
      });
    });

    return {
      totalGraphs,
      completedGraphs,
      activeGraphs: totalGraphs - completedGraphs,
      totalNodes,
      completedNodes,
    };
  }
}
