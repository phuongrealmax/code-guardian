// src/modules/latent/latent.tool-defs.ts

/**
 * Latent Module MCP Tool Definitions
 *
 * Schema definitions for Latent Chain Mode MCP tools.
 * Extracted from latent.tools.ts for better modularity.
 */

/**
 * MCP Tool Definition
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Latent MCP Tool Definitions
 */
export const LATENT_TOOL_DEFINITIONS: MCPTool[] = [
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

  // ═══════════════════════════════════════════════════════════════
  //                      DIFF-BASED EDITING
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'latent_diff_apply',
    description: `Apply a unified diff to a file with fuzzy conflict detection.

Features:
- Fuzzy matching when exact context doesn't match
- Automatic backup creation
- Conflict detection with similarity scores
- Preview mode for dry runs

Example:
{
  "target": "src/auth/login.ts",
  "diff": "--- a/src/auth/login.ts\\n+++ b/src/auth/login.ts\\n@@ -45,3 +45,5 @@\\n context line\\n-old line\\n+new line",
  "dryRun": false,
  "forceApply": false
}`,
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Target file path (relative to project root)',
        },
        diff: {
          type: 'string',
          description: 'Unified diff content',
        },
        dryRun: {
          type: 'boolean',
          description: 'Preview changes without applying (default: false)',
        },
        forceApply: {
          type: 'boolean',
          description: 'Force apply even with conflicts (default: false)',
        },
      },
      required: ['target', 'diff'],
    },
  },

  {
    name: 'latent_diff_confirm',
    description: `Confirm a pending diff edit that requires user approval.

Use after latent_diff_apply returns requiresConfirm=true.

Example:
{
  "target": "src/auth/login.ts",
  "action": "confirm"
}`,
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Target file path',
        },
        action: {
          type: 'string',
          enum: ['confirm', 'reject'],
          description: 'Confirm or reject the pending edit',
        },
      },
      required: ['target', 'action'],
    },
  },

  {
    name: 'latent_diff_rollback',
    description: `Rollback a file to its backup.

Use when a diff application caused issues and you need to restore.

Example:
{
  "target": "src/auth/login.ts"
}`,
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Target file path to rollback',
        },
      },
      required: ['target'],
    },
  },

  {
    name: 'latent_diff_config',
    description: `Configure diff editor settings.

Settings:
- confirmPolicy: 'auto' | 'prompt' | 'never'
- fuzzyThreshold: 0-1 (default 0.8)
- createBackup: boolean
- autoRollback: boolean

Example:
{
  "confirmPolicy": "prompt",
  "fuzzyThreshold": 0.75
}`,
    inputSchema: {
      type: 'object',
      properties: {
        confirmPolicy: {
          type: 'string',
          enum: ['auto', 'prompt', 'never'],
          description: 'When to require confirmation for edits',
        },
        fuzzyThreshold: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Similarity threshold for fuzzy matching (0-1)',
        },
        createBackup: {
          type: 'boolean',
          description: 'Create backup before editing',
        },
        autoRollback: {
          type: 'boolean',
          description: 'Auto-rollback on failure',
        },
      },
    },
  },

  {
    name: 'latent_diff_pending',
    description: 'List all pending diff edits waiting for confirmation.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];
