import { Express } from 'express';
import { Server as HttpServer } from 'http';
import { WebSocketServer } from 'ws';
import { EventBus } from '../core/event-bus.js';
import { Logger } from '../core/logger.js';
import { MemoryModule } from '../modules/memory/index.js';
import { GuardModule } from '../modules/guard/index.js';
import { WorkflowModule } from '../modules/workflow/index.js';
import { ProcessModule } from '../modules/process/index.js';
import { DocumentsModule } from '../modules/documents/index.js';
import { AgentsModule } from '../modules/agents/index.js';
import { LatentModule } from '../modules/latent/index.js';
import { StateManager } from '../core/state-manager.js';
export interface CCGModulesForAPI {
    memory: MemoryModule;
    guard: GuardModule;
    workflow: WorkflowModule;
    process: ProcessModule;
    documents: DocumentsModule;
    agents: AgentsModule;
    latent: LatentModule;
}
export interface APIServerConfig {
    port: number;
    corsOrigins: string[];
}
export declare function createAPIServer(modules: CCGModulesForAPI, stateManager: StateManager, eventBus: EventBus, logger: Logger, config?: APIServerConfig): {
    app: Express;
    server: HttpServer;
    wss: WebSocketServer;
    start: () => void;
};
//# sourceMappingURL=http-server.d.ts.map