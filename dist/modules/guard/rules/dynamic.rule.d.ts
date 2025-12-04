/**
 * DynamicRule - Runtime-configurable rule from user config
 *
 * Allows users to define custom validation rules via config.rules.customRules
 * without writing code.
 */
import { ValidationIssue, CustomRule } from '../../../core/types.js';
import { IGuardRule, RuleCategory } from '../guard.types.js';
export declare class DynamicRule implements IGuardRule {
    name: string;
    enabled: boolean;
    description: string;
    category: RuleCategory;
    private pattern;
    private message;
    private severity;
    constructor(config: CustomRule);
    validate(code: string, filename: string): ValidationIssue[];
}
//# sourceMappingURL=dynamic.rule.d.ts.map