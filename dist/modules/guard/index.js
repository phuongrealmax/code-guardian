// src/modules/guard/index.ts
import { GuardService } from './guard.service.js';
import { getGuardTools, formatValidationResult, formatTestAnalysis, formatRulesList, } from './guard.tools.js';
// ═══════════════════════════════════════════════════════════════
//                      GUARD MODULE CLASS
// ═══════════════════════════════════════════════════════════════
export class GuardModule {
    config;
    eventBus;
    service;
    logger;
    constructor(config, eventBus, parentLogger) {
        this.config = config;
        this.eventBus = eventBus;
        this.logger = parentLogger.child('Guard');
        this.service = new GuardService(config, eventBus, this.logger);
    }
    /**
     * Initialize the module
     */
    async initialize() {
        await this.service.initialize();
    }
    /**
     * Shutdown the module
     */
    async shutdown() {
        await this.service.shutdown();
    }
    /**
     * Get MCP tool definitions
     */
    getTools() {
        if (!this.config.enabled) {
            return [];
        }
        return getGuardTools();
    }
    /**
     * Handle MCP tool call
     */
    async handleTool(toolName, args) {
        if (!this.config.enabled) {
            return { error: 'Guard module is disabled' };
        }
        switch (toolName) {
            case 'validate':
                return this.handleValidate(args);
            case 'check_test':
                return this.handleCheckTest(args);
            case 'rules':
                return this.handleListRules();
            case 'toggle_rule':
                return this.handleToggleRule(args);
            case 'status':
                return this.handleStatus();
            default:
                throw new Error(`Unknown guard tool: ${toolName}`);
        }
    }
    // ═══════════════════════════════════════════════════════════════
    //                      TOOL HANDLERS
    // ═══════════════════════════════════════════════════════════════
    async handleValidate(args) {
        const code = args.code;
        const filename = args.filename;
        const options = {
            strict: args.strict,
            rules: args.rules,
            includeSuggestions: true,
        };
        const result = await this.service.validate(code, filename, options);
        return {
            success: true,
            valid: result.valid,
            blocked: result.blocked,
            issueCount: result.issues.length,
            issues: result.issues,
            suggestions: result.suggestions,
            formatted: formatValidationResult(result),
        };
    }
    async handleCheckTest(args) {
        const code = args.code;
        const filename = args.filename;
        const result = await this.service.checkTest(code, filename);
        return {
            success: true,
            valid: result.valid,
            issueCount: result.issues.length,
            issues: result.issues,
            analysis: result.analysis,
            formatted: formatTestAnalysis(result.analysis),
        };
    }
    async handleListRules() {
        const rules = this.service.getRules();
        return {
            success: true,
            count: rules.length,
            rules,
            formatted: formatRulesList(rules),
        };
    }
    async handleToggleRule(args) {
        const ruleName = args.rule;
        const enabled = args.enabled;
        const success = this.service.setRuleEnabled(ruleName, enabled);
        if (!success) {
            return {
                success: false,
                message: `Rule "${ruleName}" not found`,
            };
        }
        return {
            success: true,
            rule: ruleName,
            enabled,
            message: `Rule "${ruleName}" is now ${enabled ? 'enabled' : 'disabled'}`,
        };
    }
    async handleStatus() {
        const status = this.service.getStatus();
        return {
            success: true,
            ...status,
        };
    }
    // ═══════════════════════════════════════════════════════════════
    //                      PUBLIC SERVICE METHODS
    // ═══════════════════════════════════════════════════════════════
    /**
     * Get module status
     */
    getStatus() {
        return this.service.getStatus();
    }
    /**
     * Validate code (direct access)
     */
    async validate(code, filename, options) {
        return this.service.validate(code, filename, options);
    }
    /**
     * Check test file (direct access)
     */
    async checkTest(code, filename) {
        return this.service.checkTest(code, filename);
    }
}
// ═══════════════════════════════════════════════════════════════
//                      EXPORTS
// ═══════════════════════════════════════════════════════════════
export { GuardService } from './guard.service.js';
export * from './guard.types.js';
export * from './guard.tools.js';
// Export rules
export { FakeTestRule } from './rules/fake-test.rule.js';
export { DisabledFeatureRule } from './rules/disabled-feature.rule.js';
export { EmptyCatchRule } from './rules/empty-catch.rule.js';
export { EmojiCodeRule } from './rules/emoji-code.rule.js';
//# sourceMappingURL=index.js.map