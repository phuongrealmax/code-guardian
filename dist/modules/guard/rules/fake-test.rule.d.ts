import { ValidationIssue } from '../../../core/types.js';
import { IGuardRule, RuleCategory, TestAnalysis } from '../guard.types.js';
/**
 * Detects fake tests - tests that don't have any assertions.
 * A test without assertions doesn't actually verify anything.
 */
export declare class FakeTestRule implements IGuardRule {
    name: string;
    enabled: boolean;
    description: string;
    category: RuleCategory;
    private assertionPatterns;
    private testPatterns;
    private skipPatterns;
    validate(code: string, filename: string): ValidationIssue[];
    /**
     * Analyze a test file for detailed statistics
     */
    analyzeTestFile(code: string): TestAnalysis;
    private isTestFile;
    private looksLikeTestFile;
    private findTestBlocks;
    private hasAssertion;
    private countAssertions;
    private getSnippet;
}
//# sourceMappingURL=fake-test.rule.d.ts.map