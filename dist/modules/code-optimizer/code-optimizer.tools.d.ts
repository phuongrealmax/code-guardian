/**
 * MCP Tools for Code Optimizer Module
 *
 * Provides tools for:
 * - Repository scanning
 * - Code metrics calculation
 * - Hotspot detection
 * - Refactor planning
 * - Optimization recording
 */
import { CodeOptimizerService } from './code-optimizer.service.js';
import { ScanRepositoryInput, MetricsInput, HotspotsInput, RefactorPlanInput, RecordOptimizationInput, GenerateReportInput } from './types.js';
export declare function getCodeOptimizerTools(): ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            rootPath: {
                type: string;
                description: string;
            };
            includePatterns: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            excludePatterns: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            maxFiles: {
                type: string;
                description: string;
            };
            files?: undefined;
            maxFileSizeBytes?: undefined;
            metrics?: undefined;
            maxResults?: undefined;
            strategy?: undefined;
            thresholds?: undefined;
            hotspots?: undefined;
            goal?: undefined;
            maxStepsPerFile?: undefined;
            constraints?: undefined;
            sessionId?: undefined;
            summary?: undefined;
            filesChanged?: undefined;
            testsRun?: undefined;
            testsStatus?: undefined;
            metricsImprovement?: undefined;
            notes?: undefined;
            repoName?: undefined;
            scanResult?: undefined;
            metricsBefore?: undefined;
            metricsAfter?: undefined;
            refactorPlan?: undefined;
            changesDescription?: undefined;
            testsPassed?: undefined;
            testsFailed?: undefined;
            outputPath?: undefined;
            registerInDocuments?: undefined;
            storeInMemory?: undefined;
            maxHotspots?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            files: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            maxFileSizeBytes: {
                type: string;
                description: string;
            };
            rootPath?: undefined;
            includePatterns?: undefined;
            excludePatterns?: undefined;
            maxFiles?: undefined;
            metrics?: undefined;
            maxResults?: undefined;
            strategy?: undefined;
            thresholds?: undefined;
            hotspots?: undefined;
            goal?: undefined;
            maxStepsPerFile?: undefined;
            constraints?: undefined;
            sessionId?: undefined;
            summary?: undefined;
            filesChanged?: undefined;
            testsRun?: undefined;
            testsStatus?: undefined;
            metricsImprovement?: undefined;
            notes?: undefined;
            repoName?: undefined;
            scanResult?: undefined;
            metricsBefore?: undefined;
            metricsAfter?: undefined;
            refactorPlan?: undefined;
            changesDescription?: undefined;
            testsPassed?: undefined;
            testsFailed?: undefined;
            outputPath?: undefined;
            registerInDocuments?: undefined;
            storeInMemory?: undefined;
            maxHotspots?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            metrics: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        path: {
                            type: string;
                        };
                        lines: {
                            type: string;
                        };
                        maxNestingDepth: {
                            type: string;
                        };
                        branchScore: {
                            type: string;
                        };
                        todoCount: {
                            type: string;
                        };
                        fixmeCount: {
                            type: string;
                        };
                        complexityScore: {
                            type: string;
                        };
                    };
                    required: string[];
                };
                description: string;
            };
            maxResults: {
                type: string;
                description: string;
            };
            strategy: {
                type: string;
                enum: string[];
                description: string;
            };
            thresholds: {
                type: string;
                properties: {
                    minLines: {
                        type: string;
                    };
                    minComplexity: {
                        type: string;
                    };
                    minNesting: {
                        type: string;
                    };
                };
                description: string;
            };
            rootPath?: undefined;
            includePatterns?: undefined;
            excludePatterns?: undefined;
            maxFiles?: undefined;
            files?: undefined;
            maxFileSizeBytes?: undefined;
            hotspots?: undefined;
            goal?: undefined;
            maxStepsPerFile?: undefined;
            constraints?: undefined;
            sessionId?: undefined;
            summary?: undefined;
            filesChanged?: undefined;
            testsRun?: undefined;
            testsStatus?: undefined;
            metricsImprovement?: undefined;
            notes?: undefined;
            repoName?: undefined;
            scanResult?: undefined;
            metricsBefore?: undefined;
            metricsAfter?: undefined;
            refactorPlan?: undefined;
            changesDescription?: undefined;
            testsPassed?: undefined;
            testsFailed?: undefined;
            outputPath?: undefined;
            registerInDocuments?: undefined;
            storeInMemory?: undefined;
            maxHotspots?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            hotspots: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        path: {
                            type: string;
                        };
                        reason: {
                            type: string;
                        };
                        score: {
                            type: string;
                        };
                    };
                    required: string[];
                };
                description: string;
            };
            goal: {
                type: string;
                enum: string[];
                description: string;
            };
            maxStepsPerFile: {
                type: string;
                description: string;
            };
            constraints: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            rootPath?: undefined;
            includePatterns?: undefined;
            excludePatterns?: undefined;
            maxFiles?: undefined;
            files?: undefined;
            maxFileSizeBytes?: undefined;
            metrics?: undefined;
            maxResults?: undefined;
            strategy?: undefined;
            thresholds?: undefined;
            sessionId?: undefined;
            summary?: undefined;
            filesChanged?: undefined;
            testsRun?: undefined;
            testsStatus?: undefined;
            metricsImprovement?: undefined;
            notes?: undefined;
            repoName?: undefined;
            scanResult?: undefined;
            metricsBefore?: undefined;
            metricsAfter?: undefined;
            refactorPlan?: undefined;
            changesDescription?: undefined;
            testsPassed?: undefined;
            testsFailed?: undefined;
            outputPath?: undefined;
            registerInDocuments?: undefined;
            storeInMemory?: undefined;
            maxHotspots?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            sessionId: {
                type: string;
                description: string;
            };
            summary: {
                type: string;
                description: string;
            };
            filesChanged: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            testsRun: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            testsStatus: {
                type: string;
                enum: string[];
                description: string;
            };
            metricsImprovement: {
                type: string;
                properties: {
                    before: {
                        type: string;
                        properties: {
                            avgComplexity: {
                                type: string;
                            };
                            totalLines: {
                                type: string;
                            };
                        };
                    };
                    after: {
                        type: string;
                        properties: {
                            avgComplexity: {
                                type: string;
                            };
                            totalLines: {
                                type: string;
                            };
                        };
                    };
                };
                description: string;
            };
            notes: {
                type: string;
                description: string;
            };
            rootPath?: undefined;
            includePatterns?: undefined;
            excludePatterns?: undefined;
            maxFiles?: undefined;
            files?: undefined;
            maxFileSizeBytes?: undefined;
            metrics?: undefined;
            maxResults?: undefined;
            strategy?: undefined;
            thresholds?: undefined;
            hotspots?: undefined;
            goal?: undefined;
            maxStepsPerFile?: undefined;
            constraints?: undefined;
            repoName?: undefined;
            scanResult?: undefined;
            metricsBefore?: undefined;
            metricsAfter?: undefined;
            refactorPlan?: undefined;
            changesDescription?: undefined;
            testsPassed?: undefined;
            testsFailed?: undefined;
            outputPath?: undefined;
            registerInDocuments?: undefined;
            storeInMemory?: undefined;
            maxHotspots?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            sessionId: {
                type: string;
                description: string;
            };
            repoName: {
                type: string;
                description: string;
            };
            strategy: {
                type: string;
                enum: string[];
                description: string;
            };
            scanResult: {
                type: string;
                description: string;
            };
            metricsBefore: {
                type: string;
                description: string;
            };
            metricsAfter: {
                type: string;
                description: string;
            };
            hotspots: {
                type: string;
                description: string;
                items?: undefined;
            };
            refactorPlan: {
                type: string;
                description: string;
            };
            filesChanged: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            changesDescription: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            testsStatus: {
                type: string;
                enum: string[];
                description: string;
            };
            testsPassed: {
                type: string;
                description: string;
            };
            testsFailed: {
                type: string;
                description: string;
            };
            outputPath: {
                type: string;
                description: string;
            };
            registerInDocuments: {
                type: string;
                description: string;
            };
            storeInMemory: {
                type: string;
                description: string;
            };
            rootPath?: undefined;
            includePatterns?: undefined;
            excludePatterns?: undefined;
            maxFiles?: undefined;
            files?: undefined;
            maxFileSizeBytes?: undefined;
            metrics?: undefined;
            maxResults?: undefined;
            thresholds?: undefined;
            goal?: undefined;
            maxStepsPerFile?: undefined;
            constraints?: undefined;
            summary?: undefined;
            testsRun?: undefined;
            metricsImprovement?: undefined;
            notes?: undefined;
            maxHotspots?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            maxFiles: {
                type: string;
                description: string;
            };
            maxHotspots: {
                type: string;
                description: string;
            };
            strategy: {
                type: string;
                enum: string[];
                description: string;
            };
            rootPath?: undefined;
            includePatterns?: undefined;
            excludePatterns?: undefined;
            files?: undefined;
            maxFileSizeBytes?: undefined;
            metrics?: undefined;
            maxResults?: undefined;
            thresholds?: undefined;
            hotspots?: undefined;
            goal?: undefined;
            maxStepsPerFile?: undefined;
            constraints?: undefined;
            sessionId?: undefined;
            summary?: undefined;
            filesChanged?: undefined;
            testsRun?: undefined;
            testsStatus?: undefined;
            metricsImprovement?: undefined;
            notes?: undefined;
            repoName?: undefined;
            scanResult?: undefined;
            metricsBefore?: undefined;
            metricsAfter?: undefined;
            refactorPlan?: undefined;
            changesDescription?: undefined;
            testsPassed?: undefined;
            testsFailed?: undefined;
            outputPath?: undefined;
            registerInDocuments?: undefined;
            storeInMemory?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            rootPath?: undefined;
            includePatterns?: undefined;
            excludePatterns?: undefined;
            maxFiles?: undefined;
            files?: undefined;
            maxFileSizeBytes?: undefined;
            metrics?: undefined;
            maxResults?: undefined;
            strategy?: undefined;
            thresholds?: undefined;
            hotspots?: undefined;
            goal?: undefined;
            maxStepsPerFile?: undefined;
            constraints?: undefined;
            sessionId?: undefined;
            summary?: undefined;
            filesChanged?: undefined;
            testsRun?: undefined;
            testsStatus?: undefined;
            metricsImprovement?: undefined;
            notes?: undefined;
            repoName?: undefined;
            scanResult?: undefined;
            metricsBefore?: undefined;
            metricsAfter?: undefined;
            refactorPlan?: undefined;
            changesDescription?: undefined;
            testsPassed?: undefined;
            testsFailed?: undefined;
            outputPath?: undefined;
            registerInDocuments?: undefined;
            storeInMemory?: undefined;
            maxHotspots?: undefined;
        };
        required?: undefined;
    };
})[];
export declare function createCodeOptimizerToolHandlers(service: CodeOptimizerService): {
    code_scan_repository: (args: ScanRepositoryInput) => Promise<{
        formatted: string;
        rootPath: string;
        totalFiles: number;
        totalLinesApprox: number;
        files: import("./types.js").FileInfo[];
        topLargeFiles: Array<{
            path: string;
            linesApprox: number;
        }>;
        topLargeFolders: import("./types.js").FolderInfo[];
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    code_metrics: (args: MetricsInput) => Promise<{
        formatted: string;
        files: import("./types.js").FileMetrics[];
        aggregate: {
            totalFiles: number;
            totalLines: number;
            totalCodeLines: number;
            avgComplexityScore: number;
            totalTodos: number;
            totalFixmes: number;
        };
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    code_hotspots: (args: HotspotsInput) => {
        formatted: string;
        hotspots: import("./types.js").Hotspot[];
        summary: {
            totalAnalyzed: number;
            hotspotsFound: number;
            strategy: string;
            topReason: string;
        };
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    };
    code_refactor_plan: (args: RefactorPlanInput) => {
        formatted: string;
        plan: import("./types.js").FilePlan[];
        summary: {
            totalFiles: number;
            totalSteps: number;
            estimatedTotalEffort: string;
            highRiskSteps: number;
        };
        workflow: {
            phases: import("./types.js").RefactorPhase[];
            suggestedOrder: string[];
        };
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    };
    code_record_optimization: (args: RecordOptimizationInput) => Promise<import("./types.js").RecordOptimizationOutput | {
        success: boolean;
        error: string;
    }>;
    code_generate_report: (args: GenerateReportInput) => {
        success: boolean;
        reportPath: string;
        summary: {
            hotspotsAnalyzed: number;
            filesChanged: number;
            complexityReduction?: string;
            linesReduction?: string;
            testsStatus?: string;
        };
        sectionsGenerated: number;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        reportPath?: undefined;
        summary?: undefined;
        sectionsGenerated?: undefined;
        message?: undefined;
    };
    code_quick_analysis: (args: {
        maxFiles?: number;
        maxHotspots?: number;
        strategy?: "size" | "complexity" | "mixed";
    }) => Promise<{
        success: boolean;
        scan: {
            totalFiles: number;
            totalLinesApprox: number;
        };
        metrics: {
            filesAnalyzed: number;
            avgComplexity: number;
        };
        hotspots: {
            path: string;
            score: number;
            reasons: string[];
            suggestedGoal: import("./types.js").SuggestedGoal;
        }[];
        summary: {
            totalAnalyzed: number;
            hotspotsFound: number;
            strategy: string;
            topReason: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        scan?: undefined;
        metrics?: undefined;
        hotspots?: undefined;
        summary?: undefined;
    }>;
    code_optimizer_status: () => import("./types.js").CodeOptimizerStatus;
};
//# sourceMappingURL=code-optimizer.tools.d.ts.map