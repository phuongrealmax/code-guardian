/**
 * RAG Service - Main service for semantic codebase search
 */
import { EventBus } from '../../core/event-bus.js';
import { RAGConfig, RAGIndex, RAGQuery, RAGResult, RAGSearchResponse, CodeChunk, IndexBuildOptions, IndexBuildProgress } from './rag.types.js';
export declare class RAGService {
    private eventBus;
    private config;
    private index;
    private embeddingProvider;
    private buildProgress;
    private logger;
    constructor(eventBus: EventBus, config?: Partial<RAGConfig>);
    /**
     * Load existing index from disk
     */
    private loadIndex;
    /**
     * Save index to disk
     */
    private saveIndex;
    /**
     * Build or rebuild the index
     */
    buildIndex(options: IndexBuildOptions): Promise<IndexBuildProgress>;
    /**
     * Scan files based on options
     */
    private scanFiles;
    /**
     * Generate natural language description for a chunk
     */
    private generateDescription;
    /**
     * Build relationships between chunks
     */
    private buildRelations;
    /**
     * Search the index
     */
    search(query: RAGQuery): Promise<RAGSearchResponse>;
    /**
     * Extract text highlights
     */
    private extractHighlights;
    /**
     * Find related chunks by relations
     */
    private findRelatedChunks;
    /**
     * Find code similar to a specific chunk
     */
    findSimilar(filePath: string, functionName?: string, limit?: number): Promise<RAGResult[]>;
    /**
     * Get index status
     */
    getStatus(): {
        indexed: boolean;
        metadata: RAGIndex['metadata'] | null;
        buildProgress: IndexBuildProgress | null;
    };
    /**
     * Get a specific chunk by ID
     */
    getChunk(id: string): CodeChunk | undefined;
    /**
     * Clear the index
     */
    clearIndex(): void;
}
//# sourceMappingURL=rag.service.d.ts.map