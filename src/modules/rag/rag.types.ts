/**
 * CCG-RAG Module Types
 * Semantic codebase search using embeddings and knowledge graphs
 */

// Code chunk extracted from source files
export interface CodeChunk {
  id: string;
  filePath: string;
  language: string;
  type: 'function' | 'class' | 'method' | 'module' | 'interface' | 'type' | 'variable' | 'import';
  name: string;
  content: string;
  description?: string; // Natural language description for better search
  startLine: number;
  endLine: number;
  signature?: string; // Function/method signature
  docstring?: string;
  imports?: string[]; // Dependencies
  exports?: string[];
  hash: string; // Content hash for change detection
  embedding?: number[]; // Vector embedding
  createdAt: Date;
  updatedAt: Date;
}

// Relationship between code chunks
export interface CodeRelation {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'calls' | 'imports' | 'extends' | 'implements' | 'uses' | 'returns' | 'defines';
  weight: number; // Relationship strength
}

// RAG Index containing all indexed code
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
    indexDuration: number; // ms
  };
}

// Search query
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
  includeRelated?: boolean; // Include related code in results
  rerank?: boolean; // Use LLM reranking
}

// Search result
export interface RAGResult {
  chunk: CodeChunk;
  score: number; // Relevance score 0-1
  matchType: 'semantic' | 'keyword' | 'hybrid';
  highlights?: string[]; // Matched text highlights
  relatedChunks?: RAGResult[]; // Related code if requested
  // Hybrid search specific fields
  bm25Score?: number; // BM25 lexical search score
  embeddingScore?: number; // Embedding similarity score
  matchedTerms?: string[]; // Terms that matched in BM25 search
}

// Search response
export interface RAGSearchResponse {
  query: string;
  results: RAGResult[];
  totalMatches: number;
  searchTime: number; // ms
  method: 'vector' | 'keyword' | 'hybrid';
}

// Index build options
export interface IndexBuildOptions {
  paths: string[];
  exclude?: string[];
  languages?: string[];
  forceRebuild?: boolean;
  generateDescriptions?: boolean; // Use LLM to generate descriptions
  embeddingProvider?: 'local' | 'openai' | 'anthropic' | 'qwen';
}

// Index build progress
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

// Embedding provider interface
export interface EmbeddingProvider {
  name: string;
  model: string;
  dimensions: number;
  maxTokens: number;
  embed(texts: string[]): Promise<number[][]>;
  embedSingle(text: string): Promise<number[]>;
}

// Local embedding config (no external API needed)
export interface LocalEmbeddingConfig {
  model: 'minilm' | 'bge-small' | 'all-mpnet';
  cachePath?: string;
}

// Knowledge graph node
export interface KnowledgeNode {
  id: string;
  chunkId: string;
  type: CodeChunk['type'];
  name: string;
  filePath: string;
  inDegree: number; // Number of incoming relations
  outDegree: number; // Number of outgoing relations
  pageRank?: number; // Importance score
}

// Knowledge graph
export interface KnowledgeGraph {
  nodes: Map<string, KnowledgeNode>;
  edges: CodeRelation[];
  metadata: {
    nodeCount: number;
    edgeCount: number;
    avgDegree: number;
    components: number; // Connected components
  };
}

// RAG configuration
export interface RAGConfig {
  enabled: boolean;
  indexPath: string; // .ccg/rag-index.json
  embeddingProvider: 'local' | 'openai' | 'anthropic' | 'qwen';
  embeddingModel?: string;
  chunkSize: number; // Max tokens per chunk
  chunkOverlap: number; // Overlap between chunks
  searchDefaults: {
    limit: number;
    minScore: number;
    rerank: boolean;
  };
  autoIndex: boolean; // Auto-index on file changes
  excludePatterns: string[];
  supportedLanguages: string[];
}

// Default RAG configuration
export const DEFAULT_RAG_CONFIG: RAGConfig = {
  enabled: true,
  indexPath: '.ccg/rag-index.json',
  embeddingProvider: 'local',
  chunkSize: 512,
  chunkOverlap: 50,
  searchDefaults: {
    limit: 10,
    minScore: 0.5,
    rerank: true,
  },
  autoIndex: false,
  excludePatterns: [
    'node_modules/**',
    'dist/**',
    'build/**',
    '.git/**',
    '*.min.js',
    '*.bundle.js',
    'package-lock.json',
    'yarn.lock',
  ],
  supportedLanguages: [
    'typescript',
    'javascript',
    'python',
    'java',
    'go',
    'rust',
    'php',
    'ruby',
    'c',
    'cpp',
  ],
};

// Events
export type RAGEventType =
  | 'rag:index:started'
  | 'rag:index:progress'
  | 'rag:index:complete'
  | 'rag:index:error'
  | 'rag:search:started'
  | 'rag:search:complete'
  | 'rag:chunk:added'
  | 'rag:chunk:updated'
  | 'rag:chunk:removed';

export interface RAGEvent {
  type: RAGEventType;
  timestamp: Date;
  data: unknown;
}
