// src/modules/agents/index.ts
import { AgentsService } from './agents.service.js';
import { getAgentsTools, formatAgent, formatAgentsList, formatSelection, formatCoordination, formatStatus, } from './agents.tools.js';
// ═══════════════════════════════════════════════════════════════
//                      AGENTS MODULE CLASS
// ═══════════════════════════════════════════════════════════════
export class AgentsModule {
    config;
    eventBus;
    projectRoot;
    service;
    logger;
    constructor(config, eventBus, parentLogger, projectRoot) {
        this.config = config;
        this.eventBus = eventBus;
        this.projectRoot = projectRoot;
        this.logger = parentLogger.child('Agents');
        this.service = new AgentsService(config, eventBus, this.logger, projectRoot);
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
        return getAgentsTools();
    }
    /**
     * Handle MCP tool call
     */
    async handleTool(toolName, args) {
        if (!this.config.enabled) {
            return { error: 'Agents module is disabled' };
        }
        switch (toolName) {
            case 'list':
                return this.handleList(args);
            case 'get':
                return this.handleGet(args);
            case 'select':
                return this.handleSelect(args);
            case 'register':
                return this.handleRegister(args);
            case 'coordinate':
                return this.handleCoordinate(args);
            case 'reload':
                return this.handleReload();
            case 'status':
                return this.handleStatus();
            default:
                throw new Error(`Unknown agents tool: ${toolName}`);
        }
    }
    // ═══════════════════════════════════════════════════════════════
    //                      TOOL HANDLERS
    // ═══════════════════════════════════════════════════════════════
    async handleList(args) {
        const enabledOnly = args.enabledOnly !== false;
        let agents = this.service.getAll();
        if (enabledOnly) {
            agents = agents.filter(a => a.enabled);
        }
        return {
            success: true,
            count: agents.length,
            agents: agents.map(a => ({
                id: a.id,
                name: a.name,
                role: a.role,
                enabled: a.enabled,
                specializations: a.specializations,
                responsibilityCount: a.responsibilities.length,
            })),
            formatted: formatAgentsList(agents),
        };
    }
    async handleGet(args) {
        const agentId = args.agentId;
        const agent = this.service.get(agentId);
        if (!agent) {
            return {
                success: false,
                error: `Agent "${agentId}" not found`,
            };
        }
        return {
            success: true,
            agent: {
                id: agent.id,
                name: agent.name,
                role: agent.role,
                enabled: agent.enabled,
                specializations: agent.specializations,
                responsibilities: agent.responsibilities,
                principles: agent.principles,
                delegationRules: agent.delegationRules.map(r => ({
                    pattern: r.pattern,
                    matchType: r.matchType,
                    priority: r.priority,
                })),
                createdAt: agent.createdAt.toISOString(),
                updatedAt: agent.updatedAt.toISOString(),
            },
            formatted: formatAgent(agent),
        };
    }
    async handleSelect(args) {
        const params = {
            task: args.task,
            files: args.files,
            keywords: args.keywords,
            domain: args.domain,
        };
        const selection = this.service.selectAgent(params);
        if (!selection) {
            return {
                success: false,
                error: 'No suitable agent found for this task',
                suggestion: 'Consider registering a custom agent or providing more context',
            };
        }
        return {
            success: true,
            selection: {
                agentId: selection.agent.id,
                agentName: selection.agent.name,
                role: selection.agent.role,
                confidence: selection.confidence,
                reason: selection.reason,
                matchedRules: selection.matchedRules.map(r => r.pattern),
            },
            formatted: formatSelection(selection),
        };
    }
    async handleRegister(args) {
        const params = {
            id: args.id,
            name: args.name,
            role: args.role,
            specializations: args.specializations,
            responsibilities: args.responsibilities,
            principles: args.principles,
        };
        // Check if agent already exists
        if (this.service.get(params.id)) {
            return {
                success: false,
                error: `Agent "${params.id}" already exists`,
            };
        }
        const agent = this.service.register(params);
        return {
            success: true,
            agent: {
                id: agent.id,
                name: agent.name,
                role: agent.role,
            },
            message: `Agent "${agent.name}" registered successfully`,
            formatted: formatAgent(agent),
        };
    }
    async handleCoordinate(args) {
        const params = {
            task: args.task,
            agentIds: args.agentIds,
            mode: args.mode,
        };
        try {
            const result = this.service.coordinate(params);
            return {
                success: true,
                coordination: {
                    taskId: result.taskId,
                    status: result.status,
                    agents: result.agents.map(a => a.id),
                    plan: result.plan,
                },
                formatted: formatCoordination(result),
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Coordination failed',
            };
        }
    }
    async handleReload() {
        await this.service.reload();
        const status = this.service.getStatus();
        return {
            success: true,
            message: 'Agents reloaded successfully',
            agentCount: status.totalAgents,
            activeAgents: status.activeAgents,
        };
    }
    async handleStatus() {
        const status = this.service.getStatus();
        return {
            success: true,
            status,
            formatted: formatStatus(status),
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
     * Select agent for a task
     */
    selectAgent(params) {
        return this.service.selectAgent(params);
    }
    /**
     * Get agent by ID
     */
    getAgent(id) {
        return this.service.get(id);
    }
    /**
     * Get all agents
     */
    getAllAgents() {
        return this.service.getAll();
    }
    /**
     * Register a new agent
     */
    registerAgent(params) {
        return this.service.register(params);
    }
    /**
     * Coordinate multiple agents
     */
    coordinateAgents(params) {
        return this.service.coordinate(params);
    }
    /**
     * Reload agents from files
     */
    async reloadAgents() {
        return this.service.reload();
    }
}
// ═══════════════════════════════════════════════════════════════
//                      EXPORTS
// ═══════════════════════════════════════════════════════════════
export { AgentsService } from './agents.service.js';
export * from './agents.types.js';
export * from './agents.tools.js';
//# sourceMappingURL=index.js.map