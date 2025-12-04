import { ProcessInfo, PortStatus, ProcessModuleConfig } from '../../core/types.js';
import { EventBus } from '../../core/event-bus.js';
import { Logger } from '../../core/logger.js';
import { SpawnParams, SpawnResult, KillResult, ProcessModuleStatus, CleanupResult, PortInfo } from './process.types.js';
export declare class ProcessService {
    private config;
    private eventBus;
    private logger;
    private spawnedProcesses;
    private isWindows;
    constructor(config: ProcessModuleConfig, eventBus: EventBus, logger: Logger);
    /**
     * Initialize the process service
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the process service
     */
    shutdown(): Promise<void>;
    /**
     * Check if a port is available
     */
    checkPort(port: number): Promise<PortStatus>;
    /**
     * Check all configured ports
     */
    checkAllPorts(): Promise<PortInfo[]>;
    /**
     * Find process using a specific port
     */
    private findProcessOnPort;
    /**
     * Kill process on a specific port
     */
    killProcessOnPort(port: number, force?: boolean): Promise<KillResult>;
    /**
     * Kill a process by PID
     */
    killProcess(pid: number, force?: boolean): Promise<KillResult>;
    /**
     * Spawn a new process
     */
    spawnProcess(params: SpawnParams): Promise<SpawnResult>;
    /**
     * Cleanup all spawned processes
     */
    cleanupSpawned(): Promise<CleanupResult>;
    /**
     * Get all running processes (tracked + configured ports)
     */
    getRunningProcesses(): Promise<ProcessInfo[]>;
    /**
     * Get module status
     */
    getStatus(): Promise<ProcessModuleStatus>;
    /**
     * Get a simple status (sync version for quick access)
     */
    getSimpleStatus(): {
        tracked: number;
        ports: Record<string, number>;
    };
    /**
     * Get information about a process by PID
     */
    private getProcessInfo;
    /**
     * Check if a process is still running
     */
    private isProcessRunning;
    /**
     * Sleep helper
     */
    private sleep;
}
//# sourceMappingURL=process.service.d.ts.map