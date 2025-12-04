// src/modules/testing/testing.tools.ts
export function getTestingTools() {
    return [
        {
            name: 'testing_run',
            description: 'Run tests',
            inputSchema: {
                type: 'object',
                properties: {
                    files: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Specific test files to run',
                    },
                    grep: {
                        type: 'string',
                        description: 'Filter tests by name pattern',
                    },
                    coverage: {
                        type: 'boolean',
                        description: 'Run with coverage',
                    },
                    timeout: {
                        type: 'number',
                        description: 'Timeout in seconds',
                    },
                },
                required: [],
            },
        },
        {
            name: 'testing_run_affected',
            description: 'Run tests affected by changed files',
            inputSchema: {
                type: 'object',
                properties: {
                    files: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Changed files',
                    },
                },
                required: ['files'],
            },
        },
        {
            name: 'testing_browser_open',
            description: 'Open a browser session for testing',
            inputSchema: {
                type: 'object',
                properties: {
                    url: {
                        type: 'string',
                        description: 'URL to open',
                    },
                },
                required: ['url'],
            },
        },
        {
            name: 'testing_browser_screenshot',
            description: 'Take a screenshot of the browser',
            inputSchema: {
                type: 'object',
                properties: {
                    sessionId: {
                        type: 'string',
                        description: 'Browser session ID',
                    },
                    selector: {
                        type: 'string',
                        description: 'CSS selector to screenshot (optional)',
                    },
                    fullPage: {
                        type: 'boolean',
                        description: 'Capture full page',
                    },
                },
                required: ['sessionId'],
            },
        },
        {
            name: 'testing_browser_logs',
            description: 'Get console logs from browser session',
            inputSchema: {
                type: 'object',
                properties: {
                    sessionId: {
                        type: 'string',
                        description: 'Browser session ID',
                    },
                },
                required: ['sessionId'],
            },
        },
        {
            name: 'testing_browser_network',
            description: 'Get network requests from browser session',
            inputSchema: {
                type: 'object',
                properties: {
                    sessionId: {
                        type: 'string',
                        description: 'Browser session ID',
                    },
                },
                required: ['sessionId'],
            },
        },
        {
            name: 'testing_browser_errors',
            description: 'Get errors from browser session',
            inputSchema: {
                type: 'object',
                properties: {
                    sessionId: {
                        type: 'string',
                        description: 'Browser session ID',
                    },
                },
                required: ['sessionId'],
            },
        },
        {
            name: 'testing_browser_close',
            description: 'Close a browser session',
            inputSchema: {
                type: 'object',
                properties: {
                    sessionId: {
                        type: 'string',
                        description: 'Browser session ID',
                    },
                },
                required: ['sessionId'],
            },
        },
        {
            name: 'testing_cleanup',
            description: 'Clean up test data and temporary files',
            inputSchema: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
        {
            name: 'testing_status',
            description: 'Get testing module status',
            inputSchema: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
    ];
}
//# sourceMappingURL=testing.tools.js.map