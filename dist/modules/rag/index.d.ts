/**
 * CCG-RAG Module - Semantic Codebase Search
 *
 * Provides intelligent code retrieval using embeddings and knowledge graphs.
 *
 * Features:
 * - Code chunking by function/class/module
 * - Vector embeddings (local TF-IDF or external APIs)
 * - Semantic search with relevance scoring
 * - Related code discovery
 * - Knowledge graph for relationships
 */
export * from './rag.types.js';
export * from './rag.service.js';
export * from './rag.tools.js';
export * from './code-parser.js';
export * from './embedding.service.js';
import { EventBus } from '../../core/event-bus.js';
import { RAGService } from './rag.service.js';
import { createRAGTools } from './rag.tools.js';
import { RAGConfig } from './rag.types.js';
export { DEFAULT_RAG_CONFIG } from './rag.types.js';
/**
 * RAG Module class for integration with CCG v3.0
 */
export declare class RAGModule {
    service: RAGService;
    tools: ReturnType<typeof createRAGTools>;
    constructor(eventBus: EventBus, config?: Partial<RAGConfig>);
    /**
     * Get tool definitions for MCP registration (ListTools)
     */
    getToolDefinitions(): {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {};
            required: string[];
        };
    }[];
    /**
     * Get all tools for MCP handler
     */
    getTools(): {
        rag_build_index: {
            description: string;
            parameters: import("zod").ZodObject<{
                paths: import("zod").ZodArray<import("zod").ZodString>;
                exclude: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
                languages: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
                forceRebuild: import("zod").ZodOptional<import("zod").ZodBoolean>;
                generateDescriptions: import("zod").ZodOptional<import("zod").ZodBoolean>;
            }, import("zod/v4/core").$strip>;
            handler: (params: import("./rag.types.js").IndexBuildOptions) => Promise<{
                success: boolean;
                status: "error" | "complete" | "scanning" | "parsing" | "embedding" | "indexing";
                stats: {
                    filesProcessed: number;
                    chunksIndexed: number;
                    errors: number;
                };
                errors: string[];
                message: string;
            }>;
        };
        rag_query: {
            description: string;
            parameters: import("zod").ZodObject<{
                query: import("zod").ZodString;
                languages: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
                types: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodEnum<{
                    function: "function";
                    type: "type";
                    class: "class";
                    method: "method";
                    module: "module";
                    interface: "interface";
                }>>>;
                paths: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
                limit: import("zod").ZodOptional<import("zod").ZodNumber>;
                minScore: import("zod").ZodOptional<import("zod").ZodNumber>;
                includeRelated: import("zod").ZodOptional<import("zod").ZodBoolean>;
            }, import("zod/v4/core").$strip>;
            handler: (params: {
                query: string;
                languages?: string[];
                types?: ("function" | "class" | "method" | "interface" | "type" | "module")[];
                paths?: string[];
                limit?: number;
                minScore?: number;
                includeRelated?: boolean;
            }) => Promise<{
                success: boolean;
                query: string;
                resultCount: number;
                searchTime: string;
                results: {
                    file: string;
                    name: string;
                    type: "function" | "type" | "class" | "method" | "module" | "interface" | "variable" | "import";
                    score: number;
                    lines: string;
                    signature: string | undefined;
                    preview: string;
                    highlights: string[] | undefined;
                    related: {
                        file: string;
                        name: string;
                        type: "function" | "type" | "class" | "method" | "module" | "interface" | "variable" | "import";
                    }[] | undefined;
                }[];
            }>;
        };
        rag_related_code: {
            description: string;
            parameters: import("zod").ZodObject<{
                file: import("zod").ZodString;
                function: import("zod").ZodOptional<import("zod").ZodString>;
                limit: import("zod").ZodOptional<import("zod").ZodNumber>;
            }, import("zod/v4/core").$strip>;
            handler: (params: {
                file: string;
                function?: string;
                limit?: number;
            }) => Promise<{
                success: boolean;
                message: string;
                results: never[];
                source?: undefined;
                similar?: undefined;
            } | {
                success: boolean;
                source: {
                    file: string;
                    function: string;
                };
                similar: {
                    file: string;
                    name: string;
                    type: "function" | "type" | "class" | "method" | "module" | "interface" | "variable" | "import";
                    similarity: string;
                    lines: string;
                    preview: string;
                }[];
                message?: undefined;
                results?: undefined;
            }>;
        };
        rag_status: {
            description: string;
            parameters: import("zod").ZodObject<{}, import("zod/v4/core").$strip>;
            handler: () => Promise<{
                indexed: boolean;
                metadata: {
                    totalFiles: number;
                    totalChunks: number;
                    languages: string[];
                    lastIndexed: Date;
                    embeddingModel: string;
                    indexDuration: string;
                } | null;
                buildProgress: {
                    status: "error" | "complete" | "scanning" | "parsing" | "embedding" | "indexing";
                    progress: string;
                    chunks: number;
                    errors: number;
                } | null;
            }>;
        };
        rag_clear_index: {
            description: string;
            parameters: import("zod").ZodObject<{}, import("zod/v4/core").$strip>;
            handler: () => Promise<{
                success: boolean;
                message: string;
            }>;
        };
        rag_get_chunk: {
            description: string;
            parameters: import("zod").ZodObject<{
                chunkId: import("zod").ZodString;
            }, import("zod/v4/core").$strip>;
            handler: (params: {
                chunkId: string;
            }) => Promise<{
                success: boolean;
                message: string;
                chunk?: undefined;
            } | {
                success: boolean;
                chunk: {
                    id: string;
                    file: string;
                    name: string;
                    type: "function" | "type" | "class" | "method" | "module" | "interface" | "variable" | "import";
                    language: string;
                    lines: string;
                    signature: string | undefined;
                    docstring: string | undefined;
                    imports: string[] | undefined;
                    content: string;
                };
                message?: undefined;
            }>;
        };
    };
    /**
     * Get RAG status
     */
    getStatus(): {
        indexed: boolean;
        metadata: import("./rag.types.js").RAGIndex["metadata"] | null;
        buildProgress: import("./rag.types.js").IndexBuildProgress | null;
    };
}
//# sourceMappingURL=index.d.ts.map