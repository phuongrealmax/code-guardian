import { ProcessModuleConfig } from '../../core/types.js';
import { EventBus } from '../../core/event-bus.js';
import { Logger } from '../../core/logger.js';
import { MCPTool } from './process.tools.js';
import { ProcessModuleStatus, SpawnParams, SpawnResult, KillResult, CleanupResult } from './process.types.js';
export declare class ProcessModule {
    private config;
    private eventBus;
    private service;
    private logger;
    constructor(config: ProcessModuleConfig, eventBus: EventBus, parentLogger: Logger);
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
    private handleCheckPort;
    private handleCheckAllPorts;
    private handleKillOnPort;
    private handleKill;
    private handleSpawn;
    private handleList;
    private handleCleanup;
    private handleStatus;
    /**
     * Get module status
     */
    getStatus(): Promise<ProcessModuleStatus>;
    /**
     * Check if a port is available (direct access)
     */
    checkPort(port: number): Promise<import("./process.types.js").PortStatus>;
    /**
     * Check running processes (direct access)
     */
    checkRunningProcesses(): Promise<import("./process.types.js").ProcessInfo[]>;
    /**
     * Get running processes (alias for checkRunningProcesses)
     */
    getRunningProcesses(): Promise<import("./process.types.js").ProcessInfo[]>;
    /**
     * Kill process on port (direct access)
     */
    killProcessOnPort(port: number, force?: boolean): Promise<KillResult>;
    /**
     * Spawn a process (direct access)
     */
    spawnProcess(params: SpawnParams): Promise<SpawnResult>;
    /**
     * Cleanup spawned processes (direct access)
     */
    cleanupSpawned(): Promise<CleanupResult>;
}
export { ProcessService } from './process.service.js';
export * from './process.types.js';
export * from './process.tools.js';
//# sourceMappingURL=index.d.ts.map