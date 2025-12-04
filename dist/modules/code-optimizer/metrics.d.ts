import { MetricsInput, MetricsOutput } from './types.js';
export declare function computeMetrics(input: MetricsInput, rootPath?: string): Promise<MetricsOutput>;
/**
 * Quick complexity check for a single file
 */
export declare function quickComplexityCheck(content: string): {
    isComplex: boolean;
    reasons: string[];
};
//# sourceMappingURL=metrics.d.ts.map