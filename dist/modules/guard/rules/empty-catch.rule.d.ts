import { ValidationIssue } from '../../../core/types.js';
import { IGuardRule, RuleCategory } from '../guard.types.js';
/**
 * Detects empty catch blocks that swallow exceptions silently.
 * Empty catch blocks hide errors and make debugging difficult.
 */
export declare class EmptyCatchRule implements IGuardRule {
    name: string;
    enabled: boolean;
    description: string;
    category: RuleCategory;
    private validHandlingPatterns;
    private intentionalPatterns;
    validate(code: string, filename: string): ValidationIssue[];
    /**
     * Quick regex scan for obvious empty catch patterns
     */
    private quickScanEmptyCatch;
    private findCatchBlocks;
    private isCatchEmpty;
    private isIntentionallyEmpty;
    private findPromiseCatches;
}
//# sourceMappingURL=empty-catch.rule.d.ts.map