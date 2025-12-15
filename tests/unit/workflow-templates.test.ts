// tests/unit/workflow-templates.test.ts
/**
 * Workflow Templates Tests (Sprint 8)
 *
 * Tests:
 * 1. Lists >= 5 templates
 * 2. Each template graph is a DAG (no cycles)
 * 3. Each has entry node present
 * 4. At least 1 template contains decision branching
 * 5. At least 1 template contains join
 * 6. Phase defaults imply gates for impl/test/review nodes
 * 7. No internal/ paths in any node labels/payload
 */

import { describe, it, expect } from 'vitest';
import {
  listTemplates,
  getTemplate,
  hasTemplate,
  getTemplateNames,
} from '../../src/modules/auto-agent/templates/index.js';
import {
  WorkflowGraph,
  WorkflowNode,
  getEffectiveGateRequired,
} from '../../src/modules/auto-agent/task-graph.js';

// ═══════════════════════════════════════════════════════════════
//                      TEST HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if a graph is a valid DAG (no cycles)
 */
function isValidDAG(graph: WorkflowGraph): boolean {
  const nodeIds = new Set(graph.nodes.map(n => n.id));

  // Check entry exists
  if (!nodeIds.has(graph.entry)) {
    return false;
  }

  // Check all edge references exist
  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      return false;
    }
  }

  // Check for cycles using DFS
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const hasCycle = (nodeId: string): boolean => {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const outgoing = graph.edges.filter(e => e.from === nodeId);
    for (const edge of outgoing) {
      if (!visited.has(edge.to)) {
        if (hasCycle(edge.to)) return true;
      } else if (recursionStack.has(edge.to)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  };

  for (const node of graph.nodes) {
    if (!visited.has(node.id)) {
      if (hasCycle(node.id)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Scan for internal paths in a node
 */
function containsInternalPaths(node: WorkflowNode): boolean {
  const checkString = (str: string | undefined): boolean => {
    if (!str) return false;
    return str.includes('internal/') || str.includes('internal\\');
  };

  const checkObject = (obj: unknown): boolean => {
    if (!obj) return false;
    if (typeof obj === 'string') return checkString(obj);
    if (Array.isArray(obj)) return obj.some(checkObject);
    if (typeof obj === 'object') {
      return Object.values(obj as Record<string, unknown>).some(checkObject);
    }
    return false;
  };

  if (checkString(node.label)) return true;
  if (checkString(node.id)) return true;
  if (checkObject(node.payload)) return true;

  return false;
}

// ═══════════════════════════════════════════════════════════════
//                      TESTS
// ═══════════════════════════════════════════════════════════════

describe('Workflow Templates', () => {
  describe('Template Count', () => {
    it('should list at least 5 templates', () => {
      const templates = listTemplates();
      expect(templates.length).toBeGreaterThanOrEqual(5);
    });

    it('should include all expected templates', () => {
      const names = getTemplateNames();

      expect(names).toContain('feature-dev');
      expect(names).toContain('bug-fix');
      expect(names).toContain('code-review');
      expect(names).toContain('refactor-module');
      expect(names).toContain('release-smoke');
    });
  });

  describe('Template Validity', () => {
    it('each template should have a name and description', () => {
      const templates = listTemplates();

      for (const template of templates) {
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.nodeCount).toBeGreaterThan(0);
      }
    });

    it('hasTemplate should work correctly', () => {
      expect(hasTemplate('feature-dev')).toBe(true);
      expect(hasTemplate('nonexistent')).toBe(false);
    });
  });

  describe('DAG Validation', () => {
    it('each template graph should be a valid DAG', () => {
      const names = getTemplateNames();

      for (const name of names) {
        const graph = getTemplate(name);
        expect(graph).not.toBeNull();
        expect(isValidDAG(graph!)).toBe(true);
      }
    });
  });

  describe('Entry Node', () => {
    it('each template should have entry node present in nodes list', () => {
      const names = getTemplateNames();

      for (const name of names) {
        const graph = getTemplate(name)!;
        const nodeIds = graph.nodes.map(n => n.id);
        expect(nodeIds).toContain(graph.entry);
      }
    });
  });

  describe('Decision Branching', () => {
    it('at least one template should contain decision branching', () => {
      const templates = listTemplates();
      const hasDecision = templates.some(t => t.hasDecision);

      expect(hasDecision).toBe(true);
    });

    it('bug-fix template should have decision branching', () => {
      const graph = getTemplate('bug-fix')!;
      const decisionNodes = graph.nodes.filter(n => n.kind === 'decision');

      expect(decisionNodes.length).toBeGreaterThan(0);
    });

    it('release-smoke template should have decision branching', () => {
      const graph = getTemplate('release-smoke')!;
      const decisionNodes = graph.nodes.filter(n => n.kind === 'decision');

      expect(decisionNodes.length).toBeGreaterThan(0);
    });
  });

  describe('Join Nodes', () => {
    it('at least one template should contain join nodes', () => {
      const templates = listTemplates();
      const hasJoin = templates.some(t => t.hasJoin);

      expect(hasJoin).toBe(true);
    });

    it('feature-dev template should have join node for parallel impl', () => {
      const graph = getTemplate('feature-dev')!;
      const joinNodes = graph.nodes.filter(n => n.kind === 'join');

      expect(joinNodes.length).toBeGreaterThan(0);
    });

    it('code-review template should have join node for parallel reviews', () => {
      const graph = getTemplate('code-review')!;
      const joinNodes = graph.nodes.filter(n => n.kind === 'join');

      expect(joinNodes.length).toBeGreaterThan(0);
    });
  });

  describe('Gate Requirements', () => {
    it('impl phase nodes should require gates by default', () => {
      const names = getTemplateNames();

      for (const name of names) {
        const graph = getTemplate(name)!;
        const implNodes = graph.nodes.filter(n => n.phase === 'impl' && n.kind === 'task');

        for (const node of implNodes) {
          // Either explicit gateRequired: true OR no explicit gateRequired (defaults to true for impl)
          if (node.gateRequired === false) {
            // If explicitly false, that's fine (intentional opt-out)
            continue;
          }
          const effective = getEffectiveGateRequired(node, graph.defaults);
          expect(effective).toBe(true);
        }
      }
    });

    it('test phase nodes should require gates by default', () => {
      const names = getTemplateNames();

      for (const name of names) {
        const graph = getTemplate(name)!;
        const testNodes = graph.nodes.filter(n => n.phase === 'test' && n.kind === 'task');

        for (const node of testNodes) {
          if (node.gateRequired === false) continue;
          const effective = getEffectiveGateRequired(node, graph.defaults);
          expect(effective).toBe(true);
        }
      }
    });

    it('review phase nodes should require gates by default', () => {
      const names = getTemplateNames();

      for (const name of names) {
        const graph = getTemplate(name)!;
        const reviewNodes = graph.nodes.filter(n => n.phase === 'review' && n.kind === 'task');

        for (const node of reviewNodes) {
          if (node.gateRequired === false) continue;
          const effective = getEffectiveGateRequired(node, graph.defaults);
          expect(effective).toBe(true);
        }
      }
    });

    it('analysis phase nodes should not require gates by default', () => {
      const names = getTemplateNames();

      for (const name of names) {
        const graph = getTemplate(name)!;
        const analysisNodes = graph.nodes.filter(
          n => n.phase === 'analysis' && n.kind === 'task' && n.gateRequired === undefined
        );

        for (const node of analysisNodes) {
          const effective = getEffectiveGateRequired(node, graph.defaults);
          expect(effective).toBe(false);
        }
      }
    });
  });

  describe('No Internal Paths', () => {
    it('no template should contain internal/ paths in node labels or payload', () => {
      const names = getTemplateNames();

      for (const name of names) {
        const graph = getTemplate(name)!;

        for (const node of graph.nodes) {
          expect(containsInternalPaths(node)).toBe(false);
        }
      }
    });
  });

  describe('Template Input', () => {
    it('should support custom taskIdPrefix', () => {
      const graph = getTemplate('feature-dev', { taskIdPrefix: 'custom' })!;
      const nodeIds = graph.nodes.map(n => n.id);

      expect(nodeIds.some(id => id.startsWith('custom-'))).toBe(true);
    });

    it('should support custom targetPaths', () => {
      const paths = ['/src/module.ts', '/tests/module.test.ts'];
      const graph = getTemplate('feature-dev', { targetPaths: paths })!;

      const firstNode = graph.nodes.find(n => n.id.includes('analyze'));
      expect(firstNode?.payload?.targetPaths).toEqual(paths);
    });
  });

  describe('Template Structure', () => {
    it('feature-dev should have correct structure', () => {
      const graph = getTemplate('feature-dev')!;

      expect(graph.version).toBe('1.0');
      expect(graph.nodes.length).toBeGreaterThan(5);
      expect(graph.edges.length).toBeGreaterThan(4);

      // Should have all phases
      const phases = new Set(graph.nodes.map(n => n.phase));
      expect(phases.has('analysis')).toBe(true);
      expect(phases.has('plan')).toBe(true);
      expect(phases.has('impl')).toBe(true);
      expect(phases.has('test')).toBe(true);
      expect(phases.has('review')).toBe(true);
    });

    it('bug-fix should have conditional edges', () => {
      const graph = getTemplate('bug-fix')!;

      const conditionalEdges = graph.edges.filter(e => e.condition);
      expect(conditionalEdges.length).toBeGreaterThan(0);
    });

    it('code-review should have parallel review tracks', () => {
      const graph = getTemplate('code-review')!;

      // Should have security, architecture, and quality review nodes
      const nodeLabels = graph.nodes.map(n => n.label || n.id);
      expect(nodeLabels.some(l => l.toLowerCase().includes('security'))).toBe(true);
      expect(nodeLabels.some(l => l.toLowerCase().includes('architecture'))).toBe(true);
      expect(nodeLabels.some(l => l.toLowerCase().includes('quality'))).toBe(true);
    });
  });
});
