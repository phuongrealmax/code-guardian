// src/modules/auto-agent/error-memory.ts
/**
 * ErrorMemory Service
 *
 * Specialized memory for errors and their fixes.
 * Learns from past errors to prevent repetition and
 * suggest fixes based on similar errors.
 */
import { v4 as uuid } from 'uuid';
export class ErrorMemory {
    config;
    logger;
    eventBus;
    // In-memory storage (would be persisted in production)
    errors = new Map();
    patterns = new Map();
    // Statistics
    stats = {
        totalStored: 0,
        totalRecalled: 0,
        duplicatesAvoided: 0,
    };
    constructor(config, logger, eventBus) {
        this.config = config;
        this.logger = logger;
        this.eventBus = eventBus;
    }
    // ═══════════════════════════════════════════════════════════════
    //                      MAIN METHODS
    // ═══════════════════════════════════════════════════════════════
    /**
     * Store error and its fix
     */
    async store(params) {
        const { error, fix, success, tags = [] } = params;
        // Check for duplicates
        const existingEntry = this.findSimilar(error);
        if (existingEntry && this.calculateSimilarity(existingEntry.error, error) > this.config.deduplicateThreshold) {
            // Update existing entry
            existingEntry.accessCount++;
            existingEntry.lastAccessedAt = new Date();
            if (success && !existingEntry.success) {
                existingEntry.fix = fix;
                existingEntry.success = true;
            }
            this.stats.duplicatesAvoided++;
            this.logger.debug(`Updated existing error entry: ${existingEntry.id}`);
            return existingEntry;
        }
        // Check capacity
        if (this.errors.size >= this.config.maxErrors) {
            this.evictOldest();
        }
        // Create new entry
        const entry = {
            id: uuid(),
            error,
            fix,
            success,
            createdAt: new Date(),
            accessCount: 0,
            lastAccessedAt: new Date(),
            tags: [...tags, error.type],
        };
        this.errors.set(entry.id, entry);
        this.stats.totalStored++;
        // Update patterns
        this.updatePatterns(error, fix, success);
        // Emit event
        this.eventBus.emit({
            type: 'auto-agent:error:stored',
            timestamp: new Date(),
            data: {
                errorId: entry.id,
                errorType: error.type,
                success,
            },
        });
        this.logger.info(`Stored error: ${error.type} (success: ${success})`);
        return entry;
    }
    /**
     * Recall errors similar to given error or matching tags
     */
    async recall(params) {
        const { error, tags, limit = 5, minSimilarity = 0.3 } = params;
        let matches = [];
        if (error) {
            // Find by similarity
            matches = this.findSimilarErrors(error, minSimilarity);
        }
        else if (tags && tags.length > 0) {
            // Find by tags
            matches = Array.from(this.errors.values())
                .filter(e => tags.some(tag => e.tags.includes(tag)));
        }
        else {
            // Return most recent
            matches = Array.from(this.errors.values())
                .sort((a, b) => b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime());
        }
        // Limit results
        matches = matches.slice(0, limit);
        // Update access counts
        for (const match of matches) {
            match.accessCount++;
            match.lastAccessedAt = new Date();
        }
        this.stats.totalRecalled += matches.length;
        // Find best fix suggestion
        let suggestedFix;
        let confidence = 0;
        if (error) {
            const successfulFixes = matches.filter(m => m.success);
            if (successfulFixes.length > 0) {
                // Use fix from most similar successful entry
                const best = successfulFixes[0];
                suggestedFix = best.fix;
                confidence = best.similarity || 0.5;
            }
            // Check patterns for higher confidence fix
            const pattern = this.findMatchingPattern(error);
            if (pattern && pattern.successRate > confidence) {
                suggestedFix = pattern.fixTemplate;
                confidence = pattern.successRate;
            }
        }
        // Emit event
        this.eventBus.emit({
            type: 'auto-agent:error:recalled',
            timestamp: new Date(),
            data: {
                matchCount: matches.length,
                hasSuggestion: !!suggestedFix,
                confidence,
            },
        });
        this.logger.debug(`Recalled ${matches.length} errors (confidence: ${confidence})`);
        return {
            matches,
            suggestedFix,
            confidence,
        };
    }
    /**
     * Get all stored errors
     */
    getAll() {
        return Array.from(this.errors.values());
    }
    /**
     * Get patterns
     */
    getPatterns() {
        return Array.from(this.patterns.values());
    }
    /**
     * Get statistics
     */
    getStats() {
        return {
            ...this.stats,
            errorCount: this.errors.size,
            patternCount: this.patterns.size,
        };
    }
    /**
     * Clear all errors
     */
    clear() {
        this.errors.clear();
        this.patterns.clear();
        this.logger.info('Error memory cleared');
    }
    // ═══════════════════════════════════════════════════════════════
    //                      PRIVATE METHODS
    // ═══════════════════════════════════════════════════════════════
    /**
     * Find most similar error
     */
    findSimilar(error) {
        let bestMatch = null;
        let bestSimilarity = 0;
        for (const entry of this.errors.values()) {
            const similarity = this.calculateSimilarity(entry.error, error);
            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                bestMatch = entry;
            }
        }
        if (bestMatch) {
            bestMatch.similarity = bestSimilarity;
        }
        return bestMatch;
    }
    /**
     * Find errors above similarity threshold
     */
    findSimilarErrors(error, minSimilarity) {
        const results = [];
        for (const entry of this.errors.values()) {
            const similarity = this.calculateSimilarity(entry.error, error);
            if (similarity >= minSimilarity) {
                entry.similarity = similarity;
                results.push(entry);
            }
        }
        // Sort by similarity descending
        results.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
        return results;
    }
    /**
     * Calculate similarity between two errors
     */
    calculateSimilarity(a, b) {
        let score = 0;
        let weights = 0;
        // Type match (weight: 0.3)
        if (a.type === b.type) {
            score += 0.3;
        }
        weights += 0.3;
        // File match (weight: 0.2)
        if (a.file && b.file) {
            if (a.file === b.file) {
                score += 0.2;
            }
            else if (a.file.split('/').pop() === b.file.split('/').pop()) {
                score += 0.1; // Same filename
            }
        }
        weights += 0.2;
        // Message similarity (weight: 0.4)
        const messageSimilarity = this.stringSimilarity(a.message, b.message);
        score += messageSimilarity * 0.4;
        weights += 0.4;
        // Code match (weight: 0.1)
        if (a.code && b.code && a.code === b.code) {
            score += 0.1;
        }
        weights += 0.1;
        return score / weights;
    }
    /**
     * Simple string similarity (Jaccard-like)
     */
    stringSimilarity(a, b) {
        const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(w => w.length > 2));
        const wordsB = new Set(b.toLowerCase().split(/\W+/).filter(w => w.length > 2));
        if (wordsA.size === 0 || wordsB.size === 0)
            return 0;
        let intersection = 0;
        for (const word of wordsA) {
            if (wordsB.has(word))
                intersection++;
        }
        const union = wordsA.size + wordsB.size - intersection;
        return intersection / union;
    }
    /**
     * Update error patterns based on new entry
     */
    updatePatterns(error, fix, success) {
        const patternKey = `${error.type}:${this.extractPattern(error.message)}`;
        const existing = this.patterns.get(patternKey);
        if (existing) {
            existing.occurrences++;
            if (success) {
                existing.successRate = (existing.successRate * (existing.occurrences - 1) + 1) / existing.occurrences;
                existing.fixTemplate = fix; // Update with latest successful fix
            }
            else {
                existing.successRate = (existing.successRate * (existing.occurrences - 1)) / existing.occurrences;
            }
        }
        else {
            this.patterns.set(patternKey, {
                id: uuid(),
                pattern: this.extractPattern(error.message),
                errorType: error.type,
                fixTemplate: fix,
                occurrences: 1,
                successRate: success ? 1 : 0,
            });
        }
    }
    /**
     * Extract pattern from error message
     */
    extractPattern(message) {
        // Remove specific identifiers to create general pattern
        return message
            .replace(/['"`][\w\d_]+['"`]/g, "'X'") // Replace quoted identifiers
            .replace(/\d+/g, 'N') // Replace numbers
            .replace(/\/[\w\/\.\-]+/g, '/PATH') // Replace paths
            .trim();
    }
    /**
     * Find matching pattern
     */
    findMatchingPattern(error) {
        const pattern = this.extractPattern(error.message);
        const patternKey = `${error.type}:${pattern}`;
        return this.patterns.get(patternKey) || null;
    }
    /**
     * Evict oldest entry
     */
    evictOldest() {
        let oldest = null;
        let oldestId = null;
        for (const [id, entry] of this.errors.entries()) {
            if (!oldest || entry.lastAccessedAt < oldest.lastAccessedAt) {
                oldest = entry;
                oldestId = id;
            }
        }
        if (oldestId) {
            this.errors.delete(oldestId);
            this.logger.debug(`Evicted oldest error: ${oldestId}`);
        }
    }
}
//# sourceMappingURL=error-memory.js.map