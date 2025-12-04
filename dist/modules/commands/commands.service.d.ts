import { Logger } from '../../core/logger.js';
import { SlashCommand, CommandCategory, CommandInvocation, CommandResult, CommandsModuleConfig, CommandsModuleStatus, CommandTemplate } from './commands.types.js';
export declare class CommandsService {
    private config;
    private logger;
    private projectRoot;
    private commands;
    private detectedStack?;
    constructor(config: CommandsModuleConfig, logger: Logger, projectRoot: string);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    /**
     * Get all commands
     */
    getAll(): SlashCommand[];
    /**
     * Get command by name
     */
    get(name: string): SlashCommand | undefined;
    /**
     * Get commands by category
     */
    getByCategory(category: CommandCategory): SlashCommand[];
    /**
     * Register a command
     */
    register(command: SlashCommand): void;
    /**
     * Parse command invocation string
     */
    parseInvocation(input: string): CommandInvocation;
    /**
     * Execute command and return expanded prompt
     */
    execute(invocation: CommandInvocation): CommandResult;
    /**
     * Load custom commands from .claude/commands/
     */
    private loadCustomCommands;
    /**
     * Parse command file (.md format)
     */
    private parseCommandFile;
    /**
     * Generate command file from template
     */
    generateCommandFile(template: CommandTemplate, values: Record<string, string>): Promise<string>;
    private registerBuiltInCommands;
    private detectStack;
    getStatus(): CommandsModuleStatus;
}
//# sourceMappingURL=commands.service.d.ts.map