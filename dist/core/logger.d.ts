export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';
export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    message: string;
    context?: string;
    data?: unknown;
    stack?: string;
}
export interface LoggerConfig {
    level: LogLevel;
    console: boolean;
    file?: string;
    maxFileSize?: number;
    format?: 'json' | 'text' | 'pretty';
    colors?: boolean;
}
export declare class Logger {
    private config;
    private context?;
    private logBuffer;
    private maxBufferSize;
    private static levelPriority;
    private static levelColors;
    private static levelIcons;
    constructor(levelOrConfig?: LogLevel | LoggerConfig, context?: string);
    /**
     * Create a child logger with additional context
     */
    child(context: string): Logger;
    /**
     * Log debug message
     */
    debug(message: string, data?: unknown): void;
    /**
     * Log info message
     */
    info(message: string, data?: unknown): void;
    /**
     * Log warning message
     */
    warn(message: string, data?: unknown): void;
    /**
     * Log error message
     */
    error(message: string, error?: Error | unknown): void;
    /**
     * Log with timing
     */
    time(label: string): () => void;
    /**
     * Log a group of related messages
     */
    group(label: string, fn: () => void): void;
    /**
     * Log a table (for debugging)
     */
    table(data: Record<string, unknown>[] | Record<string, unknown>): void;
    /**
     * Get recent log entries
     */
    getBuffer(): LogEntry[];
    /**
     * Clear log buffer
     */
    clearBuffer(): void;
    /**
     * Set log level
     */
    setLevel(level: LogLevel): void;
    /**
     * Get current log level
     */
    getLevel(): LogLevel;
    private log;
    private shouldLog;
    private addToBuffer;
    private outputToConsole;
    private outputToFile;
}
export declare function getGlobalLogger(): Logger;
export declare function setGlobalLogger(logger: Logger): void;
/**
 * Create a scoped logger for a module
 */
export declare function createModuleLogger(moduleName: string, level?: LogLevel): Logger;
/**
 * Format error for logging
 */
export declare function formatError(error: unknown): string;
/**
 * Truncate long strings for logging
 */
export declare function truncate(str: string, maxLength?: number): string;
//# sourceMappingURL=logger.d.ts.map