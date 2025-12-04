import { ProcessInfo, PortStatus } from '../../core/types.js';
import { ProcessModuleStatus, PortInfo, CleanupResult } from './process.types.js';
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, unknown>;
        required: string[];
    };
}
export declare function getProcessTools(): MCPTool[];
/**
 * Format port status for display
 */
export declare function formatPortStatus(status: PortStatus): string;
/**
 * Format all ports status
 */
export declare function formatAllPortsStatus(ports: PortInfo[]): string;
/**
 * Format process list for display
 */
export declare function formatProcessList(processes: ProcessInfo[]): string;
/**
 * Format cleanup result
 */
export declare function formatCleanupResult(result: CleanupResult): string;
/**
 * Format module status
 */
export declare function formatModuleStatus(status: ProcessModuleStatus): string;
//# sourceMappingURL=process.tools.d.ts.map