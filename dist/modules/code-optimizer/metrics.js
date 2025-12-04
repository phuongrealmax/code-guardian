// src/modules/code-optimizer/metrics.ts
/**
 * Code Metrics Calculator
 *
 * Computes simple per-file code metrics to estimate complexity.
 * Uses heuristics rather than full AST parsing for speed.
 */
import { readFileSync, statSync, existsSync } from 'fs';
import { resolve } from 'path';
import { DEFAULT_CODE_OPTIMIZER_CONFIG, } from './types.js';
// ═══════════════════════════════════════════════════════════════
//                      METRICS CALCULATOR
// ═══════════════════════════════════════════════════════════════
export async function computeMetrics(input, rootPath = process.cwd()) {
    const maxFileSizeBytes = input.maxFileSizeBytes || DEFAULT_CODE_OPTIMIZER_CONFIG.maxFileSizeBytes;
    const fileMetrics = [];
    for (const filePath of input.files) {
        const absolutePath = resolve(rootPath, filePath);
        // Skip if file doesn't exist
        if (!existsSync(absolutePath)) {
            continue;
        }
        try {
            const stat = statSync(absolutePath);
            // Skip files that are too large
            if (stat.size > maxFileSizeBytes) {
                continue;
            }
            const content = readFileSync(absolutePath, 'utf-8');
            const metrics = analyzeFileContent(filePath, content);
            fileMetrics.push(metrics);
        }
        catch {
            // Skip files that can't be read
            continue;
        }
    }
    // Calculate aggregates
    const totalFiles = fileMetrics.length;
    const totalLines = fileMetrics.reduce((sum, f) => sum + f.lines, 0);
    const totalCodeLines = fileMetrics.reduce((sum, f) => sum + f.codeLines, 0);
    const totalTodos = fileMetrics.reduce((sum, f) => sum + f.todoCount, 0);
    const totalFixmes = fileMetrics.reduce((sum, f) => sum + f.fixmeCount, 0);
    const avgComplexityScore = totalFiles > 0
        ? fileMetrics.reduce((sum, f) => sum + f.complexityScore, 0) / totalFiles
        : 0;
    return {
        files: fileMetrics,
        aggregate: {
            totalFiles,
            totalLines,
            totalCodeLines,
            avgComplexityScore: Math.round(avgComplexityScore * 100) / 100,
            totalTodos,
            totalFixmes,
        },
    };
}
// ═══════════════════════════════════════════════════════════════
//                      FILE ANALYSIS
// ═══════════════════════════════════════════════════════════════
function analyzeFileContent(filePath, content) {
    const lines = content.split('\n');
    const totalLines = lines.length;
    // Count different types of lines
    let codeLines = 0;
    let commentLines = 0;
    let blankLines = 0;
    let todoCount = 0;
    let fixmeCount = 0;
    // Track nesting depth
    let currentNesting = 0;
    let maxNestingDepth = 0;
    // Branch keywords
    const branchKeywords = {
        if: 0,
        elseIf: 0,
        switch: 0,
        case: 0,
        for: 0,
        while: 0,
        catch: 0,
        ternary: 0,
    };
    let inMultiLineComment = false;
    for (const line of lines) {
        const trimmedLine = line.trim();
        // Handle blank lines
        if (trimmedLine === '') {
            blankLines++;
            continue;
        }
        // Handle multi-line comments
        if (inMultiLineComment) {
            commentLines++;
            if (trimmedLine.includes('*/')) {
                inMultiLineComment = false;
            }
            continue;
        }
        // Check for comment start
        if (trimmedLine.startsWith('/*')) {
            commentLines++;
            if (!trimmedLine.includes('*/')) {
                inMultiLineComment = true;
            }
            continue;
        }
        // Single line comments
        if (trimmedLine.startsWith('//') ||
            trimmedLine.startsWith('#') ||
            trimmedLine.startsWith('--')) {
            commentLines++;
            // Check for TODO/FIXME in comments
            if (/\bTODO\b/i.test(trimmedLine))
                todoCount++;
            if (/\bFIXME\b/i.test(trimmedLine))
                fixmeCount++;
            continue;
        }
        // It's a code line
        codeLines++;
        // Track nesting (simplified: count { and })
        const openBraces = (trimmedLine.match(/\{/g) || []).length;
        const closeBraces = (trimmedLine.match(/\}/g) || []).length;
        currentNesting += openBraces - closeBraces;
        maxNestingDepth = Math.max(maxNestingDepth, currentNesting);
        // Count branch keywords (simplified regex matching)
        countBranchKeywords(trimmedLine, branchKeywords);
        // Check for inline TODO/FIXME
        if (/\bTODO\b/i.test(trimmedLine))
            todoCount++;
        if (/\bFIXME\b/i.test(trimmedLine))
            fixmeCount++;
    }
    // Calculate branch score
    const branchScore = branchKeywords.if +
        branchKeywords.elseIf * 1.5 +
        branchKeywords.switch +
        branchKeywords.case * 0.5 +
        branchKeywords.for +
        branchKeywords.while +
        branchKeywords.catch +
        branchKeywords.ternary * 0.5;
    // Calculate complexity score (weighted formula)
    const complexityScore = calculateComplexityScore({
        lines: totalLines,
        codeLines,
        maxNestingDepth,
        branchScore,
        todoCount,
        fixmeCount,
    });
    return {
        path: filePath.replace(/\\/g, '/'),
        lines: totalLines,
        codeLines,
        commentLines,
        blankLines,
        todoCount,
        fixmeCount,
        maxNestingDepth,
        branchKeywordsCount: branchKeywords,
        branchScore: Math.round(branchScore * 10) / 10,
        complexityScore: Math.round(complexityScore * 10) / 10,
    };
}
// ═══════════════════════════════════════════════════════════════
//                      HELPERS
// ═══════════════════════════════════════════════════════════════
function countBranchKeywords(line, counts) {
    // Match word boundaries to avoid false positives
    const patterns = [
        { pattern: /\bif\s*\(/g, key: 'if' },
        { pattern: /\belse\s+if\s*\(/g, key: 'elseIf' },
        { pattern: /\belif\s*\(/g, key: 'elseIf' }, // Python
        { pattern: /\bswitch\s*\(/g, key: 'switch' },
        { pattern: /\bmatch\s*\(/g, key: 'switch' }, // Rust/Python
        { pattern: /\bcase\s+/g, key: 'case' },
        { pattern: /\bfor\s*\(/g, key: 'for' },
        { pattern: /\bfor\s+\w+\s+in\s+/g, key: 'for' }, // Python/Go
        { pattern: /\bforeach\s*\(/g, key: 'for' }, // PHP
        { pattern: /\bwhile\s*\(/g, key: 'while' },
        { pattern: /\bcatch\s*\(/g, key: 'catch' },
        { pattern: /\bexcept\s*:/g, key: 'catch' }, // Python
        { pattern: /\?.*:/g, key: 'ternary' }, // Ternary operator
    ];
    for (const { pattern, key } of patterns) {
        const matches = line.match(pattern);
        if (matches) {
            counts[key] += matches.length;
        }
    }
}
function calculateComplexityScore(params) {
    const { lines, codeLines, maxNestingDepth, branchScore, todoCount, fixmeCount } = params;
    // Weights for different factors
    const weights = {
        size: 0.2, // File size contribution
        nesting: 0.3, // Nesting depth contribution
        branching: 0.35, // Branch complexity contribution
        debt: 0.15, // Technical debt (TODOs/FIXMEs) contribution
    };
    // Normalize factors to 0-100 scale
    const sizeScore = Math.min(100, (codeLines / 500) * 100);
    const nestingScore = Math.min(100, (maxNestingDepth / 8) * 100);
    const branchingScore = Math.min(100, (branchScore / 50) * 100);
    const debtScore = Math.min(100, ((todoCount + fixmeCount * 2) / 10) * 100);
    // Weighted sum
    const score = sizeScore * weights.size +
        nestingScore * weights.nesting +
        branchingScore * weights.branching +
        debtScore * weights.debt;
    return score;
}
/**
 * Quick complexity check for a single file
 */
export function quickComplexityCheck(content) {
    const lines = content.split('\n');
    const reasons = [];
    // Check line count
    if (lines.length > 500) {
        reasons.push(`Large file (${lines.length} lines)`);
    }
    // Check nesting (quick scan)
    let maxNesting = 0;
    let currentNesting = 0;
    for (const line of lines) {
        currentNesting += (line.match(/\{/g) || []).length;
        currentNesting -= (line.match(/\}/g) || []).length;
        maxNesting = Math.max(maxNesting, currentNesting);
    }
    if (maxNesting > 5) {
        reasons.push(`Deep nesting (level ${maxNesting})`);
    }
    // Check for many branches
    const branchCount = (content.match(/\bif\s*\(/g) || []).length;
    if (branchCount > 20) {
        reasons.push(`Many conditionals (${branchCount} if statements)`);
    }
    // Check for TODOs
    const todoCount = (content.match(/\bTODO\b/gi) || []).length;
    if (todoCount > 5) {
        reasons.push(`Many TODOs (${todoCount})`);
    }
    return {
        isComplex: reasons.length > 0,
        reasons,
    };
}
//# sourceMappingURL=metrics.js.map