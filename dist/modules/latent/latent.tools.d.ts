/**
 * Latent Chain Mode MCP Tools
 *
 * Provides MCP tools for Latent Chain Mode:
 * - latent_context_create: Create new latent context
 * - latent_context_get: Get latent context
 * - latent_context_update: Merge context delta
 * - latent_phase_transition: Transition between phases
 * - latent_apply_patch: Apply patch to file
 * - latent_validate_response: Validate latent response format
 * - latent_complete_task: Mark task as complete
 * - latent_list_contexts: List all contexts
 * - latent_status: Get module status
 */
import { LatentService } from './latent.service.js';
/**
 * MCP Tool Definition
 */
interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
    };
}
/**
 * Create MCP tools for Latent Module
 */
export declare function createLatentTools(service: LatentService): MCPTool[];
/**
 * Handle tool calls for Latent Module
 */
export declare function handleLatentTool(service: LatentService, toolName: string, args: Record<string, unknown>): Promise<unknown>;
export {};
//# sourceMappingURL=latent.tools.d.ts.map