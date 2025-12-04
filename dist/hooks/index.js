// ═══════════════════════════════════════════════════════════════
//                      HOOKS MODULE EXPORTS
// ═══════════════════════════════════════════════════════════════
export * from './types.js';
export * from './hook-handler.js';
export { SessionStartHook } from './session-start.hook.js';
export { PreToolCallHook } from './pre-tool-call.hook.js';
export { PostToolCallHook } from './post-tool-call.hook.js';
export { SessionEndHook } from './session-end.hook.js';
import { SessionStartHook } from './session-start.hook.js';
import { PreToolCallHook } from './pre-tool-call.hook.js';
import { PostToolCallHook } from './post-tool-call.hook.js';
import { SessionEndHook } from './session-end.hook.js';
// ═══════════════════════════════════════════════════════════════
//                      HOOK ROUTER
// ═══════════════════════════════════════════════════════════════
export class HookRouter {
    modules;
    logger;
    config;
    state;
    eventBus;
    constructor(modules, logger, config, state, eventBus) {
        this.modules = modules;
        this.logger = logger;
        this.config = config;
        this.state = state;
        this.eventBus = eventBus;
    }
    async executeHook(hookType, input, context) {
        let handler;
        switch (hookType) {
            case 'session-start':
                handler = new SessionStartHook(this.modules, context, this.logger, this.config, this.state, this.eventBus);
                break;
            case 'pre-tool':
                handler = new PreToolCallHook(this.modules, context, this.logger, this.config, this.state, this.eventBus);
                break;
            case 'post-tool':
                handler = new PostToolCallHook(this.modules, context, this.logger, this.config, this.state, this.eventBus);
                break;
            case 'session-end':
                handler = new SessionEndHook(this.modules, context, this.logger, this.config, this.state, this.eventBus);
                break;
            default:
                return {
                    success: false,
                    message: `Unknown hook type: ${hookType}`,
                };
        }
        return handler.execute(input);
    }
}
//# sourceMappingURL=index.js.map