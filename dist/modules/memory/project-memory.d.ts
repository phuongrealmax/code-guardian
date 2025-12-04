import { Logger } from '../../core/logger.js';
/**
 * Project facts structure
 */
export interface ProjectFacts {
    name: string;
    domain: ProjectDomain;
    stack: {
        backend?: string;
        frontend?: string;
        database?: string;
        queue?: string;
        cache?: string;
    };
    description?: string;
    version?: string;
    mainBranch?: string;
}
/**
 * Supported project domains
 */
export type ProjectDomain = 'erp' | 'trading' | 'orchestration' | 'ecommerce' | 'cms' | 'api' | 'general';
/**
 * Business principles - domain-specific rules
 */
export interface BusinessPrinciples {
    domain: ProjectDomain;
    rules: BusinessRule[];
    customRules?: BusinessRule[];
}
export interface BusinessRule {
    id: string;
    category: string;
    rule: string;
    importance: 'critical' | 'high' | 'medium' | 'low';
    enforceable?: boolean;
}
/**
 * API Conventions
 */
export interface ApiConventions {
    responseWrapper?: {
        success: string;
        data: string;
        message: string;
        error: string;
    };
    errorFormat?: {
        message: string;
        code: string;
        fields?: string;
    };
    versioning?: {
        style: 'path' | 'header' | 'query';
        pattern: string;
        currentVersion: string;
    };
    authentication?: {
        type: 'jwt' | 'oauth' | 'api-key' | 'session';
        headerName?: string;
    };
}
/**
 * Complete project memory structure
 */
export interface ProjectMemory {
    projectFacts: ProjectFacts;
    businessPrinciples: BusinessPrinciples;
    apiConventions?: ApiConventions;
    reports?: ReportConfig[];
    customData?: Record<string, unknown>;
    lastUpdated: Date;
    version: string;
}
export interface ReportConfig {
    name: string;
    type: string;
    dimensions: string[];
    metrics: string[];
}
/**
 * Default business principles by domain
 */
export declare const DOMAIN_PRINCIPLES: Record<ProjectDomain, BusinessRule[]>;
export declare class ProjectMemoryService {
    private projectRoot;
    private logger;
    private memoryCache;
    private memoryPath;
    constructor(projectRoot: string, logger: Logger);
    /**
     * Load project memory from file
     */
    load(): Promise<ProjectMemory | null>;
    /**
     * Save project memory to file
     */
    save(memory: ProjectMemory): Promise<void>;
    /**
     * Initialize project memory with detected or provided facts
     */
    initialize(facts?: Partial<ProjectFacts>): Promise<ProjectMemory>;
    /**
     * Update project facts
     */
    updateFacts(facts: Partial<ProjectFacts>): Promise<ProjectMemory>;
    /**
     * Add custom business rule
     */
    addCustomRule(rule: BusinessRule): Promise<void>;
    /**
     * Get all business rules (default + custom)
     */
    getAllRules(): Promise<BusinessRule[]>;
    /**
     * Set API conventions
     */
    setApiConventions(conventions: ApiConventions): Promise<void>;
    /**
     * Add report configuration
     */
    addReport(report: ReportConfig): Promise<void>;
    /**
     * Set custom data
     */
    setCustomData(key: string, value: unknown): Promise<void>;
    /**
     * Get custom data
     */
    getCustomData(key: string): Promise<unknown>;
    private detectProjectName;
    private detectDomain;
    private detectStack;
}
export declare function createProjectMemoryService(projectRoot: string, logger: Logger): ProjectMemoryService;
//# sourceMappingURL=project-memory.d.ts.map