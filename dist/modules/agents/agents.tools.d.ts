import { Agent, AgentSelection, AgentsModuleStatus, CoordinationResult } from './agents.types.js';
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
    };
}
export declare function getAgentsTools(): MCPTool[];
/**
 * Format agent for display
 */
export declare function formatAgent(agent: Agent): string;
/**
 * Format agents list
 */
export declare function formatAgentsList(agents: Agent[]): string;
/**
 * Format agent selection result
 */
export declare function formatSelection(selection: AgentSelection): string;
/**
 * Format coordination result
 */
export declare function formatCoordination(result: CoordinationResult): string;
/**
 * Format module status
 */
export declare function formatStatus(status: AgentsModuleStatus): string;
//# sourceMappingURL=agents.tools.d.ts.map