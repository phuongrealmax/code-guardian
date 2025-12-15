// tests/unit/progress-service.test.ts
/**
 * Progress Service Tests (Sprint 9)
 *
 * Tests:
 * 1. Updates snapshot on node started/completed/blocked
 * 2. Records lastBlocked with nextToolCalls when blocked
 * 3. Emits progress:updated event
 * 4. Enforces metadata-only (no large payloads)
 * 5. Summary calculation
 * 6. Blockers sorted by priority
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProgressService, ProgressSnapshot, BlockerEntry } from '../../src/core/progress.service.js';
import { StateManager } from '../../src/core/state-manager.js';
import { EventBus } from '../../src/core/event-bus.js';
import { Logger } from '../../src/core/logger.js';
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

beforeEach(() => {
  // Create temp directory
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'progress-test-'));

  // Setup dependencies
  logger = new Logger('error', 'TestProgress');
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

// ═══════════════════════════════════════════════════════════════
//                      TESTS
// ═══════════════════════════════════════════════════════════════

describe('ProgressService', () => {
  describe('Snapshot', () => {
    it('should return empty snapshot initially', () => {
      const snapshot = progressService.getSnapshot();

      expect(snapshot.nodeStates).toEqual({});
      expect(snapshot.summary.total).toBe(0);
      expect(snapshot.lastBlocked).toBeUndefined();
    });

    it('should track active workflow', () => {
      progressService.setActiveWorkflow('test-workflow', 'graph-123');
      const snapshot = progressService.getSnapshot();

      expect(snapshot.workflowId).toBe('test-workflow');
      expect(snapshot.graphId).toBe('graph-123');
    });
  });

  describe('Node Events', () => {
    it('should update nodeState to running on node:started', () => {
      eventBus.emit({
        type: 'taskgraph:node:started',
        timestamp: new Date(),
        data: { nodeId: 'node-1', workflowId: 'wf-1' },
      });

      const snapshot = progressService.getSnapshot();
      expect(snapshot.nodeStates['node-1']).toBe('running');
    });

    it('should update nodeState to done on node:completed', () => {
      // First start the node
      eventBus.emit({
        type: 'taskgraph:node:started',
        timestamp: new Date(),
        data: { nodeId: 'node-1' },
      });

      // Then complete it
      eventBus.emit({
        type: 'taskgraph:node:completed',
        timestamp: new Date(),
        data: { nodeId: 'node-1' },
      });

      const snapshot = progressService.getSnapshot();
      expect(snapshot.nodeStates['node-1']).toBe('done');
    });

    it('should update nodeState to failed on node:failed', () => {
      eventBus.emit({
        type: 'taskgraph:node:failed',
        timestamp: new Date(),
        data: { nodeId: 'node-1', error: 'Test error' },
      });

      const snapshot = progressService.getSnapshot();
      expect(snapshot.nodeStates['node-1']).toBe('failed');
      expect(snapshot.lastBlocked?.nodeId).toBe('node-1');
      expect(snapshot.lastBlocked?.reason).toBe('Test error');
    });

    it('should update nodeState to skipped on node:skipped', () => {
      eventBus.emit({
        type: 'taskgraph:node:skipped',
        timestamp: new Date(),
        data: { nodeId: 'node-1' },
      });

      const snapshot = progressService.getSnapshot();
      expect(snapshot.nodeStates['node-1']).toBe('skipped');
    });

    it('should update nodeState to blocked on node:blocked', () => {
      eventBus.emit({
        type: 'taskgraph:node:blocked',
        timestamp: new Date(),
        data: {
          nodeId: 'node-1',
          reason: 'Gates not satisfied',
          missingEvidence: ['guard', 'test'],
          nextToolCalls: ['guard_validate', 'testing_run'],
        },
      });

      const snapshot = progressService.getSnapshot();
      expect(snapshot.nodeStates['node-1']).toBe('blocked');
      expect(snapshot.lastBlocked?.nodeId).toBe('node-1');
      expect(snapshot.lastBlocked?.reason).toBe('Gates not satisfied');
      expect(snapshot.lastBlocked?.missingEvidence).toEqual(['guard', 'test']);
      expect(snapshot.lastBlocked?.nextToolCalls).toEqual(['guard_validate', 'testing_run']);
    });

    it('should handle node:gated event', () => {
      eventBus.emit({
        type: 'taskgraph:node:gated',
        timestamp: new Date(),
        data: {
          nodeId: 'node-1',
          missingEvidence: ['guard'],
        },
      });

      const snapshot = progressService.getSnapshot();
      expect(snapshot.nodeStates['node-1']).toBe('blocked');
      expect(snapshot.lastBlocked?.nextToolCalls).toContain('guard_validate');
    });

    it('should handle node:bypass_gates event', () => {
      // First set as blocked
      eventBus.emit({
        type: 'taskgraph:node:gated',
        timestamp: new Date(),
        data: { nodeId: 'node-1' },
      });

      // Then bypass
      eventBus.emit({
        type: 'taskgraph:node:bypass_gates',
        timestamp: new Date(),
        data: { nodeId: 'node-1' },
      });

      const snapshot = progressService.getSnapshot();
      expect(snapshot.nodeStates['node-1']).toBe('done');
    });
  });

  describe('Summary Calculation', () => {
    it('should calculate correct summary', () => {
      // Emit various events
      eventBus.emit({
        type: 'taskgraph:node:completed',
        timestamp: new Date(),
        data: { nodeId: 'done-1' },
      });
      eventBus.emit({
        type: 'taskgraph:node:completed',
        timestamp: new Date(),
        data: { nodeId: 'done-2' },
      });
      eventBus.emit({
        type: 'taskgraph:node:started',
        timestamp: new Date(),
        data: { nodeId: 'running-1' },
      });
      eventBus.emit({
        type: 'taskgraph:node:blocked',
        timestamp: new Date(),
        data: { nodeId: 'blocked-1' },
      });
      eventBus.emit({
        type: 'taskgraph:node:skipped',
        timestamp: new Date(),
        data: { nodeId: 'skipped-1' },
      });

      const snapshot = progressService.getSnapshot();
      expect(snapshot.summary.total).toBe(5);
      expect(snapshot.summary.done).toBe(2);
      expect(snapshot.summary.running).toBe(1);
      expect(snapshot.summary.blocked).toBe(1);
      expect(snapshot.summary.skipped).toBe(1);
    });
  });

  describe('Blockers', () => {
    it('should return blockers sorted by priority', () => {
      // Add blocked nodes
      eventBus.emit({
        type: 'taskgraph:node:blocked',
        timestamp: new Date(),
        data: { nodeId: 'blocked-other' },
      });

      // The last blocked one has higher priority
      eventBus.emit({
        type: 'taskgraph:node:blocked',
        timestamp: new Date(),
        data: {
          nodeId: 'blocked-main',
          reason: 'Main blocker',
          nextToolCalls: ['guard_validate'],
        },
      });

      const blockers = progressService.getBlockers();

      expect(blockers.length).toBe(2);
      expect(blockers[0].nodeId).toBe('blocked-main');
      expect(blockers[0].priority).toBe(1);
      expect(blockers[0].nextToolCalls).toEqual(['guard_validate']);
    });

    it('should return empty array when no blockers', () => {
      const blockers = progressService.getBlockers();
      expect(blockers).toEqual([]);
    });
  });

  describe('Event Emission', () => {
    it('should emit progress:updated on node changes', () => {
      const handler = vi.fn();
      eventBus.on('progress:updated', handler);

      eventBus.emit({
        type: 'taskgraph:node:started',
        timestamp: new Date(),
        data: { nodeId: 'node-1' },
      });

      expect(handler).toHaveBeenCalled();
      const emittedData = handler.mock.calls[0][0].data;
      expect(emittedData).toHaveProperty('updatedAt');
      expect(emittedData).toHaveProperty('summary');
    });

    it('should include metadata-only in progress:updated', () => {
      const handler = vi.fn();
      eventBus.on('progress:updated', handler);

      eventBus.emit({
        type: 'taskgraph:node:blocked',
        timestamp: new Date(),
        data: {
          nodeId: 'node-1',
          largePayload: 'x'.repeat(10000), // Large data
        },
      });

      const emittedData = handler.mock.calls[0][0].data;

      // Should NOT contain large payload
      expect(emittedData).not.toHaveProperty('largePayload');
      expect(emittedData).toHaveProperty('hasBlockers', true);
    });
  });

  describe('Clear', () => {
    it('should clear progress state', () => {
      // Add some state
      progressService.setActiveWorkflow('wf-1');
      eventBus.emit({
        type: 'taskgraph:node:started',
        timestamp: new Date(),
        data: { nodeId: 'node-1' },
      });

      // Clear
      progressService.clear();

      const snapshot = progressService.getSnapshot();
      expect(snapshot.nodeStates).toEqual({});
      expect(snapshot.workflowId).toBeUndefined();
    });
  });

  describe('Gate Events', () => {
    it('should handle gate:passed event', () => {
      // First block a node
      eventBus.emit({
        type: 'taskgraph:node:gated',
        timestamp: new Date(),
        data: { nodeId: 'node-1' },
      });

      expect(progressService.getSnapshot().nodeStates['node-1']).toBe('blocked');

      // Then pass the gate
      eventBus.emit({
        type: 'gate:passed',
        timestamp: new Date(),
        data: { nodeId: 'node-1' },
      });

      expect(progressService.getSnapshot().nodeStates['node-1']).toBe('done');
      expect(progressService.getSnapshot().lastBlocked).toBeUndefined();
    });

    it('should handle gate:blocked event', () => {
      eventBus.emit({
        type: 'gate:blocked',
        timestamp: new Date(),
        data: {
          nodeId: 'node-1',
          missingEvidence: ['guard', 'test'],
        },
      });

      const snapshot = progressService.getSnapshot();
      expect(snapshot.nodeStates['node-1']).toBe('blocked');
      expect(snapshot.lastBlocked?.nextToolCalls).toContain('guard_validate');
      expect(snapshot.lastBlocked?.nextToolCalls).toContain('testing_run');
    });
  });

  describe('Workflow Completion', () => {
    it('should clear lastBlocked on workflow:completed', () => {
      // Set up blocked state
      eventBus.emit({
        type: 'taskgraph:node:blocked',
        timestamp: new Date(),
        data: { nodeId: 'node-1', reason: 'Test' },
      });

      expect(progressService.getSnapshot().lastBlocked).toBeDefined();

      // Complete workflow
      eventBus.emit({
        type: 'taskgraph:workflow:completed',
        timestamp: new Date(),
        data: { workflowId: 'wf-1' },
      });

      expect(progressService.getSnapshot().lastBlocked).toBeUndefined();
    });
  });

  describe('Detach', () => {
    it('should stop listening after detach', () => {
      progressService.detach();

      eventBus.emit({
        type: 'taskgraph:node:started',
        timestamp: new Date(),
        data: { nodeId: 'node-1' },
      });

      // Should not update state after detach
      const snapshot = progressService.getSnapshot();
      expect(snapshot.nodeStates['node-1']).toBeUndefined();
    });
  });
});
