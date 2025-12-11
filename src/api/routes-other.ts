// src/api/routes-other.ts

/**
 * Other API Routes (Agents, Guard, Latent, Documents, Process)
 *
 * Extracted from routes.ts for better modularity.
 */

import { Express, Request, Response } from 'express';
import type { CCGModulesForAPI } from './http-server.js';

type BroadcastFn = (event: string, data: unknown) => void;

// ═══════════════════════════════════════════════════════════════
//                      AGENTS ENDPOINTS
// ═══════════════════════════════════════════════════════════════

export function setupAgentsRoutes(app: Express, modules: CCGModulesForAPI): void {
  // Get all agents
  app.get('/api/agents', async (_req: Request, res: Response) => {
    try {
      const result = await modules.agents.handleTool('list', { enabledOnly: false });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Get agent by ID
  app.get('/api/agents/:id', async (req: Request, res: Response) => {
    try {
      const result = await modules.agents.handleTool('get', { agentId: req.params.id });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Select agent for task
  app.post('/api/agents/select', async (req: Request, res: Response) => {
    try {
      const { task, files, domain, keywords } = req.body;
      const result = await modules.agents.handleTool('select', {
        task,
        files,
        domain,
        keywords,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Coordinate agents
  app.post('/api/agents/coordinate', async (req: Request, res: Response) => {
    try {
      const { task, agentIds, mode } = req.body;
      const result = await modules.agents.handleTool('coordinate', {
        task,
        agentIds,
        mode,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });
}

// ═══════════════════════════════════════════════════════════════
//                      GUARD ENDPOINTS
// ═══════════════════════════════════════════════════════════════

export function setupGuardRoutes(
  app: Express,
  modules: CCGModulesForAPI,
  broadcast: BroadcastFn
): void {
  // Get guard status
  app.get('/api/guard/status', async (_req: Request, res: Response) => {
    try {
      const result = await modules.guard.handleTool('status', {});
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Get guard rules
  app.get('/api/guard/rules', async (_req: Request, res: Response) => {
    try {
      const result = await modules.guard.handleTool('rules', {});
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Validate code
  app.post('/api/guard/validate', async (req: Request, res: Response) => {
    try {
      const { code, filename, strict } = req.body;
      const result = await modules.guard.handleTool('validate', {
        code,
        filename,
        strict,
      });
      broadcast('guard:validated', result);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Toggle rule
  app.post('/api/guard/rules/:rule/toggle', async (req: Request, res: Response) => {
    try {
      const { enabled } = req.body;
      const result = await modules.guard.handleTool('toggle_rule', {
        rule: req.params.rule,
        enabled,
      });
      broadcast('guard:rule_toggled', result);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });
}

// ═══════════════════════════════════════════════════════════════
//                      LATENT ENDPOINTS
// ═══════════════════════════════════════════════════════════════

export function setupLatentRoutes(app: Express, modules: CCGModulesForAPI): void {
  // List latent contexts
  app.get('/api/latent', async (_req: Request, res: Response) => {
    try {
      const result = await modules.latent.handleTool('latent_list_contexts', {});
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Get latent context
  app.get('/api/latent/:taskId', async (req: Request, res: Response) => {
    try {
      const result = await modules.latent.handleTool('latent_context_get', {
        taskId: req.params.taskId,
        includeHistory: true,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Get latent status
  app.get('/api/latent/status', async (_req: Request, res: Response) => {
    try {
      const result = await modules.latent.handleTool('latent_status', {});
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });
}

// ═══════════════════════════════════════════════════════════════
//                      DOCUMENTS ENDPOINTS
// ═══════════════════════════════════════════════════════════════

export function setupDocumentsRoutes(
  app: Express,
  modules: CCGModulesForAPI,
  broadcast: BroadcastFn
): void {
  // List documents
  app.get('/api/documents', async (_req: Request, res: Response) => {
    try {
      const result = await modules.documents.handleTool('documents_list', {});
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Search documents
  app.get('/api/documents/search', async (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      const result = await modules.documents.handleTool('documents_search', {
        query: query as string,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Find by type
  app.get('/api/documents/type/:type', async (req: Request, res: Response) => {
    try {
      const result = await modules.documents.handleTool('documents_find_by_type', {
        type: req.params.type,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Scan documents
  app.post('/api/documents/scan', async (_req: Request, res: Response) => {
    try {
      const result = await modules.documents.handleTool('documents_scan', {});
      broadcast('documents:scanned', result);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });
}

// ═══════════════════════════════════════════════════════════════
//                      PROCESSES ENDPOINTS
// ═══════════════════════════════════════════════════════════════

export function setupProcessRoutes(
  app: Express,
  modules: CCGModulesForAPI,
  broadcast: BroadcastFn
): void {
  // List processes
  app.get('/api/processes', async (_req: Request, res: Response) => {
    try {
      const result = await modules.process.handleTool('list', {});
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Check port
  app.get('/api/processes/port/:port', async (req: Request, res: Response) => {
    try {
      const result = await modules.process.handleTool('check_port', {
        port: parseInt(req.params.port),
      });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Check all ports
  app.get('/api/processes/ports', async (_req: Request, res: Response) => {
    try {
      const result = await modules.process.handleTool('check_all_ports', {});
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Kill process on port
  app.post('/api/processes/port/:port/kill', async (req: Request, res: Response) => {
    try {
      const { force } = req.body;
      const result = await modules.process.handleTool('kill_on_port', {
        port: parseInt(req.params.port),
        force,
      });
      broadcast('process:killed', result);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Kill process by PID
  app.post('/api/processes/:pid/kill', async (req: Request, res: Response) => {
    try {
      const { force } = req.body;
      const result = await modules.process.handleTool('kill', {
        pid: parseInt(req.params.pid),
        force,
      });
      broadcast('process:killed', result);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Get process status
  app.get('/api/processes/status', async (_req: Request, res: Response) => {
    try {
      const result = await modules.process.handleTool('status', {});
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });
}
