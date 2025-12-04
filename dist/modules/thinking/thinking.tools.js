// src/modules/thinking/thinking.tools.ts
// ═══════════════════════════════════════════════════════════════
//                      TOOL DEFINITIONS
// ═══════════════════════════════════════════════════════════════
export function getThinkingTools() {
    return [
        // Thinking Models
        {
            name: 'thinking_get_model',
            description: `Get a structured thinking model for systematic reasoning.

Available models:
- chain-of-thought: Step-by-step reasoning for debugging, logic problems
- tree-of-thoughts: Explore multiple approaches, compare trade-offs
- react: Reasoning + Acting loop for exploration, experimentation
- self-consistency: Multiple solutions for verification, reliability
- decomposition: Break complex problems into smaller parts
- first-principles: Question assumptions, find fundamental truths

Use this BEFORE starting complex tasks to guide your reasoning.`,
            inputSchema: {
                type: 'object',
                properties: {
                    modelName: {
                        type: 'string',
                        enum: [
                            'chain-of-thought',
                            'tree-of-thoughts',
                            'react',
                            'self-consistency',
                            'decomposition',
                            'first-principles',
                        ],
                        description: 'Name of the thinking model to retrieve',
                    },
                    context: {
                        type: 'string',
                        description: 'Optional context about the task (for logging)',
                    },
                },
                required: ['modelName'],
            },
        },
        {
            name: 'thinking_suggest_model',
            description: `Suggest the best thinking model for a given task.
Analyzes task description and recommends the most appropriate model.`,
            inputSchema: {
                type: 'object',
                properties: {
                    taskDescription: {
                        type: 'string',
                        description: 'Description of the task or problem',
                    },
                },
                required: ['taskDescription'],
            },
        },
        {
            name: 'thinking_list_models',
            description: 'List all available thinking models with descriptions.',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        // Workflows / SOPs
        {
            name: 'thinking_get_workflow',
            description: `Get a standard workflow/SOP for common development tasks.

Available workflows:
- pre-commit: Checklist before committing code
- code-review: Systematic code review process
- refactoring: Safe refactoring workflow
- deploy: Deployment checklist
- bug-fix: Systematic bug fixing process
- feature-development: Feature development workflow
- security-audit: Security review checklist

Use this to follow best practices for common tasks.`,
            inputSchema: {
                type: 'object',
                properties: {
                    workflowName: {
                        type: 'string',
                        enum: [
                            'pre-commit',
                            'code-review',
                            'refactoring',
                            'deploy',
                            'bug-fix',
                            'feature-development',
                            'security-audit',
                        ],
                        description: 'Name of the workflow to retrieve',
                    },
                },
                required: ['workflowName'],
            },
        },
        {
            name: 'thinking_suggest_workflow',
            description: `Check if a task description triggers a workflow.
Returns the appropriate workflow if keywords match.`,
            inputSchema: {
                type: 'object',
                properties: {
                    taskDescription: {
                        type: 'string',
                        description: 'Description of the task',
                    },
                },
                required: ['taskDescription'],
            },
        },
        {
            name: 'thinking_list_workflows',
            description: 'List all available workflows with descriptions.',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        // Code Snippets (Style RAG)
        {
            name: 'thinking_save_snippet',
            description: `Save a code snippet as a style reference for future consistency.

Use when:
- User says "save this as a template"
- User says "remember this pattern"
- You want to save exemplary code for a category

The snippet will be used to ensure consistent code style in future tasks.`,
            inputSchema: {
                type: 'object',
                properties: {
                    category: {
                        type: 'string',
                        description: 'Category of the code (e.g., "React Component", "NestJS Controller", "API Handler")',
                    },
                    description: {
                        type: 'string',
                        description: 'Short description of what this snippet demonstrates',
                    },
                    code: {
                        type: 'string',
                        description: 'The code content to save',
                    },
                    language: {
                        type: 'string',
                        description: 'Programming language (auto-detected if not specified)',
                    },
                    tags: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Tags for searching (e.g., ["auth", "validation"])',
                    },
                },
                required: ['category', 'description', 'code'],
            },
        },
        {
            name: 'thinking_get_style',
            description: `Get code style references for a category.
CALL THIS BEFORE writing code blocks > 10 lines.

Returns saved code snippets that demonstrate the project's coding style.
You should FOLLOW the patterns in the returned snippets.`,
            inputSchema: {
                type: 'object',
                properties: {
                    category: {
                        type: 'string',
                        description: 'Category to search for (e.g., "Component", "Controller", "Hook")',
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximum number of snippets to return (default: 3)',
                    },
                },
                required: ['category'],
            },
        },
        {
            name: 'thinking_list_snippets',
            description: 'List all saved code snippets grouped by category.',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        // Status
        {
            name: 'thinking_status',
            description: 'Get thinking module status including counts of models, workflows, and snippets.',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
    ];
}
// ═══════════════════════════════════════════════════════════════
//                      TOOL HANDLERS
// ═══════════════════════════════════════════════════════════════
export function createThinkingToolHandlers(service) {
    return {
        // Thinking Models
        thinking_get_model: (args) => {
            const model = service.getThinkingModel(args.modelName);
            if (!model) {
                return {
                    error: `Thinking model "${args.modelName}" not found`,
                    available: service.getModelNames(),
                };
            }
            return {
                model,
                instruction: `Apply "${model.name}" by following the ${model.steps.length} steps below:`,
                prompt: model.examplePrompt,
            };
        },
        thinking_suggest_model: (args) => {
            const model = service.suggestModel(args.taskDescription);
            return {
                suggested: model,
                reason: `Based on your task description, "${model.name}" is recommended.`,
                whenToUse: model.whenToUse,
            };
        },
        thinking_list_models: () => {
            const models = service.listThinkingModels();
            return {
                count: models.length,
                models: models.map((m) => ({
                    id: m.id,
                    name: m.name,
                    description: m.description,
                    whenToUse: m.whenToUse,
                })),
            };
        },
        // Workflows
        thinking_get_workflow: (args) => {
            const workflow = service.getWorkflow(args.workflowName);
            if (!workflow) {
                return {
                    error: `Workflow "${args.workflowName}" not found`,
                    available: service.getWorkflowNames(),
                };
            }
            return {
                workflow,
                instruction: `Follow the "${workflow.name}" workflow with ${workflow.steps.length} steps:`,
                estimatedTime: workflow.estimatedTime,
            };
        },
        thinking_suggest_workflow: (args) => {
            const workflow = service.checkWorkflowTrigger(args.taskDescription);
            if (!workflow) {
                return {
                    found: false,
                    message: 'No workflow triggered by this task description.',
                    available: service.getWorkflowNames(),
                };
            }
            return {
                found: true,
                workflow,
                message: `Task triggers "${workflow.name}" workflow. Consider following it.`,
            };
        },
        thinking_list_workflows: () => {
            const workflows = service.listWorkflows();
            return {
                count: workflows.length,
                workflows: workflows.map((w) => ({
                    id: w.id,
                    name: w.name,
                    description: w.description,
                    triggerKeywords: w.triggerKeywords,
                    stepsCount: w.steps.length,
                })),
            };
        },
        // Code Snippets
        thinking_save_snippet: async (args) => {
            const snippet = await service.saveSnippet(args);
            return {
                success: true,
                snippet: {
                    id: snippet.id,
                    category: snippet.category,
                    language: snippet.language,
                },
                message: `Code snippet saved. Will use this style for future "${args.category}" code.`,
            };
        },
        thinking_get_style: (args) => {
            return service.getStyleReference(args.category, args.limit);
        },
        thinking_list_snippets: () => {
            const byCategory = service.listSnippetsByCategory();
            const categories = Object.keys(byCategory);
            return {
                count: service.listSnippets().length,
                categories: categories.length,
                snippets: Object.fromEntries(categories.map((cat) => [
                    cat,
                    byCategory[cat].map((s) => ({
                        id: s.id,
                        description: s.description,
                        language: s.language,
                        usageCount: s.usageCount,
                    })),
                ])),
            };
        },
        // Status
        thinking_status: () => {
            return service.getStatus();
        },
    };
}
//# sourceMappingURL=thinking.tools.js.map