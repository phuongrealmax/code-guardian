/**
 * Code Optimizer Service
 *
 * Main service orchestrating repository scanning, metrics calculation,
 * hotspot detection, and refactor planning.
 */
import { EventBus } from '../../core/event-bus.js';
import { Logger } from '../../core/logger.js';
import { CodeOptimizerConfig, CodeOptimizerStatus, ScanRepositoryInput, ScanRepositoryOutput, MetricsInput, MetricsOutput, HotspotsInput, HotspotsOutput, RefactorPlanInput, RefactorPlanOutput, RecordOptimizationInput, RecordOptimizationOutput, GenerateReportInput, GenerateReportOutput } from './types.js';
export declare class CodeOptimizerService {
    private config;
    private logger;
    private eventBus;
    private projectRoot;
    private lastScan?;
    private cachedMetrics;
    private activeOptimizations;
    constructor(config: Partial<CodeOptimizerConfig>, eventBus: EventBus, logger: Logger, projectRoot?: string);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    scanRepository(input: ScanRepositoryInput): Promise<ScanRepositoryOutput>;
    computeMetrics(input: MetricsInput): Promise<MetricsOutput>;
    detectHotspots(input: HotspotsInput): HotspotsOutput;
    generateRefactorPlan(input: RefactorPlanInput): RefactorPlanOutput;
    recordOptimization(input: RecordOptimizationInput): Promise<RecordOptimizationOutput>;
    generateReport(input: GenerateReportInput): GenerateReportOutput;
    /**
     * Quick analysis: scan -> metrics -> hotspots in one call
     */
    quickAnalysis(options?: {
        maxFiles?: number;
        maxHotspots?: number;
        strategy?: 'size' | 'complexity' | 'mixed';
    }): Promise<{
        scan: ScanRepositoryOutput;
        metrics: MetricsOutput;
        hotspots: HotspotsOutput;
    }>;
    getStatus(): CodeOptimizerStatus;
}
//# sourceMappingURL=code-optimizer.service.d.ts.map