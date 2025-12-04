/**
 * Default Thinking Models and Workflows Data
 *
 * Pre-defined thinking models and standard workflows
 * imported from ClaudeMCP project with enhancements.
 */
import { ThinkingModel, Workflow, ThinkingModelType, WorkflowType } from './thinking.types.js';
export declare const DEFAULT_THINKING_MODELS: Record<ThinkingModelType, ThinkingModel>;
export declare const DEFAULT_WORKFLOWS: Record<WorkflowType, Workflow>;
/**
 * Get all thinking model names
 */
export declare function getThinkingModelNames(): ThinkingModelType[];
/**
 * Get all workflow names
 */
export declare function getWorkflowNames(): WorkflowType[];
/**
 * Suggest thinking model based on task description
 */
export declare function suggestThinkingModel(taskDescription: string): ThinkingModelType;
/**
 * Suggest workflow based on task description
 */
export declare function suggestWorkflow(taskDescription: string): WorkflowType | null;
//# sourceMappingURL=thinking.data.d.ts.map