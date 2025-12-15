// src/modules/auto-agent/templates/bug-fix.ts
/**
 * Bug Fix Workflow Template (Sprint 8)
 *
 * A workflow for investigating and fixing bugs with:
 * - Analysis phase to reproduce and understand the bug
 * - Decision branch based on reproducibility
 * - Implementation and testing phases (gated)
 */

import { WorkflowGraph, WorkflowNode, WorkflowEdge } from '../task-graph.js';
import { WorkflowTemplateInfo, WorkflowTemplateInput } from './index.js';

export const BUG_FIX_TEMPLATE: WorkflowTemplateInfo = {
  name: 'bug-fix',
  description: 'Bug investigation and fix workflow with decision branching based on reproducibility',
  phases: ['analysis', 'plan', 'impl', 'test', 'review'],
  nodeCount: 9,
  hasDecision: true,
  hasJoin: true,
};

/**
 * Create a bug fix workflow graph
 */
export function createBugFixGraph(input?: WorkflowTemplateInput): WorkflowGraph {
  const prefix = input?.taskIdPrefix || 'bug';
  const taskName = input?.taskName || 'Bug Fix';

  const nodes: WorkflowNode[] = [
    // Analysis Phase
    {
      id: `${prefix}-reproduce`,
      kind: 'task',
      label: 'Reproduce Bug',
      phase: 'analysis',
      payload: {
        description: 'Attempt to reproduce the reported bug',
        targetPaths: input?.targetPaths,
      },
    },
    // Decision: Was bug reproduced?
    {
      id: `${prefix}-repro-check`,
      kind: 'decision',
      label: 'Reproduced?',
      phase: 'analysis',
      payload: {
        reproduced: true, // Default assumes reproduced
      },
    },
    // Path: Bug reproduced
    {
      id: `${prefix}-analyze-root`,
      kind: 'task',
      label: 'Root Cause Analysis',
      phase: 'analysis',
      payload: {
        description: 'Identify the root cause of the bug',
      },
    },
    // Path: Bug not reproduced
    {
      id: `${prefix}-need-info`,
      kind: 'task',
      label: 'Request More Info',
      phase: 'analysis',
      gateRequired: false,
      payload: {
        description: 'Cannot reproduce - request more information from reporter',
      },
    },
    // Join after decision branches
    {
      id: `${prefix}-analysis-join`,
      kind: 'join',
      label: 'Analysis Complete',
      phase: 'analysis',
    },
    // Plan fix
    {
      id: `${prefix}-plan-fix`,
      kind: 'task',
      label: 'Plan Fix',
      phase: 'plan',
      payload: {
        description: 'Design the fix approach',
      },
    },
    // Implementation (gated by phase)
    {
      id: `${prefix}-impl-fix`,
      kind: 'task',
      label: 'Implement Fix',
      phase: 'impl',
      payload: {
        description: 'Implement the bug fix',
      },
    },
    // Testing (gated by phase)
    {
      id: `${prefix}-test-fix`,
      kind: 'task',
      label: 'Test Fix',
      phase: 'test',
      payload: {
        description: 'Verify fix resolves the bug without regression',
      },
    },
    // Review (gated by phase)
    {
      id: `${prefix}-review`,
      kind: 'task',
      label: 'Review Fix',
      phase: 'review',
      payload: {
        description: 'Review the fix and close the bug',
        taskName,
      },
    },
  ];

  const edges: WorkflowEdge[] = [
    { from: `${prefix}-reproduce`, to: `${prefix}-repro-check` },
    // Decision edges with conditions
    {
      from: `${prefix}-repro-check`,
      to: `${prefix}-analyze-root`,
      condition: {
        type: 'equals',
        path: `results.${prefix}-repro-check.reproduced`,
        value: true,
      },
    },
    {
      from: `${prefix}-repro-check`,
      to: `${prefix}-need-info`,
      condition: {
        type: 'equals',
        path: `results.${prefix}-repro-check.reproduced`,
        value: false,
      },
    },
    // Both paths lead to join
    { from: `${prefix}-analyze-root`, to: `${prefix}-analysis-join` },
    { from: `${prefix}-need-info`, to: `${prefix}-analysis-join` },
    // Continue flow
    { from: `${prefix}-analysis-join`, to: `${prefix}-plan-fix` },
    { from: `${prefix}-plan-fix`, to: `${prefix}-impl-fix` },
    { from: `${prefix}-impl-fix`, to: `${prefix}-test-fix` },
    { from: `${prefix}-test-fix`, to: `${prefix}-review` },
  ];

  return {
    version: '1.0',
    entry: `${prefix}-reproduce`,
    nodes,
    edges,
    defaults: {
      timeoutMs: 300000,
    },
  };
}
