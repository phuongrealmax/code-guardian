import { GuardModuleConfig } from '../../core/types.js';
import { EventBus } from '../../core/event-bus.js';
import { Logger } from '../../core/logger.js';
import { MCPTool } from './guard.tools.js';
import { ValidateOptions, GuardModuleStatus } from './guard.types.js';
export declare class GuardModule {
    private config;
    private eventBus;
    private service;
    private logger;
    constructor(config: GuardModuleConfig, eventBus: EventBus, parentLogger: Logger);
    /**
     * Initialize the module
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the module
     */
    shutdown(): Promise<void>;
    /**
     * Get MCP tool definitions
     */
    getTools(): MCPTool[];
    /**
     * Handle MCP tool call
     */
    handleTool(toolName: string, args: Record<string, unknown>): Promise<unknown>;
    private handleValidate;
    private handleCheckTest;
    private handleListRules;
    private handleToggleRule;
    private handleStatus;
    /**
     * Get module status
     */
    getStatus(): GuardModuleStatus;
    /**
     * Validate code (direct access)
     */
    validate(code: string, filename: string, options?: ValidateOptions): Promise<import("./guard.types.js").ValidationResult>;
    /**
     * Check test file (direct access)
     */
    checkTest(code: string, filename: string): Promise<{
        valid: boolean;
        issues: import("./guard.types.js").ValidationIssue[];
        analysis: import("./guard.types.js").TestAnalysis;
    }>;
}
export { GuardService } from './guard.service.js';
export * from './guard.types.js';
export * from './guard.tools.js';
export { FakeTestRule } from './rules/fake-test.rule.js';
export { DisabledFeatureRule } from './rules/disabled-feature.rule.js';
export { EmptyCatchRule } from './rules/empty-catch.rule.js';
export { EmojiCodeRule } from './rules/emoji-code.rule.js';
//# sourceMappingURL=index.d.ts.map