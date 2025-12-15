// src/modules/auto-agent/templates/index.ts
/**
 * Workflow Templates Index (Sprint 8)
 *
 * Provides pre-built WorkflowGraph templates for common development tasks.
 * Each template includes appropriate phases and gate requirements.
 */

import { WorkflowGraph } from '../task-graph.js';
import { FEATURE_DEV_TEMPLATE, createFeatureDevGraph } from './feature-dev.js';
import { BUG_FIX_TEMPLATE, createBugFixGraph } from './bug-fix.js';
import { CODE_REVIEW_TEMPLATE, createCodeReviewGraph } from './code-review.js';
import { REFACTOR_MODULE_TEMPLATE, createRefactorModuleGraph } from './refactor-module.js';
import { RELEASE_SMOKE_TEMPLATE, createReleaseSmokeGraph } from './release-smoke.js';

// ═══════════════════════════════════════════════════════════════
//                         TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Template metadata
 */
export interface WorkflowTemplateInfo {
  name: string;
  description: string;
  phases: string[];
  nodeCount: number;
  hasDecision: boolean;
  hasJoin: boolean;
}

/**
 * Input parameters for template graph creation
 */
export interface WorkflowTemplateInput {
  taskIdPrefix?: string;
  targetPaths?: string[];
  taskName?: string;
  description?: string;
}

// ═══════════════════════════════════════════════════════════════
//                      TEMPLATE REGISTRY
// ═══════════════════════════════════════════════════════════════

const TEMPLATE_REGISTRY: Record<string, {
  meta: WorkflowTemplateInfo;
  createGraph: (input?: WorkflowTemplateInput) => WorkflowGraph;
}> = {
  'feature-dev': {
    meta: FEATURE_DEV_TEMPLATE,
    createGraph: createFeatureDevGraph,
  },
  'bug-fix': {
    meta: BUG_FIX_TEMPLATE,
    createGraph: createBugFixGraph,
  },
  'code-review': {
    meta: CODE_REVIEW_TEMPLATE,
    createGraph: createCodeReviewGraph,
  },
  'refactor-module': {
    meta: REFACTOR_MODULE_TEMPLATE,
    createGraph: createRefactorModuleGraph,
  },
  'release-smoke': {
    meta: RELEASE_SMOKE_TEMPLATE,
    createGraph: createReleaseSmokeGraph,
  },
};

// ═══════════════════════════════════════════════════════════════
//                      PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * List all available workflow templates
 */
export function listTemplates(): WorkflowTemplateInfo[] {
  return Object.values(TEMPLATE_REGISTRY).map(t => t.meta);
}

/**
 * Get a workflow graph from a template
 */
export function getTemplate(name: string, input?: WorkflowTemplateInput): WorkflowGraph | null {
  const template = TEMPLATE_REGISTRY[name];
  if (!template) {
    return null;
  }
  return template.createGraph(input);
}

/**
 * Check if a template exists
 */
export function hasTemplate(name: string): boolean {
  return name in TEMPLATE_REGISTRY;
}

/**
 * Get template names
 */
export function getTemplateNames(): string[] {
  return Object.keys(TEMPLATE_REGISTRY);
}

// Re-export individual templates for direct access
export { FEATURE_DEV_TEMPLATE, createFeatureDevGraph } from './feature-dev.js';
export { BUG_FIX_TEMPLATE, createBugFixGraph } from './bug-fix.js';
export { CODE_REVIEW_TEMPLATE, createCodeReviewGraph } from './code-review.js';
export { REFACTOR_MODULE_TEMPLATE, createRefactorModuleGraph } from './refactor-module.js';
export { RELEASE_SMOKE_TEMPLATE, createReleaseSmokeGraph } from './release-smoke.js';
