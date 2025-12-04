import { ResourceModuleConfig } from '../../core/types.js';
import { EventBus } from '../../core/event-bus.js';
import { Logger } from '../../core/logger.js';
import { ResourceStatus, TaskEstimate, CheckpointData, CheckpointInfo, CheckpointReason } from './resource.types.js';
export declare class ResourceService {
    private config;
    private eventBus;
    private logger;
    private projectRoot;
    private tokenUsage;
    private checkpoints;
    private checkpointDir;
    private lastAutoCheckpoint;
    constructor(config: ResourceModuleConfig, eventBus: EventBus, logger: Logger, projectRoot?: string);
    initialize(): Promise<void>;
    updateTokenUsage(used: number, estimated?: number): ResourceStatus;
    getStatus(): ResourceStatus;
    private getWarnings;
    private checkThresholds;
    estimateTask(params: {
        description: string;
        filesCount?: number;
        linesEstimate?: number;
        hasTests?: boolean;
        hasBrowserTesting?: boolean;
    }): TaskEstimate;
    private generateBreakdownSuggestions;
    createCheckpoint(params: {
        name?: string;
        reason: CheckpointReason;
        metadata?: Record<string, unknown>;
    }): Promise<CheckpointInfo>;
    restoreCheckpoint(checkpointId: string): Promise<CheckpointData | null>;
    listCheckpoints(): CheckpointInfo[];
    deleteCheckpoint(checkpointId: string): Promise<boolean>;
    private loadCheckpoints;
    private enforceCheckpointLimit;
    private onTaskComplete;
    private onSessionEnd;
}
//# sourceMappingURL=resource.service.d.ts.map