// src/modules/auto-agent/workflow-visualizer.ts
/**
 * Workflow Visualizer - Export WorkflowGraph to Mermaid diagrams (Sprint 8)
 *
 * Features:
 * - Deterministic output (sorted nodes/edges by id)
 * - Status icons when nodeStates provided
 * - Decision edges with condition labels
 * - Distinct shapes for different node kinds
 * - Gate and phase badges
 */

import {
  WorkflowGraph,
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeState,
  EdgeCondition,
  getEffectiveGateRequired,
} from './task-graph.js';

// ═══════════════════════════════════════════════════════════════
//                         TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Options for Mermaid export
 */
export interface MermaidExportOptions {
  /** Include status icons when nodeStates provided (default: true if states given) */
  includeStatus?: boolean;
  /** Node execution states for status display */
  nodeStates?: Record<string, WorkflowNodeState>;
  /** Diagram title */
  title?: string;
  /** Flow direction: TD (top-down) or LR (left-right) */
  direction?: 'TD' | 'LR';
  /** Show gate requirement badges (default: true) */
  showGateBadges?: boolean;
  /** Show phase badges (default: true) */
  showPhaseBadges?: boolean;
}

// ═══════════════════════════════════════════════════════════════
//                      STATUS ICONS
// ═══════════════════════════════════════════════════════════════

const STATUS_ICONS: Record<WorkflowNodeState, string> = {
  done: '✅',
  running: '▶',
  blocked: '⛔',
  failed: '❌',
  skipped: '⏭',
  pending: '⏳',
};

// ═══════════════════════════════════════════════════════════════
//                      MERMAID EXPORT
// ═══════════════════════════════════════════════════════════════

/**
 * Export a WorkflowGraph to Mermaid diagram format
 */
export function exportWorkflowMermaid(
  graph: WorkflowGraph,
  opts: MermaidExportOptions = {}
): string {
  const {
    includeStatus = opts.nodeStates !== undefined,
    nodeStates = {},
    title,
    direction = 'TD',
    showGateBadges = true,
    showPhaseBadges = true,
  } = opts;

  const lines: string[] = [];

  // Header
  if (title) {
    lines.push(`---`);
    lines.push(`title: ${escapeTitle(title)}`);
    lines.push(`---`);
  }
  lines.push(`flowchart ${direction}`);

  // Sort nodes by id for deterministic output
  const sortedNodes = [...graph.nodes].sort((a, b) => a.id.localeCompare(b.id));

  // Node definitions
  for (const node of sortedNodes) {
    const nodeDef = buildNodeDefinition(node, graph, {
      includeStatus,
      nodeStates,
      showGateBadges,
      showPhaseBadges,
    });
    lines.push(`    ${nodeDef}`);
  }

  // Sort edges for deterministic output
  const sortedEdges = [...graph.edges].sort((a, b) => {
    const fromCompare = a.from.localeCompare(b.from);
    if (fromCompare !== 0) return fromCompare;
    return a.to.localeCompare(b.to);
  });

  // Edge definitions
  for (const edge of sortedEdges) {
    const edgeDef = buildEdgeDefinition(edge);
    lines.push(`    ${edgeDef}`);
  }

  // Style classes for different states
  if (includeStatus && Object.keys(nodeStates).length > 0) {
    lines.push('');
    lines.push('    %% Status styling');

    // Group nodes by state for styling
    const stateGroups: Record<string, string[]> = {};
    for (const [nodeId, state] of Object.entries(nodeStates)) {
      if (!stateGroups[state]) stateGroups[state] = [];
      stateGroups[state].push(nodeId);
    }

    // Add class definitions
    if (stateGroups['done']?.length) {
      lines.push(`    classDef doneStyle fill:#90EE90,stroke:#228B22`);
      lines.push(`    class ${stateGroups['done'].join(',')} doneStyle`);
    }
    if (stateGroups['running']?.length) {
      lines.push(`    classDef runningStyle fill:#87CEEB,stroke:#4169E1`);
      lines.push(`    class ${stateGroups['running'].join(',')} runningStyle`);
    }
    if (stateGroups['blocked']?.length) {
      lines.push(`    classDef blockedStyle fill:#FFB6C1,stroke:#DC143C`);
      lines.push(`    class ${stateGroups['blocked'].join(',')} blockedStyle`);
    }
    if (stateGroups['failed']?.length) {
      lines.push(`    classDef failedStyle fill:#FF6B6B,stroke:#8B0000`);
      lines.push(`    class ${stateGroups['failed'].join(',')} failedStyle`);
    }
    if (stateGroups['skipped']?.length) {
      lines.push(`    classDef skippedStyle fill:#D3D3D3,stroke:#808080`);
      lines.push(`    class ${stateGroups['skipped'].join(',')} skippedStyle`);
    }
  }

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════
//                      HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Build Mermaid node definition with appropriate shape
 */
function buildNodeDefinition(
  node: WorkflowNode,
  graph: WorkflowGraph,
  opts: {
    includeStatus: boolean;
    nodeStates: Record<string, WorkflowNodeState>;
    showGateBadges: boolean;
    showPhaseBadges: boolean;
  }
): string {
  const { includeStatus, nodeStates, showGateBadges, showPhaseBadges } = opts;

  // Build label parts
  const labelParts: string[] = [];

  // Status icon
  if (includeStatus && nodeStates[node.id]) {
    labelParts.push(STATUS_ICONS[nodeStates[node.id]]);
  }

  // Node label or id
  labelParts.push(node.label || node.id);

  // Badges
  const badges: string[] = [];

  if (showPhaseBadges && node.phase) {
    badges.push(`[${node.phase}]`);
  }

  if (showGateBadges) {
    const gateRequired = getEffectiveGateRequired(node, graph.defaults);
    if (gateRequired) {
      badges.push('[🔒]');
    }
  }

  if (badges.length > 0) {
    labelParts.push(badges.join(' '));
  }

  const label = escapeMermaidLabel(labelParts.join(' '));
  const nodeId = sanitizeNodeId(node.id);

  // Shape based on node kind
  switch (node.kind) {
    case 'decision':
      // Diamond shape for decision nodes
      return `${nodeId}{${label}}`;
    case 'join':
      // Stadium shape for join nodes
      return `${nodeId}([${label}])`;
    case 'task':
    default:
      // Rectangle for task nodes
      return `${nodeId}[${label}]`;
  }
}

/**
 * Build Mermaid edge definition with optional condition label
 */
function buildEdgeDefinition(edge: WorkflowEdge): string {
  const fromId = sanitizeNodeId(edge.from);
  const toId = sanitizeNodeId(edge.to);

  if (edge.condition) {
    const conditionLabel = buildConditionLabel(edge.condition);
    return `${fromId} -->|${conditionLabel}| ${toId}`;
  }

  return `${fromId} --> ${toId}`;
}

/**
 * Build a human-readable condition label
 */
function buildConditionLabel(condition: EdgeCondition): string {
  const pathShort = condition.path.split('.').pop() || condition.path;

  switch (condition.type) {
    case 'equals':
      return `${pathShort}=${String(condition.value)}`;
    case 'exists':
      return `${pathShort}?`;
    case 'truthy':
      return `${pathShort}`;
    default:
      return 'condition';
  }
}

/**
 * Sanitize node ID for Mermaid (alphanumeric + underscore)
 */
function sanitizeNodeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Escape special characters in Mermaid labels
 */
function escapeMermaidLabel(label: string): string {
  // Escape quotes and special Mermaid characters
  return label
    .replace(/"/g, "'")
    .replace(/[<>]/g, '')
    .replace(/\|/g, '/')
    .replace(/\[/g, '(')
    .replace(/\]/g, ')');
}

/**
 * Escape title for YAML frontmatter
 */
function escapeTitle(title: string): string {
  // Wrap in quotes if contains special characters
  if (/[:#\[\]{}]/.test(title)) {
    return `"${title.replace(/"/g, '\\"')}"`;
  }
  return title;
}

// ═══════════════════════════════════════════════════════════════
//                      ADDITIONAL EXPORTS
// ═══════════════════════════════════════════════════════════════

/**
 * Get status icon for a node state
 */
export function getStatusIcon(state: WorkflowNodeState): string {
  return STATUS_ICONS[state] || '❓';
}

/**
 * Validate that a Mermaid diagram string is well-formed (basic check)
 */
export function isValidMermaidSyntax(mermaid: string): boolean {
  // Basic validation - check for flowchart declaration
  return mermaid.includes('flowchart') && mermaid.includes('-->');
}
