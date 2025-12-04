/**
 * Code Optimizer Module Types
 *
 * Provides types for repository scanning, metrics calculation,
 * hotspot detection, and refactor planning.
 */
export interface ScanRepositoryInput {
    rootPath?: string;
    includePatterns?: string[];
    excludePatterns?: string[];
    maxFiles?: number;
}
export interface FileInfo {
    path: string;
    extension: string;
    sizeBytes: number;
    linesApprox: number;
}
export interface FolderInfo {
    path: string;
    files: number;
    linesApprox: number;
}
export interface ScanRepositoryOutput {
    rootPath: string;
    totalFiles: number;
    totalLinesApprox: number;
    files: FileInfo[];
    topLargeFiles: Array<{
        path: string;
        linesApprox: number;
    }>;
    topLargeFolders: FolderInfo[];
}
export interface MetricsInput {
    files: string[];
    maxFileSizeBytes?: number;
}
export interface BranchKeywordsCount {
    if: number;
    elseIf: number;
    switch: number;
    case: number;
    for: number;
    while: number;
    catch: number;
    ternary: number;
}
export interface FileMetrics {
    path: string;
    lines: number;
    codeLines: number;
    commentLines: number;
    blankLines: number;
    todoCount: number;
    fixmeCount: number;
    maxNestingDepth: number;
    branchKeywordsCount: BranchKeywordsCount;
    branchScore: number;
    complexityScore: number;
}
export interface MetricsOutput {
    files: FileMetrics[];
    aggregate: {
        totalFiles: number;
        totalLines: number;
        totalCodeLines: number;
        avgComplexityScore: number;
        totalTodos: number;
        totalFixmes: number;
    };
}
export interface HotspotsInput {
    metrics: Array<{
        path: string;
        lines: number;
        maxNestingDepth: number;
        branchScore: number;
        todoCount: number;
        fixmeCount: number;
        complexityScore?: number;
    }>;
    maxResults?: number;
    strategy?: 'size' | 'complexity' | 'mixed';
    thresholds?: {
        minLines?: number;
        minComplexity?: number;
        minNesting?: number;
    };
}
export type SuggestedGoal = 'refactor' | 'add-tests' | 'split-module' | 'simplify' | 'document';
export interface Hotspot {
    path: string;
    score: number;
    rank: number;
    reasons: string[];
    suggestedGoal: SuggestedGoal;
    metrics: {
        lines: number;
        complexity: number;
        nesting: number;
        todos: number;
    };
}
export interface HotspotsOutput {
    hotspots: Hotspot[];
    summary: {
        totalAnalyzed: number;
        hotspotsFound: number;
        strategy: string;
        topReason: string;
    };
}
export type RefactorGoal = 'performance' | 'readability' | 'architecture' | 'testing' | 'mixed';
export type RefactorPhase = 'analysis' | 'plan' | 'impl' | 'review';
export type RiskLevel = 'low' | 'medium' | 'high';
export interface RefactorPlanInput {
    hotspots: Array<{
        path: string;
        reason: string;
        score?: number;
    }>;
    goal: RefactorGoal;
    maxStepsPerFile?: number;
    constraints?: string[];
}
export interface RefactorStep {
    id: string;
    title: string;
    description: string;
    phase: RefactorPhase;
    risk: RiskLevel;
    estimatedImpact: string;
    suggestedTools?: string[];
}
export interface FilePlan {
    file: string;
    goal: string;
    priority: number;
    steps: RefactorStep[];
    estimatedEffort: 'small' | 'medium' | 'large';
    dependencies?: string[];
}
export interface RefactorPlanOutput {
    plan: FilePlan[];
    summary: {
        totalFiles: number;
        totalSteps: number;
        estimatedTotalEffort: string;
        highRiskSteps: number;
    };
    workflow: {
        phases: RefactorPhase[];
        suggestedOrder: string[];
    };
}
export interface RecordOptimizationInput {
    sessionId: string;
    summary: string;
    filesChanged: string[];
    testsRun?: string[];
    testsStatus?: 'passed' | 'failed' | 'partial' | 'skipped';
    metricsImprovement?: {
        before: {
            avgComplexity: number;
            totalLines: number;
        };
        after: {
            avgComplexity: number;
            totalLines: number;
        };
    };
    notes?: string;
}
export interface RecordOptimizationOutput {
    success: boolean;
    memoryId?: string;
    documentPath?: string;
    message: string;
}
export interface CodeOptimizerConfig {
    enabled: boolean;
    defaultExcludePatterns: string[];
    maxFilesToScan: number;
    maxFileSizeBytes: number;
    cacheResults: boolean;
    cacheTTLSeconds: number;
}
export declare const DEFAULT_CODE_OPTIMIZER_CONFIG: CodeOptimizerConfig;
export interface CodeOptimizerStatus {
    enabled: boolean;
    lastScan?: {
        timestamp: Date;
        rootPath: string;
        filesScanned: number;
    };
    cachedMetrics: number;
    activeOptimizations: number;
}
export interface GenerateReportInput {
    sessionId: string;
    repoName?: string;
    strategy?: 'size' | 'complexity' | 'mixed';
    scanResult?: ScanRepositoryOutput;
    metricsBefore?: MetricsOutput;
    metricsAfter?: MetricsOutput;
    hotspots?: HotspotsOutput;
    refactorPlan?: RefactorPlanOutput;
    filesChanged?: string[];
    changesDescription?: string[];
    testsRun?: string[];
    testsStatus?: 'passed' | 'failed' | 'partial' | 'skipped';
    testsPassed?: number;
    testsFailed?: number;
    outputPath?: string;
    registerInDocuments?: boolean;
    storeInMemory?: boolean;
}
export interface ReportSection {
    title: string;
    content: string;
}
export interface GenerateReportOutput {
    success: boolean;
    reportPath: string;
    markdown: string;
    sections: ReportSection[];
    documentId?: string;
    memoryId?: string;
    summary: {
        hotspotsAnalyzed: number;
        filesChanged: number;
        complexityReduction?: string;
        linesReduction?: string;
        testsStatus?: string;
    };
}
//# sourceMappingURL=types.d.ts.map