// src/modules/workflow/workflow.service.ts
import { writeFileSync, readFileSync, existsSync, readdirSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { v4 as uuid } from 'uuid';
export class WorkflowService {
    config;
    eventBus;
    logger;
    projectRoot;
    tasks = new Map();
    currentTaskId = null;
    tasksDir;
    constructor(config, eventBus, logger, projectRoot = process.cwd()) {
        this.config = config;
        this.eventBus = eventBus;
        this.logger = logger;
        this.projectRoot = projectRoot;
        this.tasksDir = join(projectRoot, '.ccg', 'tasks');
    }
    async initialize() {
        if (!this.config.enabled)
            return;
        // Ensure tasks directory exists
        if (!existsSync(this.tasksDir)) {
            mkdirSync(this.tasksDir, { recursive: true });
        }
        await this.loadTasks();
        // Auto-cleanup old completed tasks (enabled by default)
        if (this.config.autoCleanupEnabled !== false) {
            await this.cleanupCompletedTasks();
        }
        // Resume in-progress task if any
        const inProgress = Array.from(this.tasks.values()).find(t => t.status === 'in_progress');
        if (inProgress) {
            this.currentTaskId = inProgress.id;
            this.logger.info(`Resumed task: ${inProgress.name}`);
        }
        this.logger.info(`Workflow module initialized with ${this.tasks.size} tasks`);
    }
    // ═══════════════════════════════════════════════════════════════
    //                      TASK CRUD
    // ═══════════════════════════════════════════════════════════════
    async createTask(params) {
        const task = {
            id: uuid(),
            name: params.name,
            description: params.description,
            status: 'pending',
            progress: 0,
            priority: params.priority || 'medium',
            startedAt: new Date(),
            updatedAt: new Date(),
            parentId: params.parentId,
            subtasks: [],
            estimatedTokens: params.estimatedTokens,
            checkpoints: [],
            notes: [],
            filesAffected: [],
            tags: params.tags || [],
        };
        this.tasks.set(task.id, task);
        // Add to parent's subtasks if applicable
        if (task.parentId) {
            const parent = this.tasks.get(task.parentId);
            if (parent) {
                parent.subtasks.push(task.id);
                await this.saveTask(parent);
            }
        }
        await this.saveTask(task);
        this.logger.info(`Task created: ${task.name} (${task.id})`);
        return task;
    }
    async startTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task) {
            this.logger.error(`Task not found: ${taskId}`);
            return null;
        }
        // Pause current task if any
        if (this.currentTaskId && this.currentTaskId !== taskId) {
            await this.pauseTask(this.currentTaskId);
        }
        task.status = 'in_progress';
        task.updatedAt = new Date();
        this.currentTaskId = taskId;
        await this.saveTask(task);
        this.eventBus.emit({
            type: 'task:start',
            timestamp: new Date(),
            data: { task },
            source: 'WorkflowService',
        });
        this.logger.info(`Task started: ${task.name}`);
        return task;
    }
    async updateTask(taskId, params) {
        const task = this.tasks.get(taskId);
        if (!task)
            return null;
        if (params.status !== undefined)
            task.status = params.status;
        if (params.progress !== undefined)
            task.progress = Math.min(100, Math.max(0, params.progress));
        if (params.description !== undefined)
            task.description = params.description;
        if (params.priority !== undefined)
            task.priority = params.priority;
        task.updatedAt = new Date();
        await this.saveTask(task);
        this.eventBus.emit({
            type: 'task:progress',
            timestamp: new Date(),
            data: { task },
            source: 'WorkflowService',
        });
        return task;
    }
    async completeTask(taskId, actualTokens) {
        const task = this.tasks.get(taskId);
        if (!task)
            return null;
        task.status = 'completed';
        task.progress = 100;
        task.completedAt = new Date();
        task.updatedAt = new Date();
        if (actualTokens)
            task.actualTokens = actualTokens;
        if (this.currentTaskId === taskId) {
            this.currentTaskId = null;
        }
        await this.saveTask(task);
        this.eventBus.emit({
            type: 'task:complete',
            timestamp: new Date(),
            data: { task },
            source: 'WorkflowService',
        });
        this.logger.info(`Task completed: ${task.name}`);
        return task;
    }
    async pauseTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task)
            return null;
        if (task.status === 'in_progress') {
            task.status = 'paused';
            task.updatedAt = new Date();
            if (this.currentTaskId === taskId) {
                this.currentTaskId = null;
            }
            await this.saveTask(task);
            this.logger.info(`Task paused: ${task.name}`);
        }
        return task;
    }
    async failTask(taskId, reason) {
        const task = this.tasks.get(taskId);
        if (!task)
            return null;
        task.status = 'failed';
        task.updatedAt = new Date();
        if (reason) {
            task.notes.push({
                id: uuid(),
                content: `Failed: ${reason}`,
                type: 'note',
                createdAt: new Date(),
            });
        }
        if (this.currentTaskId === taskId) {
            this.currentTaskId = null;
        }
        await this.saveTask(task);
        this.eventBus.emit({
            type: 'task:fail',
            timestamp: new Date(),
            data: { task },
            source: 'WorkflowService',
        });
        return task;
    }
    // ═══════════════════════════════════════════════════════════════
    //                      TASK NOTES & FILES
    // ═══════════════════════════════════════════════════════════════
    async addNote(taskId, content, type = 'note') {
        const task = this.tasks.get(taskId);
        if (!task)
            return null;
        const note = {
            id: uuid(),
            content,
            type,
            createdAt: new Date(),
        };
        task.notes.push(note);
        task.updatedAt = new Date();
        await this.saveTask(task);
        return note;
    }
    async addAffectedFile(taskId, filePath) {
        const task = this.tasks.get(taskId);
        if (!task)
            return false;
        if (!task.filesAffected.includes(filePath)) {
            task.filesAffected.push(filePath);
            task.updatedAt = new Date();
            await this.saveTask(task);
        }
        return true;
    }
    async addCheckpoint(taskId, checkpointId) {
        const task = this.tasks.get(taskId);
        if (!task)
            return false;
        task.checkpoints.push(checkpointId);
        task.updatedAt = new Date();
        await this.saveTask(task);
        return true;
    }
    // ═══════════════════════════════════════════════════════════════
    //                      TASK QUERIES
    // ═══════════════════════════════════════════════════════════════
    getTask(taskId) {
        return this.tasks.get(taskId);
    }
    getCurrentTask() {
        return this.currentTaskId ? this.tasks.get(this.currentTaskId) : undefined;
    }
    getTasks(filter) {
        let tasks = Array.from(this.tasks.values());
        if (filter) {
            if (filter.status) {
                const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
                tasks = tasks.filter(t => statuses.includes(t.status));
            }
            if (filter.priority) {
                const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
                tasks = tasks.filter(t => priorities.includes(t.priority));
            }
            if (filter.tags && filter.tags.length > 0) {
                tasks = tasks.filter(t => filter.tags.some(tag => t.tags.includes(tag)));
            }
            if (filter.parentId !== undefined) {
                tasks = tasks.filter(t => t.parentId === filter.parentId);
            }
        }
        // Sort by priority then by date
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        tasks.sort((a, b) => {
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0)
                return priorityDiff;
            return b.updatedAt.getTime() - a.updatedAt.getTime();
        });
        return tasks;
    }
    getTaskList() {
        return this.getTasks().map(t => ({
            id: t.id,
            name: t.name,
            status: t.status,
            progress: t.progress,
            priority: t.priority,
        }));
    }
    getPendingTasks() {
        return this.getTasks({ status: ['pending', 'paused', 'blocked'] });
    }
    getStatus() {
        const tasks = Array.from(this.tasks.values());
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return {
            currentTask: this.getCurrentTask(),
            pendingCount: tasks.filter(t => t.status === 'pending').length,
            inProgressCount: tasks.filter(t => t.status === 'in_progress').length,
            completedToday: tasks.filter(t => t.status === 'completed' &&
                t.completedAt &&
                t.completedAt >= today).length,
            totalTasks: tasks.length,
        };
    }
    // ═══════════════════════════════════════════════════════════════
    //                      PERSISTENCE
    // ═══════════════════════════════════════════════════════════════
    async loadTasks() {
        if (!existsSync(this.tasksDir)) {
            return;
        }
        const files = readdirSync(this.tasksDir).filter(f => f.endsWith('.json'));
        for (const file of files) {
            try {
                const path = join(this.tasksDir, file);
                const data = JSON.parse(readFileSync(path, 'utf-8'));
                // Convert date strings back to Date objects
                const task = {
                    ...data,
                    startedAt: new Date(data.startedAt),
                    updatedAt: new Date(data.updatedAt),
                    completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
                    notes: data.notes.map((n) => ({
                        ...n,
                        createdAt: new Date(n.createdAt),
                    })),
                };
                this.tasks.set(task.id, task);
            }
            catch (error) {
                this.logger.warn(`Failed to load task: ${file}`);
            }
        }
    }
    async saveTask(task) {
        if (!existsSync(this.tasksDir)) {
            mkdirSync(this.tasksDir, { recursive: true });
        }
        const path = join(this.tasksDir, `${task.id}.json`);
        writeFileSync(path, JSON.stringify(task, null, 2));
    }
    async saveTasks() {
        for (const task of this.tasks.values()) {
            await this.saveTask(task);
        }
    }
    async loadPendingTasks() {
        return this.getPendingTasks();
    }
    // ═══════════════════════════════════════════════════════════════
    //                      CLEANUP
    // ═══════════════════════════════════════════════════════════════
    /**
     * Clean up old completed tasks based on config
     * - Removes tasks older than retentionDays (default: 1 day)
     * - Keeps only maxCompletedTasks most recent (default: 10)
     */
    async cleanupCompletedTasks() {
        const retentionDays = this.config.completedRetentionDays ?? 1;
        const maxCompleted = this.config.maxCompletedTasks ?? 10;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        // Get completed tasks sorted by completion date (newest first)
        const completedTasks = Array.from(this.tasks.values())
            .filter(t => t.status === 'completed' || t.status === 'failed')
            .sort((a, b) => {
            const aDate = a.completedAt || a.updatedAt;
            const bDate = b.completedAt || b.updatedAt;
            return bDate.getTime() - aDate.getTime();
        });
        const tasksToDelete = [];
        completedTasks.forEach((task, index) => {
            const taskDate = task.completedAt || task.updatedAt;
            // Delete if older than retention period OR exceeds max count
            if (taskDate < cutoffDate || index >= maxCompleted) {
                tasksToDelete.push(task.id);
            }
        });
        // Delete tasks
        for (const taskId of tasksToDelete) {
            await this.deleteTask(taskId);
        }
        if (tasksToDelete.length > 0) {
            this.logger.info(`Cleaned up ${tasksToDelete.length} old completed tasks`);
        }
        return tasksToDelete.length;
    }
    /**
     * Delete a specific task by ID
     */
    async deleteTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task)
            return false;
        // Remove from parent's subtasks if applicable
        if (task.parentId) {
            const parent = this.tasks.get(task.parentId);
            if (parent) {
                parent.subtasks = parent.subtasks.filter(id => id !== taskId);
                await this.saveTask(parent);
            }
        }
        // Delete file
        const filePath = join(this.tasksDir, `${taskId}.json`);
        if (existsSync(filePath)) {
            unlinkSync(filePath);
        }
        // Remove from memory
        this.tasks.delete(taskId);
        if (this.currentTaskId === taskId) {
            this.currentTaskId = null;
        }
        return true;
    }
    /**
     * Clear all completed tasks
     */
    async clearCompletedTasks() {
        const completedTasks = Array.from(this.tasks.values())
            .filter(t => t.status === 'completed' || t.status === 'failed');
        for (const task of completedTasks) {
            await this.deleteTask(task.id);
        }
        this.logger.info(`Cleared ${completedTasks.length} completed tasks`);
        return completedTasks.length;
    }
    /**
     * Clear all tasks (use with caution)
     */
    async clearAllTasks() {
        const count = this.tasks.size;
        for (const taskId of this.tasks.keys()) {
            await this.deleteTask(taskId);
        }
        this.logger.info(`Cleared all ${count} tasks`);
        return count;
    }
}
//# sourceMappingURL=workflow.service.js.map