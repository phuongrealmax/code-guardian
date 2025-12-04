/**
 * Thinking Models Module Types
 *
 * Provides structured thinking models for systematic reasoning:
 * - Chain-of-Thought (CoT)
 * - Tree of Thoughts (ToT)
 * - ReAct (Reasoning + Acting)
 * - Self-Consistency
 * - Problem Decomposition
 * - First Principles
 */
/**
 * Available thinking model types
 */
export type ThinkingModelType = 'chain-of-thought' | 'tree-of-thoughts' | 'react' | 'self-consistency' | 'decomposition' | 'first-principles';
/**
 * A single step in a thinking model
 */
export interface ThinkingStep {
    step: number;
    name: string;
    action: string;
    tips?: string[];
}
/**
 * A thinking model definition
 */
export interface ThinkingModel {
    id: ThinkingModelType;
    name: string;
    description: string;
    whenToUse: string[];
    steps: ThinkingStep[];
    examplePrompt: string;
    tags: string[];
}
/**
 * Result of applying a thinking model
 */
export interface ThinkingModelResult {
    model: ThinkingModel;
    appliedAt: Date;
    context?: string;
}
/**
 * Available workflow types
 */
export type WorkflowType = 'pre-commit' | 'code-review' | 'refactoring' | 'deploy' | 'bug-fix' | 'feature-development' | 'security-audit' | 'code-optimization';
/**
 * A single step in a workflow
 */
export interface WorkflowStep {
    step: number;
    name: string;
    action: string;
    checkItems?: string[];
    required: boolean;
    autoRun?: boolean;
    command?: string;
}
/**
 * A workflow/SOP definition
 */
export interface Workflow {
    id: WorkflowType;
    name: string;
    description: string;
    triggerKeywords: string[];
    steps: WorkflowStep[];
    estimatedTime?: string;
    tags: string[];
}
/**
 * Result of running a workflow
 */
export interface WorkflowRunResult {
    workflow: Workflow;
    startedAt: Date;
    completedAt?: Date;
    stepsCompleted: number[];
    status: 'running' | 'completed' | 'failed' | 'skipped';
    notes?: string;
}
/**
 * A code snippet for style reference
 */
export interface CodeSnippet {
    id: string;
    category: string;
    description: string;
    code: string;
    language: string;
    tags: string[];
    createdAt: Date;
    usageCount: number;
}
/**
 * Parameters for saving a code snippet
 */
export interface SaveSnippetParams {
    category: string;
    description: string;
    code: string;
    language?: string;
    tags?: string[];
}
/**
 * Result of searching for style references
 */
export interface StyleReferenceResult {
    found: boolean;
    count: number;
    snippets: CodeSnippet[];
    message: string;
}
/**
 * Thinking module configuration
 */
export interface ThinkingModuleConfig {
    enabled: boolean;
    customModelsPath?: string;
    customWorkflowsPath?: string;
    snippetsPath?: string;
    maxSnippetsPerCategory?: number;
    autoSuggestWorkflows?: boolean;
}
/**
 * Module status
 */
export interface ThinkingModuleStatus {
    enabled: boolean;
    modelsLoaded: number;
    workflowsLoaded: number;
    snippetsStored: number;
    lastAccessed?: Date;
}
export interface GetThinkingModelParams {
    modelName: ThinkingModelType;
    context?: string;
}
export interface GetWorkflowParams {
    workflowName: WorkflowType;
}
export interface SuggestModelParams {
    taskDescription: string;
}
export interface SuggestWorkflowParams {
    taskDescription: string;
    keywords?: string[];
}
export interface GetStyleReferenceParams {
    category: string;
    limit?: number;
}
//# sourceMappingURL=thinking.types.d.ts.map