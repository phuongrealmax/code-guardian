// src/modules/latent/latent.service.ts
import { v4 as uuid } from 'uuid';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
/**
 * LatentService - Core service for Latent Chain Mode
 */
export class LatentService {
    contexts = new Map();
    history = new Map();
    config;
    eventBus;
    logger;
    projectRoot;
    // Statistics
    stats = {
        totalCreated: 0,
        totalDeltasMerged: 0,
        totalPatchesApplied: 0,
        phaseStats: {
            analysis: 0,
            plan: 0,
            impl: 0,
            review: 0,
        },
    };
    constructor(config, eventBus, logger, projectRoot) {
        this.config = config;
        this.eventBus = eventBus;
        this.logger = logger;
        this.projectRoot = projectRoot;
    }
    // ═══════════════════════════════════════════════════════════════
    //                      LIFECYCLE
    // ═══════════════════════════════════════════════════════════════
    async initialize() {
        this.logger.info('Initializing Latent Service...');
        // Load persisted contexts if enabled
        if (this.config.persist && this.config.persistPath) {
            await this.loadPersistedContexts();
        }
        // Setup cleanup interval
        if (this.config.cleanupAfterMs > 0) {
            setInterval(() => this.cleanupOldContexts(), this.config.cleanupAfterMs);
        }
        this.logger.info('Latent Service initialized');
    }
    async shutdown() {
        this.logger.info('Shutting down Latent Service...');
        // Persist contexts if enabled
        if (this.config.persist && this.config.persistPath) {
            await this.persistContexts();
        }
        this.contexts.clear();
        this.history.clear();
        this.logger.info('Latent Service shutdown complete');
    }
    // ═══════════════════════════════════════════════════════════════
    //                      CONTEXT OPERATIONS
    // ═══════════════════════════════════════════════════════════════
    /**
     * Create a new latent context
     */
    async createContext(params) {
        const { taskId, phase = 'analysis', constraints = [], files = [], agentId } = params;
        // Check if context already exists
        if (this.contexts.has(taskId)) {
            throw new Error(`Context already exists for task: ${taskId}`);
        }
        // Check max contexts limit
        if (this.contexts.size >= this.config.maxContexts) {
            // Remove oldest completed context
            await this.evictOldestContext();
        }
        const now = new Date();
        const context = {
            taskId,
            phase,
            codeMap: {
                files,
                hotSpots: [],
                components: [],
            },
            constraints,
            risks: [],
            decisions: [],
            artifacts: {
                tests: [],
                endpoints: [],
                patches: [],
                other: {},
            },
            metadata: {
                createdBy: agentId,
                lastUpdatedBy: agentId,
                estimatedTokens: 0,
                actualTokens: 0,
                custom: {},
            },
            createdAt: now,
            updatedAt: now,
            version: 1,
        };
        this.contexts.set(taskId, context);
        this.history.set(taskId, []);
        // Record history
        this.addHistoryEntry(taskId, {
            operation: 'create',
            agentId,
            phase,
        });
        // Update stats
        this.stats.totalCreated++;
        this.stats.phaseStats[phase]++;
        // Emit event
        this.eventBus.emit({
            type: 'latent:context:created',
            timestamp: new Date(),
            data: { taskId, context },
        });
        this.logger.info(`Created latent context: ${taskId}`);
        return context;
    }
    /**
     * Get latent context
     */
    async getContext(params) {
        const { taskId, fields } = params;
        const context = this.contexts.get(taskId);
        if (!context) {
            return null;
        }
        // If specific fields requested, return partial
        if (fields && fields.length > 0) {
            const partial = {};
            for (const field of fields) {
                partial[field] = context[field];
            }
            return partial;
        }
        return context;
    }
    /**
     * Get context with history
     */
    async getContextWithHistory(taskId) {
        const context = this.contexts.get(taskId);
        if (!context) {
            return null;
        }
        return {
            context,
            history: this.history.get(taskId) || [],
        };
    }
    /**
     * Update context with delta (merge, not replace)
     */
    async updateContext(params) {
        const { taskId, delta, agentId, force = false } = params;
        const context = this.contexts.get(taskId);
        if (!context) {
            throw new Error(`Context not found: ${taskId}`);
        }
        // Auto-merge is the key feature of Latent Chain Mode
        if (this.config.autoMerge) {
            this.mergeDelta(context, delta);
        }
        else if (!force) {
            throw new Error('Auto-merge disabled. Use force=true to update.');
        }
        // Update metadata
        context.metadata.lastUpdatedBy = agentId;
        context.updatedAt = new Date();
        context.version++;
        // Record history
        this.addHistoryEntry(taskId, {
            operation: 'update',
            delta,
            agentId,
            phase: context.phase,
        });
        // Update stats
        this.stats.totalDeltasMerged++;
        // Emit event
        this.eventBus.emit({
            type: 'latent:context:updated',
            timestamp: new Date(),
            data: { taskId, delta, version: context.version },
        });
        this.logger.debug(`Updated context: ${taskId} (v${context.version})`);
        return context;
    }
    /**
     * Transition to new phase
     */
    async transitionPhase(params) {
        const { taskId, toPhase, summary, agentId } = params;
        const context = this.contexts.get(taskId);
        if (!context) {
            throw new Error(`Context not found: ${taskId}`);
        }
        const fromPhase = context.phase;
        // Validate transition
        if (!this.isValidTransition(fromPhase, toPhase)) {
            throw new Error(`Invalid phase transition: ${fromPhase} -> ${toPhase}`);
        }
        // Update phase
        context.phase = toPhase;
        context.metadata.lastUpdatedBy = agentId;
        context.updatedAt = new Date();
        context.version++;
        // Add decision if summary provided
        if (summary) {
            const decision = {
                id: `D${String(context.decisions.length + 1).padStart(3, '0')}`,
                summary: `Phase ${fromPhase} completed: ${summary}`,
                rationale: `Transitioning from ${fromPhase} to ${toPhase}`,
                phase: fromPhase,
                createdAt: new Date(),
            };
            context.decisions.push(decision);
        }
        // Record history
        this.addHistoryEntry(taskId, {
            operation: 'transition',
            agentId,
            phase: toPhase,
        });
        // Update stats
        this.stats.phaseStats[toPhase]++;
        // Emit event
        this.eventBus.emit({
            type: 'latent:phase:transition',
            timestamp: new Date(),
            data: { taskId, from: fromPhase, to: toPhase },
        });
        this.logger.info(`Phase transition: ${taskId} ${fromPhase} -> ${toPhase}`);
        return context;
    }
    /**
     * Apply a patch to a file
     */
    async applyPatch(params) {
        const { taskId, target, patch, dryRun = false } = params;
        const context = this.contexts.get(taskId);
        if (!context) {
            throw new Error(`Context not found: ${taskId}`);
        }
        const targetPath = join(this.projectRoot, target);
        const result = {
            target,
            patch,
            appliedAt: new Date(),
            success: false,
        };
        try {
            if (dryRun) {
                // Dry run - just validate
                this.logger.info(`[DRY RUN] Would apply patch to: ${target}`);
                result.success = true;
            }
            else {
                // Actually apply the patch
                // For now, we'll use a simple approach
                // In production, use a proper diff/patch library
                await this.applyPatchToFile(targetPath, patch);
                result.success = true;
            }
            // Record in artifacts
            context.artifacts.patches.push(result);
            // Add file to code map if not present
            if (!context.codeMap.files.includes(target)) {
                context.codeMap.files.push(target);
            }
            // Update stats
            this.stats.totalPatchesApplied++;
            // Record history
            this.addHistoryEntry(taskId, {
                operation: 'patch',
                phase: context.phase,
            });
            // Emit event
            this.eventBus.emit({
                type: 'latent:patch:applied',
                timestamp: new Date(),
                data: { taskId, target, success: true },
            });
            this.logger.info(`Applied patch to: ${target}`);
        }
        catch (error) {
            result.success = false;
            result.error = error instanceof Error ? error.message : String(error);
            this.eventBus.emit({
                type: 'latent:patch:applied',
                timestamp: new Date(),
                data: { taskId, target, success: false },
            });
            this.logger.error(`Failed to apply patch to ${target}: ${result.error}`);
        }
        return result;
    }
    /**
     * Complete a task
     */
    async completeTask(taskId, summary) {
        const context = this.contexts.get(taskId);
        if (!context) {
            throw new Error(`Context not found: ${taskId}`);
        }
        // Add final decision
        const decision = {
            id: `D${String(context.decisions.length + 1).padStart(3, '0')}`,
            summary: `Task completed: ${summary}`,
            rationale: 'All phases completed successfully',
            phase: context.phase,
            createdAt: new Date(),
        };
        context.decisions.push(decision);
        // Record history
        this.addHistoryEntry(taskId, {
            operation: 'complete',
            phase: context.phase,
        });
        // Emit event
        this.eventBus.emit({
            type: 'latent:task:completed',
            timestamp: new Date(),
            data: { taskId, summary },
        });
        this.logger.info(`Task completed: ${taskId}`);
    }
    /**
     * Delete a context
     */
    async deleteContext(taskId) {
        const deleted = this.contexts.delete(taskId);
        this.history.delete(taskId);
        return deleted;
    }
    /**
     * List all contexts
     */
    async listContexts() {
        return Array.from(this.contexts.values());
    }
    // ═══════════════════════════════════════════════════════════════
    //                      VALIDATION
    // ═══════════════════════════════════════════════════════════════
    /**
     * Validate a latent response
     */
    validateResponse(response) {
        const errors = [];
        const warnings = [];
        // Validate summary length
        if (response.summary.length > this.config.maxSummaryLength) {
            errors.push({
                field: 'summary',
                message: `Summary too long: ${response.summary.length} > ${this.config.maxSummaryLength}`,
                suggestion: 'Keep summary to 1-2 sentences max',
            });
        }
        // Validate actions
        for (const action of response.actions) {
            if (!action.target) {
                errors.push({
                    field: 'actions.target',
                    message: 'Action missing target',
                    suggestion: 'Specify target file or command',
                });
            }
            if (!action.description) {
                warnings.push(`Action ${action.type} missing description`);
            }
        }
        // Validate context delta
        if (response.contextDelta) {
            const delta = response.contextDelta;
            // Check for decisions limit
            if (delta.decisions && delta.decisions.length > this.config.maxDecisions) {
                warnings.push(`Too many decisions in delta: ${delta.decisions.length}`);
            }
        }
        // Emit event if validation failed
        if (errors.length > 0) {
            this.eventBus.emit({
                type: 'latent:validation:failed',
                timestamp: new Date(),
                data: { taskId: 'unknown', errors },
            });
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
    // ═══════════════════════════════════════════════════════════════
    //                      STATUS
    // ═══════════════════════════════════════════════════════════════
    /**
     * Get module status
     */
    getStatus() {
        return {
            enabled: this.config.enabled,
            activeContexts: this.contexts.size,
            totalCreated: this.stats.totalCreated,
            totalDeltasMerged: this.stats.totalDeltasMerged,
            totalPatchesApplied: this.stats.totalPatchesApplied,
            phaseStats: { ...this.stats.phaseStats },
            avgTokensSaved: this.calculateAvgTokensSaved(),
        };
    }
    // ═══════════════════════════════════════════════════════════════
    //                      PRIVATE METHODS
    // ═══════════════════════════════════════════════════════════════
    /**
     * Merge delta into context (key feature!)
     */
    mergeDelta(context, delta) {
        // Phase update
        if (delta.phase) {
            context.phase = delta.phase;
        }
        // Code map updates (merge, not replace)
        if (delta.codeMap) {
            if (delta.codeMap.files) {
                context.codeMap.files = [
                    ...new Set([...context.codeMap.files, ...delta.codeMap.files]),
                ];
            }
            if (delta.codeMap.hotSpots) {
                context.codeMap.hotSpots = [
                    ...new Set([...context.codeMap.hotSpots, ...delta.codeMap.hotSpots]),
                ];
            }
            if (delta.codeMap.components) {
                context.codeMap.components = [
                    ...new Set([...context.codeMap.components, ...delta.codeMap.components]),
                ];
            }
        }
        // Add constraints (append)
        if (delta.constraints) {
            context.constraints = [
                ...new Set([...context.constraints, ...delta.constraints]),
            ];
        }
        // Add risks (append)
        if (delta.risks) {
            context.risks = [...new Set([...context.risks, ...delta.risks])];
        }
        // Add decisions
        if (delta.decisions) {
            for (const d of delta.decisions) {
                const decision = {
                    ...d,
                    id: d.id || `D${String(context.decisions.length + 1).padStart(3, '0')}`,
                    phase: d.phase || context.phase,
                    createdAt: new Date(),
                };
                context.decisions.push(decision);
            }
        }
        // Artifact updates (merge)
        if (delta.artifacts) {
            if (delta.artifacts.tests) {
                context.artifacts.tests = [
                    ...new Set([...context.artifacts.tests, ...delta.artifacts.tests]),
                ];
            }
            if (delta.artifacts.endpoints) {
                context.artifacts.endpoints = [
                    ...new Set([...context.artifacts.endpoints, ...delta.artifacts.endpoints]),
                ];
            }
            if (delta.artifacts.other) {
                context.artifacts.other = {
                    ...context.artifacts.other,
                    ...delta.artifacts.other,
                };
            }
        }
        // Metadata updates
        if (delta.metadata) {
            context.metadata = { ...context.metadata, ...delta.metadata };
        }
        // Handle removals
        if (delta.remove) {
            if (delta.remove.constraints) {
                context.constraints = context.constraints.filter((c) => !delta.remove.constraints.includes(c));
            }
            if (delta.remove.risks) {
                context.risks = context.risks.filter((r) => !delta.remove.risks.includes(r));
            }
            if (delta.remove.decisions) {
                context.decisions = context.decisions.filter((d) => !delta.remove.decisions.includes(d.id));
            }
            if (delta.remove.files) {
                context.codeMap.files = context.codeMap.files.filter((f) => !delta.remove.files.includes(f));
            }
            if (delta.remove.hotSpots) {
                context.codeMap.hotSpots = context.codeMap.hotSpots.filter((h) => !delta.remove.hotSpots.includes(h));
            }
        }
    }
    /**
     * Check if phase transition is valid
     */
    isValidTransition(from, to) {
        const transitions = {
            analysis: ['plan', 'impl'], // Can skip plan for simple tasks
            plan: ['impl', 'review'], // Can skip impl if plan revealed issues
            impl: ['review', 'plan'], // Can go back to plan if impl shows issues
            review: ['impl', 'analysis'], // Can go back for fixes
        };
        return transitions[from]?.includes(to) ?? false;
    }
    /**
     * Add history entry
     */
    addHistoryEntry(taskId, entry) {
        const context = this.contexts.get(taskId);
        const history = this.history.get(taskId) || [];
        history.push({
            ...entry,
            id: uuid(),
            taskId,
            timestamp: new Date(),
            version: context?.version || 1,
        });
        this.history.set(taskId, history);
    }
    /**
     * Apply patch to file (simplified version)
     */
    async applyPatchToFile(filePath, patch) {
        // Check if file exists
        if (!existsSync(filePath)) {
            // If file doesn't exist and patch starts with creating it
            if (patch.includes('+++ b/') || patch.includes('+++ new')) {
                // Extract content from patch and create file
                const lines = patch.split('\n');
                const content = [];
                for (const line of lines) {
                    if (line.startsWith('+') && !line.startsWith('+++')) {
                        content.push(line.substring(1));
                    }
                }
                await mkdir(dirname(filePath), { recursive: true });
                await writeFile(filePath, content.join('\n'));
                return;
            }
            throw new Error(`File not found: ${filePath}`);
        }
        // For existing files, use git apply or manual patching
        try {
            // Try git apply first
            const tempPatchFile = join(this.projectRoot, '.ccg', 'temp.patch');
            await mkdir(dirname(tempPatchFile), { recursive: true });
            await writeFile(tempPatchFile, patch);
            execSync(`git apply ${tempPatchFile}`, { cwd: this.projectRoot });
        }
        catch {
            // Fallback: manual simple patching
            const currentContent = await readFile(filePath, 'utf-8');
            const patchedContent = this.manualPatch(currentContent, patch);
            await writeFile(filePath, patchedContent);
        }
    }
    /**
     * Manual patch application (simplified)
     */
    manualPatch(content, patch) {
        const lines = content.split('\n');
        const patchLines = patch.split('\n');
        const result = [];
        let contentIndex = 0;
        for (const patchLine of patchLines) {
            if (patchLine.startsWith('@@')) {
                // Parse hunk header
                const match = patchLine.match(/@@ -(\d+),?(\d+)? \+(\d+),?(\d+)? @@/);
                if (match) {
                    const startLine = parseInt(match[1], 10) - 1;
                    // Copy lines up to the start
                    while (contentIndex < startLine) {
                        result.push(lines[contentIndex++]);
                    }
                }
            }
            else if (patchLine.startsWith('-') && !patchLine.startsWith('---')) {
                // Remove line - skip in original
                contentIndex++;
            }
            else if (patchLine.startsWith('+') && !patchLine.startsWith('+++')) {
                // Add line
                result.push(patchLine.substring(1));
            }
            else if (patchLine.startsWith(' ')) {
                // Context line
                result.push(lines[contentIndex++]);
            }
        }
        // Copy remaining lines
        while (contentIndex < lines.length) {
            result.push(lines[contentIndex++]);
        }
        return result.join('\n');
    }
    /**
     * Evict oldest context when limit reached
     */
    async evictOldestContext() {
        let oldest = null;
        for (const context of this.contexts.values()) {
            if (!oldest || context.updatedAt < oldest.updatedAt) {
                oldest = context;
            }
        }
        if (oldest) {
            this.logger.info(`Evicting oldest context: ${oldest.taskId}`);
            await this.deleteContext(oldest.taskId);
        }
    }
    /**
     * Cleanup old completed contexts
     */
    async cleanupOldContexts() {
        const now = Date.now();
        const toDelete = [];
        for (const context of this.contexts.values()) {
            const age = now - context.updatedAt.getTime();
            if (age > this.config.cleanupAfterMs && context.phase === 'review') {
                toDelete.push(context.taskId);
            }
        }
        for (const taskId of toDelete) {
            await this.deleteContext(taskId);
            this.logger.debug(`Cleaned up old context: ${taskId}`);
        }
    }
    /**
     * Calculate average tokens saved
     */
    calculateAvgTokensSaved() {
        // Estimate: each delta merge saves ~500 tokens vs full context
        // Each context update without delta would be ~1000 tokens
        const tokensSaved = this.stats.totalDeltasMerged * 500;
        const contexts = this.stats.totalCreated || 1;
        return Math.round(tokensSaved / contexts);
    }
    /**
     * Persist contexts to disk
     */
    async persistContexts() {
        if (!this.config.persistPath)
            return;
        try {
            const data = {
                contexts: Array.from(this.contexts.entries()),
                history: Array.from(this.history.entries()),
                stats: this.stats,
            };
            await mkdir(dirname(this.config.persistPath), { recursive: true });
            await writeFile(this.config.persistPath, JSON.stringify(data, null, 2));
            this.logger.debug(`Persisted ${this.contexts.size} contexts`);
        }
        catch (error) {
            this.logger.error(`Failed to persist contexts: ${error}`);
        }
    }
    /**
     * Load persisted contexts
     */
    async loadPersistedContexts() {
        if (!this.config.persistPath || !existsSync(this.config.persistPath)) {
            return;
        }
        try {
            const content = await readFile(this.config.persistPath, 'utf-8');
            const data = JSON.parse(content);
            // Restore contexts
            for (const [taskId, context] of data.contexts) {
                context.createdAt = new Date(context.createdAt);
                context.updatedAt = new Date(context.updatedAt);
                this.contexts.set(taskId, context);
            }
            // Restore history
            for (const [taskId, entries] of data.history) {
                const restored = entries.map((e) => ({
                    ...e,
                    timestamp: new Date(e.timestamp),
                }));
                this.history.set(taskId, restored);
            }
            // Restore stats
            if (data.stats) {
                this.stats = data.stats;
            }
            this.logger.info(`Loaded ${this.contexts.size} persisted contexts`);
        }
        catch (error) {
            this.logger.error(`Failed to load persisted contexts: ${error}`);
        }
    }
}
//# sourceMappingURL=latent.service.js.map