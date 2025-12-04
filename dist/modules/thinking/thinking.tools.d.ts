/**
 * MCP Tools for Thinking Module
 *
 * Provides tools for:
 * - Getting thinking models (CoT, ToT, ReAct, etc.)
 * - Getting workflows/SOPs
 * - Saving and retrieving code snippets
 * - Suggesting appropriate models/workflows
 */
import { ThinkingService } from './thinking.service.js';
import { ThinkingModelType, WorkflowType, GetThinkingModelParams, GetWorkflowParams, SaveSnippetParams, GetStyleReferenceParams, SuggestModelParams } from './thinking.types.js';
export declare function getThinkingTools(): ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            modelName: {
                type: string;
                enum: string[];
                description: string;
            };
            context: {
                type: string;
                description: string;
            };
            taskDescription?: undefined;
            workflowName?: undefined;
            category?: undefined;
            description?: undefined;
            code?: undefined;
            language?: undefined;
            tags?: undefined;
            limit?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            taskDescription: {
                type: string;
                description: string;
            };
            modelName?: undefined;
            context?: undefined;
            workflowName?: undefined;
            category?: undefined;
            description?: undefined;
            code?: undefined;
            language?: undefined;
            tags?: undefined;
            limit?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            modelName?: undefined;
            context?: undefined;
            taskDescription?: undefined;
            workflowName?: undefined;
            category?: undefined;
            description?: undefined;
            code?: undefined;
            language?: undefined;
            tags?: undefined;
            limit?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            workflowName: {
                type: string;
                enum: string[];
                description: string;
            };
            modelName?: undefined;
            context?: undefined;
            taskDescription?: undefined;
            category?: undefined;
            description?: undefined;
            code?: undefined;
            language?: undefined;
            tags?: undefined;
            limit?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            category: {
                type: string;
                description: string;
            };
            description: {
                type: string;
                description: string;
            };
            code: {
                type: string;
                description: string;
            };
            language: {
                type: string;
                description: string;
            };
            tags: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            modelName?: undefined;
            context?: undefined;
            taskDescription?: undefined;
            workflowName?: undefined;
            limit?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            category: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            modelName?: undefined;
            context?: undefined;
            taskDescription?: undefined;
            workflowName?: undefined;
            description?: undefined;
            code?: undefined;
            language?: undefined;
            tags?: undefined;
        };
        required: string[];
    };
})[];
export declare function createThinkingToolHandlers(service: ThinkingService): {
    thinking_get_model: (args: GetThinkingModelParams) => {
        error: string;
        available: ThinkingModelType[];
        model?: undefined;
        instruction?: undefined;
        prompt?: undefined;
    } | {
        model: import("./thinking.types.js").ThinkingModel;
        instruction: string;
        prompt: string;
        error?: undefined;
        available?: undefined;
    };
    thinking_suggest_model: (args: SuggestModelParams) => {
        suggested: import("./thinking.types.js").ThinkingModel;
        reason: string;
        whenToUse: string[];
    };
    thinking_list_models: () => {
        count: number;
        models: {
            id: ThinkingModelType;
            name: string;
            description: string;
            whenToUse: string[];
        }[];
    };
    thinking_get_workflow: (args: GetWorkflowParams) => {
        error: string;
        available: WorkflowType[];
        workflow?: undefined;
        instruction?: undefined;
        estimatedTime?: undefined;
    } | {
        workflow: import("./thinking.types.js").Workflow;
        instruction: string;
        estimatedTime: string | undefined;
        error?: undefined;
        available?: undefined;
    };
    thinking_suggest_workflow: (args: {
        taskDescription: string;
    }) => {
        found: boolean;
        message: string;
        available: WorkflowType[];
        workflow?: undefined;
    } | {
        found: boolean;
        workflow: import("./thinking.types.js").Workflow;
        message: string;
        available?: undefined;
    };
    thinking_list_workflows: () => {
        count: number;
        workflows: {
            id: WorkflowType;
            name: string;
            description: string;
            triggerKeywords: string[];
            stepsCount: number;
        }[];
    };
    thinking_save_snippet: (args: SaveSnippetParams) => Promise<{
        success: boolean;
        snippet: {
            id: string;
            category: string;
            language: string;
        };
        message: string;
    }>;
    thinking_get_style: (args: GetStyleReferenceParams) => import("./thinking.types.js").StyleReferenceResult;
    thinking_list_snippets: () => {
        count: number;
        categories: number;
        snippets: {
            [k: string]: {
                id: string;
                description: string;
                language: string;
                usageCount: number;
            }[];
        };
    };
    thinking_status: () => import("./thinking.types.js").ThinkingModuleStatus;
};
//# sourceMappingURL=thinking.tools.d.ts.map