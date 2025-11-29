// src/modules/index.ts

/**
 * CCG Modules Index
 *
 * This file exports all feature modules for the Claude Code Guardian.
 * Modules are initialized by the MCP server and provide tools for Claude.
 */

// ═══════════════════════════════════════════════════════════════
//                      MODULE EXPORTS
// ═══════════════════════════════════════════════════════════════

// Memory Module - Persistent memory for facts, decisions, patterns
export { MemoryModule, MemoryService } from './memory/index.js';
export type {
  Memory,
  MemoryType,
  MemoryModuleConfig,
  StoreMemoryParams,
  RecallMemoryParams,
  MemorySummary,
  MemoryModuleStatus,
} from './memory/index.js';

// Guard Module - Code validation and honesty checking
export { GuardModule, GuardService } from './guard/index.js';
export type {
  ValidationResult,
  ValidationIssue,
  GuardModuleConfig,
  IGuardRule,
  RuleCategory,
  GuardModuleStatus,
} from './guard/index.js';

// Process Module - Port and process management
export { ProcessModule, ProcessService } from './process/index.js';
export type {
  ProcessInfo,
  ProcessStatus,
  PortStatus,
  ProcessModuleConfig,
  SpawnParams,
  SpawnResult,
  KillResult,
  ProcessModuleStatus,
  CleanupResult,
} from './process/index.js';

// Resource Module - Token and checkpoint management
export { ResourceModule, ResourceService } from './resource/index.js';
export type {
  ResourceStatus,
  CheckpointInfo,
  ResourceWarning,
  TaskEstimate,
  CheckpointData,
  CheckpointReason,
  TokenUsage,
} from './resource/index.js';

// Workflow Module - Task and progress tracking
export { WorkflowModule, WorkflowService } from './workflow/index.js';
export type {
  Task,
  TaskStatus,
  TaskPriority,
  TaskNote,
  TaskCreateParams,
  TaskUpdateParams,
  TaskFilter,
  WorkflowStatus,
  TaskSummary,
} from './workflow/index.js';

// Testing Module - Test runner and browser automation
export { TestingModule, TestingService, BrowserService } from './testing/index.js';
export type {
  TestResults,
  TestResult,
  CoverageReport,
  BrowserSession,
  ConsoleLog,
  NetworkRequest,
  Screenshot,
  BrowserError,
  TestRunOptions,
  TestCleanupResult,
  TestingModuleStatus,
} from './testing/index.js';

// Documents Module - Document registry and management
export { DocumentsModule, DocumentsService } from './documents/index.js';
export type {
  Document,
  DocumentType,
  DocumentRegistry,
  DocumentSearchResult,
  DocumentUpdateCheck,
  DocumentCreateParams,
  DocumentsModuleStatus,
} from './documents/index.js';

// ═══════════════════════════════════════════════════════════════
//                      MODULE INTERFACE
// ═══════════════════════════════════════════════════════════════

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
