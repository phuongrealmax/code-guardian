// src/modules/process/index.ts
import { ProcessService } from './process.service.js';
import { getProcessTools, formatPortStatus, formatAllPortsStatus, formatProcessList, formatCleanupResult, formatModuleStatus, } from './process.tools.js';
// ═══════════════════════════════════════════════════════════════
//                      PROCESS MODULE CLASS
// ═══════════════════════════════════════════════════════════════
export class ProcessModule {
    config;
    eventBus;
    service;
    logger;
    constructor(config, eventBus, parentLogger) {
        this.config = config;
        this.eventBus = eventBus;
        this.logger = parentLogger.child('Process');
        this.service = new ProcessService(config, eventBus, this.logger);
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
        return getProcessTools();
    }
    /**
     * Handle MCP tool call
     */
    async handleTool(toolName, args) {
        if (!this.config.enabled) {
            return { error: 'Process module is disabled' };
        }
        switch (toolName) {
            case 'check_port':
                return this.handleCheckPort(args);
            case 'check_all_ports':
                return this.handleCheckAllPorts();
            case 'kill_on_port':
                return this.handleKillOnPort(args);
            case 'kill':
                return this.handleKill(args);
            case 'spawn':
                return this.handleSpawn(args);
            case 'list':
                return this.handleList();
            case 'cleanup':
                return this.handleCleanup();
            case 'status':
                return this.handleStatus();
            default:
                throw new Error(`Unknown process tool: ${toolName}`);
        }
    }
    // ═══════════════════════════════════════════════════════════════
    //                      TOOL HANDLERS
    // ═══════════════════════════════════════════════════════════════
    async handleCheckPort(args) {
        const port = args.port;
        if (!port || port < 1 || port > 65535) {
            return {
                success: false,
                error: 'Invalid port number. Must be between 1 and 65535.',
            };
        }
        const status = await this.service.checkPort(port);
        return {
            success: true,
            port,
            available: status.available,
            usedBy: status.usedBy
                ? {
                    pid: status.usedBy.pid,
                    name: status.usedBy.name,
                    command: status.usedBy.command,
                }
                : null,
            formatted: formatPortStatus(status),
        };
    }
    async handleCheckAllPorts() {
        const ports = await this.service.checkAllPorts();
        return {
            success: true,
            ports,
            formatted: formatAllPortsStatus(ports),
        };
    }
    async handleKillOnPort(args) {
        const port = args.port;
        const force = args.force ?? false;
        if (!port || port < 1 || port > 65535) {
            return {
                success: false,
                error: 'Invalid port number. Must be between 1 and 65535.',
            };
        }
        const result = await this.service.killProcessOnPort(port, force);
        return {
            ...result,
            port,
        };
    }
    async handleKill(args) {
        const pid = args.pid;
        const force = args.force ?? false;
        if (!pid || pid < 1) {
            return {
                success: false,
                error: 'Invalid PID',
            };
        }
        return this.service.killProcess(pid, force);
    }
    async handleSpawn(args) {
        const params = {
            command: args.command,
            args: args.args,
            port: args.port,
            name: args.name,
            cwd: args.cwd,
        };
        if (!params.command) {
            return {
                success: false,
                error: 'Command is required',
            };
        }
        return this.service.spawnProcess(params);
    }
    async handleList() {
        const processes = await this.service.getRunningProcesses();
        return {
            success: true,
            count: processes.length,
            processes: processes.map(p => ({
                pid: p.pid,
                name: p.name,
                port: p.port,
                command: p.command,
                status: p.status,
                spawnedBy: p.spawnedBy,
                startedAt: p.startedAt.toISOString(),
            })),
            formatted: formatProcessList(processes),
        };
    }
    async handleCleanup() {
        const result = await this.service.cleanupSpawned();
        return {
            ...result,
            formatted: formatCleanupResult(result),
        };
    }
    async handleStatus() {
        const status = await this.service.getStatus();
        return {
            success: true,
            ...status,
            formatted: formatModuleStatus(status),
        };
    }
    // ═══════════════════════════════════════════════════════════════
    //                      PUBLIC SERVICE METHODS
    // ═══════════════════════════════════════════════════════════════
    /**
     * Get module status
     */
    async getStatus() {
        return this.service.getStatus();
    }
    /**
     * Check if a port is available (direct access)
     */
    async checkPort(port) {
        return this.service.checkPort(port);
    }
    /**
     * Check running processes (direct access)
     */
    async checkRunningProcesses() {
        return this.service.getRunningProcesses();
    }
    /**
     * Get running processes (alias for checkRunningProcesses)
     */
    async getRunningProcesses() {
        return this.service.getRunningProcesses();
    }
    /**
     * Kill process on port (direct access)
     */
    async killProcessOnPort(port, force) {
        return this.service.killProcessOnPort(port, force);
    }
    /**
     * Spawn a process (direct access)
     */
    async spawnProcess(params) {
        return this.service.spawnProcess(params);
    }
    /**
     * Cleanup spawned processes (direct access)
     */
    async cleanupSpawned() {
        return this.service.cleanupSpawned();
    }
}
// ═══════════════════════════════════════════════════════════════
//                      EXPORTS
// ═══════════════════════════════════════════════════════════════
export { ProcessService } from './process.service.js';
export * from './process.types.js';
export * from './process.tools.js';
//# sourceMappingURL=index.js.map