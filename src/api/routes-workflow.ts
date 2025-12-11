// src/api/routes-workflow.ts

/**
 * Workflow/Tasks API Routes
 *
 * Extracted from routes.ts for better modularity.
 */

import { Express, Request, Response } from 'express';
import type { CCGModulesForAPI } from './http-server.js';

type BroadcastFn = (event: string, data: unknown) => void;

export function setupWorkflowRoutes(
  app: Express,
  modules: CCGModulesForAPI,
  broadcast: BroadcastFn
): void {
  // Get all tasks
  app.get('/api/tasks', async (req: Request, res: Response) => {
    try {
      const { status, priority } = req.query;
      const result = await modules.workflow.handleTool('workflow_task_list', {
        status: status ? (status as string).split(',') : undefined,
        priority: priority ? (priority as string).split(',') : undefined,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Get current task
  app.get('/api/tasks/current', async (_req: Request, res: Response) => {
    try {
      const result = await modules.workflow.handleTool('workflow_current', {});
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Create task
  app.post('/api/tasks', async (req: Request, res: Response) => {
    try {
      const { name, description, priority, tags, parentId } = req.body;
      const result = await modules.workflow.handleTool('workflow_task_create', {
        name,
        description,
        priority,
        tags,
        parentId,
      });
      broadcast('task:created', result);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Update task
  app.put('/api/tasks/:id', async (req: Request, res: Response) => {
    try {
      const { status, progress } = req.body;
      const result = await modules.workflow.handleTool('workflow_task_update', {
        taskId: req.params.id,
        status,
        progress,
      });
      broadcast('task:updated', result);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Start task
  app.post('/api/tasks/:id/start', async (req: Request, res: Response) => {
    try {
      const result = await modules.workflow.handleTool('workflow_task_start', {
        taskId: req.params.id,
      });
      broadcast('task:started', result);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Complete task
  app.post('/api/tasks/:id/complete', async (req: Request, res: Response) => {
    try {
      const result = await modules.workflow.handleTool('workflow_task_complete', {
        taskId: req.params.id,
      });
      broadcast('task:completed', result);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Delete task
  app.delete('/api/tasks/:id', async (req: Request, res: Response) => {
    try {
      const result = await modules.workflow.handleTool('workflow_task_delete', {
        taskId: req.params.id,
      });
      broadcast('task:deleted', { id: req.params.id });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Add note to task
  app.post('/api/tasks/:id/notes', async (req: Request, res: Response) => {
    try {
      const { content, type } = req.body;
      const result = await modules.workflow.handleTool('workflow_task_note', {
        taskId: req.params.id,
        content,
        type,
      });
      broadcast('task:note_added', result);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });
}
