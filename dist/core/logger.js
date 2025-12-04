// src/core/logger.ts
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
// ═══════════════════════════════════════════════════════════════
//                      LOGGER CLASS
// ═══════════════════════════════════════════════════════════════
export class Logger {
    config;
    context;
    logBuffer = [];
    maxBufferSize = 100;
    static levelPriority = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3,
        silent: 4,
    };
    static levelColors = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m', // Green
        warn: '\x1b[33m', // Yellow
        error: '\x1b[31m', // Red
        silent: '',
    };
    static levelIcons = {
        debug: '[D]',
        info: '[I]',
        warn: '[W]',
        error: '[E]',
        silent: '',
    };
    constructor(levelOrConfig = 'info', context) {
        if (typeof levelOrConfig === 'string') {
            this.config = {
                level: levelOrConfig,
                console: true,
                colors: true,
                format: 'pretty',
            };
        }
        else {
            const defaults = {
                console: true,
                colors: true,
                format: 'pretty',
            };
            this.config = { ...defaults, ...levelOrConfig };
        }
        this.context = context;
        // Ensure log directory exists
        if (this.config.file) {
            const dir = dirname(this.config.file);
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }
        }
    }
    /**
     * Create a child logger with additional context
     */
    child(context) {
        const childContext = this.context ? `${this.context}:${context}` : context;
        const childLogger = new Logger(this.config, childContext);
        return childLogger;
    }
    /**
     * Log debug message
     */
    debug(message, data) {
        this.log('debug', message, data);
    }
    /**
     * Log info message
     */
    info(message, data) {
        this.log('info', message, data);
    }
    /**
     * Log warning message
     */
    warn(message, data) {
        this.log('warn', message, data);
    }
    /**
     * Log error message
     */
    error(message, error) {
        let data;
        let stack;
        if (error instanceof Error) {
            data = { message: error.message, name: error.name };
            stack = error.stack;
        }
        else {
            data = error;
        }
        this.log('error', message, data, stack);
    }
    /**
     * Log with timing
     */
    time(label) {
        const start = Date.now();
        this.debug(`[${label}] Started`);
        return () => {
            const duration = Date.now() - start;
            this.debug(`[${label}] Completed in ${duration}ms`);
        };
    }
    /**
     * Log a group of related messages
     */
    group(label, fn) {
        this.info(`-- ${label}`);
        fn();
        this.info(`-- ${label} complete`);
    }
    /**
     * Log a table (for debugging)
     */
    table(data) {
        if (this.shouldLog('debug')) {
            console.table(data);
        }
    }
    /**
     * Get recent log entries
     */
    getBuffer() {
        return [...this.logBuffer];
    }
    /**
     * Clear log buffer
     */
    clearBuffer() {
        this.logBuffer = [];
    }
    /**
     * Set log level
     */
    setLevel(level) {
        this.config.level = level;
    }
    /**
     * Get current log level
     */
    getLevel() {
        return this.config.level;
    }
    // ═══════════════════════════════════════════════════════════════
    //                      PRIVATE METHODS
    // ═══════════════════════════════════════════════════════════════
    log(level, message, data, stack) {
        if (!this.shouldLog(level)) {
            return;
        }
        const entry = {
            timestamp: new Date(),
            level,
            message,
            context: this.context,
            data,
            stack,
        };
        // Add to buffer
        this.addToBuffer(entry);
        // Output to console
        if (this.config.console) {
            this.outputToConsole(entry);
        }
        // Output to file
        if (this.config.file) {
            this.outputToFile(entry);
        }
    }
    shouldLog(level) {
        return Logger.levelPriority[level] >= Logger.levelPriority[this.config.level];
    }
    addToBuffer(entry) {
        this.logBuffer.push(entry);
        if (this.logBuffer.length > this.maxBufferSize) {
            this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
        }
    }
    outputToConsole(entry) {
        const { format, colors } = this.config;
        if (format === 'json') {
            console.log(JSON.stringify(entry));
            return;
        }
        const timestamp = entry.timestamp.toISOString().slice(11, 23);
        const levelStr = entry.level.toUpperCase().padEnd(5);
        const contextStr = entry.context ? `[${entry.context}]` : '';
        const icon = Logger.levelIcons[entry.level];
        let output;
        if (format === 'pretty' && colors) {
            const color = Logger.levelColors[entry.level];
            const reset = '\x1b[0m';
            const gray = '\x1b[90m';
            output = `${gray}${timestamp}${reset} ${color}${icon} ${levelStr}${reset} ${contextStr} ${entry.message}`;
        }
        else {
            output = `${timestamp} ${icon} ${levelStr} ${contextStr} ${entry.message}`;
        }
        // Choose console method based on level
        switch (entry.level) {
            case 'error':
                console.error(output);
                if (entry.stack)
                    console.error(entry.stack);
                break;
            case 'warn':
                console.warn(output);
                break;
            case 'debug':
                console.debug(output);
                break;
            default:
                console.log(output);
        }
        // Log data if present
        if (entry.data !== undefined) {
            if (typeof entry.data === 'object') {
                console.log('  ', entry.data);
            }
            else {
                console.log(`   Data: ${entry.data}`);
            }
        }
    }
    outputToFile(entry) {
        if (!this.config.file)
            return;
        const line = JSON.stringify({
            ...entry,
            timestamp: entry.timestamp.toISOString(),
        }) + '\n';
        try {
            appendFileSync(this.config.file, line);
        }
        catch (error) {
            // Fallback to console if file write fails
            console.error('Failed to write to log file:', error);
        }
    }
}
// ═══════════════════════════════════════════════════════════════
//                      SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════
let globalLogger = null;
export function getGlobalLogger() {
    if (!globalLogger) {
        globalLogger = new Logger('info');
    }
    return globalLogger;
}
export function setGlobalLogger(logger) {
    globalLogger = logger;
}
// ═══════════════════════════════════════════════════════════════
//                      UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════
/**
 * Create a scoped logger for a module
 */
export function createModuleLogger(moduleName, level) {
    return new Logger(level || 'info', moduleName);
}
/**
 * Format error for logging
 */
export function formatError(error) {
    if (error instanceof Error) {
        return `${error.name}: ${error.message}`;
    }
    return String(error);
}
/**
 * Truncate long strings for logging
 */
export function truncate(str, maxLength = 200) {
    if (str.length <= maxLength)
        return str;
    return str.slice(0, maxLength - 3) + '...';
}
//# sourceMappingURL=logger.js.map