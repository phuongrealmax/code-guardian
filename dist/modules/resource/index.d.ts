import { ResourceModuleConfig } from '../../core/types.js';
import { EventBus } from '../../core/event-bus.js';
import { Logger } from '../../core/logger.js';
import { CheckpointReason } from './resource.types.js';
export declare class ResourceModule {
    private service;
    constructor(config: ResourceModuleConfig, eventBus: EventBus, logger: Logger, projectRoot?: string);
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
    shutdown(): Promise<void>;
    getStatus(): import("./resource.types.js").ResourceStatus;
    createCheckpoint(params: {
        name?: string;
        reason: CheckpointReason;
        metadata?: Record<string, unknown>;
    }): Promise<import("./resource.types.js").CheckpointInfo>;
    updateTokenUsage(used: number, estimated?: number): import("./resource.types.js").ResourceStatus;
    listCheckpoints(): import("./resource.types.js").CheckpointInfo[];
}
export { ResourceService } from './resource.service.js';
export { getResourceTools } from './resource.tools.js';
export * from './resource.types.js';
//# sourceMappingURL=index.d.ts.map