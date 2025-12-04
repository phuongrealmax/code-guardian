// src/api/index.ts
// Entry point for CCG HTTP API Server
import { ConfigManager } from '../core/config-manager.js';
import { StateManager } from '../core/state-manager.js';
import { EventBus } from '../core/event-bus.js';
import { Logger } from '../core/logger.js';
import { MemoryModule } from '../modules/memory/index.js';
import { GuardModule } from '../modules/guard/index.js';
import { WorkflowModule } from '../modules/workflow/index.js';
import { ProcessModule } from '../modules/process/index.js';
import { DocumentsModule } from '../modules/documents/index.js';
import { AgentsModule } from '../modules/agents/index.js';
import { LatentModule, DEFAULT_LATENT_CONFIG } from '../modules/latent/index.js';
import { createAPIServer } from './http-server.js';
async function main() {
    const projectRoot = process.env.CCG_PROJECT_ROOT || process.cwd();
    const logLevel = process.env.CCG_LOG_LEVEL || 'info';
    const apiPort = parseInt(process.env.CCG_API_PORT || '3334');
    // Initialize core services
    const logger = new Logger(logLevel, 'CCG-API');
    const eventBus = new EventBus();
    const configManager = new ConfigManager(projectRoot, logger, eventBus);
    const stateManager = new StateManager(projectRoot, logger, eventBus);
    logger.info('Starting CCG API Server...');
    logger.debug(`Project root: ${projectRoot}`);
    // Load configuration
    let config;
    try {
        config = await configManager.load();
        logger.info('Configuration loaded successfully');
    }
    catch (error) {
        logger.warn('Using default configuration');
        config = configManager.getDefaultConfig();
    }
    // Resolve paths
    const memoryConfig = {
        ...config.modules.memory,
        persistPath: configManager.resolvePath(config.modules.memory.persistPath),
    };
    const agentsConfig = config.modules.agents || {
        enabled: true,
        agentsFilePath: 'AGENTS.md',
        agentsDir: '.claude/agents',
        autoReload: true,
        enableCoordination: true,
    };
    // Initialize modules
    const modules = {
        memory: new MemoryModule(memoryConfig, eventBus, logger),
        guard: new GuardModule(config.modules.guard, eventBus, logger),
        workflow: new WorkflowModule(config.modules.workflow, eventBus, logger, projectRoot),
        process: new ProcessModule(config.modules.process, eventBus, logger),
        documents: new DocumentsModule(config.modules.documents, eventBus, logger, projectRoot),
        agents: new AgentsModule(agentsConfig, eventBus, logger, projectRoot),
        latent: new LatentModule(config.modules.latent || DEFAULT_LATENT_CONFIG, eventBus, logger, projectRoot),
    };
    // Initialize all modules
    const initPromises = [];
    if (config.modules.memory.enabled) {
        initPromises.push(modules.memory.initialize());
    }
    if (config.modules.guard.enabled) {
        initPromises.push(modules.guard.initialize());
    }
    if (config.modules.workflow.enabled) {
        initPromises.push(modules.workflow.initialize());
    }
    if (config.modules.process.enabled) {
        initPromises.push(modules.process.initialize());
    }
    if (config.modules.documents.enabled) {
        initPromises.push(modules.documents.initialize());
    }
    if (agentsConfig.enabled) {
        initPromises.push(modules.agents.initialize());
    }
    const latentConfig = config.modules.latent || DEFAULT_LATENT_CONFIG;
    if (latentConfig.enabled) {
        initPromises.push(modules.latent.initialize());
    }
    await Promise.all(initPromises);
    logger.info('All modules initialized');
    // Create and start API server
    const { start } = createAPIServer(modules, stateManager, eventBus, logger, {
        port: apiPort,
        corsOrigins: ['http://localhost:3333', 'http://localhost:3000'],
    });
    start();
    // Handle shutdown
    process.on('SIGINT', async () => {
        logger.info('Shutting down CCG API Server...');
        await modules.memory.savePersistent();
        await modules.workflow.saveTasks();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        logger.info('Shutting down CCG API Server...');
        await modules.memory.savePersistent();
        await modules.workflow.saveTasks();
        process.exit(0);
    });
}
main().catch((error) => {
    console.error('Failed to start CCG API Server:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map