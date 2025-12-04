// src/api/http-server.ts
// HTTP API Server for CCG Dashboard Integration
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
// WebSocket clients
const wsClients = new Set();
// Broadcast to all WebSocket clients
function broadcast(event, data) {
    const message = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
    wsClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}
// Create HTTP API Server
export function createAPIServer(modules, stateManager, eventBus, logger, config = { port: 3334, corsOrigins: ['http://localhost:3333'] }) {
    const app = express();
    // Middleware
    app.use(cors({
        origin: config.corsOrigins,
        credentials: true,
    }));
    app.use(express.json());
    // Request logging
    app.use((req, _res, next) => {
        logger.debug(`API ${req.method} ${req.path}`);
        next();
    });
    // ═══════════════════════════════════════════════════════════════
    //                      STATUS ENDPOINT
    // ═══════════════════════════════════════════════════════════════
    app.get('/api/status', async (_req, res) => {
        try {
            const session = stateManager.getSession();
            const memoryStatus = modules.memory.getStatus();
            const guardStatus = modules.guard.getStatus();
            const workflowStatus = modules.workflow.getStatus();
            res.json({
                success: true,
                data: {
                    session: session ? {
                        id: session.id,
                        status: session.status,
                        startedAt: session.startedAt.toISOString(),
                        active: true,
                    } : { active: false },
                    modules: {
                        memory: memoryStatus,
                        guard: guardStatus,
                        workflow: workflowStatus,
                    },
                },
            });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // ═══════════════════════════════════════════════════════════════
    //                      MEMORY ENDPOINTS
    // ═══════════════════════════════════════════════════════════════
    // Get all memories
    app.get('/api/memory', async (_req, res) => {
        try {
            const memories = await modules.memory.handleTool('list', { limit: 100 });
            res.json({ success: true, data: memories });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Search memories
    app.get('/api/memory/search', async (req, res) => {
        try {
            const { query, type, tags, minImportance } = req.query;
            const result = await modules.memory.handleTool('recall', {
                query: query,
                type: type,
                tags: tags ? tags.split(',') : undefined,
                minImportance: minImportance ? parseInt(minImportance) : undefined,
            });
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Create memory
    app.post('/api/memory', async (req, res) => {
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
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Delete memory
    app.delete('/api/memory/:id', async (req, res) => {
        try {
            const result = await modules.memory.handleTool('forget', { id: req.params.id });
            broadcast('memory:deleted', { id: req.params.id });
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Get memory summary
    app.get('/api/memory/summary', async (_req, res) => {
        try {
            const summary = await modules.memory.getSummary();
            res.json({ success: true, data: summary });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // ═══════════════════════════════════════════════════════════════
    //                      WORKFLOW ENDPOINTS
    // ═══════════════════════════════════════════════════════════════
    // Get all tasks
    app.get('/api/tasks', async (req, res) => {
        try {
            const { status, priority } = req.query;
            const result = await modules.workflow.handleTool('workflow_task_list', {
                status: status ? status.split(',') : undefined,
                priority: priority ? priority.split(',') : undefined,
            });
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Get current task
    app.get('/api/tasks/current', async (_req, res) => {
        try {
            const result = await modules.workflow.handleTool('workflow_current', {});
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Create task
    app.post('/api/tasks', async (req, res) => {
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
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Update task
    app.put('/api/tasks/:id', async (req, res) => {
        try {
            const { status, progress } = req.body;
            const result = await modules.workflow.handleTool('workflow_task_update', {
                taskId: req.params.id,
                status,
                progress,
            });
            broadcast('task:updated', result);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Start task
    app.post('/api/tasks/:id/start', async (req, res) => {
        try {
            const result = await modules.workflow.handleTool('workflow_task_start', {
                taskId: req.params.id,
            });
            broadcast('task:started', result);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Complete task
    app.post('/api/tasks/:id/complete', async (req, res) => {
        try {
            const result = await modules.workflow.handleTool('workflow_task_complete', {
                taskId: req.params.id,
            });
            broadcast('task:completed', result);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Delete task
    app.delete('/api/tasks/:id', async (req, res) => {
        try {
            const result = await modules.workflow.handleTool('workflow_task_delete', {
                taskId: req.params.id,
            });
            broadcast('task:deleted', { id: req.params.id });
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Add note to task
    app.post('/api/tasks/:id/notes', async (req, res) => {
        try {
            const { content, type } = req.body;
            const result = await modules.workflow.handleTool('workflow_task_note', {
                taskId: req.params.id,
                content,
                type,
            });
            broadcast('task:note_added', result);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // ═══════════════════════════════════════════════════════════════
    //                      AGENTS ENDPOINTS
    // ═══════════════════════════════════════════════════════════════
    // Get all agents
    app.get('/api/agents', async (_req, res) => {
        try {
            const result = await modules.agents.handleTool('list', { enabledOnly: false });
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Get agent by ID
    app.get('/api/agents/:id', async (req, res) => {
        try {
            const result = await modules.agents.handleTool('get', { agentId: req.params.id });
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Select agent for task
    app.post('/api/agents/select', async (req, res) => {
        try {
            const { task, files, domain, keywords } = req.body;
            const result = await modules.agents.handleTool('select', {
                task,
                files,
                domain,
                keywords,
            });
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Coordinate agents
    app.post('/api/agents/coordinate', async (req, res) => {
        try {
            const { task, agentIds, mode } = req.body;
            const result = await modules.agents.handleTool('coordinate', {
                task,
                agentIds,
                mode,
            });
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // ═══════════════════════════════════════════════════════════════
    //                      GUARD ENDPOINTS
    // ═══════════════════════════════════════════════════════════════
    // Get guard status
    app.get('/api/guard/status', async (_req, res) => {
        try {
            const result = await modules.guard.handleTool('status', {});
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Get guard rules
    app.get('/api/guard/rules', async (_req, res) => {
        try {
            const result = await modules.guard.handleTool('rules', {});
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Validate code
    app.post('/api/guard/validate', async (req, res) => {
        try {
            const { code, filename, strict } = req.body;
            const result = await modules.guard.handleTool('validate', {
                code,
                filename,
                strict,
            });
            broadcast('guard:validated', result);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Toggle rule
    app.post('/api/guard/rules/:rule/toggle', async (req, res) => {
        try {
            const { enabled } = req.body;
            const result = await modules.guard.handleTool('toggle_rule', {
                rule: req.params.rule,
                enabled,
            });
            broadcast('guard:rule_toggled', result);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // ═══════════════════════════════════════════════════════════════
    //                      LATENT ENDPOINTS
    // ═══════════════════════════════════════════════════════════════
    // List latent contexts
    app.get('/api/latent', async (_req, res) => {
        try {
            const result = await modules.latent.handleTool('latent_list_contexts', {});
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Get latent context
    app.get('/api/latent/:taskId', async (req, res) => {
        try {
            const result = await modules.latent.handleTool('latent_context_get', {
                taskId: req.params.taskId,
                includeHistory: true,
            });
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Get latent status
    app.get('/api/latent/status', async (_req, res) => {
        try {
            const result = await modules.latent.handleTool('latent_status', {});
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // ═══════════════════════════════════════════════════════════════
    //                      DOCUMENTS ENDPOINTS
    // ═══════════════════════════════════════════════════════════════
    // List documents
    app.get('/api/documents', async (_req, res) => {
        try {
            const result = await modules.documents.handleTool('documents_list', {});
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Search documents
    app.get('/api/documents/search', async (req, res) => {
        try {
            const { query } = req.query;
            const result = await modules.documents.handleTool('documents_search', {
                query: query,
            });
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Find by type
    app.get('/api/documents/type/:type', async (req, res) => {
        try {
            const result = await modules.documents.handleTool('documents_find_by_type', {
                type: req.params.type,
            });
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Scan documents
    app.post('/api/documents/scan', async (_req, res) => {
        try {
            const result = await modules.documents.handleTool('documents_scan', {});
            broadcast('documents:scanned', result);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // ═══════════════════════════════════════════════════════════════
    //                      PROCESSES ENDPOINTS
    // ═══════════════════════════════════════════════════════════════
    // List processes
    app.get('/api/processes', async (_req, res) => {
        try {
            const result = await modules.process.handleTool('list', {});
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Check port
    app.get('/api/processes/port/:port', async (req, res) => {
        try {
            const result = await modules.process.handleTool('check_port', {
                port: parseInt(req.params.port),
            });
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Check all ports
    app.get('/api/processes/ports', async (_req, res) => {
        try {
            const result = await modules.process.handleTool('check_all_ports', {});
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Kill process on port
    app.post('/api/processes/port/:port/kill', async (req, res) => {
        try {
            const { force } = req.body;
            const result = await modules.process.handleTool('kill_on_port', {
                port: parseInt(req.params.port),
                force,
            });
            broadcast('process:killed', result);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Kill process by PID
    app.post('/api/processes/:pid/kill', async (req, res) => {
        try {
            const { force } = req.body;
            const result = await modules.process.handleTool('kill', {
                pid: parseInt(req.params.pid),
                force,
            });
            broadcast('process:killed', result);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Get process status
    app.get('/api/processes/status', async (_req, res) => {
        try {
            const result = await modules.process.handleTool('status', {});
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // ═══════════════════════════════════════════════════════════════
    //                      ERROR HANDLER
    // ═══════════════════════════════════════════════════════════════
    app.use((err, _req, res, _next) => {
        logger.error('API Error:', err);
        res.status(500).json({
            success: false,
            error: err.message,
        });
    });
    // Create HTTP server
    const server = createServer(app);
    // Create WebSocket server
    const wss = new WebSocketServer({ server });
    wss.on('connection', (ws) => {
        logger.info('WebSocket client connected');
        wsClients.add(ws);
        ws.on('close', () => {
            logger.info('WebSocket client disconnected');
            wsClients.delete(ws);
        });
        ws.on('error', (error) => {
            logger.error('WebSocket error:', error);
            wsClients.delete(ws);
        });
        // Send initial status
        ws.send(JSON.stringify({
            event: 'connected',
            data: { message: 'Connected to CCG API' },
            timestamp: new Date().toISOString(),
        }));
    });
    // Subscribe to EventBus events and broadcast to WebSocket clients
    eventBus.on('memory:store', (data) => broadcast('memory:store', data));
    eventBus.on('memory:recall', (data) => broadcast('memory:recall', data));
    eventBus.on('memory:forget', (data) => broadcast('memory:forget', data));
    eventBus.on('task:create', (data) => broadcast('task:create', data));
    eventBus.on('task:start', (data) => broadcast('task:start', data));
    eventBus.on('task:complete', (data) => broadcast('task:complete', data));
    eventBus.on('task:fail', (data) => broadcast('task:fail', data));
    eventBus.on('guard:warning', (data) => broadcast('guard:warning', data));
    eventBus.on('guard:block', (data) => broadcast('guard:block', data));
    eventBus.on('guard:pass', (data) => broadcast('guard:pass', data));
    // Start function
    const start = () => {
        server.listen(config.port, () => {
            logger.info(`CCG API Server running on http://localhost:${config.port}`);
            logger.info(`WebSocket available on ws://localhost:${config.port}`);
        });
    };
    return { app, server, wss, start };
}
//# sourceMappingURL=http-server.js.map