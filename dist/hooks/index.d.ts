export * from './types.js';
export * from './hook-handler.js';
export { SessionStartHook } from './session-start.hook.js';
export { PreToolCallHook } from './pre-tool-call.hook.js';
export { PostToolCallHook } from './post-tool-call.hook.js';
export { SessionEndHook } from './session-end.hook.js';
import { HookType, HookContext, HookResult } from './types.js';
import { Modules } from './hook-handler.js';
import { Logger } from '../core/logger.js';
import { ConfigManager } from '../core/config-manager.js';
import { StateManager } from '../core/state-manager.js';
import { EventBus } from '../core/event-bus.js';
export declare class HookRouter {
    private modules;
    private logger;
    private config;
    private state;
    private eventBus;
    constructor(modules: Modules, logger: Logger, config: ConfigManager, state: StateManager, eventBus: EventBus);
    executeHook(hookType: HookType, input: unknown, context: HookContext): Promise<HookResult>;
}
//# sourceMappingURL=index.d.ts.map