/**
 * Commands Module
 *
 * Slash command management following Enterprise Toolkit patterns.
 */
import { Logger } from '../../core/logger.js';
import { CommandsModuleConfig, SlashCommand, CommandInvocation, CommandResult, CommandCategory, CommandTemplate } from './commands.types.js';
export declare class CommandsModule {
    private config;
    private projectRoot;
    private service;
    private logger;
    constructor(config: CommandsModuleConfig, parentLogger: Logger, projectRoot: string);
    /**
     * Initialize the module
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the module
     */
    shutdown(): Promise<void>;
    /**
     * Get all commands
     */
    getCommands(): SlashCommand[];
    /**
     * Get command by name
     */
    getCommand(name: string): SlashCommand | undefined;
    /**
     * Get commands by category
     */
    getCommandsByCategory(category: CommandCategory): SlashCommand[];
    /**
     * Parse command input
     */
    parseCommand(input: string): CommandInvocation;
    /**
     * Execute command
     */
    executeCommand(input: string): CommandResult;
    /**
     * Register custom command
     */
    registerCommand(command: SlashCommand): void;
    /**
     * Generate command file from template
     */
    generateCommand(template: CommandTemplate, values: Record<string, string>): Promise<string>;
    /**
     * Get module status
     */
    getStatus(): import("./commands.types.js").CommandsModuleStatus;
}
export { CommandsService } from './commands.service.js';
export * from './commands.types.js';
export declare function createCommandsModule(projectRoot: string, logger: Logger, config?: Partial<CommandsModuleConfig>): CommandsModule;
//# sourceMappingURL=index.d.ts.map