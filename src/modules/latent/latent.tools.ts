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
import { MCPTool, LATENT_TOOL_DEFINITIONS } from './latent.tool-defs.js';
import { checkFeatureAccess, Features } from '../../core/license-integration.js';

/**
 * Create MCP tools for Latent Module
 */
export function createLatentTools(_service: LatentService): MCPTool[] {
  return LATENT_TOOL_DEFINITIONS;
}

/**
 * Handle tool calls for Latent Module
 *
 * NOTE: Latent Chain Mode requires Team tier or higher.
 */
export async function handleLatentTool(
  service: LatentService,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  // License gate: Latent Chain requires Team tier
  const gated = checkFeatureAccess(Features.LATENT_CHAIN);
  if (gated) return gated;

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

    // ═══════════════════════════════════════════════════════════════
    //                      DIFF-BASED EDITING TOOLS
    // ═══════════════════════════════════════════════════════════════

    case 'latent_diff_apply': {
      const target = args.target as string;
      const diff = args.diff as string;
      const dryRun = args.dryRun as boolean | undefined;
      const forceApply = args.forceApply as boolean | undefined;

      const result = await service.applyDiff(target, diff, { dryRun, forceApply });

      return {
        success: result.success,
        target: result.target,
        linesAdded: result.linesAdded,
        linesRemoved: result.linesRemoved,
        usedFuzzyMatch: result.usedFuzzyMatch,
        requiresConfirm: result.requiresConfirm,
        conflicts: result.conflicts.map(c => ({
          type: c.type,
          hunkIndex: c.hunkIndex,
          similarity: Math.round(c.similarity * 100),
          canFuzzyResolve: c.canFuzzyResolve,
          suggestion: c.suggestion,
        })),
        preview: result.preview,
        backupPath: result.backupPath,
        error: result.error,
        message: result.success
          ? `Applied diff to ${target}: +${result.linesAdded}/-${result.linesRemoved}${result.usedFuzzyMatch ? ' (fuzzy match)' : ''}`
          : result.requiresConfirm
            ? `Conflicts detected - use latent_diff_confirm to proceed`
            : `Failed: ${result.error}`,
      };
    }

    case 'latent_diff_confirm': {
      const target = args.target as string;
      const action = args.action as 'confirm' | 'reject';

      if (action === 'reject') {
        const rejected = service.rejectDiff(target);
        return {
          success: rejected,
          target,
          action: 'rejected',
          message: rejected
            ? `Rejected pending edit for ${target}`
            : `No pending edit found for ${target}`,
        };
      }

      const result = await service.confirmDiff(target);
      return {
        success: result.success,
        target: result.target,
        linesAdded: result.linesAdded,
        linesRemoved: result.linesRemoved,
        error: result.error,
        message: result.success
          ? `Confirmed and applied edit to ${target}`
          : `Failed to apply: ${result.error}`,
      };
    }

    case 'latent_diff_rollback': {
      const target = args.target as string;
      const success = await service.rollbackDiff(target);
      return {
        success,
        target,
        message: success
          ? `Rolled back ${target} to backup`
          : `No backup found for ${target}`,
      };
    }

    case 'latent_diff_config': {
      const config: Partial<import('./diff-editor.js').DiffEditorConfig> = {};
      if (args.confirmPolicy !== undefined) {
        config.confirmPolicy = args.confirmPolicy as 'auto' | 'prompt' | 'never';
      }
      if (args.fuzzyThreshold !== undefined) {
        config.fuzzyThreshold = args.fuzzyThreshold as number;
      }
      if (args.createBackup !== undefined) {
        config.createBackup = args.createBackup as boolean;
      }
      if (args.autoRollback !== undefined) {
        config.autoRollback = args.autoRollback as boolean;
      }

      if (Object.keys(config).length > 0) {
        service.configureDiffEditor(config);
      }

      const currentConfig = service.getDiffEditorConfig();
      return {
        success: true,
        config: currentConfig,
        message: Object.keys(config).length > 0
          ? `Updated diff editor config`
          : `Current diff editor config`,
      };
    }

    case 'latent_diff_pending': {
      const pending = service.getPendingDiffConfirms();
      const entries = Array.from(pending.entries()).map(([target, req]) => ({
        target,
        riskLevel: req.riskLevel,
        conflictsCount: req.conflicts.length,
        preview: req.preview.slice(0, 200) + (req.preview.length > 200 ? '...' : ''),
      }));

      return {
        success: true,
        count: entries.length,
        pending: entries,
        message: entries.length > 0
          ? `${entries.length} pending edit(s) waiting for confirmation`
          : 'No pending edits',
      };
    }

    default:
      throw new Error(`Unknown latent tool: ${toolName}`);
  }
}
