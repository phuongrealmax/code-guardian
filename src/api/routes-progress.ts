// src/api/routes-progress.ts
/**
 * Progress API Routes (Sprint 9)
 *
 * HTTP endpoints for dashboard integration:
 * - GET /api/progress/status - Progress snapshot
 * - GET /api/progress/timeline - Timeline events
 * - GET /api/progress/blockers - Blocked nodes
 * - GET /api/progress/mermaid - Mermaid diagram
 */

import { Express, Request, Response } from 'express';
import { ProgressService } from '../core/progress.service.js';
import { StateManager } from '../core/state-manager.js';
import { exportWorkflowMermaid, MermaidExportOptions } from '../modules/auto-agent/workflow-visualizer.js';
import type { WorkflowGraph } from '../modules/auto-agent/task-graph.js';

export interface ProgressRoutesDeps {
  progressService: ProgressService;
  stateManager: StateManager;
  getActiveGraph?: () => WorkflowGraph | null;
}

export function setupProgressRoutes(
  app: Express,
  deps: ProgressRoutesDeps,
  broadcast: (event: string, data: unknown) => void
): void {
  const { progressService, stateManager, getActiveGraph } = deps;

  // GET /api/progress/status - Get current progress snapshot
  app.get('/api/progress/status', async (_req: Request, res: Response) => {
    try {
      const snapshot = progressService.getSnapshot();
      const blockers = progressService.getBlockers();

      // Build next steps
      const nextSteps: string[] = [];
      if (snapshot.lastBlocked?.nextToolCalls?.length) {
        nextSteps.push(...snapshot.lastBlocked.nextToolCalls);
      }

      res.json({
        success: true,
        data: {
          ...snapshot,
          blockerCount: blockers.length,
          nextSteps: nextSteps.length > 0 ? [...new Set(nextSteps)] : undefined,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // GET /api/progress/timeline - Get session timeline (filtered for progress events)
  app.get('/api/progress/timeline', async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 300);
      const timeline = stateManager.getTimeline();

      // Filter for workflow-related events
      const progressTypes = [
        'task_started',
        'task_completed',
        'workflow:gate_passed',
        'workflow:gate_pending',
        'workflow:gate_blocked',
        'checkpoint_created',
        'checkpoint_restored',
        'governor_warning',
      ];

      const filtered = timeline
        .filter((e) => progressTypes.includes(e.type))
        .slice(-limit);

      res.json({
        success: true,
        data: {
          total: timeline.length,
          filtered: filtered.length,
          events: filtered,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // GET /api/progress/blockers - Get blockers sorted by priority
  app.get('/api/progress/blockers', async (_req: Request, res: Response) => {
    try {
      const blockers = progressService.getBlockers();

      let summary: string;
      if (blockers.length === 0) {
        summary = 'No blocked nodes';
      } else if (blockers.length === 1) {
        summary = `1 blocker: ${blockers[0].nodeId}`;
      } else {
        summary = `${blockers.length} blockers. Highest priority: ${blockers[0].nodeId}`;
      }

      res.json({
        success: true,
        data: {
          count: blockers.length,
          summary,
          blockers,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // GET /api/progress/mermaid - Generate Mermaid diagram
  app.get('/api/progress/mermaid', async (req: Request, res: Response) => {
    try {
      const direction = (req.query.direction as 'TD' | 'LR') || 'TD';
      const showGateBadges = req.query.showGateBadges !== 'false';
      const showPhaseBadges = req.query.showPhaseBadges === 'true';

      const graph = getActiveGraph?.();
      if (!graph) {
        res.json({
          success: false,
          message: 'No active workflow graph available',
          mermaid: null,
        });
        return;
      }

      const snapshot = progressService.getSnapshot();

      const options: MermaidExportOptions = {
        nodeStates: snapshot.nodeStates,
        direction,
        showGateBadges,
        showPhaseBadges,
        title: snapshot.workflowId ? `Workflow: ${snapshot.workflowId}` : undefined,
      };

      const mermaid = exportWorkflowMermaid(graph, options);

      res.json({
        success: true,
        data: {
          mermaid,
          workflowId: snapshot.workflowId,
          nodeCount: Object.keys(snapshot.nodeStates).length,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // POST /api/progress/clear - Clear progress state
  app.post('/api/progress/clear', async (_req: Request, res: Response) => {
    try {
      progressService.clear();
      broadcast('progress:updated', { cleared: true, timestamp: new Date().toISOString() });

      res.json({
        success: true,
        message: 'Progress state cleared',
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });
}
