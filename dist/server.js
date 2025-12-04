// src/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { ConfigManager } from './core/config-manager.js';
import { StateManager } from './core/state-manager.js';
import { EventBus } from './core/event-bus.js';
import { Logger } from './core/logger.js';
import { MemoryModule } from './modules/memory/index.js';
import { GuardModule } from './modules/guard/index.js';
import { WorkflowModule } from './modules/workflow/index.js';
import { ProcessModule } from './modules/process/index.js';
import { ResourceModule } from './modules/resource/index.js';
import { TestingModule } from './modules/testing/index.js';
import { DocumentsModule } from './modules/documents/index.js';
import { AgentsModule } from './modules/agents/index.js';
import { LatentModule, DEFAULT_LATENT_CONFIG } from './modules/latent/index.js';
import { ThinkingModule, DEFAULT_THINKING_CONFIG } from './modules/thinking/index.js';
import { AutoAgentModule, DEFAULT_AUTO_AGENT_CONFIG } from './modules/auto-agent/index.js';
import { RAGModule, DEFAULT_RAG_CONFIG } from './modules/rag/index.js';
import { CodeOptimizerService, getCodeOptimizerTools, createCodeOptimizerToolHandlers, DEFAULT_CODE_OPTIMIZER_CONFIG } from './modules/code-optimizer/index.js';
// Code Optimizer tool handlers cache
let codeOptimizerHandlers = null;
// ═══════════════════════════════════════════════════════════════
//                      SERVER FACTORY
// ═══════════════════════════════════════════════════════════════
export async function createCCGServer() {
    // Determine project root from environment or current working directory
    const projectRoot = process.env.CCG_PROJECT_ROOT || process.cwd();
    const logLevel = process.env.CCG_LOG_LEVEL || 'info';
    // Initialize core services
    const logger = new Logger(logLevel, 'CCG');
    const eventBus = new EventBus();
    const configManager = new ConfigManager(projectRoot, logger, eventBus);
    const stateManager = new StateManager(projectRoot, logger, eventBus);
    logger.debug(`Project root: ${projectRoot}`);
    logger.info('Initializing Claude Code Guardian...');
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
    // Resolve relative paths in config to absolute
    const memoryConfig = {
        ...config.modules.memory,
        persistPath: configManager.resolvePath(config.modules.memory.persistPath),
    };
    logger.debug(`Memory DB path: ${memoryConfig.persistPath}`);
    // Default agents config
    const defaultAgentsConfig = {
        enabled: true,
        agentsFilePath: 'AGENTS.md',
        agentsDir: '.claude/agents',
        autoReload: true,
        enableCoordination: true,
    };
    const agentsConfig = config.modules.agents || defaultAgentsConfig;
    // Initialize modules
    const modules = {
        memory: new MemoryModule(memoryConfig, eventBus, logger),
        guard: new GuardModule(config.modules.guard, eventBus, logger),
        workflow: new WorkflowModule(config.modules.workflow, eventBus, logger, projectRoot),
        process: new ProcessModule(config.modules.process, eventBus, logger),
        resource: new ResourceModule(config.modules.resource, eventBus, logger, projectRoot),
        testing: new TestingModule(config.modules.testing, eventBus, logger, projectRoot),
        documents: new DocumentsModule(config.modules.documents, eventBus, logger, projectRoot),
        agents: new AgentsModule(agentsConfig, eventBus, logger, projectRoot),
        latent: new LatentModule(config.modules.latent || DEFAULT_LATENT_CONFIG, eventBus, logger, projectRoot),
        thinking: new ThinkingModule(config.modules.thinking || DEFAULT_THINKING_CONFIG, eventBus, logger, projectRoot),
        autoAgent: new AutoAgentModule(config.modules.autoAgent || DEFAULT_AUTO_AGENT_CONFIG, eventBus, logger),
        // RAG Module v3.0 - Semantic codebase search
        rag: new RAGModule(eventBus, config.modules.rag || DEFAULT_RAG_CONFIG),
        // NEW: Code Optimizer v3.1 - Repository analysis & refactoring
        codeOptimizer: new CodeOptimizerService(config.modules.codeOptimizer || DEFAULT_CODE_OPTIMIZER_CONFIG, eventBus, logger, projectRoot),
    };
    // Initialize code optimizer handlers
    codeOptimizerHandlers = createCodeOptimizerToolHandlers(modules.codeOptimizer);
    // Initialize all enabled modules
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
    if (config.modules.resource.enabled) {
        initPromises.push(modules.resource.initialize());
    }
    if (config.modules.testing.enabled) {
        initPromises.push(modules.testing.initialize());
    }
    if (config.modules.documents.enabled) {
        initPromises.push(modules.documents.initialize());
    }
    if (agentsConfig.enabled) {
        initPromises.push(modules.agents.initialize());
    }
    // Initialize Latent module (default enabled)
    const latentConfig = config.modules.latent || DEFAULT_LATENT_CONFIG;
    if (latentConfig.enabled) {
        initPromises.push(modules.latent.initialize());
    }
    // Initialize Thinking module (default enabled)
    const thinkingConfig = config.modules.thinking || DEFAULT_THINKING_CONFIG;
    if (thinkingConfig.enabled) {
        initPromises.push(modules.thinking.initialize());
    }
    // Initialize AutoAgent module (default enabled)
    const autoAgentConfig = config.modules.autoAgent || DEFAULT_AUTO_AGENT_CONFIG;
    if (autoAgentConfig.enabled) {
        initPromises.push(modules.autoAgent.initialize());
    }
    // Initialize Code Optimizer module (default enabled)
    const codeOptimizerConfig = config.modules.codeOptimizer || DEFAULT_CODE_OPTIMIZER_CONFIG;
    if (codeOptimizerConfig.enabled !== false) {
        initPromises.push(modules.codeOptimizer.initialize());
    }
    await Promise.all(initPromises);
    logger.info('All modules initialized');
    // Create MCP Server
    const server = new Server({
        name: 'claude-code-guardian',
        version: '1.0.0',
    }, {
        capabilities: {
            tools: {},
            resources: {},
        },
    });
    // ═══════════════════════════════════════════════════════════════
    //                      REGISTER TOOLS
    // ═══════════════════════════════════════════════════════════════
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        const tools = [
            // Session tools
            ...getSessionTools(),
            // Memory tools
            ...modules.memory.getTools(),
            // Guard tools
            ...modules.guard.getTools(),
            // Workflow tools
            ...modules.workflow.getTools(),
            // Process tools
            ...modules.process.getTools(),
            // Resource tools
            ...modules.resource.getTools(),
            // Testing tools
            ...modules.testing.getTools(),
            // Documents tools
            ...modules.documents.getTools(),
            // Agents tools
            ...modules.agents.getTools(),
            // Latent Chain Mode tools
            ...modules.latent.getTools(),
            // Thinking tools (models, workflows, code style)
            ...modules.thinking.getTools(),
            // AutoAgent tools (decompose, route, fix, error memory, TaskGraph DAG)
            ...modules.autoAgent.getTools(),
            // RAG tools (semantic codebase search) - v3.0
            ...modules.rag.getToolDefinitions(),
            // Code Optimizer tools (scan, metrics, hotspots, refactor plan) - NEW v3.1
            ...getCodeOptimizerTools(),
        ];
        logger.debug(`Listing ${tools.length} tools (CCG v3.0)`);
        return { tools };
    });
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        logger.debug(`Tool call: ${name}`, args);
        try {
            // Route to appropriate handler
            const result = await routeToolCall(name, args, modules, stateManager, logger);
            return {
                content: [
                    {
                        type: 'text',
                        text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            logger.error(`Tool ${name} failed:`, error);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: true,
                            message: error instanceof Error ? error.message : 'Unknown error',
                        }),
                    },
                ],
                isError: true,
            };
        }
    });
    // ═══════════════════════════════════════════════════════════════
    //                      REGISTER RESOURCES
    // ═══════════════════════════════════════════════════════════════
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
        return {
            resources: [
                {
                    uri: 'ccg://status',
                    name: 'CCG Status',
                    description: 'Current status of Claude Code Guardian',
                    mimeType: 'application/json',
                },
                {
                    uri: 'ccg://memory',
                    name: 'Memory Summary',
                    description: 'Summary of stored memories',
                    mimeType: 'application/json',
                },
                {
                    uri: 'ccg://config',
                    name: 'Configuration',
                    description: 'Current CCG configuration',
                    mimeType: 'application/json',
                },
            ],
        };
    });
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        const { uri } = request.params;
        switch (uri) {
            case 'ccg://status':
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify(await getFullStatus(modules, stateManager), null, 2),
                        },
                    ],
                };
            case 'ccg://memory':
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify(await modules.memory.getSummary(), null, 2),
                        },
                    ],
                };
            case 'ccg://config':
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify(config, null, 2),
                        },
                    ],
                };
            default:
                throw new Error(`Unknown resource: ${uri}`);
        }
    });
    logger.info('Claude Code Guardian MCP Server ready');
    return server;
}
// ═══════════════════════════════════════════════════════════════
//                      SESSION TOOLS
// ═══════════════════════════════════════════════════════════════
function getSessionTools() {
    return [
        {
            name: 'session_init',
            description: 'Initialize CCG session, load memory, check status. Call this at the start of a new conversation.',
            inputSchema: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
        {
            name: 'session_end',
            description: 'End the current CCG session, save all data. Call this before ending a conversation.',
            inputSchema: {
                type: 'object',
                properties: {
                    reason: {
                        type: 'string',
                        description: 'Reason for ending session (optional)',
                    },
                },
                required: [],
            },
        },
        {
            name: 'session_status',
            description: 'Get current session status including memory count, active tasks, and resource usage.',
            inputSchema: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
    ];
}
// ═══════════════════════════════════════════════════════════════
//                      TOOL ROUTING
// ═══════════════════════════════════════════════════════════════
async function routeToolCall(name, args, modules, stateManager, logger) {
    // Parse tool name: module_action
    const [moduleName, ...actionParts] = name.split('_');
    const action = actionParts.join('_');
    switch (moduleName) {
        case 'session':
            return handleSessionTool(action, args, modules, stateManager, logger);
        case 'memory':
            return modules.memory.handleTool(action, args);
        case 'guard':
            return modules.guard.handleTool(action, args);
        case 'workflow':
            return modules.workflow.handleTool(name, args);
        case 'process':
            return modules.process.handleTool(action, args);
        case 'resource':
            return modules.resource.handleTool(name, args);
        case 'testing':
            return modules.testing.handleTool(name, args);
        case 'documents':
            return modules.documents.handleTool(name, args);
        case 'agents':
            return modules.agents.handleTool(action, args);
        case 'latent':
            return modules.latent.handleTool(name, args);
        case 'thinking':
            return modules.thinking.handleTool(name, args);
        case 'auto':
            return modules.autoAgent.handleTool(name, args);
        case 'rag':
            return handleRAGTool(action, args, modules.rag);
        case 'code':
            return handleCodeOptimizerTool(name, args);
        default:
            throw new Error(`Unknown module: ${moduleName}`);
    }
}
// ═══════════════════════════════════════════════════════════════
//                      SESSION HANDLERS
// ═══════════════════════════════════════════════════════════════
async function handleSessionTool(action, args, modules, stateManager, logger) {
    switch (action) {
        case 'init':
            return initializeSession(modules, stateManager, logger);
        case 'end':
            return endSession(modules, stateManager, args.reason, logger);
        case 'status':
            return getFullStatus(modules, stateManager);
        default:
            throw new Error(`Unknown session action: ${action}`);
    }
}
async function initializeSession(modules, stateManager, logger) {
    logger.info('Initializing session...');
    // Load memory and pending tasks
    const memoryCount = await modules.memory.loadPersistent();
    const pendingTasksList = await modules.workflow.loadPendingTasks();
    const pendingTasks = pendingTasksList?.length || 0;
    // Create session
    const session = stateManager.createSession();
    const result = {
        sessionId: session.id,
        status: 'ready',
        memory: {
            loaded: memoryCount,
        },
        message: formatWelcomeMessage(memoryCount, pendingTasks),
    };
    logger.info(`Session ${session.id} initialized`);
    return result;
}
async function endSession(modules, stateManager, reason, logger) {
    logger.info('Ending session...');
    // Save memory and workflow
    await modules.memory.savePersistent();
    await modules.workflow.saveTasks();
    // Get current session
    const session = stateManager.getSession();
    if (!session) {
        return {
            success: false,
            message: 'No active session to end',
        };
    }
    // End session
    stateManager.endSession();
    const duration = Date.now() - session.startedAt.getTime();
    return {
        success: true,
        sessionId: session.id,
        duration: `${Math.round(duration / 1000)}s`,
        reason: reason || 'normal',
        message: 'Session ended. All data saved. See you next time!',
    };
}
async function getFullStatus(modules, stateManager) {
    const session = stateManager.getSession();
    const memoryStatus = modules.memory.getStatus();
    const guardStatus = modules.guard.getStatus();
    const workflowStatus = modules.workflow.getStatus();
    return {
        session: session
            ? {
                id: session.id,
                status: session.status,
                startedAt: session.startedAt.toISOString(),
                duration: `${Math.round((Date.now() - session.startedAt.getTime()) / 1000)}s`,
            }
            : { status: 'not_started' },
        modules: {
            memory: memoryStatus,
            guard: guardStatus,
            workflow: workflowStatus,
        },
    };
}
// ═══════════════════════════════════════════════════════════════
//                      HELPERS
// ═══════════════════════════════════════════════════════════════
function formatWelcomeMessage(memoryCount, pendingTasks = 0) {
    const lines = [
        'Claude Code Guardian v3.0 Ready',
        '',
        `Memory: ${memoryCount} items loaded`,
        `Tasks: ${pendingTasks} pending`,
    ];
    if (memoryCount === 0 && pendingTasks === 0) {
        lines.push('', 'Tip: Use memory_store to save decisions, workflow_task_create to track tasks');
        lines.push('NEW: Use rag_build_index to enable semantic code search');
    }
    else if (pendingTasks > 0) {
        lines.push('', 'Use workflow_task_list to see pending tasks');
    }
    return lines.join('\n');
}
// ═══════════════════════════════════════════════════════════════
//                      RAG TOOL HANDLER
// ═══════════════════════════════════════════════════════════════
async function handleRAGTool(action, args, ragModule) {
    const tools = ragModule.getTools();
    const toolName = `rag_${action}`;
    if (toolName in tools) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return tools[toolName].handler(args);
    }
    throw new Error(`Unknown RAG action: ${action}`);
}
// ═══════════════════════════════════════════════════════════════
//                      CODE OPTIMIZER HANDLER
// ═══════════════════════════════════════════════════════════════
async function handleCodeOptimizerTool(toolName, args) {
    if (!codeOptimizerHandlers) {
        throw new Error('Code Optimizer not initialized');
    }
    // Map tool name to handler
    if (toolName in codeOptimizerHandlers) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return codeOptimizerHandlers[toolName](args);
    }
    throw new Error(`Unknown Code Optimizer tool: ${toolName}`);
}
//# sourceMappingURL=server.js.map