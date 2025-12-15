// src/modules/auto-agent/templates/refactor-module.ts
/**
 * Module Refactoring Workflow Template (Sprint 8)
 *
 * A workflow for refactoring code modules with:
 * - Analysis of current module structure
 * - Planning the refactoring approach
 * - Safe incremental implementation with tests
 * - Review of changes
 */

import { WorkflowGraph, WorkflowNode, WorkflowEdge } from '../task-graph.js';
import { WorkflowTemplateInfo, WorkflowTemplateInput } from './index.js';

export const REFACTOR_MODULE_TEMPLATE: WorkflowTemplateInfo = {
  name: 'refactor-module',
  description: 'Module refactoring workflow with analysis, incremental changes, and verification',
  phases: ['analysis', 'plan', 'impl', 'test', 'review'],
  nodeCount: 8,
  hasDecision: false,
  hasJoin: false,
};

/**
 * Create a module refactoring workflow graph
 */
export function createRefactorModuleGraph(input?: WorkflowTemplateInput): WorkflowGraph {
  const prefix = input?.taskIdPrefix || 'refactor';
  const taskName = input?.taskName || 'Module Refactoring';

  const nodes: WorkflowNode[] = [
    // Analysis Phase
    {
      id: `${prefix}-analyze-deps`,
      kind: 'task',
      label: 'Analyze Dependencies',
      phase: 'analysis',
      payload: {
        description: 'Map module dependencies and usage patterns',
        targetPaths: input?.targetPaths,
      },
    },
    {
      id: `${prefix}-identify-issues`,
      kind: 'task',
      label: 'Identify Issues',
      phase: 'analysis',
      payload: {
        description: 'Identify code smells and improvement opportunities',
      },
    },
    // Planning Phase
    {
      id: `${prefix}-plan`,
      kind: 'task',
      label: 'Plan Refactoring',
      phase: 'plan',
      payload: {
        description: 'Design refactoring steps to minimize risk',
      },
    },
    // Implementation Phase (gated)
    {
      id: `${prefix}-impl-extract`,
      kind: 'task',
      label: 'Extract & Restructure',
      phase: 'impl',
      // Gate required by phase default
      payload: {
        description: 'Extract components and restructure module',
      },
    },
    {
      id: `${prefix}-impl-cleanup`,
      kind: 'task',
      label: 'Clean Up',
      phase: 'impl',
      // Gate required by phase default
      payload: {
        description: 'Remove dead code and clean up imports',
      },
    },
    // Testing Phase (gated)
    {
      id: `${prefix}-test`,
      kind: 'task',
      label: 'Verify Behavior',
      phase: 'test',
      // Gate required by phase default
      payload: {
        description: 'Run tests to verify behavior is preserved',
      },
    },
    // Review Phase (gated)
    {
      id: `${prefix}-review`,
      kind: 'task',
      label: 'Review Changes',
      phase: 'review',
      // Gate required by phase default
      payload: {
        description: 'Review refactoring changes',
      },
    },
    // Final
    {
      id: `${prefix}-done`,
      kind: 'task',
      label: 'Refactoring Complete',
      phase: 'review',
      gateRequired: false,
      payload: {
        description: 'Module refactoring finished',
        taskName,
      },
    },
  ];

  const edges: WorkflowEdge[] = [
    { from: `${prefix}-analyze-deps`, to: `${prefix}-identify-issues` },
    { from: `${prefix}-identify-issues`, to: `${prefix}-plan` },
    { from: `${prefix}-plan`, to: `${prefix}-impl-extract` },
    { from: `${prefix}-impl-extract`, to: `${prefix}-impl-cleanup` },
    { from: `${prefix}-impl-cleanup`, to: `${prefix}-test` },
    { from: `${prefix}-test`, to: `${prefix}-review` },
    { from: `${prefix}-review`, to: `${prefix}-done` },
  ];

  return {
    version: '1.0',
    entry: `${prefix}-analyze-deps`,
    nodes,
    edges,
    defaults: {
      timeoutMs: 300000,
    },
  };
}
