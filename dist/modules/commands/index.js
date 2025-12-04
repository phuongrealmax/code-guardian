// src/modules/commands/index.ts
import { CommandsService } from './commands.service.js';
// ═══════════════════════════════════════════════════════════════
//                      COMMANDS MODULE CLASS
// ═══════════════════════════════════════════════════════════════
export class CommandsModule {
    config;
    projectRoot;
    service;
    logger;
    constructor(config, parentLogger, projectRoot) {
        this.config = config;
        this.projectRoot = projectRoot;
        this.logger = parentLogger.child('Commands');
        this.service = new CommandsService(config, this.logger, projectRoot);
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
     * Get all commands
     */
    getCommands() {
        return this.service.getAll();
    }
    /**
     * Get command by name
     */
    getCommand(name) {
        return this.service.get(name);
    }
    /**
     * Get commands by category
     */
    getCommandsByCategory(category) {
        return this.service.getByCategory(category);
    }
    /**
     * Parse command input
     */
    parseCommand(input) {
        return this.service.parseInvocation(input);
    }
    /**
     * Execute command
     */
    executeCommand(input) {
        const invocation = this.service.parseInvocation(input);
        return this.service.execute(invocation);
    }
    /**
     * Register custom command
     */
    registerCommand(command) {
        this.service.register(command);
    }
    /**
     * Generate command file from template
     */
    async generateCommand(template, values) {
        return this.service.generateCommandFile(template, values);
    }
    /**
     * Get module status
     */
    getStatus() {
        return this.service.getStatus();
    }
}
// ═══════════════════════════════════════════════════════════════
//                      EXPORTS
// ═══════════════════════════════════════════════════════════════
export { CommandsService } from './commands.service.js';
export * from './commands.types.js';
// Factory function
export function createCommandsModule(projectRoot, logger, config) {
    const defaultConfig = {
        enabled: true,
        commandsDir: '.claude/commands',
        autoDetectStack: true,
        enableBaseCommands: true,
        enabledCategories: ['base', 'custom'],
    };
    return new CommandsModule({ ...defaultConfig, ...config }, logger, projectRoot);
}
//# sourceMappingURL=index.js.map