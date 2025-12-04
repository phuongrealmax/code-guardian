/**
 * Embedding Service - Generate vector embeddings for code chunks
 * Supports local embeddings (TF-IDF based) and external APIs
 */
import { EmbeddingProvider, LocalEmbeddingConfig } from './rag.types.js';
/**
 * Local TF-IDF based embedding provider
 * No external dependencies, works offline
 */
export declare class LocalEmbeddingProvider implements EmbeddingProvider {
    name: string;
    model: string;
    dimensions: number;
    maxTokens: number;
    private vocabulary;
    private idf;
    private vocabSize;
    constructor(config?: LocalEmbeddingConfig);
    private initializeVocabulary;
    /**
     * Tokenize text into words
     */
    private tokenize;
    /**
     * Calculate term frequency
     */
    private calculateTF;
    /**
     * Generate embedding vector for text
     */
    embedSingle(text: string): Promise<number[]>;
    /**
     * Generate embeddings for multiple texts
     */
    embed(texts: string[]): Promise<number[][]>;
    /**
     * Simple string hash function
     */
    private hashString;
}
/**
 * OpenAI embedding provider (requires API key)
 */
export declare class OpenAIEmbeddingProvider implements EmbeddingProvider {
    name: string;
    model: string;
    dimensions: number;
    maxTokens: number;
    private apiKey;
    private baseUrl;
    constructor(apiKey: string, model?: string);
    embedSingle(text: string): Promise<number[]>;
    embed(texts: string[]): Promise<number[][]>;
}
/**
 * Calculate cosine similarity between two vectors
 */
export declare function cosineSimilarity(a: number[], b: number[]): number;
/**
 * Find top-k most similar vectors
 */
export declare function findTopK(queryVector: number[], vectors: {
    id: string;
    vector: number[];
}[], k: number): {
    id: string;
    score: number;
}[];
/**
 * Create embedding provider based on configuration
 */
export declare function createEmbeddingProvider(type: 'local' | 'openai' | 'anthropic' | 'qwen', config?: {
    apiKey?: string;
    model?: string;
}): EmbeddingProvider;
//# sourceMappingURL=embedding.service.d.ts.map