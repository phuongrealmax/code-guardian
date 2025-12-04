import { HookHandler, Modules } from './hook-handler.js';
import { SessionStartInput, SessionStartResult, HookContext } from './types.js';
import { Logger } from '../core/logger.js';
import { ConfigManager } from '../core/config-manager.js';
import { StateManager } from '../core/state-manager.js';
import { EventBus } from '../core/event-bus.js';
export declare class SessionStartHook extends HookHandler {
    constructor(modules: Modules, context: HookContext, logger: Logger, config: ConfigManager, state: StateManager, eventBus: EventBus);
    execute(input: SessionStartInput): Promise<SessionStartResult>;
    private buildWelcomeMessage;
}
//# sourceMappingURL=session-start.hook.d.ts.map