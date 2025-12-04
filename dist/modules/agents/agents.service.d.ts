import { EventBus } from '../../core/event-bus.js';
import { Logger } from '../../core/logger.js';
import { Agent, AgentsModuleConfig, AgentsModuleStatus, AgentSelection, RegisterAgentParams, SelectAgentParams, CoordinateAgentsParams, CoordinationResult, ParsedAgentsFile, AgentDefinitionFile } from './agents.types.js';
export declare class AgentsService {
    private config;
    private eventBus;
    private logger;
    private projectRoot;
    private agents;
    private delegationStats;
    private lastReload?;
    constructor(config: AgentsModuleConfig, eventBus: EventBus, logger: Logger, projectRoot: string);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    /**
     * Register a new agent
     */
    register(params: RegisterAgentParams): Agent;
    /**
     * Get agent by ID
     */
    get(id: string): Agent | undefined;
    /**
     * Get all agents
     */
    getAll(): Agent[];
    /**
     * Update agent
     */
    update(id: string, updates: Partial<RegisterAgentParams>): Agent | undefined;
    /**
     * Remove agent
     */
    remove(id: string): boolean;
    /**
     * Enable/disable agent
     */
    setEnabled(id: string, enabled: boolean): boolean;
    /**
     * Select the best agent for a task
     */
    selectAgent(params: SelectAgentParams): AgentSelection | null;
    /**
     * Calculate match score for an agent
     */
    private calculateAgentScore;
    /**
     * Match a delegation rule against params
     */
    private matchRule;
    /**
     * Match agent by file extension/path
     */
    private matchAgentByFile;
    /**
     * Generate human-readable selection reason
     */
    private generateSelectionReason;
    /**
     * Coordinate multiple agents for a complex task
     */
    coordinate(params: CoordinateAgentsParams): CoordinationResult;
    /**
     * Load and parse AGENTS.md file
     */
    loadAgentsFile(): Promise<ParsedAgentsFile | null>;
    /**
     * Parse AGENTS.md markdown content
     */
    private parseAgentsMarkdown;
    /**
     * Load agent definition files from .claude/agents/
     */
    loadAgentDefinitions(): Promise<AgentDefinitionFile[]>;
    /**
     * Parse agent definition file
     */
    private parseAgentDefinition;
    /**
     * Register built-in agents (Enterprise Toolkit compatible)
     */
    private registerBuiltInAgents;
    private nameToId;
    private idToName;
    private extractSpecializations;
    private parseRulesToDelegation;
    getStatus(): AgentsModuleStatus;
    /**
     * Reload agents from files
     */
    reload(): Promise<void>;
}
//# sourceMappingURL=agents.service.d.ts.map