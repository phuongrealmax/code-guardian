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
import { createRAGTools, RAG_TOOL_DEFINITIONS } from './rag.tools.js';
import { RAGConfig, DEFAULT_RAG_CONFIG } from './rag.types.js';

// Re-export default config
export { DEFAULT_RAG_CONFIG } from './rag.types.js';

/**
 * RAG Module class for integration with CCG v3.0
 */
export class RAGModule {
  public service: RAGService;
  public tools: ReturnType<typeof createRAGTools>;

  constructor(eventBus: EventBus, config?: Partial<RAGConfig>) {
    this.service = new RAGService(eventBus, config);
    this.tools = createRAGTools(this.service);
  }

  /**
   * Get tool definitions for MCP registration (ListTools)
   */
  getToolDefinitions() {
    return RAG_TOOL_DEFINITIONS.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: {
        type: 'object' as const,
        properties: {},
        required: [] as string[],
      },
    }));
  }

  /**
   * Get all tools for MCP handler
   */
  getTools() {
    return this.tools;
  }

  /**
   * Get RAG status
   */
  getStatus() {
    return this.service.getStatus();
  }
}
