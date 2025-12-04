/**
 * Analyze code for various patterns
 */
export interface CodeAnalysis {
    language: string;
    lines: number;
    functions: number;
    classes: number;
    imports: number;
    exports: number;
    comments: number;
    complexity: 'low' | 'medium' | 'high';
}
/**
 * Detect programming language from file extension or content
 */
export declare function detectLanguage(filename: string, content?: string): string;
/**
 * Analyze code structure
 */
export declare function analyzeCode(code: string, language: string): CodeAnalysis;
/**
 * Check for emoji in code
 */
export declare function containsEmoji(text: string): boolean;
/**
 * Check for problematic unicode in code
 */
export declare function containsProblematicUnicode(text: string): boolean;
/**
 * Find empty catch blocks
 */
export declare function findEmptyCatchBlocks(code: string): {
    line: number;
    snippet: string;
}[];
/**
 * Find commented out code blocks
 */
export declare function findCommentedCode(code: string): {
    startLine: number;
    endLine: number;
    content: string;
}[];
//# sourceMappingURL=code-analyzer.d.ts.map