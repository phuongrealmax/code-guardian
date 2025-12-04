/**
 * MCP Tool definitions for Guard Module
 */
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, unknown>;
        required: string[];
    };
}
export declare function getGuardTools(): MCPTool[];
/**
 * Format validation result for display
 */
export declare function formatValidationResult(result: {
    valid: boolean;
    blocked: boolean;
    issues: Array<{
        rule: string;
        severity: string;
        message: string;
        location?: {
            file: string;
            line: number;
            snippet?: string;
        };
        suggestion?: string;
    }>;
    suggestions: string[];
}): string;
/**
 * Format test analysis result
 */
export declare function formatTestAnalysis(analysis: {
    hasAssertions: boolean;
    assertionCount: number;
    testCount: number;
    suspiciousTests: string[];
    skippedTests: string[];
}): string;
/**
 * Format rules list
 */
export declare function formatRulesList(rules: Array<{
    name: string;
    enabled: boolean;
    category: string;
}>): string;
//# sourceMappingURL=guard.tools.d.ts.map