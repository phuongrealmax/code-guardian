// src/core/state-manager.ts
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { randomUUID } from 'crypto';
import { Logger } from './logger.js';
// ═══════════════════════════════════════════════════════════════
//                      STATE MANAGER CLASS
// ═══════════════════════════════════════════════════════════════
export class StateManager {
    state;
    statePath;
    logger;
    eventBus;
    autoSaveInterval;
    constructor(projectRoot = process.cwd(), logger, eventBus) {
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
    createSession(projectPath) {
        const session = {
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
    setSession(sessionData) {
        if (!this.state.session) {
            this.createSession(sessionData.projectPath);
        }
        this.state.session = {
            ...this.state.session,
            ...sessionData,
        };
        this.save();
    }
    /**
     * Get current session
     */
    getSession() {
        return this.state.session;
    }
    /**
     * End current session
     */
    endSession() {
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
    pauseSession() {
        if (this.state.session) {
            this.state.session.status = 'paused';
            this.save();
        }
    }
    /**
     * Resume current session
     */
    resumeSession() {
        if (this.state.session && this.state.session.status === 'paused') {
            this.state.session.status = 'active';
            this.save();
        }
    }
    /**
     * Check if session is active
     */
    isSessionActive() {
        return this.state.session?.status === 'active';
    }
    // ═══════════════════════════════════════════════════════════════
    //                      TOKEN TRACKING
    // ═══════════════════════════════════════════════════════════════
    /**
     * Update token usage
     */
    updateTokenUsage(used, estimated) {
        if (!this.state.session) {
            return undefined;
        }
        this.state.session.tokenUsage.used = used;
        if (estimated !== undefined) {
            this.state.session.tokenUsage.estimated = estimated;
        }
        this.state.session.tokenUsage.percentage = Math.round((used / this.state.session.tokenUsage.estimated) * 100);
        this.state.session.tokenUsage.lastUpdated = new Date();
        // Don't save on every token update (too frequent)
        // Will be saved by auto-save
        return this.state.session.tokenUsage;
    }
    /**
     * Get token usage
     */
    getTokenUsage() {
        return this.state.session?.tokenUsage;
    }
    // ═══════════════════════════════════════════════════════════════
    //                      TASK TRACKING
    // ═══════════════════════════════════════════════════════════════
    /**
     * Set current task
     */
    setCurrentTask(taskId) {
        if (this.state.session) {
            this.state.session.currentTaskId = taskId;
            this.save();
        }
    }
    /**
     * Get current task ID
     */
    getCurrentTaskId() {
        return this.state.session?.currentTaskId;
    }
    // ═══════════════════════════════════════════════════════════════
    //                      STATISTICS
    // ═══════════════════════════════════════════════════════════════
    /**
     * Increment a stat counter
     */
    incrementStat(stat, amount = 1) {
        this.state.stats[stat] += amount;
    }
    /**
     * Get all stats
     */
    getStats() {
        return { ...this.state.stats };
    }
    /**
     * Reset stats
     */
    resetStats() {
        this.state.stats = this.getDefaultStats();
        this.save();
    }
    // ═══════════════════════════════════════════════════════════════
    //                      METADATA
    // ═══════════════════════════════════════════════════════════════
    /**
     * Set session metadata
     */
    setMetadata(key, value) {
        if (this.state.session) {
            this.state.session.metadata[key] = value;
        }
    }
    /**
     * Get session metadata
     */
    getMetadata(key) {
        return this.state.session?.metadata[key];
    }
    // ═══════════════════════════════════════════════════════════════
    //                      GLOBAL STATE
    // ═══════════════════════════════════════════════════════════════
    /**
     * Get install ID (unique per installation)
     */
    getInstallId() {
        return this.state.installId;
    }
    /**
     * Check if first run
     */
    isFirstRun() {
        return this.state.firstRun;
    }
    /**
     * Get last session ID
     */
    getLastSessionId() {
        return this.state.lastSessionId;
    }
    /**
     * Get entire state (for debugging)
     */
    getFullState() {
        return { ...this.state };
    }
    // ═══════════════════════════════════════════════════════════════
    //                      PERSISTENCE
    // ═══════════════════════════════════════════════════════════════
    /**
     * Load state from file
     */
    load() {
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
                this.state.session.tokenUsage.lastUpdated = new Date(this.state.session.tokenUsage.lastUpdated);
            }
            this.logger.debug('State loaded');
        }
        catch (error) {
            this.logger.error('Failed to load state', error);
        }
    }
    /**
     * Save state to file
     */
    save() {
        try {
            const dir = dirname(this.statePath);
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }
            writeFileSync(this.statePath, JSON.stringify(this.state, null, 2), 'utf-8');
            this.logger.debug('State saved');
        }
        catch (error) {
            this.logger.error('Failed to save state', error);
        }
    }
    /**
     * Reset state to defaults
     */
    reset() {
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
    dispose() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        this.save();
    }
    // ═══════════════════════════════════════════════════════════════
    //                      PRIVATE METHODS
    // ═══════════════════════════════════════════════════════════════
    getDefaultState() {
        return {
            installId: randomUUID(),
            firstRun: true,
            stats: this.getDefaultStats(),
        };
    }
    getDefaultStats() {
        return {
            totalSessions: 0,
            totalTasksCompleted: 0,
            totalFilesModified: 0,
            totalTestsRun: 0,
            totalGuardBlocks: 0,
            totalCheckpoints: 0,
        };
    }
    startAutoSave() {
        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            if (this.state.session) {
                this.save();
            }
        }, 30000);
    }
}
// ═══════════════════════════════════════════════════════════════
//                      SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════
let globalStateManager = null;
export function getGlobalStateManager(projectRoot) {
    if (!globalStateManager) {
        globalStateManager = new StateManager(projectRoot);
    }
    return globalStateManager;
}
export function resetGlobalStateManager() {
    if (globalStateManager) {
        globalStateManager.dispose();
    }
    globalStateManager = null;
}
//# sourceMappingURL=state-manager.js.map