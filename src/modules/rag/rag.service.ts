/**
 * RAG Service - Main service for semantic codebase search
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { EventBus } from '../../core/event-bus.js';
import { Logger } from '../../core/logger.js';
import {
  RAGConfig,
  RAGIndex,
  RAGQuery,
  RAGResult,
  RAGSearchResponse,
  CodeChunk,
  CodeRelation,
  IndexBuildOptions,
  IndexBuildProgress,
  DEFAULT_RAG_CONFIG,
  EmbeddingProvider,
} from './rag.types.js';
import { parseSourceFile, detectLanguage } from './code-parser.js';
import { createEmbeddingProvider, cosineSimilarity, findTopK } from './embedding.service.js';
import { HybridSearch, createHybridSearch, HybridSearchResult } from './hybrid-search.js';
import { BM25Index, createBM25Index } from './bm25.js';

export class RAGService {
  private config: RAGConfig;
  private index: RAGIndex | null = null;
  private embeddingProvider: EmbeddingProvider;
  private buildProgress: IndexBuildProgress | null = null;
  private hybridSearch: HybridSearch | null = null;
  private bm25Index: BM25Index | null = null;
  private logger: Logger;

  constructor(
    private eventBus: EventBus,
    config?: Partial<RAGConfig>
  ) {
    this.config = { ...DEFAULT_RAG_CONFIG, ...config };
    this.logger = new Logger('info', 'RAGService');
    this.embeddingProvider = createEmbeddingProvider(this.config.embeddingProvider);

    // Initialize hybrid search
    this.hybridSearch = createHybridSearch(this.embeddingProvider, {
      bm25Weight: 0.4,
      embeddingWeight: 0.6,
      minScore: 0.1,
    });

    // Initialize BM25 index for pure lexical search
    this.bm25Index = createBM25Index();

    // Try to load existing index
    this.loadIndex();
  }

  /**
   * Load existing index from disk
   */
  private loadIndex(): void {
    const indexPath = path.resolve(this.config.indexPath);

    if (fs.existsSync(indexPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

        this.index = {
          version: data.version,
          projectPath: data.projectPath,
          chunks: new Map(Object.entries(data.chunks)),
          relations: data.relations || [],
          metadata: data.metadata,
        };

        this.logger.info(`Loaded RAG index: ${this.index.metadata.totalChunks} chunks`);
      } catch (error) {
        this.logger.warn('Failed to load RAG index:', error);
      }
    }
  }

  /**
   * Save index to disk
   */
  private saveIndex(): void {
    if (!this.index) return;

    const indexPath = path.resolve(this.config.indexPath);
    const dir = path.dirname(indexPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const data = {
      version: this.index.version,
      projectPath: this.index.projectPath,
      chunks: Object.fromEntries(this.index.chunks),
      relations: this.index.relations,
      metadata: this.index.metadata,
    };

    fs.writeFileSync(indexPath, JSON.stringify(data, null, 2));
    this.logger.info(`Saved RAG index: ${this.index.metadata.totalChunks} chunks`);
  }

  /**
   * Build or rebuild the index
   */
  async buildIndex(options: IndexBuildOptions): Promise<IndexBuildProgress> {
    const startTime = Date.now();

    this.buildProgress = {
      status: 'scanning',
      processedFiles: 0,
      totalFiles: 0,
      processedChunks: 0,
      errors: [],
      startTime: new Date(),
    };

    this.eventBus.emit({ type: 'rag:index:started', timestamp: new Date(), data: { options } });

    try {
      // Step 1: Scan files
      const files = await this.scanFiles(options);
      this.buildProgress.totalFiles = files.length;
      this.buildProgress.status = 'parsing';

      this.eventBus.emit({ type: 'rag:index:progress', timestamp: new Date(), data: { ...this.buildProgress } });

      // Step 2: Parse files and extract chunks
      const allChunks: CodeChunk[] = [];
      const relations: CodeRelation[] = [];

      for (const filePath of files) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const language = detectLanguage(filePath);

          if (language === 'unknown') continue;

          const { chunks, errors } = parseSourceFile(filePath, content, language);

          allChunks.push(...chunks);
          this.buildProgress.errors.push(...errors);
          this.buildProgress.processedFiles++;
          this.buildProgress.currentFile = filePath;

          // Emit progress every 10 files
          if (this.buildProgress.processedFiles % 10 === 0) {
            this.eventBus.emit({ type: 'rag:index:progress', timestamp: new Date(), data: { ...this.buildProgress } });
          }
        } catch (error) {
          this.buildProgress.errors.push(
            `Error processing ${filePath}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      // Step 3: Generate embeddings
      this.buildProgress.status = 'embedding';
      this.eventBus.emit({ type: 'rag:index:progress', timestamp: new Date(), data: { ...this.buildProgress } });

      if (options.generateDescriptions) {
        // Generate natural language descriptions (optional, uses more resources)
        for (const chunk of allChunks) {
          chunk.description = this.generateDescription(chunk);
        }
      }

      // Generate embeddings in batches
      const batchSize = 50;
      for (let i = 0; i < allChunks.length; i += batchSize) {
        const batch = allChunks.slice(i, i + batchSize);
        const texts = batch.map(chunk =>
          `${chunk.name} ${chunk.type} ${chunk.description || ''} ${chunk.docstring || ''} ${chunk.content.slice(0, 500)}`
        );

        const embeddings = await this.embeddingProvider.embed(texts);

        batch.forEach((chunk, idx) => {
          chunk.embedding = embeddings[idx];
        });

        this.buildProgress.processedChunks = i + batch.length;
        this.eventBus.emit({ type: 'rag:index:progress', timestamp: new Date(), data: { ...this.buildProgress } });
      }

      // Step 4: Build relations
      this.buildProgress.status = 'indexing';
      relations.push(...this.buildRelations(allChunks));

      // Step 5: Create index
      const chunks = new Map<string, CodeChunk>();
      allChunks.forEach(chunk => chunks.set(chunk.id, chunk));

      this.index = {
        version: '3.0.0',
        projectPath: options.paths[0] || process.cwd(),
        chunks,
        relations,
        metadata: {
          totalFiles: this.buildProgress.processedFiles,
          totalChunks: allChunks.length,
          languages: [...new Set(allChunks.map(c => c.language))],
          lastIndexed: new Date(),
          embeddingModel: this.embeddingProvider.model,
          indexDuration: Date.now() - startTime,
        },
      };

      // Save index
      this.saveIndex();

      this.buildProgress.status = 'complete';
      this.eventBus.emit({
        type: 'rag:index:complete',
        timestamp: new Date(),
        data: {
          ...this.buildProgress,
          totalChunks: allChunks.length,
          duration: Date.now() - startTime,
        }
      });

      return this.buildProgress;
    } catch (error) {
      this.buildProgress.status = 'error';
      this.buildProgress.errors.push(
        error instanceof Error ? error.message : String(error)
      );

      this.eventBus.emit({
        type: 'rag:index:error',
        timestamp: new Date(),
        data: {
          error: error instanceof Error ? error.message : String(error),
        }
      });

      return this.buildProgress;
    }
  }

  /**
   * Scan files based on options
   */
  private async scanFiles(options: IndexBuildOptions): Promise<string[]> {
    const files: string[] = [];

    for (const searchPath of options.paths) {
      const pattern = path.join(searchPath, '**/*');
      const matches = await glob(pattern, {
        ignore: [
          ...(options.exclude || []),
          ...this.config.excludePatterns,
        ],
        nodir: true,
        absolute: true,
      });

      files.push(...matches.filter(f => {
        const lang = detectLanguage(f);
        if (lang === 'unknown') return false;
        if (options.languages && !options.languages.includes(lang)) return false;
        return true;
      }));
    }

    return files;
  }

  /**
   * Generate natural language description for a chunk
   */
  private generateDescription(chunk: CodeChunk): string {
    const parts: string[] = [];

    parts.push(`${chunk.type} named ${chunk.name}`);

    if (chunk.signature) {
      parts.push(`with signature: ${chunk.signature}`);
    }

    if (chunk.imports && chunk.imports.length > 0) {
      parts.push(`importing from: ${chunk.imports.slice(0, 3).join(', ')}`);
    }

    return parts.join(' ');
  }

  /**
   * Build relationships between chunks
   */
  private buildRelations(chunks: CodeChunk[]): CodeRelation[] {
    const relations: CodeRelation[] = [];
    const chunkByName = new Map<string, CodeChunk>();

    chunks.forEach(chunk => {
      chunkByName.set(chunk.name.toLowerCase(), chunk);
    });

    // Find function calls and references
    chunks.forEach(chunk => {
      // Check for references to other chunks
      chunkByName.forEach((target, name) => {
        if (target.id === chunk.id) return;

        // Check if this chunk references the target
        const regex = new RegExp(`\\b${name}\\b`, 'i');
        if (regex.test(chunk.content)) {
          relations.push({
            id: `${chunk.id}->${target.id}`,
            sourceId: chunk.id,
            targetId: target.id,
            type: chunk.type === 'class' && target.type === 'class' ? 'extends' : 'calls',
            weight: 1,
          });
        }
      });
    });

    return relations;
  }

  /**
   * Search the index
   */
  async search(query: RAGQuery): Promise<RAGSearchResponse> {
    const startTime = Date.now();

    if (!this.index || this.index.chunks.size === 0) {
      return {
        query: query.query,
        results: [],
        totalMatches: 0,
        searchTime: Date.now() - startTime,
        method: 'vector',
      };
    }

    this.eventBus.emit({ type: 'rag:search:started', timestamp: new Date(), data: { query } });

    // Generate query embedding
    const queryEmbedding = await this.embeddingProvider.embedSingle(query.query);

    // Filter chunks based on query filters
    let candidates = Array.from(this.index.chunks.values());

    if (query.filters) {
      if (query.filters.languages?.length) {
        candidates = candidates.filter(c =>
          query.filters!.languages!.includes(c.language)
        );
      }
      if (query.filters.types?.length) {
        candidates = candidates.filter(c =>
          query.filters!.types!.includes(c.type)
        );
      }
      if (query.filters.paths?.length) {
        candidates = candidates.filter(c =>
          query.filters!.paths!.some(p => c.filePath.includes(p))
        );
      }
    }

    // Find similar chunks
    const chunksWithVectors = candidates
      .filter(c => c.embedding && c.embedding.length > 0)
      .map(c => ({ id: c.id, vector: c.embedding! }));

    const limit = query.limit || this.config.searchDefaults.limit;
    const minScore = query.minScore || this.config.searchDefaults.minScore;

    const topResults = findTopK(queryEmbedding, chunksWithVectors, limit * 2);

    // Build results
    let results: RAGResult[] = topResults
      .filter(r => r.score >= minScore)
      .map(r => ({
        chunk: this.index!.chunks.get(r.id)!,
        score: r.score,
        matchType: 'semantic' as const,
        highlights: this.extractHighlights(
          this.index!.chunks.get(r.id)!.content,
          query.query
        ),
      }));

    // Include related chunks if requested
    if (query.includeRelated && results.length > 0) {
      results = results.map(result => ({
        ...result,
        relatedChunks: this.findRelatedChunks(result.chunk.id),
      }));
    }

    // Limit final results
    results = results.slice(0, limit);

    const response: RAGSearchResponse = {
      query: query.query,
      results,
      totalMatches: results.length,
      searchTime: Date.now() - startTime,
      method: 'vector',
    };

    this.eventBus.emit({
      type: 'rag:search:complete',
      timestamp: new Date(),
      data: {
        query: query.query,
        resultCount: results.length,
        searchTime: response.searchTime,
      }
    });

    return response;
  }

  /**
   * Hybrid search combining BM25 and embedding-based search
   * This provides better accuracy than either method alone
   */
  async searchHybrid(
    query: RAGQuery
  ): Promise<RAGSearchResponse & { hybridResults?: HybridSearchResult[] }> {
    const startTime = Date.now();

    if (!this.hybridSearch || !this.index || this.index.chunks.size === 0) {
      return {
        query: query.query,
        results: [],
        totalMatches: 0,
        searchTime: Date.now() - startTime,
        method: 'hybrid',
      };
    }

    this.eventBus.emit({ type: 'rag:search:started', timestamp: new Date(), data: { query, method: 'hybrid' } });

    const limit = query.limit || this.config.searchDefaults.limit;
    const hybridResults = await this.hybridSearch.search(query.query, limit);

    // Convert to standard RAGResult format
    const results: RAGResult[] = hybridResults.map(hr => ({
      chunk: hr.chunk,
      score: hr.hybridScore,
      matchType: 'hybrid' as const,
      highlights: this.extractHighlights(hr.chunk.content, query.query),
      bm25Score: hr.bm25Score,
      embeddingScore: hr.embeddingScore,
      matchedTerms: hr.matchedTerms,
    }));

    const response: RAGSearchResponse & { hybridResults?: HybridSearchResult[] } = {
      query: query.query,
      results,
      totalMatches: results.length,
      searchTime: Date.now() - startTime,
      method: 'hybrid',
      hybridResults, // Include detailed hybrid results
    };

    this.eventBus.emit({
      type: 'rag:search:complete',
      timestamp: new Date(),
      data: {
        query: query.query,
        resultCount: results.length,
        searchTime: response.searchTime,
        method: 'hybrid',
      }
    });

    return response;
  }

  /**
   * BM25-only search (lexical/keyword search)
   */
  searchBM25(query: string, limit: number = 10): { id: string; score: number; matchedTerms: string[] }[] {
    if (!this.bm25Index) return [];
    return this.bm25Index.search(query, limit);
  }

  /**
   * Rebuild hybrid search index from existing RAG index
   */
  async rebuildHybridIndex(): Promise<void> {
    if (!this.index || !this.hybridSearch) return;

    this.hybridSearch.clear();
    this.bm25Index?.clear();

    const chunks = Array.from(this.index.chunks.values());
    await this.hybridSearch.addChunks(chunks);

    // Also add to BM25 index
    if (this.bm25Index) {
      for (const chunk of chunks) {
        this.bm25Index.addDocument({
          id: chunk.id,
          content: `${chunk.name} ${chunk.type} ${chunk.content}`,
        });
      }
    }

    this.logger.info(`Rebuilt hybrid index with ${chunks.length} chunks`);
  }

  /**
   * Get hybrid search statistics
   */
  getHybridStats(): {
    enabled: boolean;
    totalChunks: number;
    bm25Stats: { totalDocuments: number; totalTerms: number; avgDocLength: number };
  } | null {
    if (!this.hybridSearch) return null;
    return {
      enabled: true,
      ...this.hybridSearch.getStats(),
    };
  }

  /**
   * Extract text highlights
   */
  private extractHighlights(content: string, query: string): string[] {
    const highlights: string[] = [];
    const words = query.toLowerCase().split(/\s+/);
    const lines = content.split('\n');

    lines.forEach(line => {
      const lineLower = line.toLowerCase();
      if (words.some(word => lineLower.includes(word))) {
        highlights.push(line.trim());
      }
    });

    return highlights.slice(0, 5);
  }

  /**
   * Find related chunks by relations
   */
  private findRelatedChunks(chunkId: string): RAGResult[] {
    if (!this.index) return [];

    const relatedIds = new Set<string>();

    this.index.relations.forEach(relation => {
      if (relation.sourceId === chunkId) {
        relatedIds.add(relation.targetId);
      }
      if (relation.targetId === chunkId) {
        relatedIds.add(relation.sourceId);
      }
    });

    return Array.from(relatedIds)
      .slice(0, 5)
      .map(id => ({
        chunk: this.index!.chunks.get(id)!,
        score: 0.8,
        matchType: 'semantic' as const,
      }))
      .filter(r => r.chunk);
  }

  /**
   * Find code similar to a specific chunk
   */
  async findSimilar(
    filePath: string,
    functionName?: string,
    limit = 5
  ): Promise<RAGResult[]> {
    if (!this.index) return [];

    // Find the source chunk
    let sourceChunk: CodeChunk | undefined;

    this.index.chunks.forEach(chunk => {
      if (chunk.filePath.includes(filePath)) {
        if (!functionName || chunk.name === functionName) {
          sourceChunk = chunk;
        }
      }
    });

    if (!sourceChunk || !sourceChunk.embedding) {
      return [];
    }

    // Find similar chunks
    const candidates = Array.from(this.index.chunks.values())
      .filter(c => c.id !== sourceChunk!.id && c.embedding)
      .map(c => ({ id: c.id, vector: c.embedding! }));

    const topResults = findTopK(sourceChunk.embedding, candidates, limit);

    return topResults.map(r => ({
      chunk: this.index!.chunks.get(r.id)!,
      score: r.score,
      matchType: 'semantic' as const,
    }));
  }

  /**
   * Get index status
   */
  getStatus(): {
    indexed: boolean;
    metadata: RAGIndex['metadata'] | null;
    buildProgress: IndexBuildProgress | null;
  } {
    return {
      indexed: this.index !== null && this.index.chunks.size > 0,
      metadata: this.index?.metadata || null,
      buildProgress: this.buildProgress,
    };
  }

  /**
   * Get a specific chunk by ID
   */
  getChunk(id: string): CodeChunk | undefined {
    return this.index?.chunks.get(id);
  }

  /**
   * Clear the index
   */
  clearIndex(): void {
    this.index = null;
    const indexPath = path.resolve(this.config.indexPath);
    if (fs.existsSync(indexPath)) {
      fs.unlinkSync(indexPath);
    }
    this.logger.info('RAG index cleared');
  }
}
