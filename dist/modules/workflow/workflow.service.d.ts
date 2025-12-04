import { WorkflowModuleConfig } from '../../core/types.js';
import { EventBus } from '../../core/event-bus.js';
import { Logger } from '../../core/logger.js';
import { Task, TaskNote, TaskCreateParams, TaskUpdateParams, TaskFilter, WorkflowStatus, TaskSummary } from './workflow.types.js';
export declare class WorkflowService {
    private config;
    private eventBus;
    private logger;
    private projectRoot;
    private tasks;
    private currentTaskId;
    private tasksDir;
    constructor(config: WorkflowModuleConfig, eventBus: EventBus, logger: Logger, projectRoot?: string);
    initialize(): Promise<void>;
    createTask(params: TaskCreateParams): Promise<Task>;
    startTask(taskId: string): Promise<Task | null>;
    updateTask(taskId: string, params: TaskUpdateParams): Promise<Task | null>;
    completeTask(taskId: string, actualTokens?: number): Promise<Task | null>;
    pauseTask(taskId: string): Promise<Task | null>;
    failTask(taskId: string, reason?: string): Promise<Task | null>;
    addNote(taskId: string, content: string, type?: TaskNote['type']): Promise<TaskNote | null>;
    addAffectedFile(taskId: string, filePath: string): Promise<boolean>;
    addCheckpoint(taskId: string, checkpointId: string): Promise<boolean>;
    getTask(taskId: string): Task | undefined;
    getCurrentTask(): Task | undefined;
    getTasks(filter?: TaskFilter): Task[];
    getTaskList(): TaskSummary[];
    getPendingTasks(): Task[];
    getStatus(): WorkflowStatus;
    private loadTasks;
    private saveTask;
    saveTasks(): Promise<void>;
    loadPendingTasks(): Promise<Task[]>;
    /**
     * Clean up old completed tasks based on config
     * - Removes tasks older than retentionDays (default: 1 day)
     * - Keeps only maxCompletedTasks most recent (default: 10)
     */
    cleanupCompletedTasks(): Promise<number>;
    /**
     * Delete a specific task by ID
     */
    deleteTask(taskId: string): Promise<boolean>;
    /**
     * Clear all completed tasks
     */
    clearCompletedTasks(): Promise<number>;
    /**
     * Clear all tasks (use with caution)
     */
    clearAllTasks(): Promise<number>;
}
//# sourceMappingURL=workflow.service.d.ts.map