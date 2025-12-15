// src/core/state-manager.ts

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { randomUUID } from 'crypto';
import { Logger } from './logger.js';
import { EventBus } from './event-bus.js';
import type { GuardEvidence, TestEvidence, EvidenceState } from './completion-gates.js';
import type { WorkflowNodeState } from '../modules/auto-agent/task-graph.js';

// ═══════════════════════════════════════════════════════════════
//                      STATE TYPES
// ═══════════════════════════════════════════════════════════════

// Progress State (Sprint 9)
// Single workflow progress
export interface WorkflowProgress {
  /** Graph identifier or hash */
  graphId?: string;
  /** Node execution states */
  nodeStates: Record<string, WorkflowNodeState>;
  /** Last blocked node info */
  lastBlocked?: LastBlockedInfo;
  /** Last update timestamp */
  lastUpdatedAt: Date;
  /** Last accessed timestamp for LRU */
  lastAccessedAt: Date;
}

// Multi-workflow progress state (Sprint 10)
export interface ProgressState {
  /** Active workflow being executed */
  activeWorkflowId?: string;
  /** All tracked workflows (Map for LRU support) */
  workflows: Record<string, WorkflowProgress>;
  /** LRU order - most recent last */
  lruOrder: string[];
}

export interface LastBlockedInfo {
  nodeId: string;
  reason: string;
  missingEvidence?: string[];
  failingEvidence?: string[];
  nextToolCalls?: string[];
}

const MAX_NODE_STATES = 500;
const MAX_WORKFLOWS = 10; // LRU cap for multi-workflow support

export interface Session {
  id: string;
  startedAt: Date;
  endedAt?: Date;
  projectPath: string;
  status: SessionStatus;
  tokenUsage: TokenUsage;
  currentTaskId?: string;
  metadata: Record<string, unknown>;
  timeline?: SessionEvent[];
  evidence?: EvidenceState;
  progress?: ProgressState;
}

export interface SessionEvent {
  id: string;
  type: SessionEventType;
  timestamp: Date;
  data: Record<string, unknown>;
  summary?: string;
}

export type SessionEventType =
  | 'checkpoint_created'
  | 'checkpoint_restored'
  | 'task_started'
  | 'task_completed'
  | 'risk_detected'
  | 'guard_block'
  | 'governor_warning'
  | 'large_plan_detected'
  | 'workflow:gate_passed'
  | 'workflow:gate_pending'
  | 'workflow:gate_blocked';

export type SessionStatus = 'active' | 'paused' | 'ended';

export interface TokenUsage {
  used: number;
  estimated: number;
  percentage: number;
  lastUpdated: Date;
}

export interface GlobalState {
  session?: Session;
  lastSessionId?: string;
  installId: string;
  firstRun: boolean;
  stats: SessionStats;
}

export interface SessionStats {
  totalSessions: number;
  totalTasksCompleted: number;
  totalFilesModified: number;
  totalTestsRun: number;
  totalGuardBlocks: number;
  totalCheckpoints: number;
}

// ═══════════════════════════════════════════════════════════════
//                      STATE MANAGER CLASS
// ═══════════════════════════════════════════════════════════════

export class StateManager {
  private state: GlobalState;
  private statePath: string;
  private logger: Logger;
  private eventBus?: EventBus;
  private autoSaveInterval?: ReturnType<typeof setInterval>;

  constructor(
    projectRoot: string = process.cwd(),
    logger?: Logger,
    eventBus?: EventBus
  ) {
    this.statePath = join(projectRoot, '.ccg', 'state.json');
    this.logger = logger || new Logger('info', 'StateManager');
    this.eventBus = eventBus;

    // Initialize with defaults
    this.state = this.getDefaultState();

    // Load existing state
    this.load();

    // Start auto-save
    this.startAutoSave();
  }

  // ═══════════════════════════════════════════════════════════════
  //                      SESSION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  /**
   * Create a new session
   */
  createSession(projectPath?: string): Session {
    const session: Session = {
      id: randomUUID(),
      startedAt: new Date(),
      projectPath: projectPath || process.cwd(),
      status: 'active',
      tokenUsage: {
        used: 0,
        estimated: 200000,
        percentage: 0,
        lastUpdated: new Date(),
      },
      metadata: {},
      timeline: [],
    };

    this.state.session = session;
    this.state.lastSessionId = session.id;
    this.state.stats.totalSessions++;

    // Mark first run as done
    if (this.state.firstRun) {
      this.state.firstRun = false;
    }

    this.save();
    this.logger.info(`Session created: ${session.id}`);

    return session;
  }

  /**
   * Set session data
   */
  setSession(sessionData: Partial<Session>): void {
    if (!this.state.session) {
      this.createSession(sessionData.projectPath);
    }

    this.state.session = {
      ...this.state.session!,
      ...sessionData,
    };

    this.save();
  }

  /**
   * Get current session
   */
  getSession(): Session | undefined {
    return this.state.session;
  }

  /**
   * End current session
   */
  endSession(): Session | undefined {
    if (!this.state.session) {
      return undefined;
    }

    this.state.session.status = 'ended';
    this.state.session.endedAt = new Date();

    const session = { ...this.state.session };

    // Keep reference but clear current
    this.state.lastSessionId = session.id;
    this.state.session = undefined;

    this.save();
    this.logger.info(`Session ended: ${session.id}`);

    return session;
  }

  /**
   * Pause current session
   */
  pauseSession(): void {
    if (this.state.session) {
      this.state.session.status = 'paused';
      this.save();
    }
  }

  /**
   * Resume current session
   */
  resumeSession(): void {
    if (this.state.session && this.state.session.status === 'paused') {
      this.state.session.status = 'active';
      this.save();
    }
  }

  /**
   * Check if session is active
   */
  isSessionActive(): boolean {
    return this.state.session?.status === 'active';
  }

  // ═══════════════════════════════════════════════════════════════
  //                      TOKEN TRACKING
  // ═══════════════════════════════════════════════════════════════

  /**
   * Update token usage
   */
  updateTokenUsage(used: number, estimated?: number): TokenUsage | undefined {
    if (!this.state.session) {
      return undefined;
    }

    this.state.session.tokenUsage.used = used;
    if (estimated !== undefined) {
      this.state.session.tokenUsage.estimated = estimated;
    }
    this.state.session.tokenUsage.percentage = Math.round(
      (used / this.state.session.tokenUsage.estimated) * 100
    );
    this.state.session.tokenUsage.lastUpdated = new Date();

    // Don't save on every token update (too frequent)
    // Will be saved by auto-save

    return this.state.session.tokenUsage;
  }

  /**
   * Get token usage
   */
  getTokenUsage(): TokenUsage | undefined {
    return this.state.session?.tokenUsage;
  }

  // ═══════════════════════════════════════════════════════════════
  //                      TASK TRACKING
  // ═══════════════════════════════════════════════════════════════

  /**
   * Set current task
   */
  setCurrentTask(taskId: string | undefined): void {
    if (this.state.session) {
      this.state.session.currentTaskId = taskId;
      this.save();
    }
  }

  /**
   * Get current task ID
   */
  getCurrentTaskId(): string | undefined {
    return this.state.session?.currentTaskId;
  }

  // ═══════════════════════════════════════════════════════════════
  //                      SESSION TIMELINE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Add an event to the session timeline
   */
  addTimelineEvent(
    type: SessionEventType,
    data: Record<string, unknown>,
    summary?: string
  ): SessionEvent | undefined {
    if (!this.state.session) {
      return undefined;
    }

    if (!this.state.session.timeline) {
      this.state.session.timeline = [];
    }

    const event: SessionEvent = {
      id: randomUUID(),
      type,
      timestamp: new Date(),
      data,
      summary,
    };

    this.state.session.timeline.push(event);

    // Keep timeline size manageable (last 100 events)
    if (this.state.session.timeline.length > 100) {
      this.state.session.timeline = this.state.session.timeline.slice(-100);
    }

    // Emit event for real-time tracking
    if (this.eventBus) {
      this.eventBus.emit({
        type: 'session:event',
        timestamp: new Date(),
        data: { event },
        source: 'StateManager',
      });
    }

    this.save();
    return event;
  }

  /**
   * Get session timeline
   */
  getTimeline(): SessionEvent[] {
    return this.state.session?.timeline || [];
  }

  /**
   * Get timeline events by type
   */
  getTimelineByType(type: SessionEventType): SessionEvent[] {
    return (this.state.session?.timeline || []).filter(e => e.type === type);
  }

  // ═══════════════════════════════════════════════════════════════
  //                      STATISTICS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Increment a stat counter
   */
  incrementStat(stat: keyof SessionStats, amount: number = 1): void {
    this.state.stats[stat] += amount;
  }

  /**
   * Get all stats
   */
  getStats(): SessionStats {
    return { ...this.state.stats };
  }

  /**
   * Reset stats
   */
  resetStats(): void {
    this.state.stats = this.getDefaultStats();
    this.save();
  }

  // ═══════════════════════════════════════════════════════════════
  //                      METADATA
  // ═══════════════════════════════════════════════════════════════

  /**
   * Set session metadata
   */
  setMetadata(key: string, value: unknown): void {
    if (this.state.session) {
      this.state.session.metadata[key] = value;
    }
  }

  /**
   * Get session metadata
   */
  getMetadata<T = unknown>(key: string): T | undefined {
    return this.state.session?.metadata[key] as T | undefined;
  }

  // ═══════════════════════════════════════════════════════════════
  //                      EVIDENCE STATE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get current evidence state (for gate evaluation)
   */
  getEvidenceState(): EvidenceState {
    if (!this.state.session?.evidence) {
      return { lastGuardRun: null, lastTestRun: null };
    }
    return { ...this.state.session.evidence };
  }

  /**
   * Set guard verification evidence
   */
  setGuardEvidence(evidence: GuardEvidence | null): void {
    if (this.state.session) {
      if (!this.state.session.evidence) {
        this.state.session.evidence = { lastGuardRun: null, lastTestRun: null };
      }
      this.state.session.evidence.lastGuardRun = evidence;
      this.save();
      this.logger.debug('Guard evidence updated', { status: evidence?.status });
    }
  }

  /**
   * Set test verification evidence
   */
  setTestEvidence(evidence: TestEvidence | null): void {
    if (this.state.session) {
      if (!this.state.session.evidence) {
        this.state.session.evidence = { lastGuardRun: null, lastTestRun: null };
      }
      this.state.session.evidence.lastTestRun = evidence;
      this.save();
      this.logger.debug('Test evidence updated', { status: evidence?.status });
    }
  }

  /**
   * Clear all evidence (e.g., when starting new task)
   */
  clearEvidence(): void {
    if (this.state.session) {
      this.state.session.evidence = { lastGuardRun: null, lastTestRun: null };
      this.save();
      this.logger.debug('Evidence cleared');
    }
  }

  /**
   * Check if evidence exists for current task
   */
  hasEvidenceForTask(taskId: string): { hasGuard: boolean; hasTest: boolean } {
    const evidence = this.state.session?.evidence;
    return {
      hasGuard: evidence?.lastGuardRun?.taskId === taskId && evidence.lastGuardRun.status === 'passed',
      hasTest: evidence?.lastTestRun?.taskId === taskId && evidence.lastTestRun.status === 'passed',
    };
  }

  // ═══════════════════════════════════════════════════════════════
  //                      PROGRESS STATE (Sprint 9 + Sprint 10 Multi-workflow)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Initialize empty progress state
   */
  private initProgressState(): ProgressState {
    return {
      activeWorkflowId: undefined,
      workflows: {},
      lruOrder: [],
    };
  }

  /**
   * Initialize empty workflow progress
   */
  private initWorkflowProgress(graphId?: string): WorkflowProgress {
    const now = new Date();
    return {
      graphId,
      nodeStates: {},
      lastBlocked: undefined,
      lastUpdatedAt: now,
      lastAccessedAt: now,
    };
  }

  /**
   * Touch a workflow in LRU order (move to end = most recent)
   */
  private touchWorkflowLRU(workflowId: string): void {
    if (!this.state.session?.progress) return;

    const progress = this.state.session.progress;
    const idx = progress.lruOrder.indexOf(workflowId);
    if (idx > -1) {
      progress.lruOrder.splice(idx, 1);
    }
    progress.lruOrder.push(workflowId);

    // Update last accessed time
    if (progress.workflows[workflowId]) {
      progress.workflows[workflowId].lastAccessedAt = new Date();
    }
  }

  /**
   * Evict oldest workflow if over LRU cap
   */
  private evictOldestWorkflow(): void {
    if (!this.state.session?.progress) return;

    const progress = this.state.session.progress;
    while (progress.lruOrder.length > MAX_WORKFLOWS) {
      const oldestId = progress.lruOrder.shift();
      if (oldestId) {
        delete progress.workflows[oldestId];
        this.logger.debug('Evicted oldest workflow from progress', { workflowId: oldestId });
      }
    }
  }

  /**
   * Get current progress state (combined view of active workflow)
   * Backward compatible: returns single-workflow-like structure
   */
  getProgress(): ProgressState & { activeGraphId?: string; nodeStates: Record<string, WorkflowNodeState>; lastBlocked?: LastBlockedInfo; lastUpdatedAt: Date } {
    if (!this.state.session?.progress) {
      return {
        ...this.initProgressState(),
        activeGraphId: undefined,
        nodeStates: {},
        lastBlocked: undefined,
        lastUpdatedAt: new Date(),
      };
    }

    const progress = this.state.session.progress;
    const activeWorkflowId = progress.activeWorkflowId;
    const activeWorkflow = activeWorkflowId ? progress.workflows[activeWorkflowId] : undefined;

    // Return combined state for backward compatibility
    return {
      ...progress,
      activeGraphId: activeWorkflow?.graphId,
      nodeStates: activeWorkflow?.nodeStates ?? {},
      lastBlocked: activeWorkflow?.lastBlocked,
      lastUpdatedAt: activeWorkflow?.lastUpdatedAt ?? new Date(),
    };
  }

  /**
   * Get progress for a specific workflow
   */
  getWorkflowProgress(workflowId: string): WorkflowProgress | undefined {
    if (!this.state.session?.progress) return undefined;

    const workflow = this.state.session.progress.workflows[workflowId];
    if (workflow) {
      this.touchWorkflowLRU(workflowId);
    }
    return workflow;
  }

  /**
   * List all tracked workflow IDs (in LRU order, oldest first)
   */
  listWorkflows(): string[] {
    return [...(this.state.session?.progress?.lruOrder ?? [])];
  }

  /**
   * Set progress state (partial update)
   * Sprint 10: Now workflow-aware
   */
  setProgress(partial: Partial<ProgressState & { activeGraphId?: string; nodeStates?: Record<string, WorkflowNodeState> }>): void {
    if (!this.state.session) return;

    if (!this.state.session.progress) {
      this.state.session.progress = this.initProgressState();
    }

    const progress = this.state.session.progress;

    // Handle activeWorkflowId change
    if (partial.activeWorkflowId !== undefined) {
      progress.activeWorkflowId = partial.activeWorkflowId;

      // Ensure workflow exists
      if (partial.activeWorkflowId && !progress.workflows[partial.activeWorkflowId]) {
        progress.workflows[partial.activeWorkflowId] = this.initWorkflowProgress(partial.activeGraphId);
      }

      if (partial.activeWorkflowId) {
        this.touchWorkflowLRU(partial.activeWorkflowId);
        this.evictOldestWorkflow();
      }
    }

    // Update active workflow's nodeStates if provided
    const activeId = progress.activeWorkflowId;
    if (activeId && partial.nodeStates) {
      if (!progress.workflows[activeId]) {
        progress.workflows[activeId] = this.initWorkflowProgress();
      }
      progress.workflows[activeId].nodeStates = partial.nodeStates;
      progress.workflows[activeId].lastUpdatedAt = new Date();
    }

    this.save();
    this.logger.debug('Progress state updated', { activeWorkflowId: progress.activeWorkflowId });
  }

  /**
   * Clear progress state (all workflows or specific)
   */
  clearProgress(workflowId?: string): void {
    if (!this.state.session) return;

    if (workflowId) {
      // Clear specific workflow
      if (this.state.session.progress?.workflows[workflowId]) {
        delete this.state.session.progress.workflows[workflowId];
        const idx = this.state.session.progress.lruOrder.indexOf(workflowId);
        if (idx > -1) {
          this.state.session.progress.lruOrder.splice(idx, 1);
        }
        if (this.state.session.progress.activeWorkflowId === workflowId) {
          this.state.session.progress.activeWorkflowId = undefined;
        }
      }
    } else {
      // Clear all progress
      this.state.session.progress = this.initProgressState();
    }

    this.save();
    this.logger.debug('Progress state cleared', { workflowId: workflowId ?? 'all' });
  }

  /**
   * Set a single node's state for the active workflow
   */
  setNodeState(nodeId: string, state: WorkflowNodeState, workflowId?: string): void {
    if (!this.state.session) return;

    if (!this.state.session.progress) {
      this.state.session.progress = this.initProgressState();
    }

    const progress = this.state.session.progress;
    const targetId = workflowId ?? progress.activeWorkflowId;

    if (!targetId) {
      // No workflow context - use a default
      const defaultId = '__default__';
      if (!progress.workflows[defaultId]) {
        progress.workflows[defaultId] = this.initWorkflowProgress();
      }
      progress.workflows[defaultId].nodeStates[nodeId] = state;
      progress.workflows[defaultId].lastUpdatedAt = new Date();
      progress.activeWorkflowId = defaultId;
      this.touchWorkflowLRU(defaultId);
    } else {
      if (!progress.workflows[targetId]) {
        progress.workflows[targetId] = this.initWorkflowProgress();
      }
      progress.workflows[targetId].nodeStates[nodeId] = state;
      progress.workflows[targetId].lastUpdatedAt = new Date();
      this.touchWorkflowLRU(targetId);
    }

    // Cap nodeStates per workflow
    const workflow = progress.workflows[workflowId ?? progress.activeWorkflowId ?? '__default__'];
    if (workflow) {
      const nodeStateEntries = Object.entries(workflow.nodeStates);
      if (nodeStateEntries.length > MAX_NODE_STATES) {
        workflow.nodeStates = Object.fromEntries(
          nodeStateEntries.slice(-MAX_NODE_STATES)
        );
      }
    }

    this.evictOldestWorkflow();
    // Don't save on every node update (too frequent) - auto-save handles it
  }

  /**
   * Set last blocked info for active workflow
   */
  setLastBlocked(blockedInfo: LastBlockedInfo | undefined, workflowId?: string): void {
    if (!this.state.session) return;

    if (!this.state.session.progress) {
      this.state.session.progress = this.initProgressState();
    }

    const progress = this.state.session.progress;
    const targetId = workflowId ?? progress.activeWorkflowId ?? '__default__';

    if (!progress.workflows[targetId]) {
      progress.workflows[targetId] = this.initWorkflowProgress();
      if (!progress.activeWorkflowId) {
        progress.activeWorkflowId = targetId;
      }
    }

    progress.workflows[targetId].lastBlocked = blockedInfo;
    progress.workflows[targetId].lastUpdatedAt = new Date();
    this.touchWorkflowLRU(targetId);

    this.save();
    this.logger.debug('Last blocked info updated', {
      workflowId: targetId,
      nodeId: blockedInfo?.nodeId
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //                      GLOBAL STATE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get install ID (unique per installation)
   */
  getInstallId(): string {
    return this.state.installId;
  }

  /**
   * Check if first run
   */
  isFirstRun(): boolean {
    return this.state.firstRun;
  }

  /**
   * Get last session ID
   */
  getLastSessionId(): string | undefined {
    return this.state.lastSessionId;
  }

  /**
   * Get entire state (for debugging)
   */
  getFullState(): GlobalState {
    return { ...this.state };
  }

  // ═══════════════════════════════════════════════════════════════
  //                      PERSISTENCE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Load state from file
   */
  load(): void {
    if (!existsSync(this.statePath)) {
      this.logger.debug('No state file found, using defaults');
      return;
    }

    try {
      const content = readFileSync(this.statePath, 'utf-8');
      const loaded = JSON.parse(content);

      // Merge with defaults to handle new fields
      this.state = {
        ...this.getDefaultState(),
        ...loaded,
        stats: {
          ...this.getDefaultStats(),
          ...(loaded.stats || {}),
        },
      };

      // Convert date strings back to Date objects
      if (this.state.session) {
        this.state.session.startedAt = new Date(this.state.session.startedAt);
        if (this.state.session.endedAt) {
          this.state.session.endedAt = new Date(this.state.session.endedAt);
        }
        this.state.session.tokenUsage.lastUpdated = new Date(
          this.state.session.tokenUsage.lastUpdated
        );
      }

      this.logger.debug('State loaded');
    } catch (error) {
      this.logger.error('Failed to load state', error);
    }
  }

  /**
   * Save state to file
   */
  save(): void {
    try {
      const dir = dirname(this.statePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(this.statePath, JSON.stringify(this.state, null, 2), 'utf-8');
      this.logger.debug('State saved');
    } catch (error) {
      this.logger.error('Failed to save state', error);
    }
  }

  /**
   * Reset state to defaults
   */
  reset(): void {
    const installId = this.state.installId; // Keep install ID
    this.state = {
      ...this.getDefaultState(),
      installId,
      firstRun: false,
    };
    this.save();
    this.logger.info('State reset');
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.save();
  }

  // ═══════════════════════════════════════════════════════════════
  //                      PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════

  private getDefaultState(): GlobalState {
    return {
      installId: randomUUID(),
      firstRun: true,
      stats: this.getDefaultStats(),
    };
  }

  private getDefaultStats(): SessionStats {
    return {
      totalSessions: 0,
      totalTasksCompleted: 0,
      totalFilesModified: 0,
      totalTestsRun: 0,
      totalGuardBlocks: 0,
      totalCheckpoints: 0,
    };
  }

  private startAutoSave(): void {
    // Auto-save every 30 seconds
    this.autoSaveInterval = setInterval(() => {
      if (this.state.session) {
        this.save();
      }
    }, 30000);

    // Allow process to exit even if interval is pending
    // This prevents the CLI from hanging after commands complete
    this.autoSaveInterval.unref();
  }
}

// ═══════════════════════════════════════════════════════════════
//                      SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════

let globalStateManager: StateManager | null = null;

export function getGlobalStateManager(projectRoot?: string): StateManager {
  if (!globalStateManager) {
    globalStateManager = new StateManager(projectRoot);
  }
  return globalStateManager;
}

export function resetGlobalStateManager(): void {
  if (globalStateManager) {
    globalStateManager.dispose();
  }
  globalStateManager = null;
}
