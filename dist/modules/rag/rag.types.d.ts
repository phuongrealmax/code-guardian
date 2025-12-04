/**
 * CCG-RAG Module Types
 * Semantic codebase search using embeddings and knowledge graphs
 */
export interface CodeChunk {
    id: string;
    filePath: string;
    language: string;
    type: 'function' | 'class' | 'method' | 'module' | 'interface' | 'type' | 'variable' | 'import';
    name: string;
    content: string;
    description?: string;
    startLine: number;
    endLine: number;
    signature?: string;
    docstring?: string;
    imports?: string[];
    exports?: string[];
    hash: string;
    embedding?: number[];
    createdAt: Date;
    updatedAt: Date;
}
export interface CodeRelation {
    id: string;
    sourceId: string;
    targetId: string;
    type: 'calls' | 'imports' | 'extends' | 'implements' | 'uses' | 'returns' | 'defines';
    weight: number;
}
export interface RAGIndex {
    version: string;
    projectPath: string;
    chunks: Map<string, CodeChunk>;
    relations: CodeRelation[];
    metadata: {
        totalFiles: number;
        totalChunks: number;
        languages: string[];
        lastIndexed: Date;
        embeddingModel: string;
        indexDuration: number;
    };
}
export interface RAGQuery {
    query: string;
    filters?: {
        languages?: string[];
        filePatterns?: string[];
        types?: CodeChunk['type'][];
        paths?: string[];
    };
    limit?: number;
    minScore?: number;
    includeRelated?: boolean;
    rerank?: boolean;
}
export interface RAGResult {
    chunk: CodeChunk;
    score: number;
    matchType: 'semantic' | 'keyword' | 'hybrid';
    highlights?: string[];
    relatedChunks?: RAGResult[];
}
export interface RAGSearchResponse {
    query: string;
    results: RAGResult[];
    totalMatches: number;
    searchTime: number;
    method: 'vector' | 'keyword' | 'hybrid';
}
export interface IndexBuildOptions {
    paths: string[];
    exclude?: string[];
    languages?: string[];
    forceRebuild?: boolean;
    generateDescriptions?: boolean;
    embeddingProvider?: 'local' | 'openai' | 'anthropic' | 'qwen';
}
export interface IndexBuildProgress {
    status: 'scanning' | 'parsing' | 'embedding' | 'indexing' | 'complete' | 'error';
    currentFile?: string;
    processedFiles: number;
    totalFiles: number;
    processedChunks: number;
    errors: string[];
    startTime: Date;
    estimatedCompletion?: Date;
}
export interface EmbeddingProvider {
    name: string;
    model: string;
    dimensions: number;
    maxTokens: number;
    embed(texts: string[]): Promise<number[][]>;
    embedSingle(text: string): Promise<number[]>;
}
export interface LocalEmbeddingConfig {
    model: 'minilm' | 'bge-small' | 'all-mpnet';
    cachePath?: string;
}
export interface KnowledgeNode {
    id: string;
    chunkId: string;
    type: CodeChunk['type'];
    name: string;
    filePath: string;
    inDegree: number;
    outDegree: number;
    pageRank?: number;
}
export interface KnowledgeGraph {
    nodes: Map<string, KnowledgeNode>;
    edges: CodeRelation[];
    metadata: {
        nodeCount: number;
        edgeCount: number;
        avgDegree: number;
        components: number;
    };
}
export interface RAGConfig {
    enabled: boolean;
    indexPath: string;
    embeddingProvider: 'local' | 'openai' | 'anthropic' | 'qwen';
    embeddingModel?: string;
    chunkSize: number;
    chunkOverlap: number;
    searchDefaults: {
        limit: number;
        minScore: number;
        rerank: boolean;
    };
    autoIndex: boolean;
    excludePatterns: string[];
    supportedLanguages: string[];
}
export declare const DEFAULT_RAG_CONFIG: RAGConfig;
export type RAGEventType = 'rag:index:started' | 'rag:index:progress' | 'rag:index:complete' | 'rag:index:error' | 'rag:search:started' | 'rag:search:complete' | 'rag:chunk:added' | 'rag:chunk:updated' | 'rag:chunk:removed';
export interface RAGEvent {
    type: RAGEventType;
    timestamp: Date;
    data: unknown;
}
//# sourceMappingURL=rag.types.d.ts.map