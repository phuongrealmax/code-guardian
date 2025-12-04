// src/bin/hook-command.ts
/**
 * CLI Hook Command
 *
 * This command is called by Claude Code hooks to execute CCG functionality.
 * It acts as the bridge between Claude Code's hook system and CCG modules.
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { join } from 'path';
import { existsSync } from 'fs';
import { HookRouter } from '../hooks/index.js';
import { ConfigManager } from '../core/config-manager.js';
import { StateManager } from '../core/state-manager.js';
import { EventBus } from '../core/event-bus.js';
import { Logger } from '../core/logger.js';
import { initializeModules } from '../modules/index.js';
// ═══════════════════════════════════════════════════════════════
//                      HOOK COMMAND
// ═══════════════════════════════════════════════════════════════
export function createHookCommand() {
    const hookCmd = new Command('hook')
        .description('Execute CCG hooks (used by Claude Code)')
        .argument('<hook-type>', 'Hook type: session-start, pre-tool, post-tool, session-end')
        .argument('[tool-name]', 'Tool name (for pre-tool and post-tool)')
        .option('--input <json>', 'Additional input as JSON')
        .option('--debug', 'Enable debug output')
        .action(async (hookType, toolName, options) => {
        const cwd = process.cwd();
        const ccgDir = join(cwd, '.ccg');
        // Check initialization
        if (!existsSync(ccgDir)) {
            console.error(chalk.red('CCG not initialized. Run "ccg init" first.'));
            process.exit(1);
        }
        try {
            // Initialize core services
            const logLevel = options.debug ? 'debug' : 'info';
            const logger = new Logger(logLevel);
            const eventBus = new EventBus();
            const configManager = new ConfigManager(cwd);
            const stateManager = new StateManager(cwd);
            // Load config
            await configManager.load();
            // Initialize modules
            const modules = await initializeModules(configManager, eventBus, logger, cwd);
            // Create hook router
            const router = new HookRouter(modules, logger, configManager, stateManager, eventBus);
            // Create context
            const context = {
                projectRoot: cwd,
                sessionId: stateManager.getSession()?.id,
                timestamp: new Date(),
                environment: process.env,
            };
            // Parse input based on hook type
            let input = {};
            switch (hookType) {
                case 'session-start':
                    input = {
                        projectPath: cwd,
                        resumeSession: true,
                    };
                    break;
                case 'pre-tool':
                    input = {
                        toolName: toolName || 'unknown',
                        toolInput: options.input ? JSON.parse(options.input) : {},
                    };
                    break;
                case 'post-tool':
                    input = {
                        toolName: toolName || 'unknown',
                        toolInput: options.input ? JSON.parse(options.input) : {},
                        toolOutput: {},
                        success: true,
                        duration: 0,
                    };
                    break;
                case 'session-end':
                    input = {
                        reason: 'user_exit',
                        saveState: true,
                    };
                    break;
                default:
                    console.error(chalk.red(`Unknown hook type: ${hookType}`));
                    console.log('Valid hook types: session-start, pre-tool, post-tool, session-end');
                    process.exit(1);
            }
            // Execute hook
            const result = await router.executeHook(hookType, input, context);
            // Output result message
            if (result.message) {
                console.log(result.message);
            }
            // Output warnings
            if (result.warnings && result.warnings.length > 0) {
                for (const warning of result.warnings) {
                    const prefix = warning.level === 'error'
                        ? chalk.red('ERROR')
                        : warning.level === 'warning'
                            ? chalk.yellow('WARN')
                            : chalk.blue('INFO');
                    console.log(`${prefix}: ${warning.message}`);
                    if (warning.action) {
                        console.log(`  ${chalk.dim('->')} ${warning.action}`);
                    }
                }
            }
            // Exit with appropriate code
            if (result.blocked) {
                console.error(chalk.red(`\nBLOCKED: ${result.blockReason}`));
                process.exit(1);
            }
            process.exit(result.success ? 0 : 1);
        }
        catch (error) {
            console.error(chalk.red('Hook execution failed:'), error);
            process.exit(1);
        }
    });
    return hookCmd;
}
// ═══════════════════════════════════════════════════════════════
//                      STANDALONE EXECUTION
// ═══════════════════════════════════════════════════════════════
// Allow running as standalone script for testing
if (process.argv[1]?.includes('hook-command')) {
    const program = new Command();
    program.addCommand(createHookCommand());
    program.parse();
}
//# sourceMappingURL=hook-command.js.map