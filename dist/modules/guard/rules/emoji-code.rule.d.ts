import { ValidationIssue } from '../../../core/types.js';
import { IGuardRule, RuleCategory } from '../guard.types.js';
/**
 * Detects emoji characters in source code.
 * Emoji in code can cause encoding issues, IDE problems,
 * and reduce code readability.
 */
export declare class EmojiCodeRule implements IGuardRule {
    name: string;
    enabled: boolean;
    description: string;
    category: RuleCategory;
    private emojiPattern;
    private allowedExtensions;
    private allowedContexts;
    validate(code: string, filename: string): ValidationIssue[];
    private isAllowedFileType;
    private findEmojis;
    private getLineContext;
    private findEmojiInIdentifiers;
}
//# sourceMappingURL=emoji-code.rule.d.ts.map