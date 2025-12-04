import { ValidationIssue } from '../../../core/types.js';
import { IGuardRule, RuleCategory } from '../guard.types.js';
/**
 * Detects code that has been disabled or commented out,
 * especially security-critical features.
 */
export declare class DisabledFeatureRule implements IGuardRule {
    name: string;
    enabled: boolean;
    description: string;
    category: RuleCategory;
    private disabledPatterns;
    private criticalPatterns;
    validate(code: string, filename: string): ValidationIssue[];
    /**
     * Find commented-out code that contains critical validation logic
     */
    private findCommentedCriticalCode;
    private isCriticalCode;
    private getCriticalCategory;
    private findEmptyFunctions;
    private findLargeCommentedBlocks;
    private looksLikeCode;
}
//# sourceMappingURL=disabled-feature.rule.d.ts.map