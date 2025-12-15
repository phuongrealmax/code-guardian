// src/core/progress.service.ts
/**
 * Progress Aggregator Service (Sprint 9)
 *
 * Tracks live workflow execution state by consuming EventBus events.
 * Provides unified progress visibility for dashboards.
 *
 * Key features:
 * - Metadata-only tracking (no large payloads)
 * - Deterministic snapshot generation
 * - Emits progress:updated events
 */

import { Logger } from './logger.js';
import { EventBus, CCGEvent } from './event-bus.js';
import { StateManager, ProgressState, LastBlockedInfo } from './state-manager.js';
import type { WorkflowNodeState } from '../modules/auto-agent/task-graph.js';

// ═══════════════════════════════════════════════════════════════
//                      TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Progress snapshot for API consumers
 */
export interface ProgressSnapshot {
  /** Active workflow ID */
  workflowId?: string;
  /** Graph identifier */
  graphId?: string;
  /** Summary of node states by status */
  summary: {
    total: number;
    done: number;
    running: number;
    blocked: number;
    pending: number;
    failed: number;
    skipped: number;
  };
  /** All node states */
  nodeStates: Record<string, WorkflowNodeState>;
  /** Last blocked node info */
  lastBlocked?: LastBlockedInfo;
  /** Timestamp */
  updatedAt: Date;
}

/**
 * Blocker entry with priority
 */
export interface BlockerEntry {
  nodeId: string;
  reason: string;
  priority: number;
  missingEvidence?: string[];
  failingEvidence?: string[];
  nextToolCalls?: string[];
}

// ═══════════════════════════════════════════════════════════════
//                      SERVICE CLASS
// ═══════════════════════════════════════════════════════════════

export class ProgressService {
  private logger: Logger;
  private stateManager: StateManager;
  private eventBus: EventBus;
  private subscriptions: string[] = [];
  private attached = false;

  constructor(deps: { stateManager: StateManager; eventBus: EventBus; logger?: Logger }) {
    this.stateManager = deps.stateManager;
    this.eventBus = deps.eventBus;
    this.logger = deps.logger || new Logger('info', 'ProgressService');
  }

  /**
   * Check if service is attached
   */
  isAttached(): boolean {
    return this.attached;
  }

  /**
   * Attach to EventBus and start listening for workflow events.
   * Idempotent - safe to call multiple times.
   */
  attach(): void {
    if (this.attached) {
      this.logger.debug('ProgressService already attached, skipping');
      return;
    }

    this.logger.debug('Attaching to EventBus');

    // TaskGraph node events
    this.subscriptions.push(
      this.eventBus.on('taskgraph:node:started', (e) => this.handleNodeStarted(e))
    );
    this.subscriptions.push(
      this.eventBus.on('taskgraph:node:completed', (e) => this.handleNodeCompleted(e))
    );
    this.subscriptions.push(
      this.eventBus.on('taskgraph:node:failed', (e) => this.handleNodeFailed(e))
    );
    this.subscriptions.push(
      this.eventBus.on('taskgraph:node:skipped', (e) => this.handleNodeSkipped(e))
    );
    this.subscriptions.push(
      this.eventBus.on('taskgraph:node:blocked', (e) => this.handleNodeBlocked(e))
    );
    this.subscriptions.push(
      this.eventBus.on('taskgraph:node:gated', (e) => this.handleNodeGated(e))
    );
    this.subscriptions.push(
      this.eventBus.on('taskgraph:node:bypass_gates', (e) => this.handleNodeBypassGates(e))
    );

    // Workflow completion
    this.subscriptions.push(
      this.eventBus.on('taskgraph:workflow:completed', (e) => this.handleWorkflowCompleted(e))
    );

    // Gate events
    this.subscriptions.push(
      this.eventBus.on('gate:passed', (e) => this.handleGatePassed(e))
    );
    this.subscriptions.push(
      this.eventBus.on('gate:blocked', (e) => this.handleGateBlocked(e))
    );

    // Testing failure (for observability)
    this.subscriptions.push(
      this.eventBus.on('testing:failure', (e) => this.handleTestingFailure(e))
    );

    this.attached = true;
    this.logger.info('ProgressService attached, listening for workflow events');
  }

  /**
   * Detach from EventBus
   */
  detach(): void {
    for (const subId of this.subscriptions) {
      this.eventBus.off(subId);
    }
    this.subscriptions = [];
    this.attached = false;
    this.logger.info('ProgressService detached');
  }

  /**
   * Get current progress snapshot
   */
  getSnapshot(): ProgressSnapshot {
    const progress = this.stateManager.getProgress();
    const summary = this.calculateSummary(progress.nodeStates);

    return {
      workflowId: progress.activeWorkflowId,
      graphId: progress.activeGraphId,
      summary,
      nodeStates: progress.nodeStates,
      lastBlocked: progress.lastBlocked,
      updatedAt: progress.lastUpdatedAt,
    };
  }

  /**
   * Get list of blockers sorted by priority
   */
  getBlockers(): BlockerEntry[] {
    const progress = this.stateManager.getProgress();
    const blockers: BlockerEntry[] = [];

    // Find all blocked nodes
    for (const [nodeId, state] of Object.entries(progress.nodeStates)) {
      if (state === 'blocked') {
        const isLastBlocked = progress.lastBlocked?.nodeId === nodeId;
        blockers.push({
          nodeId,
          reason: isLastBlocked ? progress.lastBlocked!.reason : 'Blocked by gates',
          priority: isLastBlocked ? 1 : 2,
          missingEvidence: isLastBlocked ? progress.lastBlocked!.missingEvidence : undefined,
          failingEvidence: isLastBlocked ? progress.lastBlocked!.failingEvidence : undefined,
          nextToolCalls: isLastBlocked ? progress.lastBlocked!.nextToolCalls : undefined,
        });
      }
    }

    // Sort by priority (lower = higher priority)
    return blockers.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Clear progress state
   */
  clear(): void {
    this.stateManager.clearProgress();
    this.emitProgressUpdated();
  }

  /**
   * Set active workflow
   */
  setActiveWorkflow(workflowId: string, graphId?: string): void {
    this.stateManager.setProgress({
      activeWorkflowId: workflowId,
      activeGraphId: graphId,
      nodeStates: {},
    });
    this.emitProgressUpdated();
  }

  // ═══════════════════════════════════════════════════════════════
  //                      EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════

  private handleNodeStarted(event: CCGEvent): void {
    const data = event.data as { nodeId?: string; workflowId?: string } | undefined;
    if (!data?.nodeId) return;

    this.stateManager.setNodeState(data.nodeId, 'running');

    // Update active workflow if provided
    if (data.workflowId) {
      const progress = this.stateManager.getProgress();
      if (!progress.activeWorkflowId) {
        this.stateManager.setProgress({ activeWorkflowId: data.workflowId });
      }
    }

    // Clear lastBlocked if this node was blocked
    const progress = this.stateManager.getProgress();
    if (progress.lastBlocked?.nodeId === data.nodeId) {
      this.stateManager.setLastBlocked(undefined);
    }

    this.emitProgressUpdated();
  }

  private handleNodeCompleted(event: CCGEvent): void {
    const data = event.data as { nodeId?: string } | undefined;
    if (!data?.nodeId) return;

    this.stateManager.setNodeState(data.nodeId, 'done');
    this.emitProgressUpdated();
  }

  private handleNodeFailed(event: CCGEvent): void {
    const data = event.data as { nodeId?: string; error?: string } | undefined;
    if (!data?.nodeId) return;

    this.stateManager.setNodeState(data.nodeId, 'failed');

    // Set lastBlocked info
    this.stateManager.setLastBlocked({
      nodeId: data.nodeId,
      reason: data.error || 'Node execution failed',
    });

    this.emitProgressUpdated();
  }

  private handleNodeSkipped(event: CCGEvent): void {
    const data = event.data as { nodeId?: string } | undefined;
    if (!data?.nodeId) return;

    this.stateManager.setNodeState(data.nodeId, 'skipped');
    this.emitProgressUpdated();
  }

  private handleNodeBlocked(event: CCGEvent): void {
    const data = event.data as {
      nodeId?: string;
      reason?: string;
      missingEvidence?: string[];
      failingEvidence?: string[];
      nextToolCalls?: string[];
    } | undefined;
    if (!data?.nodeId) return;

    this.stateManager.setNodeState(data.nodeId, 'blocked');

    // Set detailed blocked info
    this.stateManager.setLastBlocked({
      nodeId: data.nodeId,
      reason: data.reason || 'Node blocked by gates',
      missingEvidence: data.missingEvidence,
      failingEvidence: data.failingEvidence,
      nextToolCalls: data.nextToolCalls,
    });

    this.emitProgressUpdated();
  }

  private handleNodeGated(event: CCGEvent): void {
    const data = event.data as {
      nodeId?: string;
      missingEvidence?: string[];
      failingEvidence?: string[];
      nextToolCalls?: string[];
    } | undefined;
    if (!data?.nodeId) return;

    this.stateManager.setNodeState(data.nodeId, 'blocked');

    // Build next tool calls based on missing evidence
    const nextToolCalls = data.nextToolCalls || [];
    if (!nextToolCalls.length) {
      if (data.missingEvidence?.includes('guard')) {
        nextToolCalls.push('guard_validate');
      }
      if (data.missingEvidence?.includes('test')) {
        nextToolCalls.push('testing_run');
      }
    }

    this.stateManager.setLastBlocked({
      nodeId: data.nodeId,
      reason: 'Gate requirements not met',
      missingEvidence: data.missingEvidence,
      failingEvidence: data.failingEvidence,
      nextToolCalls,
    });

    this.emitProgressUpdated();
  }

  private handleNodeBypassGates(event: CCGEvent): void {
    const data = event.data as { nodeId?: string } | undefined;
    if (!data?.nodeId) return;

    // Node completed with bypass - mark as done
    this.stateManager.setNodeState(data.nodeId, 'done');
    this.emitProgressUpdated();
  }

  private handleWorkflowCompleted(event: CCGEvent): void {
    const data = event.data as { workflowId?: string } | undefined;

    // Clear lastBlocked on workflow completion
    this.stateManager.setLastBlocked(undefined);

    this.logger.debug('Workflow completed', { workflowId: data?.workflowId });
    this.emitProgressUpdated();
  }

  private handleGatePassed(event: CCGEvent): void {
    const data = event.data as { nodeId?: string } | undefined;
    if (!data?.nodeId) return;

    // If this node was blocked, it's now done
    const progress = this.stateManager.getProgress();
    if (progress.nodeStates[data.nodeId] === 'blocked') {
      this.stateManager.setNodeState(data.nodeId, 'done');
    }

    // Clear lastBlocked if it was for this node
    if (progress.lastBlocked?.nodeId === data.nodeId) {
      this.stateManager.setLastBlocked(undefined);
    }

    this.emitProgressUpdated();
  }

  private handleGateBlocked(event: CCGEvent): void {
    const data = event.data as {
      nodeId?: string;
      missingEvidence?: string[];
      failingEvidence?: string[];
    } | undefined;
    if (!data?.nodeId) return;

    this.stateManager.setNodeState(data.nodeId, 'blocked');

    const nextToolCalls: string[] = [];
    if (data.missingEvidence?.includes('guard')) {
      nextToolCalls.push('guard_validate');
    }
    if (data.missingEvidence?.includes('test')) {
      nextToolCalls.push('testing_run');
    }

    this.stateManager.setLastBlocked({
      nodeId: data.nodeId,
      reason: 'Gate blocked - evidence required',
      missingEvidence: data.missingEvidence,
      failingEvidence: data.failingEvidence,
      nextToolCalls,
    });

    this.emitProgressUpdated();
  }

  private handleTestingFailure(event: CCGEvent): void {
    // Log testing failure for observability, but don't change node states
    this.logger.debug('Testing failure recorded', { data: event.data });
  }

  // ═══════════════════════════════════════════════════════════════
  //                      HELPERS
  // ═══════════════════════════════════════════════════════════════

  private calculateSummary(
    nodeStates: Record<string, WorkflowNodeState>
  ): ProgressSnapshot['summary'] {
    const summary = {
      total: 0,
      done: 0,
      running: 0,
      blocked: 0,
      pending: 0,
      failed: 0,
      skipped: 0,
    };

    for (const state of Object.values(nodeStates)) {
      summary.total++;
      switch (state) {
        case 'done':
          summary.done++;
          break;
        case 'running':
          summary.running++;
          break;
        case 'blocked':
          summary.blocked++;
          break;
        case 'pending':
          summary.pending++;
          break;
        case 'failed':
          summary.failed++;
          break;
        case 'skipped':
          summary.skipped++;
          break;
      }
    }

    return summary;
  }

  private emitProgressUpdated(): void {
    const progress = this.stateManager.getProgress();
    const summary = this.calculateSummary(progress.nodeStates);

    // Emit metadata-only event
    this.eventBus.emit({
      type: 'progress:updated',
      timestamp: new Date(),
      data: {
        workflowId: progress.activeWorkflowId,
        updatedAt: progress.lastUpdatedAt,
        summary,
        hasBlockers: !!progress.lastBlocked,
      },
      source: 'ProgressService',
    });
  }
}

// ═══════════════════════════════════════════════════════════════
//                      SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════

let globalProgressService: ProgressService | null = null;

export function getGlobalProgressService(deps?: {
  stateManager: StateManager;
  eventBus: EventBus;
  logger?: Logger;
}): ProgressService | null {
  if (!globalProgressService && deps) {
    globalProgressService = new ProgressService(deps);
  }
  return globalProgressService;
}

export function resetGlobalProgressService(): void {
  if (globalProgressService) {
    globalProgressService.detach();
  }
  globalProgressService = null;
}
