// src/modules/auto-agent/auto-agent.tools.ts
/**
 * AutoAgent MCP Tools
 *
 * Exposes AutoAgent capabilities via MCP protocol.
 */

import { z } from 'zod';
import { AutoAgentService } from './auto-agent.service.js';

// ═══════════════════════════════════════════════════════════════
//                      INPUT SCHEMAS
// ═══════════════════════════════════════════════════════════════

const DecomposeTaskSchema = z.object({
  taskName: z.string().describe('Name of the task to decompose'),
  taskDescription: z.string().optional().describe('Detailed task description'),
  files: z.array(z.string()).optional().describe('Files involved in the task'),
  constraints: z.array(z.string()).optional().describe('Constraints to consider'),
  domain: z.string().optional().describe('Domain context (e.g., trading, erp)'),
  forceDecompose: z.boolean().optional().describe('Force decomposition even for simple tasks'),
});

const RouteToolsSchema = z.object({
  action: z.string().describe('Description of what needs to be done'),
  phase: z.string().optional().describe('Current latent phase (analysis/plan/impl/review)'),
  files: z.array(z.string()).optional().describe('Files involved'),
  currentTask: z.string().optional().describe('Current task ID'),
  domain: z.string().optional().describe('Domain context'),
});

const StartFixLoopSchema = z.object({
  errorType: z.string().describe('Type of error (build, test, guard, etc.)'),
  errorMessage: z.string().describe('Error message'),
  file: z.string().optional().describe('File where error occurred'),
  line: z.number().optional().describe('Line number'),
  code: z.string().optional().describe('Error code if available'),
  taskId: z.string().optional().describe('Associated task ID'),
  maxRetries: z.number().optional().describe('Max fix attempts (default: 3)'),
});

const StoreErrorSchema = z.object({
  errorType: z.string().describe('Type of error'),
  errorMessage: z.string().describe('Error message'),
  file: z.string().optional().describe('File where error occurred'),
  fixType: z.enum(['patch', 'rollback', 'config', 'dependency', 'custom']).describe('Type of fix applied'),
  fixTarget: z.string().describe('Target of the fix'),
  fixDescription: z.string().describe('Description of the fix'),
  success: z.boolean().describe('Whether the fix was successful'),
  tags: z.array(z.string()).optional().describe('Tags for categorization'),
});

const RecallErrorsSchema = z.object({
  errorType: z.string().optional().describe('Filter by error type'),
  errorMessage: z.string().optional().describe('Find similar errors by message'),
  tags: z.array(z.string()).optional().describe('Filter by tags'),
  limit: z.number().optional().describe('Max results (default: 5)'),
  minSimilarity: z.number().optional().describe('Min similarity threshold (0-1)'),
});

// ═══════════════════════════════════════════════════════════════
//                      TOOL DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export function createAutoAgentTools(service: AutoAgentService) {
  return [
    // ─────────────────────────────────────────────────────────────
    // TASK DECOMPOSITION
    // ─────────────────────────────────────────────────────────────
    {
      name: 'auto_decompose_task',
      description: `Automatically decompose a complex task into manageable subtasks.

Use this when:
- Starting a new complex task
- Task involves multiple files or steps
- User requests task breakdown

Returns:
- Complexity analysis (1-10 score)
- List of subtasks with order and dependencies
- Suggested tools for each subtask`,
      inputSchema: DecomposeTaskSchema,
      handler: async (input: z.infer<typeof DecomposeTaskSchema>) => {
        const result = await service.decomposeTask({
          taskName: input.taskName,
          taskDescription: input.taskDescription,
          context: {
            files: input.files,
            constraints: input.constraints,
            domain: input.domain,
          },
          forceDecompose: input.forceDecompose,
        });

        return {
          success: result.success,
          taskId: result.taskId,
          complexity: {
            score: result.complexity.score,
            suggestDecompose: result.complexity.suggestDecompose,
            factors: result.complexity.factors.map(f => `${f.name}: ${f.description}`),
          },
          subtasks: result.subtasks.map(s => ({
            id: s.id,
            name: s.name,
            description: s.description,
            order: s.order,
            phase: s.phase,
            tools: s.tools,
            estimatedTokens: s.estimatedTokens,
          })),
          suggestedOrder: result.suggestedOrder,
        };
      },
    },

    {
      name: 'auto_analyze_complexity',
      description: `Analyze task complexity without decomposing.
Returns complexity score (1-10) and factors contributing to complexity.`,
      inputSchema: DecomposeTaskSchema.pick({ taskName: true, taskDescription: true, files: true, constraints: true, domain: true }),
      handler: async (input: z.infer<typeof DecomposeTaskSchema>) => {
        const result = service.analyzeComplexity({
          taskName: input.taskName,
          taskDescription: input.taskDescription,
          context: {
            files: input.files,
            constraints: input.constraints,
            domain: input.domain,
          },
        });

        return {
          score: result.score,
          suggestDecompose: result.suggestDecompose,
          estimatedSubtasks: result.estimatedSubtasks,
          factors: result.factors.map(f => ({
            name: f.name,
            weight: f.weight,
            description: f.description,
          })),
        };
      },
    },

    // ─────────────────────────────────────────────────────────────
    // TOOL ROUTING
    // ─────────────────────────────────────────────────────────────
    {
      name: 'auto_route_tools',
      description: `Automatically suggest appropriate MCP tools for an action.

Use this when:
- Unsure which tool to use
- Starting a new action
- Need tool recommendations for a phase

Returns:
- List of suggested tools with reasons
- Confidence score`,
      inputSchema: RouteToolsSchema,
      handler: async (input: z.infer<typeof RouteToolsSchema>) => {
        const result = service.routeTools({
          action: input.action,
          context: {
            phase: input.phase,
            files: input.files,
            currentTask: input.currentTask,
            domain: input.domain,
          },
        });

        return {
          success: result.success,
          suggestedTools: result.suggestedTools.map(t => ({
            name: t.name,
            reason: t.reason,
            priority: t.priority,
          })),
          matchedRules: result.matchedRules,
          confidence: result.confidence,
        };
      },
    },

    // ─────────────────────────────────────────────────────────────
    // AUTO FIX LOOP
    // ─────────────────────────────────────────────────────────────
    {
      name: 'auto_fix_loop',
      description: `Start automatic fix loop for an error.

Attempts to fix errors automatically up to maxRetries times.
Learns from memory of similar errors.

Use this when:
- Build fails
- Tests fail
- Guard blocks code

Returns:
- Success status
- Fix attempts made
- Final result`,
      inputSchema: StartFixLoopSchema,
      handler: async (input: z.infer<typeof StartFixLoopSchema>) => {
        const result = await service.startFixLoop({
          error: {
            type: input.errorType,
            message: input.errorMessage,
            file: input.file,
            line: input.line,
            code: input.code,
          },
          context: {
            taskId: input.taskId,
          },
          maxRetries: input.maxRetries,
        });

        return {
          success: result.success,
          status: result.status,
          totalAttempts: result.totalAttempts,
          rolledBack: result.rolledBack,
          attempts: result.attempts.map(a => ({
            attemptNumber: a.attemptNumber,
            fix: a.fix.description,
            result: a.result,
            durationMs: a.durationMs,
          })),
          finalError: result.finalError ? {
            type: result.finalError.type,
            message: result.finalError.message,
          } : undefined,
        };
      },
    },

    {
      name: 'auto_fix_status',
      description: 'Get current fix loop status',
      inputSchema: z.object({}),
      handler: async () => {
        const status = service.getFixLoopStatus();
        return { status };
      },
    },

    // ─────────────────────────────────────────────────────────────
    // ERROR MEMORY
    // ─────────────────────────────────────────────────────────────
    {
      name: 'auto_store_error',
      description: `Store an error and its fix in memory.

Use this after:
- Successfully fixing an error
- Learning a new error pattern
- Documenting a fix for future reference`,
      inputSchema: StoreErrorSchema,
      handler: async (input: z.infer<typeof StoreErrorSchema>) => {
        const result = await service.storeError({
          error: {
            type: input.errorType,
            message: input.errorMessage,
            file: input.file,
          },
          fix: {
            type: input.fixType,
            target: input.fixTarget,
            description: input.fixDescription,
          },
          success: input.success,
          tags: input.tags,
        });

        return {
          success: true,
          errorId: result.id,
          message: `Error stored: ${result.error.type}`,
        };
      },
    },

    {
      name: 'auto_recall_errors',
      description: `Recall similar errors from memory.

Use this:
- Before starting to fix an error
- To learn from past fixes
- To avoid repeating mistakes`,
      inputSchema: RecallErrorsSchema,
      handler: async (input: z.infer<typeof RecallErrorsSchema>) => {
        const result = await service.recallErrors({
          error: input.errorMessage ? {
            type: input.errorType || 'unknown',
            message: input.errorMessage,
          } : undefined,
          tags: input.tags,
          limit: input.limit,
          minSimilarity: input.minSimilarity,
        });

        return {
          matchCount: result.matches.length,
          matches: result.matches.map(m => ({
            errorType: m.error.type,
            errorMessage: m.error.message.substring(0, 100),
            fixDescription: m.fix.description,
            success: m.success,
            similarity: m.similarity,
          })),
          suggestedFix: result.suggestedFix ? {
            type: result.suggestedFix.type,
            target: result.suggestedFix.target,
            description: result.suggestedFix.description,
          } : undefined,
          confidence: result.confidence,
        };
      },
    },

    // ─────────────────────────────────────────────────────────────
    // STATUS
    // ─────────────────────────────────────────────────────────────
    {
      name: 'auto_agent_status',
      description: 'Get AutoAgent module status including all sub-services',
      inputSchema: z.object({}),
      handler: async () => {
        return service.getStatus();
      },
    },
  ];
}
