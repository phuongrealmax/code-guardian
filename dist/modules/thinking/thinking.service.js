// src/modules/thinking/thinking.service.ts
/**
 * Thinking Service
 *
 * Manages thinking models, workflows/SOPs, and code style snippets.
 * Provides methods for:
 * - Getting and applying thinking models
 * - Running standard workflows
 * - Saving and retrieving code snippets for style consistency
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { DEFAULT_THINKING_MODELS, DEFAULT_WORKFLOWS, suggestThinkingModel, suggestWorkflow, getThinkingModelNames, getWorkflowNames, } from './thinking.data.js';
// ═══════════════════════════════════════════════════════════════
//                      THINKING SERVICE
// ═══════════════════════════════════════════════════════════════
export class ThinkingService {
    config;
    eventBus;
    logger;
    projectRoot;
    models = new Map();
    workflows = new Map();
    snippets = new Map();
    snippetsDir;
    lastAccessed;
    constructor(config, eventBus, logger, projectRoot = process.cwd()) {
        this.config = config;
        this.eventBus = eventBus;
        this.logger = logger;
        this.projectRoot = projectRoot;
        this.snippetsDir = config.snippetsPath || join(projectRoot, '.ccg', 'snippets');
    }
    // ═══════════════════════════════════════════════════════════════
    //                      INITIALIZATION
    // ═══════════════════════════════════════════════════════════════
    async initialize() {
        if (!this.config.enabled) {
            this.logger.info('Thinking module disabled');
            return;
        }
        // Load default thinking models
        for (const [id, model] of Object.entries(DEFAULT_THINKING_MODELS)) {
            this.models.set(id, model);
        }
        // Load default workflows
        for (const [id, workflow] of Object.entries(DEFAULT_WORKFLOWS)) {
            this.workflows.set(id, workflow);
        }
        // Load custom models if path specified
        if (this.config.customModelsPath && existsSync(this.config.customModelsPath)) {
            await this.loadCustomModels();
        }
        // Load custom workflows if path specified
        if (this.config.customWorkflowsPath && existsSync(this.config.customWorkflowsPath)) {
            await this.loadCustomWorkflows();
        }
        // Ensure snippets directory exists
        if (!existsSync(this.snippetsDir)) {
            mkdirSync(this.snippetsDir, { recursive: true });
        }
        // Load saved snippets
        await this.loadSnippets();
        this.logger.info(`Thinking module initialized: ${this.models.size} models, ${this.workflows.size} workflows, ${this.snippets.size} snippets`);
    }
    async shutdown() {
        // Save any pending snippets
        this.logger.info('Thinking module shutdown');
    }
    // ═══════════════════════════════════════════════════════════════
    //                      THINKING MODELS
    // ═══════════════════════════════════════════════════════════════
    /**
     * Get a thinking model by name
     */
    getThinkingModel(modelName) {
        this.lastAccessed = new Date();
        const model = this.models.get(modelName);
        if (model) {
            this.eventBus.emit({
                type: 'thinking:model_accessed',
                timestamp: new Date(),
                data: { modelName },
                source: 'ThinkingService',
            });
        }
        return model || null;
    }
    /**
     * List all available thinking models
     */
    listThinkingModels() {
        return Array.from(this.models.values());
    }
    /**
     * Suggest a thinking model based on task description
     */
    suggestModel(taskDescription) {
        const modelType = suggestThinkingModel(taskDescription);
        return this.models.get(modelType);
    }
    /**
     * Get available model names
     */
    getModelNames() {
        return getThinkingModelNames();
    }
    // ═══════════════════════════════════════════════════════════════
    //                      WORKFLOWS / SOPs
    // ═══════════════════════════════════════════════════════════════
    /**
     * Get a workflow by name
     */
    getWorkflow(workflowName) {
        this.lastAccessed = new Date();
        const workflow = this.workflows.get(workflowName);
        if (workflow) {
            this.eventBus.emit({
                type: 'thinking:workflow_accessed',
                timestamp: new Date(),
                data: { workflowName },
                source: 'ThinkingService',
            });
        }
        return workflow || null;
    }
    /**
     * List all available workflows
     */
    listWorkflows() {
        return Array.from(this.workflows.values());
    }
    /**
     * Suggest a workflow based on task description
     */
    suggestWorkflow(taskDescription) {
        const workflowType = suggestWorkflow(taskDescription);
        if (!workflowType)
            return null;
        return this.workflows.get(workflowType) || null;
    }
    /**
     * Get available workflow names
     */
    getWorkflowNames() {
        return getWorkflowNames();
    }
    /**
     * Check if task description triggers a workflow
     */
    checkWorkflowTrigger(taskDescription) {
        const desc = taskDescription.toLowerCase();
        for (const workflow of this.workflows.values()) {
            for (const keyword of workflow.triggerKeywords) {
                if (desc.includes(keyword.toLowerCase())) {
                    return workflow;
                }
            }
        }
        return null;
    }
    // ═══════════════════════════════════════════════════════════════
    //                      CODE SNIPPETS (STYLE RAG)
    // ═══════════════════════════════════════════════════════════════
    /**
     * Save a code snippet for style reference
     */
    async saveSnippet(params) {
        const snippet = {
            id: randomUUID(),
            category: params.category,
            description: params.description,
            code: params.code,
            language: params.language || this.detectLanguage(params.code),
            tags: params.tags || [],
            createdAt: new Date(),
            usageCount: 0,
        };
        // Check for max snippets per category
        const categorySnippets = Array.from(this.snippets.values()).filter((s) => s.category.toLowerCase() === params.category.toLowerCase());
        const maxPerCategory = this.config.maxSnippetsPerCategory || 10;
        if (categorySnippets.length >= maxPerCategory) {
            // Remove oldest snippet in this category
            const oldest = categorySnippets.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
            await this.deleteSnippet(oldest.id);
        }
        this.snippets.set(snippet.id, snippet);
        await this.persistSnippet(snippet);
        this.eventBus.emit({
            type: 'thinking:snippet_saved',
            timestamp: new Date(),
            data: { category: params.category, id: snippet.id },
            source: 'ThinkingService',
        });
        this.logger.info(`Code snippet saved: ${params.category} (${snippet.id})`);
        return snippet;
    }
    /**
     * Get code style references for a category
     */
    getStyleReference(category, limit = 3) {
        this.lastAccessed = new Date();
        const categoryLower = category.toLowerCase();
        const matches = Array.from(this.snippets.values()).filter((snippet) => {
            const catMatch = snippet.category.toLowerCase().includes(categoryLower);
            const descMatch = snippet.description.toLowerCase().includes(categoryLower);
            const tagMatch = snippet.tags.some((tag) => tag.toLowerCase().includes(categoryLower));
            return catMatch || descMatch || tagMatch;
        });
        // Sort by usage count (most used first)
        matches.sort((a, b) => b.usageCount - a.usageCount);
        const results = matches.slice(0, limit);
        // Update usage count for returned snippets
        for (const snippet of results) {
            snippet.usageCount++;
            this.persistSnippet(snippet);
        }
        if (results.length === 0) {
            return {
                found: false,
                count: 0,
                snippets: [],
                message: `No code snippets found for "${category}". Use save_code_snippet to save templates.`,
            };
        }
        return {
            found: true,
            count: results.length,
            snippets: results,
            message: `Found ${results.length} code snippets for "${category}". FOLLOW THESE PATTERNS.`,
        };
    }
    /**
     * List all saved snippets
     */
    listSnippets() {
        return Array.from(this.snippets.values());
    }
    /**
     * List snippets by category
     */
    listSnippetsByCategory() {
        const byCategory = {};
        for (const snippet of this.snippets.values()) {
            if (!byCategory[snippet.category]) {
                byCategory[snippet.category] = [];
            }
            byCategory[snippet.category].push(snippet);
        }
        return byCategory;
    }
    /**
     * Delete a snippet
     */
    async deleteSnippet(id) {
        const snippet = this.snippets.get(id);
        if (!snippet)
            return false;
        this.snippets.delete(id);
        // Delete file
        const filePath = join(this.snippetsDir, `${id}.json`);
        if (existsSync(filePath)) {
            unlinkSync(filePath);
        }
        return true;
    }
    // ═══════════════════════════════════════════════════════════════
    //                      STATUS
    // ═══════════════════════════════════════════════════════════════
    getStatus() {
        return {
            enabled: this.config.enabled,
            modelsLoaded: this.models.size,
            workflowsLoaded: this.workflows.size,
            snippetsStored: this.snippets.size,
            lastAccessed: this.lastAccessed,
        };
    }
    // ═══════════════════════════════════════════════════════════════
    //                      PRIVATE METHODS
    // ═══════════════════════════════════════════════════════════════
    async loadCustomModels() {
        // Load custom thinking models from JSON files
        const modelsPath = this.config.customModelsPath;
        try {
            const files = readdirSync(modelsPath).filter((f) => f.endsWith('.json'));
            for (const file of files) {
                const content = readFileSync(join(modelsPath, file), 'utf-8');
                const model = JSON.parse(content);
                if (model.id) {
                    this.models.set(model.id, model);
                    this.logger.debug(`Loaded custom model: ${model.id}`);
                }
            }
        }
        catch (error) {
            this.logger.warn('Failed to load custom thinking models', error);
        }
    }
    async loadCustomWorkflows() {
        // Load custom workflows from JSON files
        const workflowsPath = this.config.customWorkflowsPath;
        try {
            const files = readdirSync(workflowsPath).filter((f) => f.endsWith('.json'));
            for (const file of files) {
                const content = readFileSync(join(workflowsPath, file), 'utf-8');
                const workflow = JSON.parse(content);
                if (workflow.id) {
                    this.workflows.set(workflow.id, workflow);
                    this.logger.debug(`Loaded custom workflow: ${workflow.id}`);
                }
            }
        }
        catch (error) {
            this.logger.warn('Failed to load custom workflows', error);
        }
    }
    async loadSnippets() {
        if (!existsSync(this.snippetsDir))
            return;
        try {
            const files = readdirSync(this.snippetsDir).filter((f) => f.endsWith('.json'));
            for (const file of files) {
                const content = readFileSync(join(this.snippetsDir, file), 'utf-8');
                const snippet = JSON.parse(content);
                snippet.createdAt = new Date(snippet.createdAt);
                this.snippets.set(snippet.id, snippet);
            }
        }
        catch (error) {
            this.logger.warn('Failed to load snippets', error);
        }
    }
    async persistSnippet(snippet) {
        if (!existsSync(this.snippetsDir)) {
            mkdirSync(this.snippetsDir, { recursive: true });
        }
        const filePath = join(this.snippetsDir, `${snippet.id}.json`);
        writeFileSync(filePath, JSON.stringify(snippet, null, 2));
    }
    detectLanguage(code) {
        // Simple language detection based on syntax
        if (code.includes('import React') || code.includes('export default function')) {
            return 'tsx';
        }
        if (code.includes('interface ') || code.includes(': string') || code.includes(': number')) {
            return 'typescript';
        }
        if (code.includes('const ') || code.includes('function ') || code.includes('=>')) {
            return 'javascript';
        }
        if (code.includes('def ') || code.includes('import ') || code.includes('class ')) {
            if (code.includes('self.') || code.includes('__init__')) {
                return 'python';
            }
        }
        if (code.includes('package ') || code.includes('func ')) {
            return 'go';
        }
        if (code.includes('fn ') || code.includes('let mut')) {
            return 'rust';
        }
        return 'text';
    }
}
//# sourceMappingURL=thinking.service.js.map