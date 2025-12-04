import { ValidationIssue } from '../../../core/types.js';
import { IGuardRule, RuleCategory } from '../guard.types.js';
/**
 * Detects potential SQL injection vulnerabilities.
 * Identifies string concatenation in SQL queries instead of parameterized queries.
 */
export declare class SqlInjectionRule implements IGuardRule {
    name: string;
    enabled: boolean;
    description: string;
    category: RuleCategory;
    private sqlKeywords;
    private dangerousPatterns;
    private safePatterns;
    validate(code: string, filename: string): ValidationIssue[];
    private getContext;
    private isSafePattern;
    private hasRawSqlWithVariable;
}
//# sourceMappingURL=sql-injection.rule.d.ts.map