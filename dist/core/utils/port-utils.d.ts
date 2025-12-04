/**
 * Check if a port is available
 */
export declare function isPortAvailable(port: number): Promise<boolean>;
/**
 * Find an available port starting from a given port
 */
export declare function findAvailablePort(startPort: number, maxAttempts?: number): Promise<number | null>;
/**
 * Get process using a port (cross-platform)
 */
export declare function getProcessOnPort(port: number): Promise<{
    pid: number;
    name: string;
    command: string;
} | null>;
/**
 * Kill process on a port
 */
export declare function killProcessOnPort(port: number): Promise<boolean>;
/**
 * Wait for port to become available
 */
export declare function waitForPort(port: number, timeout?: number, interval?: number): Promise<boolean>;
/**
 * Wait for a service to be ready on a port
 */
export declare function waitForService(port: number, host?: string, timeout?: number, interval?: number): Promise<boolean>;
//# sourceMappingURL=port-utils.d.ts.map