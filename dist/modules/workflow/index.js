// src/modules/workflow/index.ts
import { WorkflowService } from './workflow.service.js';
import { getWorkflowTools } from './workflow.tools.js';
export class WorkflowModule {
    service;
    constructor(config, eventBus, logger, projectRoot) {
        this.service = new WorkflowService(config, eventBus, logger, projectRoot);
    }
    async initialize() {
        await this.service.initialize();
    }
    getTools() {
        return getWorkflowTools();
    }
    async handleTool(toolName, args) {
        switch (toolName) {
            case 'workflow_task_create':
                return this.service.createTask({
                    name: args.name,
                    description: args.description,
                    priority: args.priority,
                    parentId: args.parentId,
                    estimatedTokens: args.estimatedTokens,
                    tags: args.tags,
                });
            case 'workflow_task_start':
                return this.service.startTask(args.taskId);
            case 'workflow_task_update':
                return this.service.updateTask(args.taskId, {
                    progress: args.progress,
                    status: args.status,
                });
            case 'workflow_task_complete':
                return this.service.completeTask(args.taskId, args.actualTokens);
            case 'workflow_task_pause':
                return this.service.pauseTask(args.taskId);
            case 'workflow_task_fail':
                return this.service.failTask(args.taskId, args.reason);
            case 'workflow_task_note':
                return this.service.addNote(args.taskId, args.content, args.type || 'note');
            case 'workflow_task_list':
                return this.service.getTasks({
                    status: args.status,
                    priority: args.priority,
                });
            case 'workflow_current':
                return this.service.getCurrentTask();
            case 'workflow_status':
                return this.service.getStatus();
            case 'workflow_task_delete':
                return this.service.deleteTask(args.taskId);
            case 'workflow_cleanup': {
                const clearAll = args.clearAll;
                if (clearAll) {
                    return { deleted: await this.service.clearAllTasks(), type: 'all' };
                }
                else {
                    return { deleted: await this.service.clearCompletedTasks(), type: 'completed' };
                }
            }
            default:
                throw new Error(`Unknown workflow tool: ${toolName}`);
        }
    }
    getStatus() {
        return this.service.getStatus();
    }
    getTaskList() {
        return this.service.getTaskList();
    }
    async loadPendingTasks() {
        return this.service.loadPendingTasks();
    }
    async saveTasks() {
        return this.service.saveTasks();
    }
    async shutdown() {
        await this.service.saveTasks();
    }
    // ═══════════════════════════════════════════════════════════════
    //                      WRAPPER METHODS
    // ═══════════════════════════════════════════════════════════════
    getCurrentTask() {
        return this.service.getCurrentTask();
    }
    getTasks(filter) {
        return this.service.getTasks(filter);
    }
    async updateTask(taskId, params) {
        return this.service.updateTask(taskId, params);
    }
    async pauseTask(taskId) {
        return this.service.pauseTask(taskId);
    }
    async addAffectedFile(taskId, filePath) {
        return this.service.addAffectedFile(taskId, filePath);
    }
    async createTask(params) {
        return this.service.createTask(params);
    }
    async startTask(taskId) {
        return this.service.startTask(taskId);
    }
    async completeTask(taskId, actualTokens) {
        return this.service.completeTask(taskId, actualTokens);
    }
}
export { WorkflowService } from './workflow.service.js';
export { getWorkflowTools } from './workflow.tools.js';
export * from './workflow.types.js';
//# sourceMappingURL=index.js.map