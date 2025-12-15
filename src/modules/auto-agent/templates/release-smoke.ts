// src/modules/auto-agent/templates/release-smoke.ts
/**
 * Release Smoke Testing Workflow Template (Sprint 8)
 *
 * A workflow for performing release smoke tests with:
 * - Build verification
 * - Parallel test tracks (unit, integration, E2E)
 * - Performance check
 * - Release decision
 */

import { WorkflowGraph, WorkflowNode, WorkflowEdge } from '../task-graph.js';
import { WorkflowTemplateInfo, WorkflowTemplateInput } from './index.js';

export const RELEASE_SMOKE_TEMPLATE: WorkflowTemplateInfo = {
  name: 'release-smoke',
  description: 'Release smoke testing workflow with build verification and parallel test tracks',
  phases: ['analysis', 'test', 'review'],
  nodeCount: 9,
  hasDecision: true,
  hasJoin: true,
};

/**
 * Create a release smoke testing workflow graph
 */
export function createReleaseSmokeGraph(input?: WorkflowTemplateInput): WorkflowGraph {
  const prefix = input?.taskIdPrefix || 'release';
  const taskName = input?.taskName || 'Release Smoke Test';

  const nodes: WorkflowNode[] = [
    // Build verification
    {
      id: `${prefix}-build`,
      kind: 'task',
      label: 'Verify Build',
      phase: 'analysis',
      gateRequired: false,
      payload: {
        description: 'Ensure clean build passes',
        targetPaths: input?.targetPaths,
      },
    },
    // Decision: Build passed?
    {
      id: `${prefix}-build-check`,
      kind: 'decision',
      label: 'Build OK?',
      phase: 'analysis',
      payload: {
        passed: true, // Default assumes passed
      },
    },
    // Parallel test tracks
    {
      id: `${prefix}-unit-tests`,
      kind: 'task',
      label: 'Unit Tests',
      phase: 'test',
      // Gate required by phase default
      payload: {
        description: 'Run unit test suite',
      },
    },
    {
      id: `${prefix}-int-tests`,
      kind: 'task',
      label: 'Integration Tests',
      phase: 'test',
      // Gate required by phase default
      payload: {
        description: 'Run integration test suite',
      },
    },
    {
      id: `${prefix}-e2e-tests`,
      kind: 'task',
      label: 'E2E Tests',
      phase: 'test',
      // Gate required by phase default
      payload: {
        description: 'Run end-to-end test suite',
      },
    },
    // Join test tracks
    {
      id: `${prefix}-test-join`,
      kind: 'join',
      label: 'Tests Complete',
      phase: 'test',
    },
    // Performance check
    {
      id: `${prefix}-perf`,
      kind: 'task',
      label: 'Performance Check',
      phase: 'test',
      gateRequired: true, // Explicit gate for performance
      payload: {
        description: 'Verify no performance regressions',
      },
    },
    // Build failed path
    {
      id: `${prefix}-build-failed`,
      kind: 'task',
      label: 'Build Failed',
      phase: 'analysis',
      gateRequired: false,
      payload: {
        description: 'Build failed - investigate and fix',
      },
    },
    // Release decision
    {
      id: `${prefix}-verdict`,
      kind: 'task',
      label: 'Release Decision',
      phase: 'review',
      // Gate required by phase default
      payload: {
        description: 'Make release go/no-go decision',
        taskName,
      },
    },
  ];

  const edges: WorkflowEdge[] = [
    { from: `${prefix}-build`, to: `${prefix}-build-check` },
    // Build decision
    {
      from: `${prefix}-build-check`,
      to: `${prefix}-unit-tests`,
      condition: {
        type: 'equals',
        path: `results.${prefix}-build-check.passed`,
        value: true,
      },
    },
    {
      from: `${prefix}-build-check`,
      to: `${prefix}-int-tests`,
      condition: {
        type: 'equals',
        path: `results.${prefix}-build-check.passed`,
        value: true,
      },
    },
    {
      from: `${prefix}-build-check`,
      to: `${prefix}-e2e-tests`,
      condition: {
        type: 'equals',
        path: `results.${prefix}-build-check.passed`,
        value: true,
      },
    },
    {
      from: `${prefix}-build-check`,
      to: `${prefix}-build-failed`,
      condition: {
        type: 'equals',
        path: `results.${prefix}-build-check.passed`,
        value: false,
      },
    },
    // Test tracks converge
    { from: `${prefix}-unit-tests`, to: `${prefix}-test-join` },
    { from: `${prefix}-int-tests`, to: `${prefix}-test-join` },
    { from: `${prefix}-e2e-tests`, to: `${prefix}-test-join` },
    // Performance and verdict
    { from: `${prefix}-test-join`, to: `${prefix}-perf` },
    { from: `${prefix}-perf`, to: `${prefix}-verdict` },
  ];

  return {
    version: '1.0',
    entry: `${prefix}-build`,
    nodes,
    edges,
    defaults: {
      timeoutMs: 600000, // 10 minutes per node (tests may take longer)
    },
  };
}
