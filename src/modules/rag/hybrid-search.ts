/**
 * Hybrid Search - Combines BM25 lexical search with embedding-based semantic search
 *
 * This provides better accuracy than either method alone:
 * - BM25: Good for exact keyword matches, handles rare terms well
 * - Embeddings: Good for semantic similarity, handles synonyms and concepts
 *
 * Hybrid score = α * BM25_score + (1-α) * embedding_similarity
 */

import { BM25Index, BM25SearchResult, createBM25Index } from './bm25.js';
import { cosineSimilarity } from './embedding.service.js';
import { CodeChunk, EmbeddingProvider } from './rag.types.js';

export interface HybridSearchConfig {
  bm25Weight: number;      // Weight for BM25 score (0-1), default 0.4
  embeddingWeight: number; // Weight for embedding similarity (0-1), default 0.6
  minScore: number;        // Minimum score threshold, default 0.1
  reranker: 'none' | 'reciprocal-rank-fusion'; // Reranking strategy
}

export interface HybridSearchResult {
  id: string;
  chunk: CodeChunk;
  hybridScore: number;
  bm25Score: number;
  embeddingScore: number;
  matchedTerms: string[];
}

const DEFAULT_HYBRID_CONFIG: HybridSearchConfig = {
  bm25Weight: 0.4,
  embeddingWeight: 0.6,
  minScore: 0.1,
  reranker: 'none',
};

/**
 * Hybrid Search combining BM25 and embedding-based search
 */
export class HybridSearch {
  private config: HybridSearchConfig;
  private bm25Index: BM25Index;
  private embeddingProvider: EmbeddingProvider;
  private chunks: Map<string, CodeChunk> = new Map();
  private embeddings: Map<string, number[]> = new Map();

  constructor(
    embeddingProvider: EmbeddingProvider,
    config?: Partial<HybridSearchConfig>
  ) {
    this.config = { ...DEFAULT_HYBRID_CONFIG, ...config };

    // Normalize weights
    const totalWeight = this.config.bm25Weight + this.config.embeddingWeight;
    this.config.bm25Weight /= totalWeight;
    this.config.embeddingWeight /= totalWeight;

    this.bm25Index = createBM25Index();
    this.embeddingProvider = embeddingProvider;
  }

  /**
   * Add a chunk to the search index
   */
  async addChunk(chunk: CodeChunk): Promise<void> {
    // Store chunk
    this.chunks.set(chunk.id, chunk);

    // Add to BM25 index
    this.bm25Index.addDocument({
      id: chunk.id,
      content: this.getSearchableContent(chunk),
    });

    // Generate and store embedding
    const embedding = await this.embeddingProvider.embedSingle(
      this.getSearchableContent(chunk)
    );
    this.embeddings.set(chunk.id, embedding);
  }

  /**
   * Add multiple chunks
   */
  async addChunks(chunks: CodeChunk[]): Promise<void> {
    // Batch add to BM25
    this.bm25Index.addDocuments(
      chunks.map(chunk => ({
        id: chunk.id,
        content: this.getSearchableContent(chunk),
      }))
    );

    // Batch generate embeddings
    const contents = chunks.map(chunk => this.getSearchableContent(chunk));
    const embeddings = await this.embeddingProvider.embed(contents);

    // Store chunks and embeddings
    for (let i = 0; i < chunks.length; i++) {
      this.chunks.set(chunks[i].id, chunks[i]);
      this.embeddings.set(chunks[i].id, embeddings[i]);
    }
  }

  /**
   * Remove a chunk from the index
   */
  removeChunk(chunkId: string): boolean {
    const removed = this.bm25Index.removeDocument(chunkId);
    this.chunks.delete(chunkId);
    this.embeddings.delete(chunkId);
    return removed;
  }

  /**
   * Get searchable content from a chunk
   */
  private getSearchableContent(chunk: CodeChunk): string {
    const parts = [
      chunk.name,
      chunk.type,
      chunk.content,
      chunk.signature || '',
      chunk.docstring || '',
    ];
    return parts.filter(Boolean).join(' ');
  }

  /**
   * Normalize scores to 0-1 range
   */
  private normalizeScores(results: { id: string; score: number }[]): Map<string, number> {
    const normalized = new Map<string, number>();

    if (results.length === 0) return normalized;

    const maxScore = Math.max(...results.map(r => r.score));
    const minScore = Math.min(...results.map(r => r.score));
    const range = maxScore - minScore;

    for (const result of results) {
      const normalizedScore = range > 0 ? (result.score - minScore) / range : 1;
      normalized.set(result.id, normalizedScore);
    }

    return normalized;
  }

  /**
   * Reciprocal Rank Fusion for combining ranked lists
   * RRF(d) = Σ 1/(k + rank_i(d)) for each ranking
   */
  private reciprocalRankFusion(
    bm25Results: BM25SearchResult[],
    embeddingResults: { id: string; score: number }[],
    k: number = 60
  ): Map<string, number> {
    const scores = new Map<string, number>();

    // Add BM25 ranks
    bm25Results.forEach((result, rank) => {
      const current = scores.get(result.id) || 0;
      scores.set(result.id, current + 1 / (k + rank + 1));
    });

    // Add embedding ranks
    embeddingResults.forEach((result, rank) => {
      const current = scores.get(result.id) || 0;
      scores.set(result.id, current + 1 / (k + rank + 1));
    });

    return scores;
  }

  /**
   * Search with hybrid scoring
   */
  async search(query: string, limit: number = 10): Promise<HybridSearchResult[]> {
    // Get BM25 results
    const bm25Results = this.bm25Index.search(query, limit * 2);

    // Get embedding for query
    const queryEmbedding = await this.embeddingProvider.embedSingle(query);

    // Calculate embedding similarities for all chunks
    const embeddingResults: { id: string; score: number }[] = [];
    for (const [id, embedding] of this.embeddings) {
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      embeddingResults.push({ id, score: similarity });
    }

    // Sort by similarity
    embeddingResults.sort((a, b) => b.score - a.score);

    // Calculate hybrid scores based on reranker strategy
    let hybridScores: Map<string, number>;
    let bm25ScoreMap: Map<string, number>;
    let embeddingScoreMap: Map<string, number>;

    if (this.config.reranker === 'reciprocal-rank-fusion') {
      // Use RRF for combining
      hybridScores = this.reciprocalRankFusion(bm25Results, embeddingResults.slice(0, limit * 2));
      bm25ScoreMap = new Map(bm25Results.map((r, i) => [r.id, 1 / (60 + i + 1)]));
      embeddingScoreMap = new Map(embeddingResults.map((r, i) => [r.id, 1 / (60 + i + 1)]));
    } else {
      // Weighted average approach
      bm25ScoreMap = this.normalizeScores(bm25Results);
      embeddingScoreMap = this.normalizeScores(embeddingResults.slice(0, limit * 2));

      hybridScores = new Map();
      const allIds = new Set([
        ...bm25Results.map(r => r.id),
        ...embeddingResults.slice(0, limit * 2).map(r => r.id),
      ]);

      for (const id of allIds) {
        const bm25Score = bm25ScoreMap.get(id) || 0;
        const embScore = embeddingScoreMap.get(id) || 0;
        const hybridScore =
          this.config.bm25Weight * bm25Score +
          this.config.embeddingWeight * embScore;
        hybridScores.set(id, hybridScore);
      }
    }

    // Build matched terms map
    const matchedTermsMap = new Map<string, string[]>();
    for (const result of bm25Results) {
      matchedTermsMap.set(result.id, result.matchedTerms);
    }

    // Build results
    const results: HybridSearchResult[] = [];
    for (const [id, hybridScore] of hybridScores) {
      if (hybridScore < this.config.minScore) continue;

      const chunk = this.chunks.get(id);
      if (!chunk) continue;

      results.push({
        id,
        chunk,
        hybridScore,
        bm25Score: bm25ScoreMap.get(id) || 0,
        embeddingScore: embeddingScoreMap.get(id) || 0,
        matchedTerms: matchedTermsMap.get(id) || [],
      });
    }

    // Sort by hybrid score
    results.sort((a, b) => b.hybridScore - a.hybridScore);

    return results.slice(0, limit);
  }

  /**
   * Search with only BM25 (lexical search)
   */
  searchBM25(query: string, limit: number = 10): BM25SearchResult[] {
    return this.bm25Index.search(query, limit);
  }

  /**
   * Search with only embeddings (semantic search)
   */
  async searchSemantic(
    query: string,
    limit: number = 10
  ): Promise<{ id: string; chunk: CodeChunk; score: number }[]> {
    const queryEmbedding = await this.embeddingProvider.embedSingle(query);

    const results: { id: string; score: number }[] = [];
    for (const [id, embedding] of this.embeddings) {
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      results.push({ id, score: similarity });
    }

    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit).map(r => ({
      id: r.id,
      chunk: this.chunks.get(r.id)!,
      score: r.score,
    }));
  }

  /**
   * Get index statistics
   */
  getStats(): {
    totalChunks: number;
    bm25Stats: { totalDocuments: number; totalTerms: number; avgDocLength: number };
    config: HybridSearchConfig;
  } {
    return {
      totalChunks: this.chunks.size,
      bm25Stats: this.bm25Index.getStats(),
      config: this.config,
    };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.bm25Index.clear();
    this.chunks.clear();
    this.embeddings.clear();
  }

  /**
   * Update search weights
   */
  setWeights(bm25Weight: number, embeddingWeight: number): void {
    const total = bm25Weight + embeddingWeight;
    this.config.bm25Weight = bm25Weight / total;
    this.config.embeddingWeight = embeddingWeight / total;
  }
}

/**
 * Create a hybrid search instance
 */
export function createHybridSearch(
  embeddingProvider: EmbeddingProvider,
  config?: Partial<HybridSearchConfig>
): HybridSearch {
  return new HybridSearch(embeddingProvider, config);
}
