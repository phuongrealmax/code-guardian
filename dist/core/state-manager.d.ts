import { Logger } from './logger.js';
import { EventBus } from './event-bus.js';
export interface Session {
    id: string;
    startedAt: Date;
    endedAt?: Date;
    projectPath: string;
    status: SessionStatus;
    tokenUsage: TokenUsage;
    currentTaskId?: string;
    metadata: Record<string, unknown>;
}
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
export declare class StateManager {
    private state;
    private statePath;
    private logger;
    private eventBus?;
    private autoSaveInterval?;
    constructor(projectRoot?: string, logger?: Logger, eventBus?: EventBus);
    /**
     * Create a new session
     */
    createSession(projectPath?: string): Session;
    /**
     * Set session data
     */
    setSession(sessionData: Partial<Session>): void;
    /**
     * Get current session
     */
    getSession(): Session | undefined;
    /**
     * End current session
     */
    endSession(): Session | undefined;
    /**
     * Pause current session
     */
    pauseSession(): void;
    /**
     * Resume current session
     */
    resumeSession(): void;
    /**
     * Check if session is active
     */
    isSessionActive(): boolean;
    /**
     * Update token usage
     */
    updateTokenUsage(used: number, estimated?: number): TokenUsage | undefined;
    /**
     * Get token usage
     */
    getTokenUsage(): TokenUsage | undefined;
    /**
     * Set current task
     */
    setCurrentTask(taskId: string | undefined): void;
    /**
     * Get current task ID
     */
    getCurrentTaskId(): string | undefined;
    /**
     * Increment a stat counter
     */
    incrementStat(stat: keyof SessionStats, amount?: number): void;
    /**
     * Get all stats
     */
    getStats(): SessionStats;
    /**
     * Reset stats
     */
    resetStats(): void;
    /**
     * Set session metadata
     */
    setMetadata(key: string, value: unknown): void;
    /**
     * Get session metadata
     */
    getMetadata<T = unknown>(key: string): T | undefined;
    /**
     * Get install ID (unique per installation)
     */
    getInstallId(): string;
    /**
     * Check if first run
     */
    isFirstRun(): boolean;
    /**
     * Get last session ID
     */
    getLastSessionId(): string | undefined;
    /**
     * Get entire state (for debugging)
     */
    getFullState(): GlobalState;
    /**
     * Load state from file
     */
    load(): void;
    /**
     * Save state to file
     */
    save(): void;
    /**
     * Reset state to defaults
     */
    reset(): void;
    /**
     * Clean up resources
     */
    dispose(): void;
    private getDefaultState;
    private getDefaultStats;
    private startAutoSave;
}
export declare function getGlobalStateManager(projectRoot?: string): StateManager;
export declare function resetGlobalStateManager(): void;
//# sourceMappingURL=state-manager.d.ts.map