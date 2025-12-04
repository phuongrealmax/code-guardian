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
export { CodeOptimizerService } from './code-optimizer.service.js';
export { getCodeOptimizerTools, createCodeOptimizerToolHandlers } from './code-optimizer.tools.js';
export { scanRepository, getLanguageFromExtension, isSourceCodeFile, isTestFile } from './repo-scanner.js';
export { computeMetrics, quickComplexityCheck } from './metrics.js';
export { selectHotspots, groupHotspotsByGoal, getPriorityOrder, filterByScore } from './hotspots.js';
export { buildRefactorPlan, getStepsForPhase, getHighRiskSteps } from './refactor-plan.js';
export { generateReport } from './report-generator.js';
export type { ScanRepositoryInput, ScanRepositoryOutput, FileInfo, FolderInfo, MetricsInput, MetricsOutput, FileMetrics, BranchKeywordsCount, HotspotsInput, HotspotsOutput, Hotspot, SuggestedGoal, RefactorPlanInput, RefactorPlanOutput, FilePlan, RefactorStep, RefactorGoal, RefactorPhase, RiskLevel, RecordOptimizationInput, RecordOptimizationOutput, GenerateReportInput, GenerateReportOutput, ReportSection, CodeOptimizerConfig, CodeOptimizerStatus, } from './types.js';
export { DEFAULT_CODE_OPTIMIZER_CONFIG } from './types.js';
//# sourceMappingURL=index.d.ts.map