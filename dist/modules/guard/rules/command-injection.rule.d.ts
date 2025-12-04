import { ValidationIssue } from '../../../core/types.js';
import { IGuardRule, RuleCategory } from '../guard.types.js';
/**
 * Detects potential Command Injection (OS Command Injection) vulnerabilities.
 * OWASP Top 10 - A03:2021 (Injection)
 * CWE-78: Improper Neutralization of Special Elements used in an OS Command
 */
export declare class CommandInjectionRule implements IGuardRule {
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
//# sourceMappingURL=command-injection.rule.d.ts.map