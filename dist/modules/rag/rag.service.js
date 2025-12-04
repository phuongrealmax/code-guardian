/**
 * RAG Service - Main service for semantic codebase search
 */
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { Logger } from '../../core/logger.js';
import { DEFAULT_RAG_CONFIG, } from './rag.types.js';
import { parseSourceFile, detectLanguage } from './code-parser.js';
import { createEmbeddingProvider, findTopK } from './embedding.service.js';
export class RAGService {
    eventBus;
    config;
    index = null;
    embeddingProvider;
    buildProgress = null;
    logger;
    constructor(eventBus, config) {
        this.eventBus = eventBus;
        this.config = { ...DEFAULT_RAG_CONFIG, ...config };
        this.logger = new Logger('info', 'RAGService');
        this.embeddingProvider = createEmbeddingProvider(this.config.embeddingProvider);
        // Try to load existing index
        this.loadIndex();
    }
    /**
     * Load existing index from disk
     */
    loadIndex() {
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
            }
            catch (error) {
                this.logger.warn('Failed to load RAG index:', error);
            }
        }
    }
    /**
     * Save index to disk
     */
    saveIndex() {
        if (!this.index)
            return;
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
    async buildIndex(options) {
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
            const allChunks = [];
            const relations = [];
            for (const filePath of files) {
                try {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const language = detectLanguage(filePath);
                    if (language === 'unknown')
                        continue;
                    const { chunks, errors } = parseSourceFile(filePath, content, language);
                    allChunks.push(...chunks);
                    this.buildProgress.errors.push(...errors);
                    this.buildProgress.processedFiles++;
                    this.buildProgress.currentFile = filePath;
                    // Emit progress every 10 files
                    if (this.buildProgress.processedFiles % 10 === 0) {
                        this.eventBus.emit({ type: 'rag:index:progress', timestamp: new Date(), data: { ...this.buildProgress } });
                    }
                }
                catch (error) {
                    this.buildProgress.errors.push(`Error processing ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
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
                const texts = batch.map(chunk => `${chunk.name} ${chunk.type} ${chunk.description || ''} ${chunk.docstring || ''} ${chunk.content.slice(0, 500)}`);
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
            const chunks = new Map();
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
        }
        catch (error) {
            this.buildProgress.status = 'error';
            this.buildProgress.errors.push(error instanceof Error ? error.message : String(error));
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
    async scanFiles(options) {
        const files = [];
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
                if (lang === 'unknown')
                    return false;
                if (options.languages && !options.languages.includes(lang))
                    return false;
                return true;
            }));
        }
        return files;
    }
    /**
     * Generate natural language description for a chunk
     */
    generateDescription(chunk) {
        const parts = [];
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
    buildRelations(chunks) {
        const relations = [];
        const chunkByName = new Map();
        chunks.forEach(chunk => {
            chunkByName.set(chunk.name.toLowerCase(), chunk);
        });
        // Find function calls and references
        chunks.forEach(chunk => {
            // Check for references to other chunks
            chunkByName.forEach((target, name) => {
                if (target.id === chunk.id)
                    return;
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
    async search(query) {
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
                candidates = candidates.filter(c => query.filters.languages.includes(c.language));
            }
            if (query.filters.types?.length) {
                candidates = candidates.filter(c => query.filters.types.includes(c.type));
            }
            if (query.filters.paths?.length) {
                candidates = candidates.filter(c => query.filters.paths.some(p => c.filePath.includes(p)));
            }
        }
        // Find similar chunks
        const chunksWithVectors = candidates
            .filter(c => c.embedding && c.embedding.length > 0)
            .map(c => ({ id: c.id, vector: c.embedding }));
        const limit = query.limit || this.config.searchDefaults.limit;
        const minScore = query.minScore || this.config.searchDefaults.minScore;
        const topResults = findTopK(queryEmbedding, chunksWithVectors, limit * 2);
        // Build results
        let results = topResults
            .filter(r => r.score >= minScore)
            .map(r => ({
            chunk: this.index.chunks.get(r.id),
            score: r.score,
            matchType: 'semantic',
            highlights: this.extractHighlights(this.index.chunks.get(r.id).content, query.query),
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
        const response = {
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
     * Extract text highlights
     */
    extractHighlights(content, query) {
        const highlights = [];
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
    findRelatedChunks(chunkId) {
        if (!this.index)
            return [];
        const relatedIds = new Set();
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
            chunk: this.index.chunks.get(id),
            score: 0.8,
            matchType: 'semantic',
        }))
            .filter(r => r.chunk);
    }
    /**
     * Find code similar to a specific chunk
     */
    async findSimilar(filePath, functionName, limit = 5) {
        if (!this.index)
            return [];
        // Find the source chunk
        let sourceChunk;
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
            .filter(c => c.id !== sourceChunk.id && c.embedding)
            .map(c => ({ id: c.id, vector: c.embedding }));
        const topResults = findTopK(sourceChunk.embedding, candidates, limit);
        return topResults.map(r => ({
            chunk: this.index.chunks.get(r.id),
            score: r.score,
            matchType: 'semantic',
        }));
    }
    /**
     * Get index status
     */
    getStatus() {
        return {
            indexed: this.index !== null && this.index.chunks.size > 0,
            metadata: this.index?.metadata || null,
            buildProgress: this.buildProgress,
        };
    }
    /**
     * Get a specific chunk by ID
     */
    getChunk(id) {
        return this.index?.chunks.get(id);
    }
    /**
     * Clear the index
     */
    clearIndex() {
        this.index = null;
        const indexPath = path.resolve(this.config.indexPath);
        if (fs.existsSync(indexPath)) {
            fs.unlinkSync(indexPath);
        }
        this.logger.info('RAG index cleared');
    }
}
//# sourceMappingURL=rag.service.js.map