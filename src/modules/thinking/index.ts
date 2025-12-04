// src/modules/thinking/index.ts

/**
 * Thinking Module Exports
 *
 * This module provides:
 * - Thinking Models (CoT, ToT, ReAct, Self-Consistency, Decomposition, First Principles)
 * - Standard Workflows/SOPs (Pre-commit, Code Review, Refactoring, Deploy, Bug Fix, etc.)
 * - Code Style RAG (Save and retrieve code snippets for style consistency)
 */

// Module
export { ThinkingModule } from './thinking.module.js';

// Service
export { ThinkingService } from './thinking.service.js';

// Types
export type {
  // Thinking Models
  ThinkingModel,
  ThinkingModelType,
  ThinkingStep,
  ThinkingModelResult,
  // Workflows
  Workflow,
  WorkflowType,
  WorkflowStep,
  WorkflowRunResult,
  // Code Snippets
  CodeSnippet,
  SaveSnippetParams,
  StyleReferenceResult,
  // Config & Status
  ThinkingModuleConfig,
  ThinkingModuleStatus,
  // Tool Params
  GetThinkingModelParams,
  GetWorkflowParams,
  SuggestModelParams,
  SuggestWorkflowParams,
  GetStyleReferenceParams,
} from './thinking.types.js';

// Data & Helpers
export {
  DEFAULT_THINKING_MODELS,
  DEFAULT_WORKFLOWS,
  getThinkingModelNames,
  getWorkflowNames,
  suggestThinkingModel,
  suggestWorkflow,
} from './thinking.data.js';

// Tools
export { getThinkingTools, createThinkingToolHandlers } from './thinking.tools.js';

// Default configuration
export const DEFAULT_THINKING_CONFIG: import('./thinking.types.js').ThinkingModuleConfig = {
  enabled: true,
  maxSnippetsPerCategory: 10,
  autoSuggestWorkflows: true,
};
