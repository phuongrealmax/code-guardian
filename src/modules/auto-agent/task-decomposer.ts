// src/modules/auto-agent/task-decomposer.ts
/**
 * TaskDecomposer Service
 *
 * Automatically breaks down complex tasks into manageable subtasks.
 * Uses heuristics and patterns to analyze task complexity and
 * suggest optimal decomposition.
 */

import { v4 as uuid } from 'uuid';
import { Logger } from '../../core/logger.js';
import { EventBus } from '../../core/event-bus.js';
import {
  AutoAgentModuleConfig,
  TaskComplexityAnalysis,
  ComplexityFactor,
  SubtaskDefinition,
  DecomposeResult,
  DecomposeParams,
} from './auto-agent.types.js';

// Complexity keywords and their weights
const COMPLEXITY_KEYWORDS: Record<string, number> = {
  // High complexity
  'refactor': 0.8,
  'migrate': 0.9,
  'redesign': 0.9,
  'architecture': 0.85,
  'integrate': 0.7,
  'security': 0.75,
  'performance': 0.7,
  'optimize': 0.6,

  // Medium complexity
  'implement': 0.5,
  'add': 0.4,
  'create': 0.4,
  'update': 0.35,
  'modify': 0.35,
  'enhance': 0.45,

  // Low complexity
  'fix': 0.3,
  'bug': 0.3,
  'typo': 0.1,
  'rename': 0.2,
  'remove': 0.25,
  'delete': 0.2,
};

// Phase templates for common task types
const TASK_PHASE_TEMPLATES: Record<string, SubtaskDefinition[]> = {
  'feature': [
    { id: '', name: 'Analyze requirements', description: 'Understand feature scope', order: 1, dependsOn: [], estimatedTokens: 500, phase: 'analysis', tools: ['documents_search', 'memory_recall'] },
    { id: '', name: 'Design solution', description: 'Plan implementation approach', order: 2, dependsOn: [], estimatedTokens: 800, phase: 'plan', tools: ['thinking_get_model'] },
    { id: '', name: 'Implement core logic', description: 'Write main implementation', order: 3, dependsOn: [], estimatedTokens: 2000, phase: 'impl', tools: ['latent_apply_patch', 'guard_validate'] },
    { id: '', name: 'Write tests', description: 'Create unit/integration tests', order: 4, dependsOn: [], estimatedTokens: 1000, phase: 'impl', tools: ['testing_run'] },
    { id: '', name: 'Review and refine', description: 'Final review and fixes', order: 5, dependsOn: [], estimatedTokens: 500, phase: 'review', tools: ['guard_validate', 'testing_run'] },
  ],
  'bugfix': [
    { id: '', name: 'Reproduce and analyze', description: 'Understand bug cause', order: 1, dependsOn: [], estimatedTokens: 400, phase: 'analysis', tools: ['memory_recall'] },
    { id: '', name: 'Plan fix', description: 'Determine fix approach', order: 2, dependsOn: [], estimatedTokens: 300, phase: 'plan', tools: [] },
    { id: '', name: 'Apply fix', description: 'Implement the fix', order: 3, dependsOn: [], estimatedTokens: 800, phase: 'impl', tools: ['latent_apply_patch', 'guard_validate'] },
    { id: '', name: 'Verify fix', description: 'Test fix works', order: 4, dependsOn: [], estimatedTokens: 400, phase: 'review', tools: ['testing_run_affected'] },
  ],
  'refactor': [
    { id: '', name: 'Analyze current code', description: 'Map code structure', order: 1, dependsOn: [], estimatedTokens: 600, phase: 'analysis', tools: ['documents_search'] },
    { id: '', name: 'Plan refactoring steps', description: 'Design safe transformation', order: 2, dependsOn: [], estimatedTokens: 800, phase: 'plan', tools: ['thinking_get_model'] },
    { id: '', name: 'Create tests first', description: 'Ensure behavior preserved', order: 3, dependsOn: [], estimatedTokens: 1000, phase: 'impl', tools: ['testing_run'] },
    { id: '', name: 'Apply refactoring', description: 'Transform code', order: 4, dependsOn: [], estimatedTokens: 1500, phase: 'impl', tools: ['latent_apply_patch', 'guard_validate'] },
    { id: '', name: 'Verify no regressions', description: 'Run all tests', order: 5, dependsOn: [], estimatedTokens: 400, phase: 'review', tools: ['testing_run'] },
  ],
  'review': [
    { id: '', name: 'Read and understand', description: 'Analyze code/changes', order: 1, dependsOn: [], estimatedTokens: 500, phase: 'analysis', tools: ['documents_search'] },
    { id: '', name: 'Check patterns', description: 'Validate against best practices', order: 2, dependsOn: [], estimatedTokens: 600, phase: 'analysis', tools: ['guard_validate', 'memory_recall'] },
    { id: '', name: 'Document findings', description: 'Report issues and suggestions', order: 3, dependsOn: [], estimatedTokens: 400, phase: 'review', tools: ['memory_store'] },
  ],
};

export class TaskDecomposer {
  private config: AutoAgentModuleConfig['decomposer'];
  private logger: Logger;
  private eventBus: EventBus;

  // Statistics
  private stats = {
    totalDecomposed: 0,
    totalSubtasksCreated: 0,
  };

  constructor(
    config: AutoAgentModuleConfig['decomposer'],
    logger: Logger,
    eventBus: EventBus
  ) {
    this.config = config;
    this.logger = logger;
    this.eventBus = eventBus;
  }

  // ═══════════════════════════════════════════════════════════════
  //                      MAIN METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Analyze task complexity
   */
  analyzeComplexity(params: DecomposeParams): TaskComplexityAnalysis {
    const factors: ComplexityFactor[] = [];
    let totalScore = 0;

    const taskText = `${params.taskName} ${params.taskDescription || ''}`.toLowerCase();

    // 1. Keyword analysis
    let keywordScore = 0;
    for (const [keyword, weight] of Object.entries(COMPLEXITY_KEYWORDS)) {
      if (taskText.includes(keyword)) {
        keywordScore = Math.max(keywordScore, weight);
        factors.push({
          name: `keyword:${keyword}`,
          weight,
          description: `Contains "${keyword}" keyword`,
        });
      }
    }
    totalScore += keywordScore * 3; // Weight: 30% max

    // 2. File count analysis
    const fileCount = params.context?.files?.length || 0;
    if (fileCount > 0) {
      const fileWeight = Math.min(fileCount / 10, 1);
      totalScore += fileWeight * 2;
      factors.push({
        name: 'file_count',
        weight: fileWeight,
        description: `Affects ${fileCount} files`,
      });
    }

    // 3. Constraint count
    const constraintCount = params.context?.constraints?.length || 0;
    if (constraintCount > 0) {
      const constraintWeight = Math.min(constraintCount / 5, 1);
      totalScore += constraintWeight * 1.5;
      factors.push({
        name: 'constraints',
        weight: constraintWeight,
        description: `Has ${constraintCount} constraints`,
      });
    }

    // 4. Description length (longer = more complex)
    const descLength = params.taskDescription?.length || 0;
    if (descLength > 100) {
      const lengthWeight = Math.min(descLength / 500, 1);
      totalScore += lengthWeight * 1.5;
      factors.push({
        name: 'description_length',
        weight: lengthWeight,
        description: 'Detailed description indicates complexity',
      });
    }

    // 5. Domain-specific boost
    if (params.context?.domain) {
      const domainBoosts: Record<string, number> = {
        'trading': 0.3,
        'security': 0.4,
        'auth': 0.3,
        'payment': 0.4,
      };
      const boost = domainBoosts[params.context.domain] || 0;
      if (boost > 0) {
        totalScore += boost * 2;
        factors.push({
          name: `domain:${params.context.domain}`,
          weight: boost,
          description: `High-risk domain: ${params.context.domain}`,
        });
      }
    }

    // Normalize score to 1-10
    const normalizedScore = Math.min(Math.max(Math.round(totalScore), 1), 10);

    // Estimate subtasks based on score
    const estimatedSubtasks = Math.min(
      Math.max(Math.round(normalizedScore / 2), 2),
      this.config.maxSubtasks
    );

    return {
      score: normalizedScore,
      factors,
      suggestDecompose: normalizedScore >= this.config.minComplexityForDecompose,
      estimatedSubtasks,
    };
  }

  /**
   * Decompose task into subtasks
   */
  async decompose(params: DecomposeParams): Promise<DecomposeResult> {
    const complexity = this.analyzeComplexity(params);

    // Check if decomposition is needed
    if (!complexity.suggestDecompose && !params.forceDecompose) {
      return {
        success: true,
        taskId: uuid(),
        complexity,
        subtasks: [],
        suggestedOrder: [],
      };
    }

    // Determine task type
    const taskType = this.detectTaskType(params);

    // Get template subtasks
    const template = TASK_PHASE_TEMPLATES[taskType] || TASK_PHASE_TEMPLATES['feature'];

    // Generate subtasks from template
    const subtasks: SubtaskDefinition[] = template.map((t, index) => ({
      ...t,
      id: uuid(),
      order: index + 1,
      dependsOn: index > 0 ? [template[index - 1].id] : [],
      files: params.context?.files,
    }));

    // Assign dependencies based on order
    for (let i = 1; i < subtasks.length; i++) {
      subtasks[i].dependsOn = [subtasks[i - 1].id];
    }

    // Update statistics
    this.stats.totalDecomposed++;
    this.stats.totalSubtasksCreated += subtasks.length;

    const result: DecomposeResult = {
      success: true,
      taskId: uuid(),
      complexity,
      subtasks,
      suggestedOrder: subtasks.map(s => s.id),
    };

    // Emit event
    this.eventBus.emit({
      type: 'auto-agent:task:decomposed',
      timestamp: new Date(),
      data: {
        taskName: params.taskName,
        complexity: complexity.score,
        subtaskCount: subtasks.length,
      },
    });

    this.logger.info(`Decomposed task "${params.taskName}" into ${subtasks.length} subtasks (complexity: ${complexity.score})`);

    return result;
  }

  /**
   * Get decomposition statistics
   */
  getStats() {
    return {
      ...this.stats,
      avgSubtasks: this.stats.totalDecomposed > 0
        ? Math.round(this.stats.totalSubtasksCreated / this.stats.totalDecomposed * 10) / 10
        : 0,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  //                      PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Detect task type from name/description
   */
  private detectTaskType(params: DecomposeParams): string {
    const text = `${params.taskName} ${params.taskDescription || ''}`.toLowerCase();

    if (text.includes('refactor') || text.includes('restructure')) {
      return 'refactor';
    }
    if (text.includes('fix') || text.includes('bug') || text.includes('error')) {
      return 'bugfix';
    }
    if (text.includes('review') || text.includes('audit') || text.includes('check')) {
      return 'review';
    }

    return 'feature';
  }
}
