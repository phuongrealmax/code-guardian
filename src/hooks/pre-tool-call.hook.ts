import { HookHandler, Modules } from './hook-handler.js';
import {
  PreToolCallInput,
  PreToolCallResult,
  TaskEstimation,
  ImpactAnalysis,
  GuardWarning,
  HookContext,
  HookWarning
} from './types.js';
import { Logger } from '../core/logger.js';
import { ConfigManager } from '../core/config-manager.js';
import { StateManager } from '../core/state-manager.js';
import { EventBus } from '../core/event-bus.js';
import { existsSync } from 'fs';
import { dirname, basename, join } from 'path';

export class PreToolCallHook extends HookHandler {
  constructor(
    modules: Modules,
    context: HookContext,
    logger: Logger,
    config: ConfigManager,
    state: StateManager,
    eventBus: EventBus
  ) {
    super(modules, context, logger, config, state, eventBus);
  }

  async execute(input: PreToolCallInput): Promise<PreToolCallResult> {
    const startTime = Date.now();
    const warnings: HookWarning[] = [];
    const guardWarnings: GuardWarning[] = [];
    const suggestions: string[] = [];
    let blocked = false;
    let blockReason = '';

    this.logger.debug(`Pre-tool hook for: ${input.toolName}`);

    try {
      // ═══════════════════════════════════════════════════════════
      // STEP 1: Estimate task complexity (for write operations)
      // ═══════════════════════════════════════════════════════════
      let estimation: TaskEstimation | undefined;

      if (this.isWriteOperation(input.toolName)) {
        estimation = await this.estimateTask(input);

        if (estimation.suggestCheckpoint) {
          warnings.push(this.createWarning(
            'warning',
            `Token usage high (${estimation.estimatedTokens} estimated). Consider creating checkpoint.`,
            '/ccg checkpoint create'
          ));
        }

        if (!estimation.canComplete) {
          warnings.push(this.createWarning(
            'error',
            'Task may exceed available tokens!',
            'Create checkpoint now or break task into smaller pieces'
          ));
        }

        if (estimation.suggestBreakdown) {
          suggestions.push('Consider breaking this task into smaller subtasks');
        }
      }

      // ═══════════════════════════════════════════════════════════
      // STEP 2: Impact analysis
      // ═══════════════════════════════════════════════════════════
      let impactAnalysis: ImpactAnalysis | undefined;

      if (this.isWriteOperation(input.toolName)) {
        impactAnalysis = this.analyzeImpact(input);

        if (impactAnalysis.riskLevel === 'high') {
          warnings.push(this.createWarning(
            'warning',
            `High-risk change: affects ${impactAnalysis.filesAffected.length} files`,
            'Review affected files before proceeding'
          ));
        }

        if (impactAnalysis.potentialConflicts.length > 0) {
          warnings.push(this.createWarning(
            'warning',
            `Potential conflicts detected in: ${impactAnalysis.potentialConflicts.join(', ')}`,
            'Check for unsaved changes'
          ));
        }

        if (impactAnalysis.testsToRun.length > 0) {
          suggestions.push(`Run affected tests: ${impactAnalysis.testsToRun.slice(0, 3).join(', ')}`);
        }
      }

      // ═══════════════════════════════════════════════════════════
      // STEP 3: Pre-validate content with Guard
      // ═══════════════════════════════════════════════════════════
      if (input.toolName === 'write_file' || input.toolName === 'edit_file') {
        const content = this.extractContent(input);
        const filename = this.extractFilename(input);

        if (content && filename) {
          const validation = await this.modules.guard.validate(content, filename);

          for (const issue of validation.issues) {
            guardWarnings.push({
              rule: issue.rule,
              severity: issue.severity as 'warning' | 'error' | 'block',
              message: issue.message,
              location: issue.location,
              suggestion: issue.suggestion,
            });

            if (issue.severity === 'block') {
              blocked = true;
              blockReason = `Guard blocked: ${issue.message}`;
            }
          }
        }
      }

      // ═══════════════════════════════════════════════════════════
      // STEP 4: Process-specific checks
      // ═══════════════════════════════════════════════════════════
      if (input.toolName === 'bash') {
        const command = this.extractBashCommand(input);

        if (command) {
          // Check for server/process start commands
          const portMatch = command.match(/(?:--port|PORT=|:)(\d{4,5})/);
          if (portMatch) {
            const port = parseInt(portMatch[1], 10);
            const portStatus = await this.modules.process.checkPort(port);

            if (!portStatus.available) {
              warnings.push(this.createWarning(
                'warning',
                `Port ${port} is already in use by ${portStatus.usedBy || 'unknown process'}`,
                'Kill existing process or use different port'
              ));
              suggestions.push(`Run: /ccg process kill --port ${port}`);
            }
          }

          // Check for dangerous commands
          if (this.isDangerousCommand(command)) {
            warnings.push(this.createWarning(
              'error',
              'Potentially dangerous command detected',
              'Review command carefully before executing'
            ));
          }
        }
      }

      // ═══════════════════════════════════════════════════════════
      // STEP 5: Track file in current task
      // ═══════════════════════════════════════════════════════════
      if (this.isWriteOperation(input.toolName)) {
        const filename = this.extractFilename(input);
        const currentTask = this.modules.workflow.getCurrentTask();

        if (currentTask && filename) {
          await this.modules.workflow.addAffectedFile(currentTask.id, filename);
        }
      }

      // ═══════════════════════════════════════════════════════════
      // STEP 6: Auto-attach latent context (MCP-First Mode)
      // ═══════════════════════════════════════════════════════════
      if (await this.shouldAutoAttachLatent(input.toolName)) {
        await this.autoAttachLatentContext(input);
      }

      const duration = Date.now() - startTime;
      this.logger.debug(`Pre-tool hook completed in ${duration}ms`);

      // Build result
      const allWarnings: HookWarning[] = [
        ...warnings,
        ...guardWarnings.map(gw => ({
          level: gw.severity === 'block' ? 'error' as const : gw.severity as 'warning' | 'error',
          message: gw.message,
          action: gw.suggestion,
        })),
      ];

      return {
        success: !blocked,
        blocked,
        blockReason: blocked ? blockReason : undefined,
        message: blocked ? blockReason : undefined,
        warnings: allWarnings,
        data: {
          validated: !blocked,
          estimation,
          impactAnalysis,
          guardWarnings: guardWarnings.length > 0 ? guardWarnings : undefined,
          suggestions: suggestions.length > 0 ? suggestions : undefined,
        },
      };

    } catch (error) {
      this.logger.error('Pre-tool hook error:', error);

      return {
        success: true, // Don't block on hook errors
        warnings: [{
          level: 'warning',
          message: `Pre-tool validation error: ${error instanceof Error ? error.message : 'Unknown'}`,
        }],
        data: {
          validated: true,
        },
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //                      HELPER METHODS
  // ═══════════════════════════════════════════════════════════════

  private isWriteOperation(toolName: string): boolean {
    return ['write_file', 'edit_file', 'create_file', 'str_replace_editor'].includes(toolName);
  }

  private async estimateTask(input: PreToolCallInput): Promise<TaskEstimation> {
    const content = this.extractContent(input);
    const linesEstimate = content ? content.split('\n').length : 50;

    // Simple estimation based on content size
    const estimatedTokens = Math.round(linesEstimate * 10); // ~10 tokens per line estimate
    const resourceStatus = this.modules.resource.getStatus();
    const remainingTokens = resourceStatus.tokens.estimated - resourceStatus.tokens.used;

    let complexity: 'low' | 'medium' | 'high' | 'very_high' = 'low';
    if (linesEstimate > 100) complexity = 'medium';
    if (linesEstimate > 300) complexity = 'high';
    if (linesEstimate > 500) complexity = 'very_high';

    return {
      complexity,
      estimatedTokens,
      canComplete: estimatedTokens < remainingTokens,
      suggestCheckpoint: resourceStatus.tokens.percentage >= 70,
      suggestBreakdown: linesEstimate > 200,
    };
  }

  private analyzeImpact(input: PreToolCallInput): ImpactAnalysis {
    const filename = this.extractFilename(input);
    const filesAffected: string[] = filename ? [filename] : [];
    const dependentFiles: string[] = [];
    const potentialConflicts: string[] = [];
    const testsToRun: string[] = [];

    if (filename) {
      // Find dependent files (simple import analysis)
      const baseName = basename(filename).replace(/\.(ts|tsx|js|jsx)$/, '');

      // Look for test files
      const testPatterns = [
        `${baseName}.test.ts`,
        `${baseName}.test.tsx`,
        `${baseName}.spec.ts`,
        `__tests__/${baseName}.ts`,
      ];

      for (const pattern of testPatterns) {
        const testPath = join(dirname(filename), pattern);
        if (existsSync(testPath)) {
          testsToRun.push(testPath);
        }
      }

      // Check for index file dependencies
      const dir = dirname(filename);
      const indexPath = join(dir, 'index.ts');
      if (existsSync(indexPath) && indexPath !== filename) {
        dependentFiles.push(indexPath);
      }
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (filesAffected.length > 3) riskLevel = 'medium';
    if (filesAffected.length > 5 || potentialConflicts.length > 0) riskLevel = 'high';

    return {
      filesAffected,
      dependentFiles,
      potentialConflicts,
      testsToRun,
      riskLevel,
    };
  }

  private extractContent(input: PreToolCallInput): string | undefined {
    const toolInput = input.toolInput;
    return (toolInput.content || toolInput.new_str || toolInput.file_text) as string | undefined;
  }

  private extractFilename(input: PreToolCallInput): string | undefined {
    const toolInput = input.toolInput;
    return (toolInput.path || toolInput.file_path || toolInput.filename) as string | undefined;
  }

  private extractBashCommand(input: PreToolCallInput): string | undefined {
    const toolInput = input.toolInput;
    return (toolInput.command || toolInput.cmd) as string | undefined;
  }

  private isDangerousCommand(command: string): boolean {
    const dangerousPatterns = [
      /rm\s+-rf?\s+[\/~]/,
      />\s*\/dev\/sd[a-z]/,
      /mkfs\./,
      /dd\s+if=/,
      /chmod\s+-R\s+777/,
      /:(){ :|:& };:/,  // Fork bomb
    ];

    return dangerousPatterns.some(pattern => pattern.test(command));
  }

  // ═══════════════════════════════════════════════════════════════
  //              AUTO-ATTACH LATENT CONTEXT (MCP-FIRST MODE)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Determine if this tool call should auto-attach latent context
   * Uses config's autoAttachTriggerTools list
   */
  private async shouldAutoAttachLatent(toolName: string): Promise<boolean> {
    const latentConfig = await this.config.get('modules.latent') as {
      enabled?: boolean;
      autoAttach?: boolean;
      autoAttachTriggerTools?: string[];
    } | undefined;

    if (!latentConfig?.enabled || latentConfig?.autoAttach === false) {
      return false;
    }

    // Use configured trigger tools or fallback to defaults
    const triggerTools = latentConfig.autoAttachTriggerTools || [
      'guard_validate',
      'guard_check_test',
      'testing_run',
      'testing_run_affected',
      'write_file',
      'edit_file',
      'create_file',
      'str_replace_editor',
      'memory_store',
      'workflow_task_start',
    ];

    return triggerTools.includes(toolName) || this.isWriteOperation(toolName);
  }

  /**
   * Auto-attach latent context if:
   * 1. Latent module is enabled and autoAttach is true
   * 2. There's a current workflow task OR tool is a write operation
   * 3. No existing latent context for this task
   *
   * MCP-First Mode: Ensures every significant action is tracked via MCP
   */
  private async autoAttachLatentContext(input: PreToolCallInput): Promise<void> {
    try {
      const latentConfig = await this.config.get('modules.latent') as {
        enabled?: boolean;
        autoAttach?: boolean;
      } | undefined;

      if (!latentConfig?.enabled || latentConfig?.autoAttach === false) {
        return;
      }

      // Check if there's a current workflow task
      const currentTask = this.modules.workflow.getCurrentTask();
      const filename = this.extractFilename(input);

      // Get latent service
      const latentService = this.modules.latent.getService();
      const existingContexts = await latentService.listContexts();

      // Determine task ID - use workflow task if available, otherwise create from tool context
      let taskId: string;
      let taskName: string;

      if (currentTask) {
        taskId = `task-${currentTask.id.slice(0, 8)}`;
        taskName = currentTask.name;
      } else if (this.isWriteOperation(input.toolName) && filename) {
        // Create task ID from filename for write operations without workflow task
        const baseFilename = filename.split('/').pop() || filename;
        taskId = `file-${baseFilename.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 20)}`;
        taskName = `Edit ${baseFilename}`;
      } else {
        // No task context available
        return;
      }

      // Check if latent context already exists
      const hasContext = existingContexts.some(c =>
        c.taskId === taskId ||
        (currentTask && (
          c.taskId === currentTask.id ||
          c.taskId.includes(currentTask.name.toLowerCase().replace(/\s+/g, '-'))
        ))
      );

      if (hasContext) {
        // Context exists - update it with new file info if available
        if (filename) {
          const existingContext = existingContexts.find(c =>
            c.taskId === taskId ||
            (currentTask && c.taskId.includes(currentTask.name.toLowerCase().replace(/\s+/g, '-')))
          );
          if (existingContext && !existingContext.codeMap.files.includes(filename)) {
            await latentService.updateContext({
              taskId: existingContext.taskId,
              delta: {
                codeMap: { files: [filename] },
              },
              agentId: 'pre-tool-hook',
            });
          }
        }
        return;
      }

      // Auto-create latent context (MCP-First Mode)
      await latentService.createContext({
        taskId,
        phase: 'analysis',
        constraints: [
          'MCP-First Mode: All changes must go through MCP tools',
          'Auto-attached context for tracking',
          'Follow project conventions',
        ],
        files: filename ? [filename] : [],
        agentId: 'pre-tool-hook',
      });

      // Add initial decision documenting the auto-attach
      await latentService.updateContext({
        taskId,
        delta: {
          decisions: [{
            id: 'AUTO001',
            summary: `Auto-attached for: ${taskName}`,
            rationale: `MCP-First Mode triggered by ${input.toolName} call`,
            phase: 'analysis',
          }],
          metadata: {
            custom: {
              autoAttached: true,
              triggeredBy: input.toolName,
              workflowTaskId: currentTask?.id,
              initialFile: filename,
            },
          },
        },
      });

      this.logger.info(`[MCP-First] Auto-attached latent context: ${taskId} for: ${taskName}`);

      // Emit event for tracking
      this.eventBus.emit({
        type: 'latent:context:created',
        timestamp: new Date(),
        data: {
          taskId,
          workflowTaskId: currentTask?.id,
          triggeredBy: input.toolName,
          autoAttached: true,
          mcpFirstMode: true,
        },
        source: 'PreToolCallHook',
      });

    } catch (error) {
      // Don't fail the hook on auto-attach errors
      this.logger.warn('Failed to auto-attach latent context:', error);
    }
  }
}
