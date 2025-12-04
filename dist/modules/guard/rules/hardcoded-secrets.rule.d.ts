import { ValidationIssue } from '../../../core/types.js';
import { IGuardRule, RuleCategory } from '../guard.types.js';
/**
 * Detects hardcoded secrets, API keys, passwords, and credentials.
 * Critical security rule for preventing credential leaks.
 */
export declare class HardcodedSecretsRule implements IGuardRule {
    name: string;
    enabled: boolean;
    description: string;
    category: RuleCategory;
    private secretPatterns;
    private safePatterns;
    private skipFilePatterns;
    validate(code: string, filename: string): ValidationIssue[];
    private shouldSkipFile;
    private isSafeLine;
    private isDocumentation;
    private looksLikePlaceholder;
    private redactSecret;
    private suggestEnvVar;
}
//# sourceMappingURL=hardcoded-secrets.rule.d.ts.map