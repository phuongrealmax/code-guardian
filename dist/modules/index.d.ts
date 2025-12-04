/**
 * CCG Modules Index
 *
 * This file exports all feature modules for the Claude Code Guardian.
 * Modules are initialized by the MCP server and provide tools for Claude.
 */
export { MemoryModule, MemoryService } from './memory/index.js';
export type { Memory, MemoryType, MemoryModuleConfig, StoreMemoryParams, RecallMemoryParams, MemorySummary, MemoryModuleStatus, } from './memory/index.js';
export { GuardModule, GuardService } from './guard/index.js';
export type { ValidationResult, ValidationIssue, GuardModuleConfig, IGuardRule, RuleCategory, GuardModuleStatus, } from './guard/index.js';
export { ProcessModule, ProcessService } from './process/index.js';
export type { ProcessInfo, ProcessStatus, PortStatus, ProcessModuleConfig, SpawnParams, SpawnResult, KillResult, ProcessModuleStatus, CleanupResult, } from './process/index.js';
export { ResourceModule, ResourceService } from './resource/index.js';
export type { ResourceStatus, CheckpointInfo, ResourceWarning, TaskEstimate, CheckpointData, CheckpointReason, TokenUsage, } from './resource/index.js';
export { WorkflowModule, WorkflowService } from './workflow/index.js';
export type { Task, TaskStatus, TaskPriority, TaskNote, TaskCreateParams, TaskUpdateParams, TaskFilter, WorkflowStatus, TaskSummary, } from './workflow/index.js';
export { TestingModule, TestingService, BrowserService } from './testing/index.js';
export type { TestResults, TestResult, CoverageReport, BrowserSession, ConsoleLog, NetworkRequest, Screenshot, BrowserError, TestRunOptions, TestCleanupResult, TestingModuleStatus, } from './testing/index.js';
export { DocumentsModule, DocumentsService } from './documents/index.js';
export type { Document, DocumentType, DocumentRegistry, DocumentSearchResult, DocumentUpdateCheck, DocumentCreateParams, DocumentsModuleStatus, } from './documents/index.js';
export { AgentsModule, AgentsService } from './agents/index.js';
export type { Agent, AgentSelection, AgentsModuleConfig, AgentsModuleStatus, DelegationRule, RegisterAgentParams, SelectAgentParams, CoordinateAgentsParams, CoordinationResult, } from './agents/index.js';
export { LatentModule, LatentService, DEFAULT_LATENT_CONFIG } from './latent/index.js';
export type { AgentLatentContext, LatentPhase, LatentDecision, CodeMap, TaskArtifacts, ContextDelta, LatentResponse, LatentAction, LatentActionType, LatentModuleConfig, LatentModuleStatus, CreateContextParams, UpdateContextParams, ApplyPatchParams, GetContextParams, TransitionPhaseParams, ContextHistoryEntry, LatentContextWithHistory, LatentValidationResult, } from './latent/index.js';
export { AutoAgentModule, AutoAgentService, DEFAULT_AUTO_AGENT_CONFIG } from './auto-agent/index.js';
export type { AutoAgentModuleConfig, AutoAgentStatus, DecomposeParams, DecomposeResult, TaskComplexityAnalysis, SubtaskDefinition, RouteToolParams, ToolRouteResult, SuggestedTool, StartFixLoopParams, FixLoopResult, FixLoopStatus, ErrorInfo, FixAction, StoreErrorParams, RecallErrorsParams, RecallErrorsResult, ErrorMemoryEntry, } from './auto-agent/index.js';
/**
 * Base interface for all CCG modules
 */
export interface ICCGModule {
    /**
     * Initialize the module
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the module
     */
    shutdown(): Promise<void>;
    /**
     * Get MCP tool definitions
     */
    getTools(): Array<{
        name: string;
        description: string;
        inputSchema: Record<string, unknown>;
    }>;
    /**
     * Handle MCP tool call
     */
    handleTool(toolName: string, args: Record<string, unknown>): Promise<unknown>;
    /**
     * Get module status
     */
    getStatus(): Record<string, unknown>;
}
import { ConfigManager } from '../core/config-manager.js';
import { EventBus } from '../core/event-bus.js';
import { Logger } from '../core/logger.js';
import { MemoryModule } from './memory/index.js';
import { GuardModule } from './guard/index.js';
import { ProcessModule } from './process/index.js';
import { ResourceModule } from './resource/index.js';
import { WorkflowModule } from './workflow/index.js';
import { TestingModule } from './testing/index.js';
import { DocumentsModule } from './documents/index.js';
import { AgentsModule } from './agents/index.js';
import { LatentModule } from './latent/index.js';
import { AutoAgentModule } from './auto-agent/index.js';
/**
 * Initialized modules interface for HookRouter
 */
export interface InitializedModules {
    memory: MemoryModule;
    guard: GuardModule;
    process: ProcessModule;
    resource: ResourceModule;
    workflow: WorkflowModule;
    testing: TestingModule;
    documents: DocumentsModule;
    agents: AgentsModule;
    latent: LatentModule;
    autoAgent: AutoAgentModule;
}
/**
 * Initialize all CCG modules
 *
 * @param configManager - ConfigManager instance
 * @param eventBus - EventBus instance
 * @param logger - Logger instance
 * @param projectRoot - Root directory of the project
 * @returns Initialized modules object
 */
export declare function initializeModules(configManager: ConfigManager, eventBus: EventBus, logger: Logger, projectRoot: string): Promise<InitializedModules>;
/**
 * Shutdown all modules gracefully
 */
export declare function shutdownModules(modules: InitializedModules): Promise<void>;
//# sourceMappingURL=index.d.ts.map