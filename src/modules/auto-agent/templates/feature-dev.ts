// src/modules/auto-agent/templates/feature-dev.ts
/**
 * Feature Development Workflow Template (Sprint 8)
 *
 * A comprehensive workflow for developing new features with:
 * - Analysis phase (ungated)
 * - Planning phase (ungated)
 * - Implementation phase (gated)
 * - Testing phase (gated)
 * - Review phase (gated)
 */

import { WorkflowGraph, WorkflowNode, WorkflowEdge } from '../task-graph.js';
import { WorkflowTemplateInfo, WorkflowTemplateInput } from './index.js';

export const FEATURE_DEV_TEMPLATE: WorkflowTemplateInfo = {
  name: 'feature-dev',
  description: 'Full feature development workflow with analysis, planning, implementation, testing, and review phases',
  phases: ['analysis', 'plan', 'impl', 'test', 'review'],
  nodeCount: 8,
  hasDecision: false,
  hasJoin: true,
};

/**
 * Create a feature development workflow graph
 */
export function createFeatureDevGraph(input?: WorkflowTemplateInput): WorkflowGraph {
  const prefix = input?.taskIdPrefix || 'feat';
  const taskName = input?.taskName || 'Feature Development';

  const nodes: WorkflowNode[] = [
    // Analysis Phase
    {
      id: `${prefix}-analyze`,
      kind: 'task',
      label: 'Analyze Requirements',
      phase: 'analysis',
      payload: {
        description: 'Understand requirements and constraints',
        targetPaths: input?.targetPaths,
      },
    },
    // Planning Phase
    {
      id: `${prefix}-plan`,
      kind: 'task',
      label: 'Design Solution',
      phase: 'plan',
      payload: {
        description: 'Design the solution architecture',
      },
    },
    // Implementation Phase (parallel tasks)
    {
      id: `${prefix}-impl-core`,
      kind: 'task',
      label: 'Implement Core Logic',
      phase: 'impl',
      // Gate required by phase default
      payload: {
        description: 'Implement the core feature logic',
      },
    },
    {
      id: `${prefix}-impl-ui`,
      kind: 'task',
      label: 'Implement UI/API',
      phase: 'impl',
      // Gate required by phase default
      payload: {
        description: 'Implement user interface or API layer',
      },
    },
    // Join after parallel implementation
    {
      id: `${prefix}-impl-join`,
      kind: 'join',
      label: 'Implementation Complete',
      phase: 'impl',
    },
    // Testing Phase
    {
      id: `${prefix}-test`,
      kind: 'task',
      label: 'Write Tests',
      phase: 'test',
      // Gate required by phase default
      payload: {
        description: 'Write unit and integration tests',
      },
    },
    // Review Phase
    {
      id: `${prefix}-review`,
      kind: 'task',
      label: 'Code Review',
      phase: 'review',
      // Gate required by phase default
      payload: {
        description: 'Review code changes and documentation',
      },
    },
    // Final
    {
      id: `${prefix}-done`,
      kind: 'task',
      label: 'Feature Complete',
      phase: 'review',
      gateRequired: false, // Final node doesn't need gate
      payload: {
        description: 'Feature ready for merge',
        taskName,
      },
    },
  ];

  const edges: WorkflowEdge[] = [
    { from: `${prefix}-analyze`, to: `${prefix}-plan` },
    { from: `${prefix}-plan`, to: `${prefix}-impl-core` },
    { from: `${prefix}-plan`, to: `${prefix}-impl-ui` },
    { from: `${prefix}-impl-core`, to: `${prefix}-impl-join` },
    { from: `${prefix}-impl-ui`, to: `${prefix}-impl-join` },
    { from: `${prefix}-impl-join`, to: `${prefix}-test` },
    { from: `${prefix}-test`, to: `${prefix}-review` },
    { from: `${prefix}-review`, to: `${prefix}-done` },
  ];

  return {
    version: '1.0',
    entry: `${prefix}-analyze`,
    nodes,
    edges,
    defaults: {
      timeoutMs: 300000, // 5 minutes per node
    },
  };
}
