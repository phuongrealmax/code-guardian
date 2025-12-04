// src/modules/code-optimizer/code-optimizer.tools.ts
// ═══════════════════════════════════════════════════════════════
//                      TOOL DEFINITIONS
// ═══════════════════════════════════════════════════════════════
export function getCodeOptimizerTools() {
    return [
        // Repository Scanning
        {
            name: 'code_scan_repository',
            description: `Scan repository structure and gather basic statistics for code optimization.

Returns:
- Total files and approximate line counts
- Top 50 largest files
- Top 50 largest folders
- File breakdown by extension

Use this as the FIRST step when analyzing a codebase for optimization.`,
            inputSchema: {
                type: 'object',
                properties: {
                    rootPath: {
                        type: 'string',
                        description: 'Root path to scan (default: current workspace)',
                    },
                    includePatterns: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Glob patterns to include (default: **/*.*)',
                    },
                    excludePatterns: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Glob patterns to exclude (default: node_modules, dist, .git)',
                    },
                    maxFiles: {
                        type: 'number',
                        description: 'Maximum files to scan (default: 5000)',
                    },
                },
            },
        },
        // Code Metrics
        {
            name: 'code_metrics',
            description: `Calculate code metrics for specified files.

Metrics calculated per file:
- Lines (total, code, comments, blank)
- Nesting depth (max)
- Branch keywords (if, switch, for, while, catch, ternary)
- TODO/FIXME counts
- Complexity score (weighted composite)

Use AFTER scanning to analyze specific files.`,
            inputSchema: {
                type: 'object',
                properties: {
                    files: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'List of file paths to analyze (relative to workspace)',
                    },
                    maxFileSizeBytes: {
                        type: 'number',
                        description: 'Skip files larger than this (default: 512KB)',
                    },
                },
                required: ['files'],
            },
        },
        // Hotspot Detection
        {
            name: 'code_hotspots',
            description: `Identify code hotspots that should be prioritized for refactoring.

Scoring strategies:
- size: Prioritize large files
- complexity: Prioritize complex files (nesting, branching)
- mixed: Balanced scoring (recommended)

Returns ranked hotspots with:
- Composite score
- Reasons (e.g., "Very high complexity", "Deep nesting")
- Suggested goal (refactor, add-tests, split-module, simplify, document)`,
            inputSchema: {
                type: 'object',
                properties: {
                    metrics: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                path: { type: 'string' },
                                lines: { type: 'number' },
                                maxNestingDepth: { type: 'number' },
                                branchScore: { type: 'number' },
                                todoCount: { type: 'number' },
                                fixmeCount: { type: 'number' },
                                complexityScore: { type: 'number' },
                            },
                            required: ['path', 'lines', 'maxNestingDepth', 'branchScore', 'todoCount', 'fixmeCount'],
                        },
                        description: 'Metrics from code_metrics tool',
                    },
                    maxResults: {
                        type: 'number',
                        description: 'Maximum hotspots to return (default: 20)',
                    },
                    strategy: {
                        type: 'string',
                        enum: ['size', 'complexity', 'mixed'],
                        description: 'Scoring strategy (default: mixed)',
                    },
                    thresholds: {
                        type: 'object',
                        properties: {
                            minLines: { type: 'number' },
                            minComplexity: { type: 'number' },
                            minNesting: { type: 'number' },
                        },
                        description: 'Minimum thresholds for hotspot detection',
                    },
                },
                required: ['metrics'],
            },
        },
        // Refactor Plan
        {
            name: 'code_refactor_plan',
            description: `Generate a structured refactoring plan for identified hotspots.

Goals:
- readability: Improve code clarity and maintainability
- performance: Optimize for speed
- architecture: Restructure modules and dependencies
- testing: Improve test coverage
- mixed: General improvement

Each step includes:
- Phase (analysis, plan, impl, review) - compatible with Latent Chain
- Risk level (low, medium, high)
- Suggested tools to use`,
            inputSchema: {
                type: 'object',
                properties: {
                    hotspots: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                path: { type: 'string' },
                                reason: { type: 'string' },
                                score: { type: 'number' },
                            },
                            required: ['path', 'reason'],
                        },
                        description: 'Hotspots from code_hotspots tool',
                    },
                    goal: {
                        type: 'string',
                        enum: ['readability', 'performance', 'architecture', 'testing', 'mixed'],
                        description: 'Refactoring goal',
                    },
                    maxStepsPerFile: {
                        type: 'number',
                        description: 'Maximum steps per file (default: 5)',
                    },
                    constraints: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Constraints to apply (e.g., "No breaking changes")',
                    },
                },
                required: ['hotspots', 'goal'],
            },
        },
        // Record Optimization
        {
            name: 'code_record_optimization',
            description: `Record a completed optimization session for future reference.

Stores:
- Summary of changes
- Files modified
- Test results
- Metrics improvement (if provided)

Use this AFTER completing a refactoring session.`,
            inputSchema: {
                type: 'object',
                properties: {
                    sessionId: {
                        type: 'string',
                        description: 'Unique session identifier',
                    },
                    summary: {
                        type: 'string',
                        description: 'Summary of the optimization performed',
                    },
                    filesChanged: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'List of modified files',
                    },
                    testsRun: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Test files executed',
                    },
                    testsStatus: {
                        type: 'string',
                        enum: ['passed', 'failed', 'partial', 'skipped'],
                        description: 'Overall test status',
                    },
                    metricsImprovement: {
                        type: 'object',
                        properties: {
                            before: {
                                type: 'object',
                                properties: {
                                    avgComplexity: { type: 'number' },
                                    totalLines: { type: 'number' },
                                },
                            },
                            after: {
                                type: 'object',
                                properties: {
                                    avgComplexity: { type: 'number' },
                                    totalLines: { type: 'number' },
                                },
                            },
                        },
                        description: 'Before/after metrics comparison',
                    },
                    notes: {
                        type: 'string',
                        description: 'Additional notes',
                    },
                },
                required: ['sessionId', 'summary', 'filesChanged'],
            },
        },
        // Generate Report
        {
            name: 'code_generate_report',
            description: `Generate a formatted markdown report for an optimization session.

The report includes:
- Overview (repo stats)
- Metrics comparison (before/after)
- Hotspots table with scores
- Files changed
- Refactor plan summary
- Test results
- Recommended next steps

Reports are saved to docs/reports/ and can be registered in Documents module.`,
            inputSchema: {
                type: 'object',
                properties: {
                    sessionId: {
                        type: 'string',
                        description: 'Unique session identifier',
                    },
                    repoName: {
                        type: 'string',
                        description: 'Repository name (default: folder name)',
                    },
                    strategy: {
                        type: 'string',
                        enum: ['size', 'complexity', 'mixed'],
                        description: 'Strategy used for analysis',
                    },
                    scanResult: {
                        type: 'object',
                        description: 'Scan result from code_scan_repository',
                    },
                    metricsBefore: {
                        type: 'object',
                        description: 'Metrics before optimization',
                    },
                    metricsAfter: {
                        type: 'object',
                        description: 'Metrics after optimization',
                    },
                    hotspots: {
                        type: 'object',
                        description: 'Hotspots from code_hotspots',
                    },
                    refactorPlan: {
                        type: 'object',
                        description: 'Refactor plan from code_refactor_plan',
                    },
                    filesChanged: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'List of modified files',
                    },
                    changesDescription: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Description for each file change',
                    },
                    testsStatus: {
                        type: 'string',
                        enum: ['passed', 'failed', 'partial', 'skipped'],
                        description: 'Overall test status',
                    },
                    testsPassed: {
                        type: 'number',
                        description: 'Number of tests passed',
                    },
                    testsFailed: {
                        type: 'number',
                        description: 'Number of tests failed',
                    },
                    outputPath: {
                        type: 'string',
                        description: 'Custom output path (default: docs/reports/optimization-<date>-<session>.md)',
                    },
                    registerInDocuments: {
                        type: 'boolean',
                        description: 'Register report in Documents module (default: true)',
                    },
                    storeInMemory: {
                        type: 'boolean',
                        description: 'Store summary in Memory module (default: true)',
                    },
                },
                required: ['sessionId'],
            },
        },
        // Quick Analysis (Convenience)
        {
            name: 'code_quick_analysis',
            description: `Perform quick analysis: scan + metrics + hotspots in one call.

This is a convenience tool that combines:
1. code_scan_repository
2. code_metrics (on source files)
3. code_hotspots

Use for rapid assessment of a codebase.`,
            inputSchema: {
                type: 'object',
                properties: {
                    maxFiles: {
                        type: 'number',
                        description: 'Maximum files to scan (default: 1000)',
                    },
                    maxHotspots: {
                        type: 'number',
                        description: 'Maximum hotspots to return (default: 20)',
                    },
                    strategy: {
                        type: 'string',
                        enum: ['size', 'complexity', 'mixed'],
                        description: 'Hotspot scoring strategy (default: mixed)',
                    },
                },
            },
        },
        // Status
        {
            name: 'code_optimizer_status',
            description: 'Get Code Optimizer module status including cache and active optimizations.',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
    ];
}
// ═══════════════════════════════════════════════════════════════
//                      TOOL HANDLERS
// ═══════════════════════════════════════════════════════════════
export function createCodeOptimizerToolHandlers(service) {
    return {
        code_scan_repository: async (args) => {
            try {
                const result = await service.scanRepository(args);
                return {
                    success: true,
                    ...result,
                    formatted: formatScanResult(result),
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                };
            }
        },
        code_metrics: async (args) => {
            try {
                const result = await service.computeMetrics(args);
                return {
                    success: true,
                    ...result,
                    formatted: formatMetricsResult(result),
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                };
            }
        },
        code_hotspots: (args) => {
            try {
                const result = service.detectHotspots(args);
                return {
                    success: true,
                    ...result,
                    formatted: formatHotspotsResult(result),
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                };
            }
        },
        code_refactor_plan: (args) => {
            try {
                const result = service.generateRefactorPlan(args);
                return {
                    success: true,
                    ...result,
                    formatted: formatPlanResult(result),
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                };
            }
        },
        code_record_optimization: async (args) => {
            try {
                const result = await service.recordOptimization(args);
                return result;
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                };
            }
        },
        code_generate_report: (args) => {
            try {
                const result = service.generateReport(args);
                return {
                    success: true,
                    reportPath: result.reportPath,
                    summary: result.summary,
                    sectionsGenerated: result.sections.length,
                    message: `Report generated at ${result.reportPath}`,
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                };
            }
        },
        code_quick_analysis: async (args) => {
            try {
                const result = await service.quickAnalysis(args);
                return {
                    success: true,
                    scan: {
                        totalFiles: result.scan.totalFiles,
                        totalLinesApprox: result.scan.totalLinesApprox,
                    },
                    metrics: {
                        filesAnalyzed: result.metrics.files.length,
                        avgComplexity: result.metrics.aggregate.avgComplexityScore,
                    },
                    hotspots: result.hotspots.hotspots.map((h) => ({
                        path: h.path,
                        score: h.score,
                        reasons: h.reasons,
                        suggestedGoal: h.suggestedGoal,
                    })),
                    summary: result.hotspots.summary,
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                };
            }
        },
        code_optimizer_status: () => {
            return service.getStatus();
        },
    };
}
// ═══════════════════════════════════════════════════════════════
//                      FORMATTERS
// ═══════════════════════════════════════════════════════════════
function formatScanResult(result) {
    let output = '=== Repository Scan ===\n\n';
    output += `Root: ${result.rootPath}\n`;
    output += `Total Files: ${result.totalFiles}\n`;
    output += `Total Lines (approx): ${result.totalLinesApprox.toLocaleString()}\n\n`;
    output += 'TOP LARGE FILES:\n';
    for (const file of result.topLargeFiles.slice(0, 10)) {
        output += `  ${file.path} (~${file.linesApprox} lines)\n`;
    }
    output += '\nTOP LARGE FOLDERS:\n';
    for (const folder of result.topLargeFolders.slice(0, 10)) {
        output += `  ${folder.path} (${folder.files} files, ~${folder.linesApprox} lines)\n`;
    }
    return output;
}
function formatMetricsResult(result) {
    let output = '=== Code Metrics ===\n\n';
    output += `Files Analyzed: ${result.aggregate.totalFiles}\n`;
    output += `Total Lines: ${result.aggregate.totalLines.toLocaleString()}\n`;
    output += `Code Lines: ${result.aggregate.totalCodeLines.toLocaleString()}\n`;
    output += `Avg Complexity: ${result.aggregate.avgComplexityScore}\n`;
    output += `Total TODOs: ${result.aggregate.totalTodos}\n`;
    output += `Total FIXMEs: ${result.aggregate.totalFixmes}\n\n`;
    // Top 10 most complex files
    const sorted = [...result.files].sort((a, b) => b.complexityScore - a.complexityScore);
    output += 'TOP COMPLEX FILES:\n';
    for (const file of sorted.slice(0, 10)) {
        output += `  [${file.complexityScore.toFixed(1)}] ${file.path} (${file.lines} lines, depth ${file.maxNestingDepth})\n`;
    }
    return output;
}
function formatHotspotsResult(result) {
    let output = '=== Code Hotspots ===\n\n';
    output += `Analyzed: ${result.summary.totalAnalyzed} files\n`;
    output += `Hotspots Found: ${result.summary.hotspotsFound}\n`;
    output += `Strategy: ${result.summary.strategy}\n`;
    output += `Top Reason: ${result.summary.topReason}\n\n`;
    output += 'HOTSPOTS:\n';
    for (const hotspot of result.hotspots) {
        output += `\n#${hotspot.rank} ${hotspot.path}\n`;
        output += `   Score: ${hotspot.score.toFixed(1)} | Goal: ${hotspot.suggestedGoal}\n`;
        output += `   Reasons: ${hotspot.reasons.join(', ')}\n`;
    }
    return output;
}
function formatPlanResult(result) {
    let output = '=== Refactor Plan ===\n\n';
    output += `Files: ${result.summary.totalFiles}\n`;
    output += `Total Steps: ${result.summary.totalSteps}\n`;
    output += `High-Risk Steps: ${result.summary.highRiskSteps}\n`;
    output += `Estimated Effort: ${result.summary.estimatedTotalEffort}\n\n`;
    output += 'WORKFLOW PHASES: ' + result.workflow.phases.join(' -> ') + '\n\n';
    for (const filePlan of result.plan) {
        output += `\n[${filePlan.priority}] ${filePlan.file}\n`;
        output += `    Goal: ${filePlan.goal}\n`;
        output += `    Effort: ${filePlan.estimatedEffort}\n`;
        output += '    Steps:\n';
        for (const step of filePlan.steps) {
            output += `      - [${step.phase}/${step.risk}] ${step.title}\n`;
        }
    }
    return output;
}
//# sourceMappingURL=code-optimizer.tools.js.map