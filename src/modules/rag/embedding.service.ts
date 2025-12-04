/**
 * Embedding Service - Generate vector embeddings for code chunks
 * Supports local embeddings (TF-IDF based) and external APIs
 */

import { EmbeddingProvider, LocalEmbeddingConfig } from './rag.types.js';

/**
 * Local TF-IDF based embedding provider
 * No external dependencies, works offline
 */
export class LocalEmbeddingProvider implements EmbeddingProvider {
  name = 'local-tfidf';
  model = 'tfidf-256';
  dimensions = 256;
  maxTokens = 8192;

  private vocabulary: Map<string, number> = new Map();
  private idf: Map<string, number> = new Map();
  private vocabSize = 0;

  constructor(config?: LocalEmbeddingConfig) {
    // Initialize with common code tokens
    this.initializeVocabulary();
  }

  private initializeVocabulary(): void {
    // Common programming tokens
    const commonTokens = [
      'function', 'class', 'const', 'let', 'var', 'return', 'if', 'else',
      'for', 'while', 'import', 'export', 'async', 'await', 'try', 'catch',
      'throw', 'new', 'this', 'super', 'extends', 'implements', 'interface',
      'type', 'enum', 'public', 'private', 'protected', 'static', 'readonly',
      'void', 'null', 'undefined', 'true', 'false', 'number', 'string',
      'boolean', 'array', 'object', 'promise', 'error', 'response', 'request',
      'data', 'result', 'value', 'key', 'item', 'index', 'length', 'size',
      'get', 'set', 'add', 'remove', 'update', 'delete', 'create', 'find',
      'filter', 'map', 'reduce', 'sort', 'push', 'pop', 'shift', 'unshift',
      'user', 'auth', 'login', 'logout', 'token', 'session', 'password',
      'email', 'name', 'id', 'uuid', 'date', 'time', 'timestamp', 'config',
      'options', 'params', 'query', 'body', 'headers', 'status', 'message',
      'success', 'failure', 'pending', 'complete', 'active', 'enabled',
      'handler', 'callback', 'listener', 'event', 'emit', 'subscribe',
      'service', 'controller', 'model', 'view', 'component', 'module',
      'test', 'spec', 'describe', 'it', 'expect', 'mock', 'spy', 'assert',
    ];

    commonTokens.forEach((token, index) => {
      this.vocabulary.set(token.toLowerCase(), index);
      this.idf.set(token.toLowerCase(), 1.0); // Default IDF
    });

    this.vocabSize = commonTokens.length;
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1 && token.length < 30);
  }

  /**
   * Calculate term frequency
   */
  private calculateTF(tokens: string[]): Map<string, number> {
    const tf = new Map<string, number>();
    const totalTokens = tokens.length;

    tokens.forEach(token => {
      tf.set(token, (tf.get(token) || 0) + 1);
    });

    // Normalize by total tokens
    tf.forEach((count, token) => {
      tf.set(token, count / totalTokens);
    });

    return tf;
  }

  /**
   * Generate embedding vector for text
   */
  async embedSingle(text: string): Promise<number[]> {
    const tokens = this.tokenize(text);
    const tf = this.calculateTF(tokens);

    // Create fixed-size vector
    const vector = new Array(this.dimensions).fill(0);

    // Map tokens to vector positions using hash
    tf.forEach((freq, token) => {
      const idf = this.idf.get(token) || Math.log(1000); // High IDF for unknown tokens
      const tfidf = freq * idf;

      // Hash token to vector position
      const hash = this.hashString(token);
      const position = hash % this.dimensions;

      // Add to vector (with sign from second hash)
      const sign = (this.hashString(token + '_sign') % 2) * 2 - 1;
      vector[position] += tfidf * sign;
    });

    // L2 normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      return vector.map(val => val / magnitude);
    }

    return vector;
  }

  /**
   * Generate embeddings for multiple texts
   */
  async embed(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(text => this.embedSingle(text)));
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

/**
 * OpenAI embedding provider (requires API key)
 */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  name = 'openai';
  model = 'text-embedding-3-small';
  dimensions = 1536;
  maxTokens = 8191;

  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    if (model) this.model = model;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  async embedSingle(text: string): Promise<number[]> {
    const embeddings = await this.embed([text]);
    return embeddings[0];
  }

  async embed(texts: string[]): Promise<number[][]> {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json() as { data: { embedding: number[] }[] };
    return data.data.map((item) => item.embedding);
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Find top-k most similar vectors
 */
export function findTopK(
  queryVector: number[],
  vectors: { id: string; vector: number[] }[],
  k: number
): { id: string; score: number }[] {
  const scores = vectors.map(({ id, vector }) => ({
    id,
    score: cosineSimilarity(queryVector, vector),
  }));

  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

/**
 * Create embedding provider based on configuration
 */
export function createEmbeddingProvider(
  type: 'local' | 'openai' | 'anthropic' | 'qwen',
  config?: { apiKey?: string; model?: string }
): EmbeddingProvider {
  switch (type) {
    case 'openai':
      if (!config?.apiKey) {
        throw new Error('OpenAI API key required');
      }
      return new OpenAIEmbeddingProvider(config.apiKey, config.model);

    case 'local':
    default:
      return new LocalEmbeddingProvider();
  }
}
