import { WorkflowModuleConfig } from '../../core/types.js';
import { EventBus } from '../../core/event-bus.js';
import { Logger } from '../../core/logger.js';
export declare class WorkflowModule {
    private service;
    constructor(config: WorkflowModuleConfig, eventBus: EventBus, logger: Logger, projectRoot?: string);
    initialize(): Promise<void>;
    getTools(): {
        inputSchema: {
            [x: string]: unknown;
            type: "object";
            properties?: {
                [x: string]: object;
            } | undefined;
            required?: string[] | undefined;
        };
        name: string;
        description?: string | undefined;
        outputSchema?: {
            [x: string]: unknown;
            type: "object";
            properties?: {
                [x: string]: object;
            } | undefined;
            required?: string[] | undefined;
        } | undefined;
        annotations?: {
            title?: string | undefined;
            readOnlyHint?: boolean | undefined;
            destructiveHint?: boolean | undefined;
            idempotentHint?: boolean | undefined;
            openWorldHint?: boolean | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
        icons?: {
            src: string;
            mimeType?: string | undefined;
            sizes?: string[] | undefined;
        }[] | undefined;
        title?: string | undefined;
    }[];
    handleTool(toolName: string, args: Record<string, unknown>): Promise<unknown>;
    getStatus(): import("./workflow.types.js").WorkflowStatus;
    getTaskList(): import("./workflow.types.js").TaskSummary[];
    loadPendingTasks(): Promise<import("./workflow.types.js").Task[]>;
    saveTasks(): Promise<void>;
    shutdown(): Promise<void>;
    getCurrentTask(): import("./workflow.types.js").Task | undefined;
    getTasks(filter?: Parameters<typeof this.service.getTasks>[0]): import("./workflow.types.js").Task[];
    updateTask(taskId: string, params: {
        progress?: number;
        status?: 'pending' | 'in_progress' | 'paused' | 'blocked' | 'completed' | 'failed';
    }): Promise<import("./workflow.types.js").Task | null>;
    pauseTask(taskId: string): Promise<import("./workflow.types.js").Task | null>;
    addAffectedFile(taskId: string, filePath: string): Promise<boolean>;
    createTask(params: Parameters<typeof this.service.createTask>[0]): Promise<import("./workflow.types.js").Task>;
    startTask(taskId: string): Promise<import("./workflow.types.js").Task | null>;
    completeTask(taskId: string, actualTokens?: number): Promise<import("./workflow.types.js").Task | null>;
}
export { WorkflowService } from './workflow.service.js';
export { getWorkflowTools } from './workflow.tools.js';
export * from './workflow.types.js';
//# sourceMappingURL=index.d.ts.map