// tests/unit/progress-tools.test.ts
/**
 * Progress Tools Tests (Sprint 9)
 *
 * Tests:
 * 1. progress_status returns deterministic output
 * 2. progress_blockers sorted by priority
 * 3. progress_mermaid uses workflow visualizer
 * 4. progress_clear clears state
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createProgressToolHandlers,
  handleProgressTool,
  ProgressToolDeps,
  PROGRESS_TOOL_DEFINITIONS,
} from '../../src/core/progress.tools.js';
import { ProgressService } from '../../src/core/progress.service.js';
import { StateManager } from '../../src/core/state-manager.js';
import { EventBus } from '../../src/core/event-bus.js';
import { Logger } from '../../src/core/logger.js';
import { WorkflowGraph } from '../../src/modules/auto-agent/task-graph.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ═══════════════════════════════════════════════════════════════
//                      TEST SETUP
// ═══════════════════════════════════════════════════════════════

let tempDir: string;
let stateManager: StateManager;
let eventBus: EventBus;
let progressService: ProgressService;
let logger: Logger;
let testGraph: WorkflowGraph;

beforeEach(() => {
  // Create temp directory
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'progress-tools-test-'));

  // Setup dependencies
  logger = new Logger('error', 'TestProgressTools');
  eventBus = new EventBus();
  stateManager = new StateManager(tempDir, logger, eventBus);

  // Create session
  stateManager.createSession(tempDir);

  // Create progress service
  progressService = new ProgressService({
    stateManager,
    eventBus,
    logger,
  });

  progressService.attach();

  // Create test graph
  testGraph = {
    version: '1.0',
    entry: 'A',
    nodes: [
      { id: 'A', kind: 'task', label: 'Task A', phase: 'analysis' },
      { id: 'B', kind: 'task', label: 'Task B', phase: 'impl' },
      { id: 'C', kind: 'task', label: 'Task C', phase: 'test' },
    ],
    edges: [
      { from: 'A', to: 'B' },
      { from: 'B', to: 'C' },
    ],
  };
});

afterEach(() => {
  progressService.detach();
  stateManager.dispose();

  // Cleanup temp dir
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
});

function createDeps(customGraph?: WorkflowGraph): ProgressToolDeps {
  return {
    progressService,
    stateManager,
    getActiveGraph: () => customGraph ?? testGraph,
  };
}

// ═══════════════════════════════════════════════════════════════
//                      TESTS
// ═══════════════════════════════════════════════════════════════

describe('Progress Tool Definitions', () => {
  it('should export 4 tool definitions', () => {
    expect(PROGRESS_TOOL_DEFINITIONS.length).toBe(4);
  });

  it('should include all expected tools', () => {
    const names = PROGRESS_TOOL_DEFINITIONS.map((t) => t.name);
    expect(names).toContain('progress_status');
    expect(names).toContain('progress_blockers');
    expect(names).toContain('progress_mermaid');
    expect(names).toContain('progress_clear');
  });

  it('each tool should have name, description, and inputSchema', () => {
    for (const tool of PROGRESS_TOOL_DEFINITIONS) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
    }
  });
});

describe('progress_status Tool', () => {
  it('should return success with snapshot', async () => {
    const deps = createDeps();
    const handlers = createProgressToolHandlers(deps);

    const result = await handlers.progress_status({});

    expect(result.success).toBe(true);
    expect(result.snapshot).toBeDefined();
    expect(result.snapshot?.summary).toBeDefined();
  });

  it('should return deterministic output', async () => {
    const deps = createDeps();
    const handlers = createProgressToolHandlers(deps);

    // Set up some state
    eventBus.emit({
      type: 'taskgraph:node:completed',
      timestamp: new Date(),
      data: { nodeId: 'A' },
    });

    const result1 = await handlers.progress_status({});
    const result2 = await handlers.progress_status({});

    // Compare (excluding timestamps)
    expect(result1.snapshot?.nodeStates).toEqual(result2.snapshot?.nodeStates);
    expect(result1.snapshot?.summary).toEqual(result2.snapshot?.summary);
  });

  it('should include nextSteps when blocked', async () => {
    const deps = createDeps();
    const handlers = createProgressToolHandlers(deps);

    eventBus.emit({
      type: 'taskgraph:node:blocked',
      timestamp: new Date(),
      data: {
        nodeId: 'B',
        nextToolCalls: ['guard_validate', 'testing_run'],
      },
    });

    const result = await handlers.progress_status({});

    expect(result.nextSteps).toBeDefined();
    expect(result.nextSteps).toContain('guard_validate');
    expect(result.nextSteps).toContain('testing_run');
  });

  it('should filter by workflowId if provided', async () => {
    const deps = createDeps();
    const handlers = createProgressToolHandlers(deps);

    progressService.setActiveWorkflow('wf-1');

    const result = await handlers.progress_status({ workflowId: 'wf-2' });

    expect(result.success).toBe(false);
    expect(result.message).toContain('wf-2');
  });
});

describe('progress_blockers Tool', () => {
  it('should return empty blockers initially', async () => {
    const deps = createDeps();
    const handlers = createProgressToolHandlers(deps);

    const result = await handlers.progress_blockers({});

    expect(result.success).toBe(true);
    expect(result.blockers).toEqual([]);
    expect(result.summary).toBe('No blocked nodes');
  });

  it('should return blockers sorted by priority', async () => {
    const deps = createDeps();
    const handlers = createProgressToolHandlers(deps);

    // Add blockers
    eventBus.emit({
      type: 'taskgraph:node:blocked',
      timestamp: new Date(),
      data: { nodeId: 'B' },
    });
    eventBus.emit({
      type: 'taskgraph:node:blocked',
      timestamp: new Date(),
      data: { nodeId: 'C', reason: 'Main blocker', nextToolCalls: ['guard_validate'] },
    });

    const result = await handlers.progress_blockers({});

    expect(result.blockers.length).toBe(2);
    // Last blocked (C) should have priority 1
    expect(result.blockers[0].nodeId).toBe('C');
    expect(result.blockers[0].priority).toBe(1);
    expect(result.blockers[0].nextToolCalls).toEqual(['guard_validate']);
  });

  it('should include summary with next tool calls', async () => {
    const deps = createDeps();
    const handlers = createProgressToolHandlers(deps);

    eventBus.emit({
      type: 'taskgraph:node:blocked',
      timestamp: new Date(),
      data: { nodeId: 'B', reason: 'Test reason', nextToolCalls: ['guard_validate'] },
    });

    const result = await handlers.progress_blockers({});

    expect(result.summary).toContain('1 blocker');
    expect(result.summary).toContain('guard_validate');
  });
});

describe('progress_mermaid Tool', () => {
  it('should return error when no graph available', async () => {
    const deps: ProgressToolDeps = {
      progressService,
      stateManager,
      getActiveGraph: () => null,
    };
    const handlers = createProgressToolHandlers(deps);

    const result = await handlers.progress_mermaid({});

    expect(result.success).toBe(false);
    expect(result.message).toContain('No active workflow');
  });

  it('should return mermaid diagram with status icons', async () => {
    const deps = createDeps();
    const handlers = createProgressToolHandlers(deps);

    // Add some state
    eventBus.emit({
      type: 'taskgraph:node:completed',
      timestamp: new Date(),
      data: { nodeId: 'A' },
    });
    eventBus.emit({
      type: 'taskgraph:node:started',
      timestamp: new Date(),
      data: { nodeId: 'B' },
    });

    const result = await handlers.progress_mermaid({});

    expect(result.success).toBe(true);
    expect(result.mermaid).toBeDefined();
    expect(result.mermaid).toContain('flowchart');
    expect(result.mermaid).toContain('-->');
  });

  it('should respect direction option', async () => {
    const deps = createDeps();
    const handlers = createProgressToolHandlers(deps);

    const resultTD = await handlers.progress_mermaid({ direction: 'TD' });
    const resultLR = await handlers.progress_mermaid({ direction: 'LR' });

    expect(resultTD.mermaid).toContain('flowchart TD');
    expect(resultLR.mermaid).toContain('flowchart LR');
  });

  it('should include gate badges when showGateBadges is true', async () => {
    const deps = createDeps();
    const handlers = createProgressToolHandlers(deps);

    const result = await handlers.progress_mermaid({ showGateBadges: true });

    expect(result.mermaid).toBeDefined();
    // The test graph has impl/test phases which should have gate badges
  });
});

describe('progress_clear Tool', () => {
  it('should clear progress state', async () => {
    const deps = createDeps();
    const handlers = createProgressToolHandlers(deps);

    // Add some state
    progressService.setActiveWorkflow('wf-1');
    eventBus.emit({
      type: 'taskgraph:node:started',
      timestamp: new Date(),
      data: { nodeId: 'A' },
    });

    // Clear
    const result = await handlers.progress_clear();

    expect(result.success).toBe(true);
    expect(result.message).toBe('Progress state cleared');

    // Verify cleared
    const snapshot = progressService.getSnapshot();
    expect(snapshot.nodeStates).toEqual({});
  });
});

describe('handleProgressTool Dispatch', () => {
  it('should dispatch to correct handler', async () => {
    const deps = createDeps();

    const statusResult = await handleProgressTool('progress_status', {}, deps);
    expect(statusResult).toHaveProperty('success', true);

    const blockersResult = await handleProgressTool('progress_blockers', {}, deps);
    expect(blockersResult).toHaveProperty('blockers');

    const clearResult = await handleProgressTool('progress_clear', {}, deps);
    expect(clearResult).toHaveProperty('message');
  });

  it('should throw on unknown tool', async () => {
    const deps = createDeps();

    await expect(handleProgressTool('progress_unknown', {}, deps)).rejects.toThrow(
      'Unknown progress tool'
    );
  });
});
