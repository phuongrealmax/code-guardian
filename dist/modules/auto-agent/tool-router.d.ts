/**
 * ToolRouter Service
 *
 * Automatically selects appropriate MCP tools based on context.
 * Uses rule-based matching and heuristics to suggest optimal tools.
 */
import { Logger } from '../../core/logger.js';
import { EventBus } from '../../core/event-bus.js';
import { AutoAgentModuleConfig, ToolRoutingRule, ToolRouteResult, SuggestedTool, RouteToolParams } from './auto-agent.types.js';
export declare class ToolRouter {
    private config;
    private logger;
    private eventBus;
    private rules;
    private stats;
    constructor(config: AutoAgentModuleConfig['router'], logger: Logger, eventBus: EventBus);
    /**
     * Route to appropriate tools based on action and context
     */
    route(params: RouteToolParams): ToolRouteResult;
    /**
     * Get best single tool for action
     */
    getBestTool(params: RouteToolParams): SuggestedTool | null;
    /**
     * Add custom routing rule
     */
    addRule(rule: ToolRoutingRule): void;
    /**
     * Get all rules
     */
    getRules(): ToolRoutingRule[];
    /**
     * Get statistics
     */
    getStats(): {
        totalRouted: number;
        rulesCount: number;
        topRules: {
            id: string;
            hits: number;
        }[];
    };
    /**
     * Check if rule matches the action/context
     */
    private matchRule;
    /**
     * Match keywords in action
     */
    private matchKeywords;
    /**
     * Calculate confidence score
     */
    private calculateConfidence;
}
//# sourceMappingURL=tool-router.d.ts.map