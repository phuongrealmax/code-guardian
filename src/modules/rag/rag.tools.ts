/**
 * RAG Module MCP Tools
 *
 * NOTE: RAG (Semantic Code Search) requires Team tier or higher.
 */

import { z } from 'zod';
import { RAGService } from './rag.service.js';
import { RAGQuery, IndexBuildOptions } from './rag.types.js';
import { checkFeatureAccess } from '../../core/license-integration.js';

// RAG feature name - not in Features const, using string
const RAG_FEATURE = 'rag';

/**
 * License check helper for RAG handlers
 */
function checkRAGLicense() {
  return checkFeatureAccess(RAG_FEATURE);
}

/**
 * Create RAG MCP tools
 */
export function createRAGTools(ragService: RAGService) {
  return {
    // Build/rebuild the codebase index
    rag_build_index: {
      description: 'Build or rebuild the RAG index for semantic code search. Index the codebase to enable intelligent code discovery.',
      parameters: z.object({
        paths: z.array(z.string()).describe('Paths to index (e.g., ["src/", "lib/"])'),
        exclude: z.array(z.string()).optional().describe('Patterns to exclude'),
        languages: z.array(z.string()).optional().describe('Languages to include'),
        forceRebuild: z.boolean().optional().describe('Force rebuild even if index exists'),
        generateDescriptions: z.boolean().optional().describe('Generate NL descriptions for chunks'),
      }),
      handler: async (params: IndexBuildOptions) => {
        const gated = checkRAGLicense();
        if (gated) return gated;

        const progress = await ragService.buildIndex(params);

        return {
          success: progress.status === 'complete',
          status: progress.status,
          stats: {
            filesProcessed: progress.processedFiles,
            chunksIndexed: progress.processedChunks,
            errors: progress.errors.length,
          },
          errors: progress.errors.slice(0, 10),
          message: progress.status === 'complete'
            ? `Indexed ${progress.processedChunks} chunks from ${progress.processedFiles} files`
            : `Index build ${progress.status}`,
        };
      },
    },

    // Semantic search across codebase
    rag_query: {
      description: 'Search the codebase semantically. Find code by describing what it does in natural language.',
      parameters: z.object({
        query: z.string().describe('Natural language search query (e.g., "authentication middleware", "error handling")'),
        languages: z.array(z.string()).optional().describe('Filter by languages'),
        types: z.array(z.enum(['function', 'class', 'method', 'interface', 'type', 'module'])).optional().describe('Filter by code type'),
        paths: z.array(z.string()).optional().describe('Filter by path patterns'),
        limit: z.number().optional().describe('Max results (default: 10)'),
        minScore: z.number().optional().describe('Minimum relevance score 0-1 (default: 0.5)'),
        includeRelated: z.boolean().optional().describe('Include related code'),
      }),
      handler: async (params: {
        query: string;
        languages?: string[];
        types?: ('function' | 'class' | 'method' | 'interface' | 'type' | 'module')[];
        paths?: string[];
        limit?: number;
        minScore?: number;
        includeRelated?: boolean;
      }) => {
        const gated = checkRAGLicense();
        if (gated) return gated;

        const query: RAGQuery = {
          query: params.query,
          filters: {
            languages: params.languages,
            types: params.types,
            paths: params.paths,
          },
          limit: params.limit,
          minScore: params.minScore,
          includeRelated: params.includeRelated,
        };

        const response = await ragService.search(query);

        return {
          success: true,
          query: response.query,
          resultCount: response.results.length,
          searchTime: `${response.searchTime}ms`,
          results: response.results.map(r => ({
            file: r.chunk.filePath,
            name: r.chunk.name,
            type: r.chunk.type,
            score: Math.round(r.score * 100) / 100,
            lines: `${r.chunk.startLine}-${r.chunk.endLine}`,
            signature: r.chunk.signature,
            preview: r.chunk.content.slice(0, 200) + (r.chunk.content.length > 200 ? '...' : ''),
            highlights: r.highlights?.slice(0, 3),
            related: r.relatedChunks?.map(rc => ({
              file: rc.chunk.filePath,
              name: rc.chunk.name,
              type: rc.chunk.type,
            })),
          })),
        };
      },
    },

    // Find similar code patterns
    rag_related_code: {
      description: 'Find code similar to a specific function or class. Useful for finding related implementations.',
      parameters: z.object({
        file: z.string().describe('File path containing the source code'),
        function: z.string().optional().describe('Function/class name to find similar code for'),
        limit: z.number().optional().describe('Max results (default: 5)'),
      }),
      handler: async (params: { file: string; function?: string; limit?: number }) => {
        const gated = checkRAGLicense();
        if (gated) return gated;

        const results = await ragService.findSimilar(
          params.file,
          params.function,
          params.limit || 5
        );

        if (results.length === 0) {
          return {
            success: false,
            message: 'No similar code found. Make sure the file is indexed.',
            results: [],
          };
        }

        return {
          success: true,
          source: {
            file: params.file,
            function: params.function || 'entire file',
          },
          similar: results.map(r => ({
            file: r.chunk.filePath,
            name: r.chunk.name,
            type: r.chunk.type,
            similarity: Math.round(r.score * 100) + '%',
            lines: `${r.chunk.startLine}-${r.chunk.endLine}`,
            preview: r.chunk.content.slice(0, 150) + '...',
          })),
        };
      },
    },

    // Get RAG status
    rag_status: {
      description: 'Get RAG index status including stats and build progress.',
      parameters: z.object({}),
      handler: async () => {
        const gated = checkRAGLicense();
        if (gated) return gated;

        const status = ragService.getStatus();

        return {
          indexed: status.indexed,
          metadata: status.metadata
            ? {
                totalFiles: status.metadata.totalFiles,
                totalChunks: status.metadata.totalChunks,
                languages: status.metadata.languages,
                lastIndexed: status.metadata.lastIndexed,
                embeddingModel: status.metadata.embeddingModel,
                indexDuration: `${status.metadata.indexDuration}ms`,
              }
            : null,
          buildProgress: status.buildProgress
            ? {
                status: status.buildProgress.status,
                progress: `${status.buildProgress.processedFiles}/${status.buildProgress.totalFiles} files`,
                chunks: status.buildProgress.processedChunks,
                errors: status.buildProgress.errors.length,
              }
            : null,
        };
      },
    },

    // Clear the index
    rag_clear_index: {
      description: 'Clear the RAG index. Use this before rebuilding or to free disk space.',
      parameters: z.object({}),
      handler: async () => {
        const gated = checkRAGLicense();
        if (gated) return gated;

        ragService.clearIndex();

        return {
          success: true,
          message: 'RAG index cleared',
        };
      },
    },

    // Get specific chunk details
    rag_get_chunk: {
      description: 'Get detailed information about a specific code chunk by ID.',
      parameters: z.object({
        chunkId: z.string().describe('The chunk ID from search results'),
      }),
      handler: async (params: { chunkId: string }) => {
        const gated = checkRAGLicense();
        if (gated) return gated;

        const chunk = ragService.getChunk(params.chunkId);

        if (!chunk) {
          return {
            success: false,
            message: 'Chunk not found',
          };
        }

        return {
          success: true,
          chunk: {
            id: chunk.id,
            file: chunk.filePath,
            name: chunk.name,
            type: chunk.type,
            language: chunk.language,
            lines: `${chunk.startLine}-${chunk.endLine}`,
            signature: chunk.signature,
            docstring: chunk.docstring,
            imports: chunk.imports,
            content: chunk.content,
          },
        };
      },
    },
  };
}

/**
 * Export tool definitions for MCP registration
 */
export const RAG_TOOL_DEFINITIONS = [
  {
    name: 'rag_build_index',
    description: 'Build/rebuild the RAG index for semantic code search',
  },
  {
    name: 'rag_query',
    description: 'Semantic search across codebase - find code by natural language',
  },
  {
    name: 'rag_related_code',
    description: 'Find code similar to a specific function or class',
  },
  {
    name: 'rag_status',
    description: 'Get RAG index status and statistics',
  },
  {
    name: 'rag_clear_index',
    description: 'Clear the RAG index',
  },
  {
    name: 'rag_get_chunk',
    description: 'Get detailed information about a code chunk',
  },
];
