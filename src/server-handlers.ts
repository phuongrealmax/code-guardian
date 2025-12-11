// src/server-handlers.ts

/**
 * Server Tool Handlers
 *
 * Extracted from server.ts for better modularity.
 */

import { Logger } from './core/logger.js';
import { StateManager } from './core/state-manager.js';
import { MemoryModule } from './modules/memory/index.js';
import { GuardModule } from './modules/guard/index.js';
import { WorkflowModule } from './modules/workflow/index.js';
import { ProcessModule } from './modules/process/index.js';
import { ResourceModule } from './modules/resource/index.js';
import { TestingModule } from './modules/testing/index.js';
import { DocumentsModule } from './modules/documents/index.js';
import { AgentsModule } from './modules/agents/index.js';
import { LatentModule } from './modules/latent/index.js';
import { ThinkingModule } from './modules/thinking/index.js';
import { AutoAgentModule } from './modules/auto-agent/index.js';
import { RAGModule } from './modules/rag/index.js';
import { CodeOptimizerService, createCodeOptimizerToolHandlers } from './modules/code-optimizer/index.js';

// ═══════════════════════════════════════════════════════════════
//                      TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export interface CCGModules {
  memory: MemoryModule;
  guard: GuardModule;
  workflow: WorkflowModule;
  process: ProcessModule;
  resource: ResourceModule;
  testing: TestingModule;
  documents: DocumentsModule;
  agents: AgentsModule;
  latent: LatentModule;
  thinking: ThinkingModule;
  autoAgent: AutoAgentModule;
  rag: RAGModule;
  codeOptimizer: CodeOptimizerService;
}

interface SessionInitResult {
  sessionId: string;
  status: string;
  memory: { loaded: number };
  message: string;
}

// Code Optimizer tool handlers cache
let codeOptimizerHandlers: ReturnType<typeof createCodeOptimizerToolHandlers> | null = null;

export function setCodeOptimizerHandlers(handlers: ReturnType<typeof createCodeOptimizerToolHandlers>): void {
  codeOptimizerHandlers = handlers;
}

// ═══════════════════════════════════════════════════════════════
//                      SESSION TOOLS
// ═══════════════════════════════════════════════════════════════

export function getSessionTools() {
  return [
    {
      name: 'session_init',
      description: 'Initialize CCG session, load memory, check status. Call this at the start of a new conversation.',
      inputSchema: {
        type: 'object' as const,
        properties: {},
        required: [] as string[],
      },
    },
    {
      name: 'session_end',
      description: 'End the current CCG session, save all data. Call this before ending a conversation.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          reason: {
            type: 'string',
            description: 'Reason for ending session (optional)',
          },
        },
        required: [] as string[],
      },
    },
    {
      name: 'session_status',
      description: 'Get current session status including memory count, active tasks, and resource usage.',
      inputSchema: {
        type: 'object' as const,
        properties: {},
        required: [] as string[],
      },
    },
  ];
}

// ═══════════════════════════════════════════════════════════════
//                      TOOL ROUTING
// ═══════════════════════════════════════════════════════════════

export async function routeToolCall(
  name: string,
  args: Record<string, unknown>,
  modules: CCGModules,
  stateManager: StateManager,
  logger: Logger
): Promise<unknown> {
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

async function handleSessionTool(
  action: string,
  args: Record<string, unknown>,
  modules: CCGModules,
  stateManager: StateManager,
  logger: Logger
): Promise<unknown> {
  switch (action) {
    case 'init':
      return initializeSession(modules, stateManager, logger);

    case 'end':
      return endSession(modules, stateManager, args.reason as string | undefined, logger);

    case 'status':
      return getFullStatus(modules, stateManager);

    default:
      throw new Error(`Unknown session action: ${action}`);
  }
}

async function initializeSession(
  modules: CCGModules,
  stateManager: StateManager,
  logger: Logger
): Promise<SessionInitResult> {
  logger.info('Initializing session...');

  // Load memory and pending tasks
  const memoryCount = await modules.memory.loadPersistent();
  const pendingTasksList = await modules.workflow.loadPendingTasks();
  const pendingTasks = pendingTasksList?.length || 0;

  // Create session
  const session = stateManager.createSession();

  const result: SessionInitResult = {
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

async function endSession(
  modules: CCGModules,
  stateManager: StateManager,
  reason: string | undefined,
  logger: Logger
): Promise<unknown> {
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

export async function getFullStatus(
  modules: CCGModules,
  stateManager: StateManager
): Promise<unknown> {
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

function formatWelcomeMessage(memoryCount: number, pendingTasks: number = 0): string {
  const lines = [
    'Claude Code Guardian v3.0 Ready',
    '',
    `Memory: ${memoryCount} items loaded`,
    `Tasks: ${pendingTasks} pending`,
  ];

  if (memoryCount === 0 && pendingTasks === 0) {
    lines.push('', 'Tip: Use memory_store to save decisions, workflow_task_create to track tasks');
    lines.push('NEW: Use rag_build_index to enable semantic code search');
  } else if (pendingTasks > 0) {
    lines.push('', 'Use workflow_task_list to see pending tasks');
  }

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════
//                      RAG TOOL HANDLER
// ═══════════════════════════════════════════════════════════════

async function handleRAGTool(
  action: string,
  args: Record<string, unknown>,
  ragModule: RAGModule
): Promise<unknown> {
  const tools = ragModule.getTools();

  const toolName = `rag_${action}`;
  if (toolName in tools) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (tools as any)[toolName].handler(args);
  }

  throw new Error(`Unknown RAG action: ${action}`);
}

// ═══════════════════════════════════════════════════════════════
//                      CODE OPTIMIZER HANDLER
// ═══════════════════════════════════════════════════════════════

async function handleCodeOptimizerTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  if (!codeOptimizerHandlers) {
    throw new Error('Code Optimizer not initialized');
  }

  // Map tool name to handler
  if (toolName in codeOptimizerHandlers) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (codeOptimizerHandlers as any)[toolName](args);
  }

  throw new Error(`Unknown Code Optimizer tool: ${toolName}`);
}
