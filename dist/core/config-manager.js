// src/core/config-manager.ts
import { readFileSync, writeFileSync, existsSync, watchFile, unwatchFile } from 'fs';
import { join, dirname, isAbsolute, resolve } from 'path';
import { mkdirSync } from 'fs';
import { Logger } from './logger.js';
// ═══════════════════════════════════════════════════════════════
//                      DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════
export const DEFAULT_CONFIG = {
    version: '1.0.0',
    project: {
        name: '',
        type: 'typescript-node',
        root: '.',
    },
    modules: {
        memory: {
            enabled: true,
            maxItems: 100,
            autoSave: true,
            persistPath: '.ccg/memory.db',
            compressionEnabled: true,
        },
        guard: {
            enabled: true,
            strictMode: true,
            rules: {
                blockFakeTests: true,
                blockDisabledFeatures: true,
                blockEmptyCatch: true,
                blockEmojiInCode: true,
                blockSwallowedExceptions: true,
                blockSqlInjection: true,
                blockHardcodedSecrets: true,
            },
        },
        process: {
            enabled: true,
            ports: {
                dev: 3000,
                api: 8080,
                test: 9000,
            },
            autoKillOnConflict: true,
            trackSpawnedProcesses: true,
        },
        resource: {
            enabled: true,
            checkpoints: {
                auto: true,
                thresholds: [50, 70, 85, 95],
                maxCheckpoints: 10,
                compressOld: true,
            },
            warningThreshold: 70,
            pauseThreshold: 95,
        },
        testing: {
            enabled: true,
            autoRun: false,
            testCommand: 'npm test',
            browser: {
                enabled: true,
                headless: true,
                captureConsole: true,
                captureNetwork: true,
                screenshotOnError: true,
            },
            cleanup: {
                autoCleanTestData: true,
                testDataPrefix: 'test_',
                testDataLocations: ['tmp', 'test-data', '.test'],
            },
        },
        documents: {
            enabled: true,
            locations: {
                readme: 'README.md',
                docs: 'docs',
                api: 'docs/api',
                specs: 'docs/specs',
            },
            updateInsteadOfCreate: true,
            namingConvention: 'kebab-case',
        },
        workflow: {
            enabled: true,
            autoTrackTasks: true,
            requireTaskForLargeChanges: false,
            largeChangeThreshold: 100,
        },
        agents: {
            enabled: true,
            agentsFilePath: 'AGENTS.md',
            agentsDir: '.claude/agents',
            autoReload: true,
            enableCoordination: true,
        },
        latent: {
            enabled: true,
            maxContexts: 50,
            autoMerge: true,
            persist: true,
            persistPath: '.ccg/latent-contexts.json',
            strictValidation: false,
            maxSummaryLength: 200,
            maxDecisions: 100,
            cleanupAfterMs: 24 * 60 * 60 * 1000,
            autoAttach: true,
            autoAttachTriggerTools: [
                'guard_validate',
                'guard_check_test',
                'testing_run',
                'testing_run_affected',
                'write_file',
                'edit_file',
                'create_file',
                'str_replace_editor',
                'memory_store',
                'workflow_task_start',
            ],
        },
        autoAgent: {
            enabled: true,
            decomposer: {
                maxSubtasks: 10,
                autoDecompose: true,
                minComplexityForDecompose: 4,
            },
            router: {
                enabled: true,
                routingRules: [],
            },
            fixLoop: {
                enabled: true,
                maxRetries: 3,
                retryDelayMs: 1000,
                autoRollbackOnFail: true,
            },
            errorMemory: {
                enabled: true,
                maxErrors: 100,
                deduplicateThreshold: 0.8,
                autoRecall: true,
            },
        },
    },
    notifications: {
        showInline: true,
        showStatusBar: true,
        verbosity: 'normal',
        sound: {
            enabled: false,
            criticalOnly: true,
        },
    },
    conventions: {
        fileNaming: 'kebab-case',
        variableNaming: 'camelCase',
        componentNaming: 'PascalCase',
        noEmoji: true,
        noUnicode: true,
    },
};
// ═══════════════════════════════════════════════════════════════
//                      CONFIG MANAGER CLASS
// ═══════════════════════════════════════════════════════════════
export class ConfigManager {
    config;
    configPath;
    projectRoot;
    logger;
    eventBus;
    watchers = new Set();
    changeCallbacks = new Set();
    constructor(projectRoot = process.cwd(), logger, eventBus) {
        // Ensure project root is absolute path
        this.projectRoot = isAbsolute(projectRoot) ? projectRoot : resolve(projectRoot);
        this.configPath = join(this.projectRoot, '.ccg', 'config.json');
        this.config = { ...DEFAULT_CONFIG };
        this.logger = logger || new Logger('info', 'ConfigManager');
        this.eventBus = eventBus;
    }
    /**
     * Get the project root directory
     */
    getProjectRoot() {
        return this.projectRoot;
    }
    /**
     * Resolve a relative path to absolute using project root
     */
    resolvePath(relativePath) {
        if (isAbsolute(relativePath)) {
            return relativePath;
        }
        return join(this.projectRoot, relativePath);
    }
    /**
     * Load configuration from file
     */
    async load() {
        if (!existsSync(this.configPath)) {
            this.logger.info('No config file found, using defaults');
            return this.config;
        }
        try {
            const content = readFileSync(this.configPath, 'utf-8');
            const fileConfig = JSON.parse(content);
            // Deep merge with defaults
            this.config = this.deepMerge(DEFAULT_CONFIG, fileConfig);
            this.logger.info('Configuration loaded successfully');
            return this.config;
        }
        catch (error) {
            this.logger.error('Failed to load config, using defaults', error);
            return this.config;
        }
    }
    /**
     * Save configuration to file
     */
    async save() {
        try {
            const dir = dirname(this.configPath);
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }
            writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
            this.logger.info('Configuration saved');
        }
        catch (error) {
            this.logger.error('Failed to save config', error);
            throw error;
        }
    }
    /**
     * Get entire configuration
     */
    getAll() {
        return { ...this.config };
    }
    /**
     * Get configuration value by path
     */
    get(path) {
        const parts = path.split('.');
        let current = this.config;
        for (const part of parts) {
            if (current === null || current === undefined) {
                return undefined;
            }
            current = current[part];
        }
        return current;
    }
    /**
     * Set configuration value by path
     */
    set(path, value) {
        const parts = path.split('.');
        let current = this.config;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!(part in current)) {
                current[part] = {};
            }
            current = current[part];
        }
        const lastPart = parts[parts.length - 1];
        const oldValue = current[lastPart];
        current[lastPart] = value;
        // Notify listeners
        this.notifyChange();
        this.logger.debug(`Config updated: ${path}`, { oldValue, newValue: value });
    }
    /**
     * Get module configuration
     */
    getModuleConfig(moduleName) {
        return this.config.modules[moduleName];
    }
    /**
     * Check if a module is enabled
     */
    isModuleEnabled(moduleName) {
        const moduleConfig = this.config.modules[moduleName];
        return moduleConfig?.enabled ?? false;
    }
    /**
     * Enable/disable a module
     */
    setModuleEnabled(moduleName, enabled) {
        if (this.config.modules[moduleName]) {
            this.config.modules[moduleName].enabled = enabled;
            this.notifyChange();
        }
    }
    /**
     * Watch for configuration changes
     */
    watch(callback) {
        this.changeCallbacks.add(callback);
        // Set up file watcher if not already watching
        if (this.watchers.size === 0 && existsSync(this.configPath)) {
            watchFile(this.configPath, { interval: 1000 }, () => {
                this.logger.debug('Config file changed, reloading');
                this.load().then(() => this.notifyChange());
            });
            this.watchers.add(this.configPath);
        }
        // Return unsubscribe function
        return () => {
            this.changeCallbacks.delete(callback);
            if (this.changeCallbacks.size === 0 && this.watchers.has(this.configPath)) {
                unwatchFile(this.configPath);
                this.watchers.delete(this.configPath);
            }
        };
    }
    /**
     * Validate configuration
     */
    validate() {
        const errors = [];
        // Check required fields
        if (!this.config.version) {
            errors.push('Missing version');
        }
        // Validate module configs
        for (const [name, moduleConfig] of Object.entries(this.config.modules)) {
            if (typeof moduleConfig.enabled !== 'boolean') {
                errors.push(`Module ${name}: missing 'enabled' field`);
            }
        }
        // Validate resource thresholds
        if (this.config.modules.resource.warningThreshold >= this.config.modules.resource.pauseThreshold) {
            errors.push('Warning threshold must be less than pause threshold');
        }
        // Validate checkpoint thresholds are sorted
        const thresholds = this.config.modules.resource.checkpoints.thresholds;
        for (let i = 1; i < thresholds.length; i++) {
            if (thresholds[i] <= thresholds[i - 1]) {
                errors.push('Checkpoint thresholds must be in ascending order');
                break;
            }
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    /**
     * Reset to defaults
     */
    reset() {
        this.config = { ...DEFAULT_CONFIG };
        this.notifyChange();
        this.logger.info('Configuration reset to defaults');
    }
    /**
     * Get default configuration
     */
    getDefaultConfig() {
        return { ...DEFAULT_CONFIG };
    }
    /**
     * Export configuration as JSON string
     */
    export() {
        return JSON.stringify(this.config, null, 2);
    }
    /**
     * Import configuration from JSON string
     */
    import(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.config = this.deepMerge(DEFAULT_CONFIG, imported);
            this.notifyChange();
            this.logger.info('Configuration imported');
        }
        catch (error) {
            this.logger.error('Failed to import config', error);
            throw new Error('Invalid configuration JSON');
        }
    }
    // ═══════════════════════════════════════════════════════════════
    //                      PRIVATE METHODS
    // ═══════════════════════════════════════════════════════════════
    deepMerge(target, source) {
        const result = { ...target };
        for (const key of Object.keys(source)) {
            const sourceValue = source[key];
            const targetValue = target[key];
            if (sourceValue !== undefined &&
                typeof sourceValue === 'object' &&
                sourceValue !== null &&
                !Array.isArray(sourceValue) &&
                typeof targetValue === 'object' &&
                targetValue !== null &&
                !Array.isArray(targetValue)) {
                result[key] = this.deepMerge(targetValue, sourceValue);
            }
            else if (sourceValue !== undefined) {
                result[key] = sourceValue;
            }
        }
        return result;
    }
    notifyChange() {
        for (const callback of this.changeCallbacks) {
            try {
                callback(this.config);
            }
            catch (error) {
                this.logger.error('Config change callback error', error);
            }
        }
        // Emit event if event bus available
        if (this.eventBus) {
            this.eventBus.emit({
                type: 'session:resume', // Using existing type, could add config:change
                timestamp: new Date(),
                data: { config: this.config },
                source: 'ConfigManager',
            });
        }
    }
}
// ═══════════════════════════════════════════════════════════════
//                      CONFIG SCHEMA (for validation)
// ═══════════════════════════════════════════════════════════════
export const CONFIG_SCHEMA = {
    type: 'object',
    required: ['version', 'modules'],
    properties: {
        version: { type: 'string' },
        project: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                type: { type: 'string', enum: ['typescript-react', 'typescript-node', 'javascript', 'python', 'other'] },
                root: { type: 'string' },
            },
        },
        modules: {
            type: 'object',
            properties: {
                memory: { type: 'object', required: ['enabled'] },
                guard: { type: 'object', required: ['enabled'] },
                process: { type: 'object', required: ['enabled'] },
                resource: { type: 'object', required: ['enabled'] },
                testing: { type: 'object', required: ['enabled'] },
                documents: { type: 'object', required: ['enabled'] },
                workflow: { type: 'object', required: ['enabled'] },
            },
        },
    },
};
//# sourceMappingURL=config-manager.js.map