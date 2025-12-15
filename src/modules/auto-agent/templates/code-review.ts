// src/modules/auto-agent/templates/code-review.ts
/**
 * Code Review Workflow Template (Sprint 8)
 *
 * A workflow for conducting code reviews with:
 * - Parallel analysis tracks (security, architecture, quality)
 * - Review summary phase
 * - All phases are review-focused
 */

import { WorkflowGraph, WorkflowNode, WorkflowEdge } from '../task-graph.js';
import { WorkflowTemplateInfo, WorkflowTemplateInput } from './index.js';

export const CODE_REVIEW_TEMPLATE: WorkflowTemplateInfo = {
  name: 'code-review',
  description: 'Code review workflow with parallel security, architecture, and quality analysis tracks',
  phases: ['analysis', 'review'],
  nodeCount: 7,
  hasDecision: false,
  hasJoin: true,
};

/**
 * Create a code review workflow graph
 */
export function createCodeReviewGraph(input?: WorkflowTemplateInput): WorkflowGraph {
  const prefix = input?.taskIdPrefix || 'review';
  const taskName = input?.taskName || 'Code Review';

  const nodes: WorkflowNode[] = [
    // Initial review context
    {
      id: `${prefix}-context`,
      kind: 'task',
      label: 'Gather Review Context',
      phase: 'analysis',
      gateRequired: false,
      payload: {
        description: 'Understand the changes and their purpose',
        targetPaths: input?.targetPaths,
      },
    },
    // Parallel review tracks
    {
      id: `${prefix}-security`,
      kind: 'task',
      label: 'Security Review',
      phase: 'review',
      gateRequired: true, // Explicit gate for security
      payload: {
        description: 'Check for security vulnerabilities and issues',
      },
    },
    {
      id: `${prefix}-architecture`,
      kind: 'task',
      label: 'Architecture Review',
      phase: 'review',
      // Gate required by phase default
      payload: {
        description: 'Review architectural decisions and patterns',
      },
    },
    {
      id: `${prefix}-quality`,
      kind: 'task',
      label: 'Code Quality Review',
      phase: 'review',
      // Gate required by phase default
      payload: {
        description: 'Check code style, readability, and best practices',
      },
    },
    // Join parallel reviews
    {
      id: `${prefix}-join`,
      kind: 'join',
      label: 'Reviews Complete',
      phase: 'review',
    },
    // Summary
    {
      id: `${prefix}-summary`,
      kind: 'task',
      label: 'Review Summary',
      phase: 'review',
      // Gate required by phase default
      payload: {
        description: 'Compile review findings and recommendations',
      },
    },
    // Final decision
    {
      id: `${prefix}-verdict`,
      kind: 'task',
      label: 'Review Verdict',
      phase: 'review',
      gateRequired: false, // Final verdict is the gate itself
      payload: {
        description: 'Approve, request changes, or reject',
        taskName,
      },
    },
  ];

  const edges: WorkflowEdge[] = [
    // Fan out to parallel reviews
    { from: `${prefix}-context`, to: `${prefix}-security` },
    { from: `${prefix}-context`, to: `${prefix}-architecture` },
    { from: `${prefix}-context`, to: `${prefix}-quality` },
    // Fan in
    { from: `${prefix}-security`, to: `${prefix}-join` },
    { from: `${prefix}-architecture`, to: `${prefix}-join` },
    { from: `${prefix}-quality`, to: `${prefix}-join` },
    // Summary and verdict
    { from: `${prefix}-join`, to: `${prefix}-summary` },
    { from: `${prefix}-summary`, to: `${prefix}-verdict` },
  ];

  return {
    version: '1.0',
    entry: `${prefix}-context`,
    nodes,
    edges,
    defaults: {
      timeoutMs: 180000, // 3 minutes per node
    },
  };
}
