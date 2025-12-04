// src/modules/auto-agent/tool-router.ts
/**
 * ToolRouter Service
 *
 * Automatically selects appropriate MCP tools based on context.
 * Uses rule-based matching and heuristics to suggest optimal tools.
 */
// Default routing rules
const DEFAULT_ROUTING_RULES = [
    // Code modification
    {
        id: 'rule-edit-code',
        name: 'Edit Code',
        pattern: 'edit|modify|change|update|fix|patch',
        matchType: 'keyword',
        tools: ['latent_apply_patch', 'guard_validate'],
        priority: 10,
    },
    {
        id: 'rule-create-file',
        name: 'Create File',
        pattern: 'create|new|add file|write',
        matchType: 'keyword',
        tools: ['write_file', 'guard_validate'],
        priority: 10,
    },
    // Testing
    {
        id: 'rule-test',
        name: 'Testing',
        pattern: 'test|spec|verify|check',
        matchType: 'keyword',
        tools: ['testing_run', 'testing_run_affected'],
        priority: 8,
    },
    // Documentation
    {
        id: 'rule-docs',
        name: 'Documentation',
        pattern: 'document|readme|doc|explain',
        matchType: 'keyword',
        tools: ['documents_search', 'documents_create'],
        priority: 7,
    },
    // Memory operations
    {
        id: 'rule-remember',
        name: 'Remember',
        pattern: 'remember|store|save|learn',
        matchType: 'keyword',
        tools: ['memory_store'],
        priority: 6,
    },
    {
        id: 'rule-recall',
        name: 'Recall',
        pattern: 'recall|remember|previous|history',
        matchType: 'keyword',
        tools: ['memory_recall'],
        priority: 6,
    },
    // Validation
    {
        id: 'rule-validate',
        name: 'Validate',
        pattern: 'validate|check|verify|guard|security',
        matchType: 'keyword',
        tools: ['guard_validate', 'guard_check_test'],
        priority: 9,
    },
    // Workflow
    {
        id: 'rule-task',
        name: 'Task Management',
        pattern: 'task|todo|workflow|progress',
        matchType: 'keyword',
        tools: ['workflow_task_create', 'workflow_task_update', 'workflow_current'],
        priority: 5,
    },
    // Latent Chain
    {
        id: 'rule-latent',
        name: 'Latent Chain',
        pattern: 'latent|context|phase|chain',
        matchType: 'keyword',
        tools: ['latent_context_create', 'latent_context_update', 'latent_phase_transition'],
        priority: 8,
    },
    // Analysis
    {
        id: 'rule-analyze',
        name: 'Analysis',
        pattern: 'analyze|review|understand|examine',
        matchType: 'keyword',
        tools: ['thinking_suggest_model', 'documents_search', 'memory_recall'],
        priority: 7,
    },
    // Process management
    {
        id: 'rule-process',
        name: 'Process',
        pattern: 'run|execute|start|stop|kill|port',
        matchType: 'keyword',
        tools: ['process_spawn', 'process_check_port', 'process_kill'],
        priority: 6,
    },
    // File patterns
    {
        id: 'rule-typescript',
        name: 'TypeScript Files',
        pattern: '\\.tsx?$',
        matchType: 'file_pattern',
        tools: ['guard_validate', 'testing_run'],
        priority: 5,
    },
    {
        id: 'rule-test-files',
        name: 'Test Files',
        pattern: '\\.(test|spec)\\.(ts|js)x?$',
        matchType: 'file_pattern',
        tools: ['guard_check_test', 'testing_run'],
        priority: 8,
    },
];
// Phase-specific tools
const PHASE_TOOLS = {
    'analysis': ['memory_recall', 'documents_search', 'thinking_suggest_model'],
    'plan': ['thinking_get_workflow', 'workflow_task_create'],
    'impl': ['latent_apply_patch', 'guard_validate', 'testing_run_affected'],
    'review': ['guard_validate', 'testing_run', 'memory_store'],
};
export class ToolRouter {
    config;
    logger;
    eventBus;
    rules;
    // Statistics
    stats = {
        totalRouted: 0,
        ruleHits: new Map(),
    };
    constructor(config, logger, eventBus) {
        this.config = config;
        this.logger = logger;
        this.eventBus = eventBus;
        // Merge default rules with config rules
        this.rules = [
            ...DEFAULT_ROUTING_RULES,
            ...(config.routingRules || []),
        ].sort((a, b) => b.priority - a.priority);
    }
    // ═══════════════════════════════════════════════════════════════
    //                      MAIN METHODS
    // ═══════════════════════════════════════════════════════════════
    /**
     * Route to appropriate tools based on action and context
     */
    route(params) {
        const suggestedTools = [];
        const matchedRules = [];
        const action = params.action.toLowerCase();
        // 1. Match against rules
        for (const rule of this.rules) {
            if (this.matchRule(rule, action, params.context)) {
                matchedRules.push(rule.id);
                // Track hit
                const hits = this.stats.ruleHits.get(rule.id) || 0;
                this.stats.ruleHits.set(rule.id, hits + 1);
                // Add tools with priority
                for (const tool of rule.tools) {
                    if (!suggestedTools.find(t => t.name === tool)) {
                        suggestedTools.push({
                            name: tool,
                            reason: rule.name,
                            priority: rule.priority,
                        });
                    }
                }
            }
        }
        // 2. Add phase-specific tools
        if (params.context?.phase) {
            const phaseTools = PHASE_TOOLS[params.context.phase] || [];
            for (const tool of phaseTools) {
                if (!suggestedTools.find(t => t.name === tool)) {
                    suggestedTools.push({
                        name: tool,
                        reason: `Phase: ${params.context.phase}`,
                        priority: 3,
                    });
                }
            }
        }
        // 3. Sort by priority
        suggestedTools.sort((a, b) => b.priority - a.priority);
        // 4. Calculate confidence
        const confidence = this.calculateConfidence(matchedRules.length, suggestedTools.length);
        // Update stats
        this.stats.totalRouted++;
        // Emit event
        this.eventBus.emit({
            type: 'auto-agent:tool:routed',
            timestamp: new Date(),
            data: {
                action,
                toolCount: suggestedTools.length,
                confidence,
            },
        });
        this.logger.debug(`Routed "${action}" to ${suggestedTools.length} tools (confidence: ${confidence})`);
        return {
            success: suggestedTools.length > 0,
            suggestedTools,
            matchedRules,
            confidence,
        };
    }
    /**
     * Get best single tool for action
     */
    getBestTool(params) {
        const result = this.route(params);
        return result.suggestedTools[0] || null;
    }
    /**
     * Add custom routing rule
     */
    addRule(rule) {
        this.rules.push(rule);
        this.rules.sort((a, b) => b.priority - a.priority);
        this.logger.debug(`Added routing rule: ${rule.name}`);
    }
    /**
     * Get all rules
     */
    getRules() {
        return [...this.rules];
    }
    /**
     * Get statistics
     */
    getStats() {
        return {
            totalRouted: this.stats.totalRouted,
            rulesCount: this.rules.length,
            topRules: Array.from(this.stats.ruleHits.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([id, hits]) => ({ id, hits })),
        };
    }
    // ═══════════════════════════════════════════════════════════════
    //                      PRIVATE METHODS
    // ═══════════════════════════════════════════════════════════════
    /**
     * Check if rule matches the action/context
     */
    matchRule(rule, action, context) {
        switch (rule.matchType) {
            case 'keyword':
                return this.matchKeywords(rule.pattern, action);
            case 'regex':
                return new RegExp(rule.pattern, 'i').test(action);
            case 'file_pattern':
                if (!context?.files?.length)
                    return false;
                const regex = new RegExp(rule.pattern);
                return context.files.some(f => regex.test(f));
            case 'domain':
                return context?.domain === rule.pattern;
            default:
                return false;
        }
    }
    /**
     * Match keywords in action
     */
    matchKeywords(pattern, action) {
        const keywords = pattern.split('|');
        return keywords.some(kw => action.includes(kw));
    }
    /**
     * Calculate confidence score
     */
    calculateConfidence(matchedRules, suggestedTools) {
        if (matchedRules === 0)
            return 0;
        if (matchedRules >= 3 && suggestedTools >= 2)
            return 0.9;
        if (matchedRules >= 2)
            return 0.7;
        if (matchedRules >= 1)
            return 0.5;
        return 0.3;
    }
}
//# sourceMappingURL=tool-router.js.map