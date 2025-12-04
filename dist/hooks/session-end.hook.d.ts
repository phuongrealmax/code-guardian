import { HookHandler, Modules } from './hook-handler.js';
import { SessionEndInput, SessionEndResult, HookContext } from './types.js';
import { Logger } from '../core/logger.js';
import { ConfigManager } from '../core/config-manager.js';
import { StateManager } from '../core/state-manager.js';
import { EventBus } from '../core/event-bus.js';
export declare class SessionEndHook extends HookHandler {
    constructor(modules: Modules, context: HookContext, logger: Logger, config: ConfigManager, state: StateManager, eventBus: EventBus);
    execute(_input: SessionEndInput): Promise<SessionEndResult>;
    private generateSessionSummary;
    private buildFarewellMessage;
}
//# sourceMappingURL=session-end.hook.d.ts.map