import { HookContext, HookResult, HookWarning } from './types.js';
import { Logger } from '../core/logger.js';
import { ConfigManager } from '../core/config-manager.js';
import { StateManager } from '../core/state-manager.js';
import { EventBus } from '../core/event-bus.js';
import { MemoryModule } from '../modules/memory/index.js';
import { GuardModule } from '../modules/guard/index.js';
import { ProcessModule } from '../modules/process/index.js';
import { ResourceModule } from '../modules/resource/index.js';
import { WorkflowModule } from '../modules/workflow/index.js';
import { TestingModule } from '../modules/testing/index.js';
import { DocumentsModule } from '../modules/documents/index.js';
import { LatentModule } from '../modules/latent/index.js';
export interface Modules {
    memory: MemoryModule;
    guard: GuardModule;
    process: ProcessModule;
    resource: ResourceModule;
    workflow: WorkflowModule;
    testing: TestingModule;
    documents: DocumentsModule;
    latent: LatentModule;
}
export declare abstract class HookHandler {
    protected logger: Logger;
    protected config: ConfigManager;
    protected state: StateManager;
    protected eventBus: EventBus;
    protected modules: Modules;
    protected context: HookContext;
    constructor(modules: Modules, context: HookContext, logger: Logger, config: ConfigManager, state: StateManager, eventBus: EventBus);
    abstract execute(input: unknown): Promise<HookResult>;
    protected formatOutput(result: HookResult): string;
    protected createWarning(level: HookWarning['level'], message: string, action?: string): HookWarning;
}
//# sourceMappingURL=hook-handler.d.ts.map