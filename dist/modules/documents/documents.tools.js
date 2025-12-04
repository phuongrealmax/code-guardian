// src/modules/documents/documents.tools.ts
export function getDocumentsTools() {
    return [
        {
            name: 'documents_search',
            description: 'Search documents by query',
            inputSchema: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Search query',
                    },
                },
                required: ['query'],
            },
        },
        {
            name: 'documents_find_by_type',
            description: 'Find documents by type',
            inputSchema: {
                type: 'object',
                properties: {
                    type: {
                        type: 'string',
                        enum: ['readme', 'spec', 'api', 'guide', 'changelog', 'architecture', 'config', 'other'],
                        description: 'Document type',
                    },
                },
                required: ['type'],
            },
        },
        {
            name: 'documents_should_update',
            description: 'Check if an existing document should be updated instead of creating new',
            inputSchema: {
                type: 'object',
                properties: {
                    topic: {
                        type: 'string',
                        description: 'Topic or subject of the document',
                    },
                    content: {
                        type: 'string',
                        description: 'New content to be written',
                    },
                },
                required: ['topic', 'content'],
            },
        },
        {
            name: 'documents_update',
            description: 'Update an existing document',
            inputSchema: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'Document path',
                    },
                    content: {
                        type: 'string',
                        description: 'New content',
                    },
                },
                required: ['path', 'content'],
            },
        },
        {
            name: 'documents_create',
            description: 'Create a new document',
            inputSchema: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'Document path',
                    },
                    content: {
                        type: 'string',
                        description: 'Document content',
                    },
                    type: {
                        type: 'string',
                        enum: ['readme', 'spec', 'api', 'guide', 'changelog', 'architecture', 'config', 'other'],
                        description: 'Document type',
                    },
                    description: {
                        type: 'string',
                        description: 'Document description',
                    },
                    tags: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Tags',
                    },
                },
                required: ['path', 'content'],
            },
        },
        {
            name: 'documents_register',
            description: 'Register an existing document in the registry',
            inputSchema: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'Document path',
                    },
                },
                required: ['path'],
            },
        },
        {
            name: 'documents_scan',
            description: 'Scan project for documents and update registry',
            inputSchema: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
        {
            name: 'documents_list',
            description: 'List all registered documents',
            inputSchema: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
        {
            name: 'documents_status',
            description: 'Get documents module status',
            inputSchema: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
    ];
}
//# sourceMappingURL=documents.tools.js.map