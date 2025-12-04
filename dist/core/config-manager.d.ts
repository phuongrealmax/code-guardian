import { CCGConfig, ModulesConfig } from './types.js';
import { Logger } from './logger.js';
import { EventBus } from './event-bus.js';
export declare const DEFAULT_CONFIG: CCGConfig;
export declare class ConfigManager {
    private config;
    private configPath;
    private projectRoot;
    private logger;
    private eventBus?;
    private watchers;
    private changeCallbacks;
    constructor(projectRoot?: string, logger?: Logger, eventBus?: EventBus);
    /**
     * Get the project root directory
     */
    getProjectRoot(): string;
    /**
     * Resolve a relative path to absolute using project root
     */
    resolvePath(relativePath: string): string;
    /**
     * Load configuration from file
     */
    load(): Promise<CCGConfig>;
    /**
     * Save configuration to file
     */
    save(): Promise<void>;
    /**
     * Get entire configuration
     */
    getAll(): CCGConfig;
    /**
     * Get configuration value by path
     */
    get<T = unknown>(path: string): T | undefined;
    /**
     * Set configuration value by path
     */
    set<T>(path: string, value: T): void;
    /**
     * Get module configuration
     */
    getModuleConfig<K extends keyof ModulesConfig>(moduleName: K): ModulesConfig[K];
    /**
     * Check if a module is enabled
     */
    isModuleEnabled(moduleName: keyof ModulesConfig): boolean;
    /**
     * Enable/disable a module
     */
    setModuleEnabled(moduleName: keyof ModulesConfig, enabled: boolean): void;
    /**
     * Watch for configuration changes
     */
    watch(callback: (config: CCGConfig) => void): () => void;
    /**
     * Validate configuration
     */
    validate(): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Reset to defaults
     */
    reset(): void;
    /**
     * Get default configuration
     */
    getDefaultConfig(): CCGConfig;
    /**
     * Export configuration as JSON string
     */
    export(): string;
    /**
     * Import configuration from JSON string
     */
    import(jsonString: string): void;
    private deepMerge;
    private notifyChange;
}
export declare const CONFIG_SCHEMA: {
    type: string;
    required: string[];
    properties: {
        version: {
            type: string;
        };
        project: {
            type: string;
            properties: {
                name: {
                    type: string;
                };
                type: {
                    type: string;
                    enum: string[];
                };
                root: {
                    type: string;
                };
            };
        };
        modules: {
            type: string;
            properties: {
                memory: {
                    type: string;
                    required: string[];
                };
                guard: {
                    type: string;
                    required: string[];
                };
                process: {
                    type: string;
                    required: string[];
                };
                resource: {
                    type: string;
                    required: string[];
                };
                testing: {
                    type: string;
                    required: string[];
                };
                documents: {
                    type: string;
                    required: string[];
                };
                workflow: {
                    type: string;
                    required: string[];
                };
            };
        };
    };
};
//# sourceMappingURL=config-manager.d.ts.map