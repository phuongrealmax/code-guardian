import { ValidationResult, ValidationIssue, GuardModuleConfig } from '../../core/types.js';
import { EventBus } from '../../core/event-bus.js';
import { Logger } from '../../core/logger.js';
import { ValidateOptions, TestAnalysis, GuardModuleStatus, RuleStatus } from './guard.types.js';
export declare class GuardService {
    private config;
    private eventBus;
    private logger;
    private rules;
    private initialized;
    private validationsRun;
    private totalIssuesFound;
    private blockedCount;
    private ruleStats;
    constructor(config: GuardModuleConfig, eventBus: EventBus, logger: Logger);
    /**
     * Initialize the guard service
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the guard service
     */
    shutdown(): Promise<void>;
    /**
     * Validate code against all enabled rules
     */
    validate(code: string, filename: string, options?: ValidateOptions): Promise<ValidationResult>;
    /**
     * Check a test file for common issues
     */
    checkTest(code: string, filename: string): Promise<{
        valid: boolean;
        issues: ValidationIssue[];
        analysis: TestAnalysis;
    }>;
    /**
     * Get list of available rules
     */
    getRules(): RuleStatus[];
    /**
     * Enable/disable a specific rule
     */
    setRuleEnabled(ruleName: string, enabled: boolean): boolean;
    /**
     * Get module status
     */
    getStatus(): GuardModuleStatus;
    private generateSuggestions;
}
//# sourceMappingURL=guard.service.d.ts.map