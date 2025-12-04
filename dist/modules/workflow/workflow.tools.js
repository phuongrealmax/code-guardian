// src/modules/workflow/workflow.tools.ts
export function getWorkflowTools() {
    return [
        {
            name: 'workflow_task_create',
            description: 'Create a new task',
            inputSchema: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        description: 'Task name',
                    },
                    description: {
                        type: 'string',
                        description: 'Task description',
                    },
                    priority: {
                        type: 'string',
                        enum: ['low', 'medium', 'high', 'critical'],
                        description: 'Task priority',
                    },
                    parentId: {
                        type: 'string',
                        description: 'Parent task ID for subtasks',
                    },
                    estimatedTokens: {
                        type: 'number',
                        description: 'Estimated tokens for task',
                    },
                    tags: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Tags for categorization',
                    },
                },
                required: ['name'],
            },
        },
        {
            name: 'workflow_task_start',
            description: 'Start working on a task',
            inputSchema: {
                type: 'object',
                properties: {
                    taskId: {
                        type: 'string',
                        description: 'Task ID to start',
                    },
                },
                required: ['taskId'],
            },
        },
        {
            name: 'workflow_task_update',
            description: 'Update task progress or status',
            inputSchema: {
                type: 'object',
                properties: {
                    taskId: {
                        type: 'string',
                        description: 'Task ID',
                    },
                    progress: {
                        type: 'number',
                        minimum: 0,
                        maximum: 100,
                        description: 'Progress percentage',
                    },
                    status: {
                        type: 'string',
                        enum: ['pending', 'in_progress', 'paused', 'blocked', 'completed', 'failed'],
                        description: 'Task status',
                    },
                },
                required: ['taskId'],
            },
        },
        {
            name: 'workflow_task_complete',
            description: 'Mark task as completed',
            inputSchema: {
                type: 'object',
                properties: {
                    taskId: {
                        type: 'string',
                        description: 'Task ID to complete',
                    },
                    actualTokens: {
                        type: 'number',
                        description: 'Actual tokens used',
                    },
                },
                required: ['taskId'],
            },
        },
        {
            name: 'workflow_task_pause',
            description: 'Pause a task',
            inputSchema: {
                type: 'object',
                properties: {
                    taskId: {
                        type: 'string',
                        description: 'Task ID to pause',
                    },
                },
                required: ['taskId'],
            },
        },
        {
            name: 'workflow_task_fail',
            description: 'Mark task as failed',
            inputSchema: {
                type: 'object',
                properties: {
                    taskId: {
                        type: 'string',
                        description: 'Task ID',
                    },
                    reason: {
                        type: 'string',
                        description: 'Reason for failure',
                    },
                },
                required: ['taskId'],
            },
        },
        {
            name: 'workflow_task_note',
            description: 'Add a note to a task',
            inputSchema: {
                type: 'object',
                properties: {
                    taskId: {
                        type: 'string',
                        description: 'Task ID',
                    },
                    content: {
                        type: 'string',
                        description: 'Note content',
                    },
                    type: {
                        type: 'string',
                        enum: ['note', 'decision', 'blocker', 'idea'],
                        description: 'Note type',
                    },
                },
                required: ['taskId', 'content'],
            },
        },
        {
            name: 'workflow_task_list',
            description: 'List tasks with optional filters',
            inputSchema: {
                type: 'object',
                properties: {
                    status: {
                        type: 'array',
                        items: {
                            type: 'string',
                            enum: ['pending', 'in_progress', 'paused', 'blocked', 'completed', 'failed'],
                        },
                        description: 'Filter by status',
                    },
                    priority: {
                        type: 'array',
                        items: {
                            type: 'string',
                            enum: ['low', 'medium', 'high', 'critical'],
                        },
                        description: 'Filter by priority',
                    },
                },
                required: [],
            },
        },
        {
            name: 'workflow_current',
            description: 'Get current task being worked on',
            inputSchema: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
        {
            name: 'workflow_status',
            description: 'Get workflow status summary',
            inputSchema: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
        {
            name: 'workflow_task_delete',
            description: 'Delete a specific task by ID',
            inputSchema: {
                type: 'object',
                properties: {
                    taskId: {
                        type: 'string',
                        description: 'Task ID to delete',
                    },
                },
                required: ['taskId'],
            },
        },
        {
            name: 'workflow_cleanup',
            description: 'Clean up old completed tasks (manual trigger)',
            inputSchema: {
                type: 'object',
                properties: {
                    clearAll: {
                        type: 'boolean',
                        description: 'If true, clear ALL tasks (use with caution). Default: false (only completed)',
                    },
                },
                required: [],
            },
        },
    ];
}
//# sourceMappingURL=workflow.tools.js.map