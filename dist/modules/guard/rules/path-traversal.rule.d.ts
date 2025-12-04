import { ValidationIssue } from '../../../core/types.js';
import { IGuardRule, RuleCategory } from '../guard.types.js';
/**
 * Detects potential Path Traversal vulnerabilities.
 * OWASP Top 10 - A01:2021 (Broken Access Control)
 * CWE-22: Improper Limitation of a Pathname to a Restricted Directory
 */
export declare class PathTraversalRule implements IGuardRule {
    name: string;
    enabled: boolean;
    description: string;
    category: RuleCategory;
    private dangerousPatterns;
    private safePatterns;
    validate(code: string, filename: string): ValidationIssue[];
    private getContext;
    private isSafePattern;
    private isComment;
    private getSuggestion;
}
//# sourceMappingURL=path-traversal.rule.d.ts.map