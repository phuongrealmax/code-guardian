// src/modules/guard/guard.service.ts
// Import rules - Quality
import { FakeTestRule } from './rules/fake-test.rule.js';
import { DisabledFeatureRule } from './rules/disabled-feature.rule.js';
import { EmptyCatchRule } from './rules/empty-catch.rule.js';
import { EmojiCodeRule } from './rules/emoji-code.rule.js';
// Import rules - Security (OWASP Top 10)
import { SqlInjectionRule } from './rules/sql-injection.rule.js';
import { HardcodedSecretsRule } from './rules/hardcoded-secrets.rule.js';
import { XssVulnerabilityRule } from './rules/xss-vulnerability.rule.js';
import { CommandInjectionRule } from './rules/command-injection.rule.js';
import { PathTraversalRule } from './rules/path-traversal.rule.js';
// Import rules - AI/LLM Security
import { PromptInjectionRule } from './rules/prompt-injection.rule.js';
// Import dynamic rule for custom configs
import { DynamicRule } from './rules/dynamic.rule.js';
// ═══════════════════════════════════════════════════════════════
//                      GUARD SERVICE CLASS
// ═══════════════════════════════════════════════════════════════
export class GuardService {
    config;
    eventBus;
    logger;
    rules = [];
    initialized = false;
    // Stats
    validationsRun = 0;
    totalIssuesFound = 0;
    blockedCount = 0;
    // Per-rule stats tracking
    ruleStats = new Map();
    constructor(config, eventBus, logger) {
        this.config = config;
        this.eventBus = eventBus;
        this.logger = logger;
    }
    /**
     * Initialize the guard service
     */
    async initialize() {
        if (!this.config.enabled) {
            this.logger.info('Guard module disabled');
            return;
        }
        if (this.initialized) {
            this.logger.warn('Guard service already initialized');
            return;
        }
        // Initialize built-in rules based on config
        if (this.config.rules.blockFakeTests) {
            this.rules.push(new FakeTestRule());
        }
        if (this.config.rules.blockDisabledFeatures) {
            this.rules.push(new DisabledFeatureRule());
        }
        if (this.config.rules.blockEmptyCatch) {
            this.rules.push(new EmptyCatchRule());
        }
        if (this.config.rules.blockEmojiInCode) {
            this.rules.push(new EmojiCodeRule());
        }
        // Security rules - enabled by default
        if (this.config.rules.blockSqlInjection !== false) {
            this.rules.push(new SqlInjectionRule());
        }
        if (this.config.rules.blockHardcodedSecrets !== false) {
            this.rules.push(new HardcodedSecretsRule());
        }
        if (this.config.rules.blockXss !== false) {
            this.rules.push(new XssVulnerabilityRule());
        }
        if (this.config.rules.blockCommandInjection !== false) {
            this.rules.push(new CommandInjectionRule());
        }
        if (this.config.rules.blockPathTraversal !== false) {
            this.rules.push(new PathTraversalRule());
        }
        if (this.config.rules.blockPromptInjection !== false) {
            this.rules.push(new PromptInjectionRule());
        }
        // Load custom rules from config
        if (this.config.rules.customRules && this.config.rules.customRules.length > 0) {
            for (const customRule of this.config.rules.customRules) {
                try {
                    const dynamicRule = new DynamicRule(customRule);
                    if (dynamicRule.enabled) {
                        this.rules.push(dynamicRule);
                        this.logger.debug(`Loaded custom rule: ${customRule.name}`);
                    }
                }
                catch (error) {
                    this.logger.warn(`Failed to load custom rule: ${customRule.name}`, error);
                }
            }
        }
        // Initialize per-rule stats
        for (const rule of this.rules) {
            this.ruleStats.set(rule.name, 0);
        }
        this.initialized = true;
        this.logger.info(`Guard module initialized with ${this.rules.length} rules (${this.config.rules.customRules?.length || 0} custom)`);
    }
    /**
     * Shutdown the guard service
     */
    async shutdown() {
        this.initialized = false;
        this.logger.info('Guard service shutdown');
    }
    // ═══════════════════════════════════════════════════════════════
    //                      PUBLIC METHODS
    // ═══════════════════════════════════════════════════════════════
    /**
     * Validate code against all enabled rules
     */
    async validate(code, filename, options = {}) {
        if (!this.config.enabled) {
            return { valid: true, issues: [], blocked: false, suggestions: [] };
        }
        this.validationsRun++;
        const issues = [];
        // Determine which rules to run
        let rulesToRun = this.rules.filter(r => r.enabled);
        if (options.rules && options.rules.length > 0) {
            rulesToRun = rulesToRun.filter(r => options.rules.includes(r.name));
        }
        if (options.skipRules && options.skipRules.length > 0) {
            rulesToRun = rulesToRun.filter(r => !options.skipRules.includes(r.name));
        }
        // Run each rule
        for (const rule of rulesToRun) {
            try {
                const ruleIssues = rule.validate(code, filename);
                issues.push(...ruleIssues);
                // Track per-rule stats
                if (ruleIssues.length > 0) {
                    const currentCount = this.ruleStats.get(rule.name) || 0;
                    this.ruleStats.set(rule.name, currentCount + ruleIssues.length);
                }
            }
            catch (error) {
                this.logger.error(`Rule ${rule.name} failed:`, error);
            }
        }
        // Update stats
        this.totalIssuesFound += issues.length;
        // Determine if should block
        const blockingIssues = issues.filter(i => i.severity === 'block');
        const blocked = Boolean((this.config.strictMode || options.strict) && blockingIssues.length > 0);
        if (blocked) {
            this.blockedCount++;
            this.eventBus.emit({
                type: 'guard:block',
                timestamp: new Date(),
                data: { filename, issueCount: blockingIssues.length },
                source: 'GuardService',
            });
        }
        else if (issues.length > 0) {
            this.eventBus.emit({
                type: 'guard:warning',
                timestamp: new Date(),
                data: { filename, issueCount: issues.length },
                source: 'GuardService',
            });
        }
        else {
            this.eventBus.emit({
                type: 'guard:pass',
                timestamp: new Date(),
                data: { filename },
                source: 'GuardService',
            });
        }
        // Generate suggestions
        const suggestions = this.generateSuggestions(issues, options.includeSuggestions);
        return {
            valid: !blocked,
            issues,
            blocked,
            suggestions,
        };
    }
    /**
     * Check a test file for common issues
     */
    async checkTest(code, filename) {
        const fakeTestRule = this.rules.find(r => r.name === 'fake-test');
        if (!fakeTestRule) {
            return {
                valid: true,
                issues: [],
                analysis: {
                    hasAssertions: true,
                    assertionCount: 0,
                    testCount: 0,
                    suspiciousTests: [],
                    skippedTests: [],
                },
            };
        }
        const issues = fakeTestRule.validate(code, filename);
        const analysis = fakeTestRule.analyzeTestFile(code);
        return {
            valid: issues.filter(i => i.severity === 'block').length === 0,
            issues,
            analysis,
        };
    }
    /**
     * Get list of available rules
     */
    getRules() {
        return this.rules.map(r => ({
            name: r.name,
            enabled: r.enabled,
            category: r.category,
            issuesFound: this.ruleStats.get(r.name) || 0,
        }));
    }
    /**
     * Enable/disable a specific rule
     */
    setRuleEnabled(ruleName, enabled) {
        const rule = this.rules.find(r => r.name === ruleName);
        if (!rule) {
            return false;
        }
        rule.enabled = enabled;
        this.logger.info(`Rule ${ruleName} ${enabled ? 'enabled' : 'disabled'}`);
        return true;
    }
    /**
     * Get module status
     */
    getStatus() {
        return {
            enabled: this.config.enabled,
            strictMode: this.config.strictMode,
            rules: this.getRules(),
            stats: {
                validationsRun: this.validationsRun,
                issuesFound: this.totalIssuesFound,
                blockedCount: this.blockedCount,
            },
        };
    }
    // ═══════════════════════════════════════════════════════════════
    //                      PRIVATE METHODS
    // ═══════════════════════════════════════════════════════════════
    generateSuggestions(issues, include = true) {
        if (!include)
            return [];
        const suggestions = [];
        for (const issue of issues) {
            if (issue.suggestion) {
                suggestions.push(issue.suggestion);
            }
        }
        // Deduplicate
        return [...new Set(suggestions)];
    }
}
//# sourceMappingURL=guard.service.js.map