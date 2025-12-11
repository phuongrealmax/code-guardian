// src/api/routes-memory.ts

/**
 * Memory API Routes
 *
 * Extracted from routes.ts for better modularity.
 */

import { Express, Request, Response } from 'express';
import type { CCGModulesForAPI } from './http-server.js';

type BroadcastFn = (event: string, data: unknown) => void;

export function setupMemoryRoutes(
  app: Express,
  modules: CCGModulesForAPI,
  broadcast: BroadcastFn
): void {
  // Get all memories
  app.get('/api/memory', async (_req: Request, res: Response) => {
    try {
      const memories = await modules.memory.handleTool('list', { limit: 100 });
      res.json({ success: true, data: memories });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Search memories
  app.get('/api/memory/search', async (req: Request, res: Response) => {
    try {
      const { query, type, tags, minImportance } = req.query;
      const result = await modules.memory.handleTool('recall', {
        query: query as string,
        type: type as string,
        tags: tags ? (tags as string).split(',') : undefined,
        minImportance: minImportance ? parseInt(minImportance as string) : undefined,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Create memory
  app.post('/api/memory', async (req: Request, res: Response) => {
    try {
      const { content, type, importance, tags } = req.body;
      const result = await modules.memory.handleTool('store', {
        content,
        type,
        importance,
        tags,
      });
      broadcast('memory:created', result);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Delete memory
  app.delete('/api/memory/:id', async (req: Request, res: Response) => {
    try {
      const result = await modules.memory.handleTool('forget', { id: req.params.id });
      broadcast('memory:deleted', { id: req.params.id });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Get memory summary
  app.get('/api/memory/summary', async (_req: Request, res: Response) => {
    try {
      const summary = await modules.memory.getSummary();
      res.json({ success: true, data: summary });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });
}
