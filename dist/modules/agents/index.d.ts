/**
 * Agents Module
 *
 * Multi-agent architecture for specialized task delegation.
 * Inspired by Claude Enterprise Toolkit pattern.
 */
import { EventBus } from '../../core/event-bus.js';
import { Logger } from '../../core/logger.js';
import { AgentsModuleConfig, RegisterAgentParams, SelectAgentParams, CoordinateAgentsParams } from './agents.types.js';
import { MCPTool } from './agents.tools.js';
export declare class AgentsModule {
    private config;
    private eventBus;
    private projectRoot;
    private service;
    private logger;
    constructor(config: AgentsModuleConfig, eventBus: EventBus, parentLogger: Logger, projectRoot: string);
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
    private handleList;
    private handleGet;
    private handleSelect;
    private handleRegister;
    private handleCoordinate;
    private handleReload;
    private handleStatus;
    /**
     * Get module status
     */
    getStatus(): import("./agents.types.js").AgentsModuleStatus;
    /**
     * Select agent for a task
     */
    selectAgent(params: SelectAgentParams): import("./agents.types.js").AgentSelection | null;
    /**
     * Get agent by ID
     */
    getAgent(id: string): import("./agents.types.js").Agent | undefined;
    /**
     * Get all agents
     */
    getAllAgents(): import("./agents.types.js").Agent[];
    /**
     * Register a new agent
     */
    registerAgent(params: RegisterAgentParams): import("./agents.types.js").Agent;
    /**
     * Coordinate multiple agents
     */
    coordinateAgents(params: CoordinateAgentsParams): import("./agents.types.js").CoordinationResult;
    /**
     * Reload agents from files
     */
    reloadAgents(): Promise<void>;
}
export { AgentsService } from './agents.service.js';
export * from './agents.types.js';
export * from './agents.tools.js';
//# sourceMappingURL=index.d.ts.map