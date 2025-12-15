// src/core/progress.tools.ts
/**
 * Progress MCP Tools (Sprint 9)
 *
 * Tools for querying live workflow progress:
 * - progress_status: Get current progress snapshot
 * - progress_blockers: Get blockers sorted by priority
 * - progress_mermaid: Generate Mermaid diagram with live status
 * - progress_clear: Clear progress state
 */

import { z } from 'zod';
import { ProgressService, ProgressSnapshot, BlockerEntry } from './progress.service.js';
import { StateManager } from './state-manager.js';
import { exportWorkflowMermaid, MermaidExportOptions } from '../modules/auto-agent/workflow-visualizer.js';
import type { WorkflowGraph } from '../modules/auto-agent/task-graph.js';

// ═══════════════════════════════════════════════════════════════
//                      TOOL DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export const PROGRESS_TOOL_DEFINITIONS = [
  {
    name: 'progress_status',
    description:
      'Get current workflow progress snapshot. Returns active workflow, node states summary, last blocked node info, and next steps.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        workflowId: {
          type: 'string',
          description: 'Optional workflow ID to filter (uses active workflow if not specified)',
        },
      },
    },
  },
  {
    name: 'progress_blockers',
    description:
      'Get list of blocked nodes sorted by priority with next tool calls to resolve them.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        workflowId: {
          type: 'string',
          description: 'Optional workflow ID to filter',
        },
      },
    },
  },
  {
    name: 'progress_mermaid',
    description:
      'Generate Mermaid diagram of workflow with live status icons. Requires an active workflow graph.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        workflowId: {
          type: 'string',
          description: 'Optional workflow ID',
        },
        direction: {
          type: 'string',
          enum: ['TD', 'LR'],
          description: 'Diagram direction: TD (top-down) or LR (left-right). Default: TD',
        },
        showGateBadges: {
          type: 'boolean',
          description: 'Show gate requirement badges. Default: true',
        },
        showPhaseBadges: {
          type: 'boolean',
          description: 'Show phase badges. Default: false',
        },
      },
    },
  },
  {
    name: 'progress_clear',
    description: 'Clear progress state. Use when starting a new workflow or resetting.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
];

// ═══════════════════════════════════════════════════════════════
//                      ZOD SCHEMAS
// ═══════════════════════════════════════════════════════════════

const ProgressStatusSchema = z.object({
  workflowId: z.string().optional(),
});

const ProgressBlockersSchema = z.object({
  workflowId: z.string().optional(),
});

const ProgressMermaidSchema = z.object({
  workflowId: z.string().optional(),
  direction: z.enum(['TD', 'LR']).optional(),
  showGateBadges: z.boolean().optional(),
  showPhaseBadges: z.boolean().optional(),
});

// ═══════════════════════════════════════════════════════════════
//                      TOOL HANDLERS
// ═══════════════════════════════════════════════════════════════

export interface ProgressToolDeps {
  progressService: ProgressService;
  stateManager: StateManager;
  getActiveGraph?: () => WorkflowGraph | null;
}

export function createProgressToolHandlers(deps: ProgressToolDeps) {
  const { progressService, stateManager, getActiveGraph } = deps;

  return {
    /**
     * Get progress status snapshot
     */
    progress_status: async (
      args: z.infer<typeof ProgressStatusSchema>
    ): Promise<{
      success: boolean;
      snapshot?: ProgressSnapshot;
      nextSteps?: string[];
      message?: string;
    }> => {
      const snapshot = progressService.getSnapshot();

      // Filter by workflowId if provided
      if (args.workflowId && snapshot.workflowId !== args.workflowId) {
        return {
          success: false,
          message: `No active progress for workflow: ${args.workflowId}`,
        };
      }

      // Build next steps based on state
      const nextSteps: string[] = [];

      if (snapshot.lastBlocked) {
        if (snapshot.lastBlocked.nextToolCalls?.length) {
          nextSteps.push(...snapshot.lastBlocked.nextToolCalls);
        } else if (snapshot.lastBlocked.missingEvidence?.length) {
          for (const evidence of snapshot.lastBlocked.missingEvidence) {
            if (evidence === 'guard') nextSteps.push('guard_validate');
            if (evidence === 'test') nextSteps.push('testing_run');
          }
        }
      }

      if (snapshot.summary.running === 0 && snapshot.summary.blocked === 0 && snapshot.summary.pending > 0) {
        nextSteps.push('workflow_execute_step');
      }

      return {
        success: true,
        snapshot,
        nextSteps: nextSteps.length > 0 ? [...new Set(nextSteps)] : undefined,
      };
    },

    /**
     * Get blockers sorted by priority
     */
    progress_blockers: async (
      args: z.infer<typeof ProgressBlockersSchema>
    ): Promise<{
      success: boolean;
      blockers: BlockerEntry[];
      summary: string;
    }> => {
      const snapshot = progressService.getSnapshot();

      // Filter by workflowId if provided
      if (args.workflowId && snapshot.workflowId !== args.workflowId) {
        return {
          success: true,
          blockers: [],
          summary: `No blockers for workflow: ${args.workflowId}`,
        };
      }

      const blockers = progressService.getBlockers();

      // Build summary
      let summary: string;
      if (blockers.length === 0) {
        summary = 'No blocked nodes';
      } else if (blockers.length === 1) {
        const b = blockers[0];
        summary = `1 blocker: ${b.nodeId} - ${b.reason}`;
        if (b.nextToolCalls?.length) {
          summary += `. Run: ${b.nextToolCalls.join(', ')}`;
        }
      } else {
        summary = `${blockers.length} blockers. Highest priority: ${blockers[0].nodeId}`;
      }

      return {
        success: true,
        blockers,
        summary,
      };
    },

    /**
     * Generate Mermaid diagram with live status
     */
    progress_mermaid: async (
      args: z.infer<typeof ProgressMermaidSchema>
    ): Promise<{
      success: boolean;
      mermaid?: string;
      message?: string;
    }> => {
      const snapshot = progressService.getSnapshot();

      // Get active graph
      const graph = getActiveGraph?.();
      if (!graph) {
        return {
          success: false,
          message: 'No active workflow graph available. Start a workflow first.',
        };
      }

      // Build export options
      const options: MermaidExportOptions = {
        nodeStates: snapshot.nodeStates,
        direction: args.direction || 'TD',
        showGateBadges: args.showGateBadges ?? true,
        showPhaseBadges: args.showPhaseBadges ?? false,
        title: snapshot.workflowId ? `Workflow: ${snapshot.workflowId}` : undefined,
      };

      const mermaid = exportWorkflowMermaid(graph, options);

      return {
        success: true,
        mermaid,
      };
    },

    /**
     * Clear progress state
     */
    progress_clear: async (): Promise<{
      success: boolean;
      message: string;
    }> => {
      progressService.clear();

      return {
        success: true,
        message: 'Progress state cleared',
      };
    },
  };
}

// ═══════════════════════════════════════════════════════════════
//                      HANDLER DISPATCH
// ═══════════════════════════════════════════════════════════════

export async function handleProgressTool(
  toolName: string,
  args: unknown,
  deps: ProgressToolDeps
): Promise<unknown> {
  const handlers = createProgressToolHandlers(deps);

  switch (toolName) {
    case 'progress_status':
      return handlers.progress_status(ProgressStatusSchema.parse(args));

    case 'progress_blockers':
      return handlers.progress_blockers(ProgressBlockersSchema.parse(args));

    case 'progress_mermaid':
      return handlers.progress_mermaid(ProgressMermaidSchema.parse(args));

    case 'progress_clear':
      return handlers.progress_clear();

    default:
      throw new Error(`Unknown progress tool: ${toolName}`);
  }
}
