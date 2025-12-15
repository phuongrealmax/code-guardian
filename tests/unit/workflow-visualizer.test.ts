// tests/unit/workflow-visualizer.test.ts
/**
 * Workflow Visualizer Tests (Sprint 8)
 *
 * Tests:
 * 1. Deterministic output (same graph => same mermaid)
 * 2. Direction TD/LR
 * 3. Status icons show when nodeStates provided
 * 4. Decision edge label includes condition summary
 * 5. Join node shape distinct
 * 6. Output contains no payload dumps
 */

import { describe, it, expect } from 'vitest';
import {
  exportWorkflowMermaid,
  getStatusIcon,
  isValidMermaidSyntax,
} from '../../src/modules/auto-agent/workflow-visualizer.js';
import {
  WorkflowGraph,
  WorkflowNode,
  WorkflowNodeState,
} from '../../src/modules/auto-agent/task-graph.js';

// ═══════════════════════════════════════════════════════════════
//                      TEST HELPERS
// ═══════════════════════════════════════════════════════════════

function createSimpleGraph(): WorkflowGraph {
  return {
    version: '1.0',
    entry: 'A',
    nodes: [
      { id: 'A', kind: 'task', label: 'Task A', phase: 'analysis' },
      { id: 'B', kind: 'task', label: 'Task B', phase: 'impl' },
      { id: 'C', kind: 'task', label: 'Task C', phase: 'test' },
    ],
    edges: [
      { from: 'A', to: 'B' },
      { from: 'B', to: 'C' },
    ],
  };
}

function createDecisionGraph(): WorkflowGraph {
  return {
    version: '1.0',
    entry: 'start',
    nodes: [
      { id: 'start', kind: 'task', label: 'Start' },
      { id: 'decision', kind: 'decision', label: 'Check Status' },
      { id: 'yes', kind: 'task', label: 'Yes Path' },
      { id: 'no', kind: 'task', label: 'No Path' },
      { id: 'end', kind: 'join', label: 'End' },
    ],
    edges: [
      { from: 'start', to: 'decision' },
      { from: 'decision', to: 'yes', condition: { type: 'equals', path: 'status', value: 'ok' } },
      { from: 'decision', to: 'no', condition: { type: 'truthy', path: 'failed' } },
      { from: 'yes', to: 'end' },
      { from: 'no', to: 'end' },
    ],
  };
}

function createGatedGraph(): WorkflowGraph {
  return {
    version: '1.0',
    entry: 'A',
    nodes: [
      { id: 'A', kind: 'task', label: 'Analysis', phase: 'analysis' },
      { id: 'B', kind: 'task', label: 'Implementation', phase: 'impl', gateRequired: true },
      { id: 'C', kind: 'task', label: 'Testing', phase: 'test' },
    ],
    edges: [
      { from: 'A', to: 'B' },
      { from: 'B', to: 'C' },
    ],
  };
}

// ═══════════════════════════════════════════════════════════════
//                      TESTS
// ═══════════════════════════════════════════════════════════════

describe('Workflow Visualizer', () => {
  describe('Deterministic Output', () => {
    it('should produce identical output for same graph', () => {
      const graph = createSimpleGraph();

      const output1 = exportWorkflowMermaid(graph);
      const output2 = exportWorkflowMermaid(graph);

      expect(output1).toBe(output2);
    });

    it('should produce deterministic output regardless of node order in input', () => {
      const graph1: WorkflowGraph = {
        version: '1.0',
        entry: 'A',
        nodes: [
          { id: 'A', kind: 'task', label: 'A' },
          { id: 'B', kind: 'task', label: 'B' },
          { id: 'C', kind: 'task', label: 'C' },
        ],
        edges: [
          { from: 'A', to: 'B' },
          { from: 'B', to: 'C' },
        ],
      };

      const graph2: WorkflowGraph = {
        version: '1.0',
        entry: 'A',
        nodes: [
          { id: 'C', kind: 'task', label: 'C' },
          { id: 'A', kind: 'task', label: 'A' },
          { id: 'B', kind: 'task', label: 'B' },
        ],
        edges: [
          { from: 'B', to: 'C' },
          { from: 'A', to: 'B' },
        ],
      };

      const output1 = exportWorkflowMermaid(graph1);
      const output2 = exportWorkflowMermaid(graph2);

      // Outputs should be identical despite different input order
      expect(output1).toBe(output2);
    });
  });

  describe('Direction', () => {
    it('should default to TD (top-down) direction', () => {
      const graph = createSimpleGraph();
      const output = exportWorkflowMermaid(graph);

      expect(output).toContain('flowchart TD');
    });

    it('should support LR (left-right) direction', () => {
      const graph = createSimpleGraph();
      const output = exportWorkflowMermaid(graph, { direction: 'LR' });

      expect(output).toContain('flowchart LR');
    });
  });

  describe('Status Icons', () => {
    it('should show status icons when nodeStates provided', () => {
      const graph = createSimpleGraph();
      const nodeStates: Record<string, WorkflowNodeState> = {
        'A': 'done',
        'B': 'running',
        'C': 'pending',
      };

      const output = exportWorkflowMermaid(graph, { nodeStates });

      expect(output).toContain('✅'); // done
      expect(output).toContain('▶'); // running
      expect(output).toContain('⏳'); // pending
    });

    it('should not show status icons when nodeStates not provided', () => {
      const graph = createSimpleGraph();
      const output = exportWorkflowMermaid(graph);

      expect(output).not.toContain('✅');
      expect(output).not.toContain('▶');
      expect(output).not.toContain('⏳');
    });

    it('should show all status icons correctly', () => {
      expect(getStatusIcon('done')).toBe('✅');
      expect(getStatusIcon('running')).toBe('▶');
      expect(getStatusIcon('blocked')).toBe('⛔');
      expect(getStatusIcon('failed')).toBe('❌');
      expect(getStatusIcon('skipped')).toBe('⏭');
      expect(getStatusIcon('pending')).toBe('⏳');
    });

    it('should add CSS classes for status styling', () => {
      const graph = createSimpleGraph();
      const nodeStates: Record<string, WorkflowNodeState> = {
        'A': 'done',
        'B': 'blocked',
      };

      const output = exportWorkflowMermaid(graph, { nodeStates });

      expect(output).toContain('classDef doneStyle');
      expect(output).toContain('classDef blockedStyle');
    });
  });

  describe('Decision Edge Labels', () => {
    it('should include condition summary in edge labels', () => {
      const graph = createDecisionGraph();
      const output = exportWorkflowMermaid(graph);

      // Check for condition labels
      expect(output).toContain('status=ok'); // equals condition
      expect(output).toContain('failed'); // truthy condition
    });

    it('should handle exists condition', () => {
      const graph: WorkflowGraph = {
        version: '1.0',
        entry: 'A',
        nodes: [
          { id: 'A', kind: 'decision', label: 'Check' },
          { id: 'B', kind: 'task', label: 'B' },
        ],
        edges: [
          { from: 'A', to: 'B', condition: { type: 'exists', path: 'data.result' } },
        ],
      };

      const output = exportWorkflowMermaid(graph);
      expect(output).toContain('result?'); // exists shows path with ?
    });
  });

  describe('Node Shapes', () => {
    it('should use diamond shape for decision nodes', () => {
      const graph = createDecisionGraph();
      const output = exportWorkflowMermaid(graph);

      // Decision nodes use {} for diamond shape
      expect(output).toMatch(/decision\{.*\}/);
    });

    it('should use stadium shape for join nodes', () => {
      const graph = createDecisionGraph();
      const output = exportWorkflowMermaid(graph);

      // Join nodes use ([]) for stadium shape
      expect(output).toMatch(/end\(\[.*\]\)/);
    });

    it('should use rectangle shape for task nodes', () => {
      const graph = createSimpleGraph();
      const output = exportWorkflowMermaid(graph);

      // Task nodes use [] for rectangle shape
      expect(output).toMatch(/A\[.*\]/);
    });
  });

  describe('Badges', () => {
    it('should show gate badges when showGateBadges is true', () => {
      const graph = createGatedGraph();
      const output = exportWorkflowMermaid(graph, { showGateBadges: true });

      expect(output).toContain('🔒'); // Gate badge
    });

    it('should show phase badges when showPhaseBadges is true', () => {
      const graph = createSimpleGraph();
      const output = exportWorkflowMermaid(graph, { showPhaseBadges: true });

      expect(output).toContain('(analysis)');
      expect(output).toContain('(impl)');
      expect(output).toContain('(test)');
    });

    it('should hide badges when disabled', () => {
      const graph = createGatedGraph();
      const output = exportWorkflowMermaid(graph, {
        showGateBadges: false,
        showPhaseBadges: false,
      });

      expect(output).not.toContain('🔒');
      expect(output).not.toContain('(analysis)');
    });
  });

  describe('Title', () => {
    it('should include title in YAML frontmatter when provided', () => {
      const graph = createSimpleGraph();
      const output = exportWorkflowMermaid(graph, { title: 'My Workflow' });

      expect(output).toContain('---');
      expect(output).toContain('title: My Workflow');
    });

    it('should not include frontmatter when no title', () => {
      const graph = createSimpleGraph();
      const output = exportWorkflowMermaid(graph);

      expect(output).not.toContain('---');
      expect(output).not.toContain('title:');
    });
  });

  describe('No Payload Dumps', () => {
    it('should not include large payload contents', () => {
      const graph: WorkflowGraph = {
        version: '1.0',
        entry: 'A',
        nodes: [
          {
            id: 'A',
            kind: 'task',
            label: 'Task',
            payload: {
              description: 'This is a very long description that should not appear in the diagram',
              targetPaths: ['/path/to/file1', '/path/to/file2', '/path/to/file3'],
              secretKey: 'should-not-appear',
            },
          },
        ],
        edges: [],
      };

      const output = exportWorkflowMermaid(graph);

      expect(output).not.toContain('very long description');
      expect(output).not.toContain('/path/to/file');
      expect(output).not.toContain('secretKey');
      expect(output).not.toContain('should-not-appear');
    });
  });

  describe('Valid Mermaid Syntax', () => {
    it('should produce valid mermaid syntax', () => {
      const graph = createDecisionGraph();
      const output = exportWorkflowMermaid(graph);

      expect(isValidMermaidSyntax(output)).toBe(true);
    });

    it('should include flowchart and edges', () => {
      const graph = createSimpleGraph();
      const output = exportWorkflowMermaid(graph);

      expect(output).toContain('flowchart');
      expect(output).toContain('-->');
    });
  });
});
