// src/modules/latent/latent.tools.ts

/**
 * Latent Chain Mode MCP Tools
 *
 * Provides MCP tools for Latent Chain Mode:
 * - latent_context_create: Create new latent context
 * - latent_context_get: Get latent context
 * - latent_context_update: Merge context delta
 * - latent_phase_transition: Transition between phases
 * - latent_apply_patch: Apply patch to file
 * - latent_validate_response: Validate latent response format
 * - latent_complete_task: Mark task as complete
 * - latent_list_contexts: List all contexts
 * - latent_status: Get module status
 */

import { LatentService } from './latent.service.js';
import {
  LatentPhase,
  ContextDelta,
  LatentResponse,
  CreateContextParams,
  UpdateContextParams,
  ApplyPatchParams,
  GetContextParams,
  TransitionPhaseParams,
} from './latent.types.js';

/**
 * MCP Tool Definition
 */
interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Create MCP tools for Latent Module
 */
export function createLatentTools(service: LatentService): MCPTool[] {
  return [
    // ═══════════════════════════════════════════════════════════════
    //                      CONTEXT MANAGEMENT
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'latent_context_create',
      description: `Create a new AgentLatentContext for a task.
This initializes the hidden-state structure for Latent Chain Mode.

Use this at the start of a new task to begin latent reasoning.

Example:
{
  "taskId": "fix-auth-bug",
  "phase": "analysis",
  "constraints": ["No breaking changes", "Must pass existing tests"],
  "files": ["src/auth/login.ts"]
}`,
      inputSchema: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'Unique task identifier',
          },
          phase: {
            type: 'string',
            enum: ['analysis', 'plan', 'impl', 'review'],
            description: 'Initial phase (default: analysis)',
          },
          constraints: {
            type: 'array',
            items: { type: 'string' },
            description: 'Constraints/rules to follow',
          },
          files: {
            type: 'array',
            items: { type: 'string' },
            description: 'Initial files involved',
          },
          agentId: {
            type: 'string',
            description: 'Creating agent ID',
          },
        },
        required: ['taskId'],
      },
    },

    {
      name: 'latent_context_get',
      description: `Get the current AgentLatentContext for a task.
Returns the full KV-cache like structure for hidden-state reasoning.

Use this to retrieve context before making updates.

Example:
{
  "taskId": "fix-auth-bug",
  "fields": ["phase", "codeMap", "decisions"]
}`,
      inputSchema: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'Task identifier',
          },
          includeHistory: {
            type: 'boolean',
            description: 'Include change history',
          },
          fields: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific fields to return (empty = all)',
          },
        },
        required: ['taskId'],
      },
    },

    {
      name: 'latent_context_update',
      description: `Update latent context with a delta (changes only, not full context).
This is the KEY feature of Latent Chain Mode - send only what changed.

The delta will be MERGED into the existing context, not replace it.

Example:
{
  "taskId": "fix-auth-bug",
  "delta": {
    "codeMap": { "hotSpots": ["src/auth/login.ts:45"] },
    "decisions": [{ "id": "D001", "summary": "Use JWT", "rationale": "Industry standard" }],
    "risks": ["Token expiry handling"]
  }
}`,
      inputSchema: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'Task identifier',
          },
          delta: {
            type: 'object',
            description: 'Context delta to merge',
            properties: {
              phase: { type: 'string' },
              codeMap: {
                type: 'object',
                properties: {
                  files: { type: 'array', items: { type: 'string' } },
                  hotSpots: { type: 'array', items: { type: 'string' } },
                  components: { type: 'array', items: { type: 'string' } },
                },
              },
              constraints: { type: 'array', items: { type: 'string' } },
              risks: { type: 'array', items: { type: 'string' } },
              decisions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    summary: { type: 'string' },
                    rationale: { type: 'string' },
                  },
                },
              },
              artifacts: { type: 'object' },
              metadata: { type: 'object' },
              remove: {
                type: 'object',
                description: 'Items to remove by ID or value',
              },
            },
          },
          agentId: {
            type: 'string',
            description: 'Agent making update',
          },
          force: {
            type: 'boolean',
            description: 'Force update even if auto-merge disabled',
          },
        },
        required: ['taskId', 'delta'],
      },
    },

    // ═══════════════════════════════════════════════════════════════
    //                      PHASE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'latent_phase_transition',
      description: `Transition to a new phase in the Latent Chain workflow.

Valid transitions:
- analysis -> plan, impl
- plan -> impl, review
- impl -> review, plan (go back for issues)
- review -> impl, analysis (go back for fixes)

Example:
{
  "taskId": "fix-auth-bug",
  "toPhase": "plan",
  "summary": "Identified root cause in token validation"
}`,
      inputSchema: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'Task identifier',
          },
          toPhase: {
            type: 'string',
            enum: ['analysis', 'plan', 'impl', 'review'],
            description: 'Target phase',
          },
          summary: {
            type: 'string',
            description: 'Summary of phase completion',
          },
          agentId: {
            type: 'string',
            description: 'Agent making transition',
          },
        },
        required: ['taskId', 'toPhase'],
      },
    },

    // ═══════════════════════════════════════════════════════════════
    //                      PATCH APPLICATION
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'latent_apply_patch',
      description: `Apply a patch to a file during impl phase.

Use unified diff format for patches.

Example:
{
  "taskId": "fix-auth-bug",
  "target": "src/auth/login.ts",
  "patch": "--- a/src/auth/login.ts\\n+++ b/src/auth/login.ts\\n@@ -45,3 +45,5 @@\\n-const token = generateToken();\\n+const token = generateToken();\\n+token.expiresIn = '1h';",
  "dryRun": false
}`,
      inputSchema: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'Task identifier',
          },
          target: {
            type: 'string',
            description: 'Target file path (relative to project root)',
          },
          patch: {
            type: 'string',
            description: 'Patch content in unified diff format',
          },
          dryRun: {
            type: 'boolean',
            description: 'Validate only, do not apply',
          },
        },
        required: ['taskId', 'target', 'patch'],
      },
    },

    // ═══════════════════════════════════════════════════════════════
    //                      VALIDATION
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'latent_validate_response',
      description: `Validate a LatentResponse format before outputting.

Checks:
- Summary length (max 200 chars)
- Actions have targets
- Context delta format

Example:
{
  "response": {
    "summary": "Fixed token expiry bug",
    "contextDelta": { "decisions": [...] },
    "actions": [{ "type": "edit_file", "target": "src/auth.ts", "description": "Fix token" }]
  }
}`,
      inputSchema: {
        type: 'object',
        properties: {
          response: {
            type: 'object',
            description: 'LatentResponse to validate',
            properties: {
              summary: { type: 'string' },
              contextDelta: { type: 'object' },
              actions: { type: 'array' },
              phaseCompleted: { type: 'string' },
              nextPhase: { type: 'string' },
              taskComplete: { type: 'boolean' },
            },
            required: ['summary', 'contextDelta', 'actions'],
          },
        },
        required: ['response'],
      },
    },

    // ═══════════════════════════════════════════════════════════════
    //                      TASK COMPLETION
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'latent_complete_task',
      description: `Mark a task as complete.

Call this after review phase is done and all work is verified.

Example:
{
  "taskId": "fix-auth-bug",
  "summary": "Fixed token expiry bug by adding explicit timeout"
}`,
      inputSchema: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'Task identifier',
          },
          summary: {
            type: 'string',
            description: 'Final task summary (1-2 sentences)',
          },
        },
        required: ['taskId', 'summary'],
      },
    },

    // ═══════════════════════════════════════════════════════════════
    //                      LISTING & STATUS
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'latent_list_contexts',
      description: 'List all active latent contexts.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },

    {
      name: 'latent_delete_context',
      description: 'Delete a latent context.',
      inputSchema: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'Task identifier to delete',
          },
        },
        required: ['taskId'],
      },
    },

    {
      name: 'latent_status',
      description: 'Get Latent Module status including statistics.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },

    // ═══════════════════════════════════════════════════════════════
    //                      STEP LOGGING (OBSERVER)
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'latent_step_log',
      description: `Log a reasoning step for audit and tracking purposes.

Use this BEFORE or AFTER major reasoning steps such as:
- Starting a group of multi-file changes
- Making architectural decisions
- Transitioning between phases
- Completing a milestone

This allows CCG to track Claude's reasoning process even when no code changes are made.

Example:
{
  "taskId": "fix-auth-bug",
  "phase": "analysis",
  "description": "Identified root cause: token validation skips expiry check",
  "affectedFiles": ["src/auth/token.ts", "src/auth/validate.ts"],
  "decisions": ["D001: Add expiry check before token use"],
  "nextAction": "Transition to plan phase to design fix"
}`,
      inputSchema: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'Task identifier (creates context if not exists)',
          },
          phase: {
            type: 'string',
            enum: ['analysis', 'plan', 'impl', 'review'],
            description: 'Current phase of reasoning',
          },
          description: {
            type: 'string',
            description: 'Brief description of the reasoning step (max 500 chars)',
          },
          affectedFiles: {
            type: 'array',
            items: { type: 'string' },
            description: 'Files affected or being considered',
          },
          decisions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Decisions made in this step (format: "D001: summary")',
          },
          risks: {
            type: 'array',
            items: { type: 'string' },
            description: 'Risks identified in this step',
          },
          nextAction: {
            type: 'string',
            description: 'What Claude will do next',
          },
          metadata: {
            type: 'object',
            description: 'Additional metadata for the step',
          },
        },
        required: ['taskId', 'phase', 'description'],
      },
    },
  ];
}

/**
 * Handle tool calls for Latent Module
 */
export async function handleLatentTool(
  service: LatentService,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    // Context Management
    case 'latent_context_create': {
      const params: CreateContextParams = {
        taskId: args.taskId as string,
        phase: (args.phase as LatentPhase) || 'analysis',
        constraints: (args.constraints as string[]) || [],
        files: (args.files as string[]) || [],
        agentId: args.agentId as string | undefined,
      };
      const context = await service.createContext(params);
      return {
        success: true,
        taskId: context.taskId,
        phase: context.phase,
        message: `Created latent context for task: ${context.taskId}`,
      };
    }

    case 'latent_context_get': {
      const params: GetContextParams = {
        taskId: args.taskId as string,
        includeHistory: args.includeHistory as boolean | undefined,
        fields: args.fields as (keyof import('./latent.types.js').AgentLatentContext)[] | undefined,
      };

      if (params.includeHistory) {
        const result = await service.getContextWithHistory(params.taskId);
        if (!result) {
          return { success: false, error: `Context not found: ${params.taskId}` };
        }
        return { success: true, ...result };
      }

      const context = await service.getContext(params);
      if (!context) {
        return { success: false, error: `Context not found: ${params.taskId}` };
      }
      return { success: true, context };
    }

    case 'latent_context_update': {
      const params: UpdateContextParams = {
        taskId: args.taskId as string,
        delta: args.delta as ContextDelta,
        agentId: args.agentId as string | undefined,
        force: args.force as boolean | undefined,
      };
      const context = await service.updateContext(params);
      return {
        success: true,
        taskId: context.taskId,
        version: context.version,
        phase: context.phase,
        message: `Context updated (v${context.version})`,
      };
    }

    // Phase Management
    case 'latent_phase_transition': {
      const params: TransitionPhaseParams = {
        taskId: args.taskId as string,
        toPhase: args.toPhase as LatentPhase,
        summary: args.summary as string | undefined,
        agentId: args.agentId as string | undefined,
      };
      const context = await service.transitionPhase(params);
      return {
        success: true,
        taskId: context.taskId,
        phase: context.phase,
        version: context.version,
        message: `Transitioned to phase: ${context.phase}`,
      };
    }

    // Patch Application
    case 'latent_apply_patch': {
      const params: ApplyPatchParams = {
        taskId: args.taskId as string,
        target: args.target as string,
        patch: args.patch as string,
        dryRun: args.dryRun as boolean | undefined,
      };
      const result = await service.applyPatch(params);
      return {
        success: result.success,
        target: result.target,
        error: result.error,
        message: result.success
          ? `Patch applied to: ${result.target}`
          : `Failed to apply patch: ${result.error}`,
      };
    }

    // Validation
    case 'latent_validate_response': {
      const response = args.response as LatentResponse;
      const result = service.validateResponse(response);
      return {
        valid: result.valid,
        errors: result.errors,
        warnings: result.warnings,
        message: result.valid
          ? 'Response is valid'
          : `Validation failed: ${result.errors.map((e) => e.message).join(', ')}`,
      };
    }

    // Task Completion
    case 'latent_complete_task': {
      await service.completeTask(args.taskId as string, args.summary as string);
      return {
        success: true,
        taskId: args.taskId,
        message: `Task completed: ${args.taskId}`,
      };
    }

    // Listing & Status
    case 'latent_list_contexts': {
      const contexts = await service.listContexts();
      return {
        success: true,
        count: contexts.length,
        contexts: contexts.map((c) => ({
          taskId: c.taskId,
          phase: c.phase,
          version: c.version,
          decisionsCount: c.decisions.length,
          filesCount: c.codeMap.files.length,
          updatedAt: c.updatedAt,
        })),
      };
    }

    case 'latent_delete_context': {
      const deleted = await service.deleteContext(args.taskId as string);
      return {
        success: deleted,
        taskId: args.taskId,
        message: deleted
          ? `Context deleted: ${args.taskId}`
          : `Context not found: ${args.taskId}`,
      };
    }

    case 'latent_status': {
      const status = service.getStatus();
      return {
        success: true,
        ...status,
      };
    }

    // Step Logging (Observer Pattern)
    case 'latent_step_log': {
      const taskId = args.taskId as string;
      const phase = args.phase as LatentPhase;
      const description = args.description as string;
      const affectedFiles = (args.affectedFiles as string[]) || [];
      const decisions = (args.decisions as string[]) || [];
      const risks = (args.risks as string[]) || [];
      const nextAction = args.nextAction as string | undefined;
      const metadata = args.metadata as Record<string, unknown> | undefined;

      // Ensure context exists, create if not
      let context = await service.getContext({ taskId });
      if (!context) {
        context = await service.createContext({
          taskId,
          phase,
          files: affectedFiles,
          agentId: 'step-log',
        });
      }

      // Parse decisions into LatentDecision format
      const parsedDecisions = decisions.map((d, idx) => {
        const match = d.match(/^(D\d+):\s*(.+)$/);
        if (match) {
          return {
            id: match[1],
            summary: match[2],
            rationale: `Logged via step_log`,
            phase,
          };
        }
        return {
          id: `STEP${String(idx + 1).padStart(3, '0')}`,
          summary: d,
          rationale: 'Logged via step_log',
          phase,
        };
      });

      // Build context delta
      const delta: ContextDelta = {
        phase,
        codeMap: affectedFiles.length > 0 ? { files: affectedFiles } : undefined,
        decisions: parsedDecisions.length > 0 ? parsedDecisions : undefined,
        risks: risks.length > 0 ? risks : undefined,
        metadata: {
          custom: {
            lastStepLog: {
              description,
              nextAction,
              timestamp: new Date().toISOString(),
              ...metadata,
            },
          },
        },
      };

      // Update context
      const updated = await service.updateContext({
        taskId,
        delta,
        agentId: 'step-log',
      });

      return {
        success: true,
        taskId,
        phase: updated.phase,
        version: updated.version,
        message: `Step logged: ${description.slice(0, 100)}${description.length > 100 ? '...' : ''}`,
        filesTracked: affectedFiles.length,
        decisionsLogged: parsedDecisions.length,
        risksIdentified: risks.length,
      };
    }

    default:
      throw new Error(`Unknown latent tool: ${toolName}`);
  }
}
