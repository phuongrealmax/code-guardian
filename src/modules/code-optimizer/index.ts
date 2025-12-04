// src/modules/code-optimizer/index.ts

/**
 * Code Optimizer Module Exports
 *
 * This module provides:
 * - Repository scanning for code statistics
 * - Code metrics calculation (complexity, nesting, branching)
 * - Hotspot detection for prioritizing refactoring
 * - Refactor plan generation (Latent Chain compatible)
 * - Optimization recording for future reference
 */

// Service
export { CodeOptimizerService } from './code-optimizer.service.js';

// Tools
export { getCodeOptimizerTools, createCodeOptimizerToolHandlers } from './code-optimizer.tools.js';

// Individual functions (for direct use)
export { scanRepository, getLanguageFromExtension, isSourceCodeFile, isTestFile } from './repo-scanner.js';
export { computeMetrics, quickComplexityCheck } from './metrics.js';
export { selectHotspots, groupHotspotsByGoal, getPriorityOrder, filterByScore } from './hotspots.js';
export { buildRefactorPlan, getStepsForPhase, getHighRiskSteps } from './refactor-plan.js';
export { generateReport } from './report-generator.js';

// Types
export type {
  // Scan
  ScanRepositoryInput,
  ScanRepositoryOutput,
  FileInfo,
  FolderInfo,
  // Metrics
  MetricsInput,
  MetricsOutput,
  FileMetrics,
  BranchKeywordsCount,
  // Hotspots
  HotspotsInput,
  HotspotsOutput,
  Hotspot,
  SuggestedGoal,
  // Refactor Plan
  RefactorPlanInput,
  RefactorPlanOutput,
  FilePlan,
  RefactorStep,
  RefactorGoal,
  RefactorPhase,
  RiskLevel,
  // Record
  RecordOptimizationInput,
  RecordOptimizationOutput,
  // Report
  GenerateReportInput,
  GenerateReportOutput,
  ReportSection,
  // Config & Status
  CodeOptimizerConfig,
  CodeOptimizerStatus,
} from './types.js';

// Default configuration
export { DEFAULT_CODE_OPTIMIZER_CONFIG } from './types.js';
