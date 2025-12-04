// src/modules/memory/memory.service.ts
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
// ═══════════════════════════════════════════════════════════════
//                      MEMORY SERVICE CLASS
// ═══════════════════════════════════════════════════════════════
export class MemoryService {
    config;
    eventBus;
    logger;
    db = null;
    memories = new Map();
    initialized = false;
    constructor(config, eventBus, logger) {
        this.config = config;
        this.eventBus = eventBus;
        this.logger = logger;
    }
    /**
     * Initialize the memory service
     */
    async initialize() {
        if (!this.config.enabled) {
            this.logger.info('Memory module disabled');
            return;
        }
        if (this.initialized) {
            this.logger.warn('Memory service already initialized');
            return;
        }
        try {
            // Zero Retention Mode: Skip database persistence (GDPR compliance)
            if (this.config.zeroRetention) {
                this.logger.info('Memory module running in ZERO RETENTION mode - data will not persist');
                this.initialized = true;
                return;
            }
            // Ensure directory exists
            const dbDir = dirname(this.config.persistPath);
            if (!existsSync(dbDir)) {
                mkdirSync(dbDir, { recursive: true });
            }
            // Initialize SQLite database
            this.db = new Database(this.config.persistPath);
            this.createTables();
            await this.loadFromDb();
            // Apply retention policy if configured
            if (this.config.retentionDays) {
                await this.applyRetentionPolicy();
            }
            this.initialized = true;
            this.logger.info(`Memory module initialized with ${this.memories.size} items`);
            // Emit event
            this.eventBus.emit({
                type: 'memory:store',
                timestamp: new Date(),
                data: { action: 'initialized', count: this.memories.size },
                source: 'MemoryService',
            });
        }
        catch (error) {
            this.logger.error('Failed to initialize memory service', error);
            throw error;
        }
    }
    /**
     * Shutdown the memory service
     */
    async shutdown() {
        if (this.config.autoSave) {
            await this.savePersistent();
        }
        if (this.db) {
            this.db.close();
            this.db = null;
        }
        this.initialized = false;
        this.logger.info('Memory service shutdown');
    }
    // ═══════════════════════════════════════════════════════════════
    //                      PUBLIC METHODS
    // ═══════════════════════════════════════════════════════════════
    /**
     * Store a new memory
     */
    async store(params) {
        this.ensureInitialized();
        const memory = {
            id: randomUUID(),
            content: params.content,
            type: params.type,
            importance: Math.min(10, Math.max(1, params.importance)),
            tags: params.tags || [],
            createdAt: new Date(),
            accessedAt: new Date(),
            accessCount: 0,
            metadata: params.metadata,
        };
        // Check for duplicates
        const duplicate = this.findSimilar(memory.content);
        if (duplicate) {
            // Update existing instead of creating new
            duplicate.importance = Math.max(duplicate.importance, memory.importance);
            duplicate.accessedAt = new Date();
            duplicate.accessCount++;
            // Merge tags
            const mergedTags = [...new Set([...duplicate.tags, ...memory.tags])];
            duplicate.tags = mergedTags;
            await this.updateInDb(duplicate);
            this.logger.debug(`Memory updated (duplicate): ${duplicate.id}`);
            return duplicate;
        }
        // Store new memory
        this.memories.set(memory.id, memory);
        await this.insertToDb(memory);
        // Enforce max items
        await this.enforceLimit();
        // Emit event
        this.eventBus.emit({
            type: 'memory:store',
            timestamp: new Date(),
            data: { id: memory.id, type: memory.type },
            source: 'MemoryService',
        });
        this.logger.debug(`Memory stored: ${memory.id}`);
        return memory;
    }
    /**
     * Recall memories based on query
     */
    async recall(params) {
        this.ensureInitialized();
        const limit = params.limit || 10;
        const query = params.query.toLowerCase();
        let results = Array.from(this.memories.values());
        // Filter by type if specified
        if (params.type) {
            results = results.filter(m => m.type === params.type);
        }
        // Filter by minimum importance
        if (params.minImportance) {
            results = results.filter(m => m.importance >= params.minImportance);
        }
        // Filter by tags
        if (params.tags && params.tags.length > 0) {
            results = results.filter(m => params.tags.some(tag => m.tags.includes(tag)));
        }
        // Score by relevance
        const scored = results.map(memory => {
            let score = 0;
            let matchType = 'partial';
            // Exact content match
            if (memory.content.toLowerCase() === query) {
                score += 20;
                matchType = 'exact';
            }
            // Partial content match
            else if (memory.content.toLowerCase().includes(query)) {
                score += 10;
                matchType = 'partial';
            }
            // Tag match
            for (const tag of memory.tags) {
                if (tag.toLowerCase().includes(query)) {
                    score += 5;
                    if (matchType !== 'exact')
                        matchType = 'tag';
                }
            }
            // Word-level matching
            const queryWords = query.split(/\s+/);
            const contentWords = memory.content.toLowerCase().split(/\s+/);
            for (const qWord of queryWords) {
                if (contentWords.some(cWord => cWord.includes(qWord))) {
                    score += 2;
                }
            }
            // Importance boost
            score += memory.importance;
            // Recency boost (memories accessed recently get higher scores)
            const daysSinceAccess = (Date.now() - memory.accessedAt.getTime()) / (1000 * 60 * 60 * 24);
            score -= Math.min(5, daysSinceAccess * 0.1);
            // Access count boost
            score += Math.min(3, memory.accessCount * 0.5);
            return { memory, score, matchType };
        });
        // Sort by score and take top results
        const topResults = scored
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
        // Update access times for returned memories
        for (const result of topResults) {
            result.memory.accessedAt = new Date();
            result.memory.accessCount++;
            await this.updateInDb(result.memory);
        }
        // Emit event
        this.eventBus.emit({
            type: 'memory:recall',
            timestamp: new Date(),
            data: { query: params.query, resultCount: topResults.length },
            source: 'MemoryService',
        });
        return topResults.map(r => r.memory);
    }
    /**
     * Forget (delete) a memory
     */
    async forget(id) {
        this.ensureInitialized();
        if (!this.memories.has(id)) {
            return false;
        }
        this.memories.delete(id);
        this.db.prepare('DELETE FROM memories WHERE id = ?').run(id);
        // Emit event
        this.eventBus.emit({
            type: 'memory:forget',
            timestamp: new Date(),
            data: { id },
            source: 'MemoryService',
        });
        this.logger.debug(`Memory deleted: ${id}`);
        return true;
    }
    /**
     * Get memory by ID
     */
    async get(id) {
        this.ensureInitialized();
        return this.memories.get(id);
    }
    /**
     * Get all memories
     */
    async getAll() {
        this.ensureInitialized();
        return Array.from(this.memories.values());
    }
    /**
     * Get memory summary
     */
    async getSummary() {
        this.ensureInitialized();
        const all = Array.from(this.memories.values());
        const byType = {};
        for (const memory of all) {
            byType[memory.type] = (byType[memory.type] || 0) + 1;
        }
        const recentlyAccessed = [...all]
            .sort((a, b) => b.accessedAt.getTime() - a.accessedAt.getTime())
            .slice(0, 5);
        const mostImportant = [...all]
            .sort((a, b) => b.importance - a.importance)
            .slice(0, 5);
        const dates = all.map(m => m.createdAt.getTime());
        return {
            total: all.length,
            byType,
            recentlyAccessed,
            mostImportant,
            oldestMemory: dates.length > 0 ? new Date(Math.min(...dates)) : undefined,
            newestMemory: dates.length > 0 ? new Date(Math.max(...dates)) : undefined,
        };
    }
    /**
     * Get module status
     */
    getStatus() {
        const total = this.memories.size;
        const lastMemory = Array.from(this.memories.values())
            .sort((a, b) => b.accessedAt.getTime() - a.accessedAt.getTime())[0];
        return {
            enabled: this.config.enabled,
            totalMemories: total,
            dbPath: this.config.persistPath,
            lastAccessed: lastMemory?.accessedAt,
            memoryUsage: {
                used: total,
                max: this.config.maxItems,
                percentage: Math.round((total / this.config.maxItems) * 100),
            },
        };
    }
    /**
     * Get snapshot of all memories
     */
    getSnapshot() {
        return Array.from(this.memories.values());
    }
    /**
     * Load memories from snapshot
     */
    async loadSnapshot(memories) {
        this.ensureInitialized();
        this.memories.clear();
        for (const memory of memories) {
            this.memories.set(memory.id, memory);
            await this.insertToDb(memory);
        }
        this.logger.info(`Loaded ${memories.length} memories from snapshot`);
    }
    /**
     * Save all memories to persistent storage
     */
    async savePersistent() {
        this.ensureInitialized();
        const count = this.memories.size;
        this.logger.info(`Saved ${count} memories to persistent storage`);
        return count;
    }
    /**
     * Load memories from persistent storage
     */
    async loadPersistent() {
        await this.loadFromDb();
        return this.memories.size;
    }
    // ═══════════════════════════════════════════════════════════════
    //                      PRIVATE METHODS
    // ═══════════════════════════════════════════════════════════════
    ensureInitialized() {
        if (!this.initialized || !this.db) {
            throw new Error('Memory service not initialized');
        }
    }
    createTables() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        type TEXT NOT NULL,
        importance INTEGER NOT NULL,
        tags TEXT NOT NULL,
        created_at TEXT NOT NULL,
        accessed_at TEXT NOT NULL,
        access_count INTEGER DEFAULT 0,
        metadata TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
      CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance);
      CREATE INDEX IF NOT EXISTS idx_memories_accessed_at ON memories(accessed_at);
    `);
    }
    async loadFromDb() {
        if (!this.db)
            return;
        const rows = this.db.prepare(`
      SELECT * FROM memories
      ORDER BY importance DESC, accessed_at DESC
      LIMIT ?
    `).all(this.config.maxItems);
        for (const row of rows) {
            const memory = {
                id: row.id,
                content: row.content,
                type: row.type,
                importance: row.importance,
                tags: JSON.parse(row.tags),
                createdAt: new Date(row.created_at),
                accessedAt: new Date(row.accessed_at),
                accessCount: row.access_count,
                metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
            };
            this.memories.set(memory.id, memory);
        }
    }
    async insertToDb(memory) {
        if (!this.db)
            return;
        this.db.prepare(`
      INSERT OR REPLACE INTO memories
      (id, content, type, importance, tags, created_at, accessed_at, access_count, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(memory.id, memory.content, memory.type, memory.importance, JSON.stringify(memory.tags), memory.createdAt.toISOString(), memory.accessedAt.toISOString(), memory.accessCount, memory.metadata ? JSON.stringify(memory.metadata) : null);
    }
    async updateInDb(memory) {
        if (!this.db)
            return;
        this.db.prepare(`
      UPDATE memories
      SET importance = ?, tags = ?, accessed_at = ?, access_count = ?, metadata = ?
      WHERE id = ?
    `).run(memory.importance, JSON.stringify(memory.tags), memory.accessedAt.toISOString(), memory.accessCount, memory.metadata ? JSON.stringify(memory.metadata) : null, memory.id);
    }
    findSimilar(content) {
        const normalized = content.toLowerCase().trim();
        for (const memory of this.memories.values()) {
            const memoryNormalized = memory.content.toLowerCase().trim();
            // Exact match
            if (memoryNormalized === normalized) {
                return memory;
            }
            // High overlap check
            const overlap = this.calculateOverlap(normalized, memoryNormalized);
            if (overlap > 0.8) {
                return memory;
            }
        }
        return undefined;
    }
    calculateOverlap(a, b) {
        const wordsA = new Set(a.split(/\s+/).filter(w => w.length > 2));
        const wordsB = new Set(b.split(/\s+/).filter(w => w.length > 2));
        if (wordsA.size === 0 || wordsB.size === 0) {
            return 0;
        }
        let intersection = 0;
        for (const word of wordsA) {
            if (wordsB.has(word)) {
                intersection++;
            }
        }
        return intersection / Math.max(wordsA.size, wordsB.size);
    }
    async enforceLimit() {
        if (this.memories.size <= this.config.maxItems) {
            return;
        }
        // Sort by composite score (importance + recency)
        const sorted = Array.from(this.memories.values())
            .sort((a, b) => {
            const scoreA = a.importance * 10 - (Date.now() - a.accessedAt.getTime()) / (1000 * 60 * 60);
            const scoreB = b.importance * 10 - (Date.now() - b.accessedAt.getTime()) / (1000 * 60 * 60);
            return scoreA - scoreB; // Lower scores first (to be removed)
        });
        const toRemove = sorted.slice(0, this.memories.size - this.config.maxItems);
        for (const memory of toRemove) {
            await this.forget(memory.id);
        }
        this.logger.debug(`Removed ${toRemove.length} memories to enforce limit`);
    }
    /**
     * Apply retention policy - delete memories older than configured days
     * GDPR/Compliance: Automatic data cleanup
     */
    async applyRetentionPolicy() {
        if (!this.config.retentionDays || this.config.zeroRetention) {
            return;
        }
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
        const toDelete = [];
        for (const [id, memory] of this.memories) {
            if (memory.createdAt < cutoffDate) {
                toDelete.push(id);
            }
        }
        for (const id of toDelete) {
            this.memories.delete(id);
            if (this.db) {
                this.db.prepare('DELETE FROM memories WHERE id = ?').run(id);
            }
        }
        if (toDelete.length > 0) {
            this.logger.info(`Retention policy: Deleted ${toDelete.length} memories older than ${this.config.retentionDays} days`);
            this.eventBus.emit({
                type: 'memory:forget',
                timestamp: new Date(),
                data: { action: 'retention_policy', count: toDelete.length },
                source: 'MemoryService',
            });
        }
    }
    /**
     * Check if running in zero retention mode
     */
    isZeroRetentionMode() {
        return this.config.zeroRetention === true;
    }
}
//# sourceMappingURL=memory.service.js.map