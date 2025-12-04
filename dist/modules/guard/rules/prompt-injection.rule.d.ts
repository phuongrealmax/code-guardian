import { ValidationIssue } from '../../../core/types.js';
import { IGuardRule, RuleCategory } from '../guard.types.js';
/**
 * Detects potential Prompt Injection vulnerabilities in AI/LLM applications.
 * This rule checks for patterns that could allow users to manipulate AI prompts.
 *
 * Categories:
 * 1. Direct injection - User input directly in prompts
 * 2. Indirect injection - Data from external sources in prompts
 * 3. Jailbreak attempts - Patterns that try to bypass AI restrictions
 */
export declare class PromptInjectionRule implements IGuardRule {
    name: string;
    enabled: boolean;
    description: string;
    category: RuleCategory;
    private dangerousPatterns;
    private jailbreakPatterns;
    private safePatterns;
    validate(code: string, filename: string): ValidationIssue[];
    /**
     * Validate user input for prompt injection patterns
     * Can be called directly for runtime validation
     */
    validateUserInput(input: string): {
        safe: boolean;
        issues: string[];
    };
    private isAiRelatedFile;
    private getContext;
    private isSafePattern;
    private isComment;
    private containsStringLiteral;
}
//# sourceMappingURL=prompt-injection.rule.d.ts.map