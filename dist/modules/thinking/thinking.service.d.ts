import { EventBus } from '../../core/event-bus.js';
import { Logger } from '../../core/logger.js';
import { ThinkingModel, ThinkingModelType, Workflow, WorkflowType, CodeSnippet, SaveSnippetParams, StyleReferenceResult, ThinkingModuleConfig, ThinkingModuleStatus } from './thinking.types.js';
export declare class ThinkingService {
    private config;
    private eventBus;
    private logger;
    private projectRoot;
    private models;
    private workflows;
    private snippets;
    private snippetsDir;
    private lastAccessed?;
    constructor(config: ThinkingModuleConfig, eventBus: EventBus, logger: Logger, projectRoot?: string);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    /**
     * Get a thinking model by name
     */
    getThinkingModel(modelName: ThinkingModelType): ThinkingModel | null;
    /**
     * List all available thinking models
     */
    listThinkingModels(): ThinkingModel[];
    /**
     * Suggest a thinking model based on task description
     */
    suggestModel(taskDescription: string): ThinkingModel;
    /**
     * Get available model names
     */
    getModelNames(): ThinkingModelType[];
    /**
     * Get a workflow by name
     */
    getWorkflow(workflowName: WorkflowType): Workflow | null;
    /**
     * List all available workflows
     */
    listWorkflows(): Workflow[];
    /**
     * Suggest a workflow based on task description
     */
    suggestWorkflow(taskDescription: string): Workflow | null;
    /**
     * Get available workflow names
     */
    getWorkflowNames(): WorkflowType[];
    /**
     * Check if task description triggers a workflow
     */
    checkWorkflowTrigger(taskDescription: string): Workflow | null;
    /**
     * Save a code snippet for style reference
     */
    saveSnippet(params: SaveSnippetParams): Promise<CodeSnippet>;
    /**
     * Get code style references for a category
     */
    getStyleReference(category: string, limit?: number): StyleReferenceResult;
    /**
     * List all saved snippets
     */
    listSnippets(): CodeSnippet[];
    /**
     * List snippets by category
     */
    listSnippetsByCategory(): Record<string, CodeSnippet[]>;
    /**
     * Delete a snippet
     */
    deleteSnippet(id: string): Promise<boolean>;
    getStatus(): ThinkingModuleStatus;
    private loadCustomModels;
    private loadCustomWorkflows;
    private loadSnippets;
    private persistSnippet;
    private detectLanguage;
}
//# sourceMappingURL=thinking.service.d.ts.map