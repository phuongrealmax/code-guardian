/**
 * RAG Module MCP Tools
 */
import { z } from 'zod';
import { RAGService } from './rag.service.js';
import { IndexBuildOptions } from './rag.types.js';
/**
 * Create RAG MCP tools
 */
export declare function createRAGTools(ragService: RAGService): {
    rag_build_index: {
        description: string;
        parameters: z.ZodObject<{
            paths: z.ZodArray<z.ZodString>;
            exclude: z.ZodOptional<z.ZodArray<z.ZodString>>;
            languages: z.ZodOptional<z.ZodArray<z.ZodString>>;
            forceRebuild: z.ZodOptional<z.ZodBoolean>;
            generateDescriptions: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>;
        handler: (params: IndexBuildOptions) => Promise<{
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
        parameters: z.ZodObject<{
            query: z.ZodString;
            languages: z.ZodOptional<z.ZodArray<z.ZodString>>;
            types: z.ZodOptional<z.ZodArray<z.ZodEnum<{
                function: "function";
                type: "type";
                class: "class";
                method: "method";
                module: "module";
                interface: "interface";
            }>>>;
            paths: z.ZodOptional<z.ZodArray<z.ZodString>>;
            limit: z.ZodOptional<z.ZodNumber>;
            minScore: z.ZodOptional<z.ZodNumber>;
            includeRelated: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>;
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
        parameters: z.ZodObject<{
            file: z.ZodString;
            function: z.ZodOptional<z.ZodString>;
            limit: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
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
        parameters: z.ZodObject<{}, z.core.$strip>;
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
        parameters: z.ZodObject<{}, z.core.$strip>;
        handler: () => Promise<{
            success: boolean;
            message: string;
        }>;
    };
    rag_get_chunk: {
        description: string;
        parameters: z.ZodObject<{
            chunkId: z.ZodString;
        }, z.core.$strip>;
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
 * Export tool definitions for MCP registration
 */
export declare const RAG_TOOL_DEFINITIONS: {
    name: string;
    description: string;
}[];
//# sourceMappingURL=rag.tools.d.ts.map