/**
 * Estimate token count for text
 * Based on GPT tokenization (roughly 4 chars per token)
 */
export declare function estimateTokens(text: string): number;
/**
 * Estimate tokens for code (more accurate for source files)
 */
export declare function estimateCodeTokens(code: string): number;
/**
 * Estimate task complexity based on description
 */
export declare function estimateTaskComplexity(description: string): {
    complexity: 'low' | 'medium' | 'high' | 'very_high';
    tokenEstimate: number;
    timeEstimate: string;
};
//# sourceMappingURL=token-estimator.d.ts.map