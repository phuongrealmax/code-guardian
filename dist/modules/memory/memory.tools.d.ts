/**
 * MCP Tool definitions for Memory Module
 */
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, unknown>;
        required: string[];
    };
}
export declare function getMemoryTools(): MCPTool[];
/**
 * Format memory for display
 */
export declare function formatMemoryResult(memory: {
    id: string;
    content: string;
    type: string;
    importance: number;
    tags: string[];
    createdAt: Date;
    accessedAt: Date;
    accessCount: number;
}): string;
/**
 * Format memory list for display
 */
export declare function formatMemoryList(memories: Array<{
    id: string;
    content: string;
    type: string;
    importance: number;
    tags: string[];
}>): string;
/**
 * Format summary for display
 */
export declare function formatSummary(summary: {
    total: number;
    byType: Record<string, number>;
    recentlyAccessed: Array<{
        id: string;
        content: string;
        type: string;
    }>;
    mostImportant: Array<{
        id: string;
        content: string;
        importance: number;
    }>;
}): string;
//# sourceMappingURL=memory.tools.d.ts.map