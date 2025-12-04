export class HookHandler {
    logger;
    config;
    state;
    eventBus;
    modules;
    context;
    constructor(modules, context, logger, config, state, eventBus) {
        this.modules = modules;
        this.context = context;
        this.logger = logger;
        this.config = config;
        this.state = state;
        this.eventBus = eventBus;
    }
    formatOutput(result) {
        const lines = [];
        if (result.blocked) {
            lines.push(`BLOCKED: ${result.blockReason}`);
        }
        if (result.warnings && result.warnings.length > 0) {
            for (const warning of result.warnings) {
                const prefix = warning.level === 'error' ? '[ERROR]' : warning.level === 'warning' ? '[WARN]' : '[INFO]';
                lines.push(`${prefix} ${warning.message}`);
                if (warning.action) {
                    lines.push(`   -> ${warning.action}`);
                }
            }
        }
        if (result.message) {
            lines.push(result.message);
        }
        return lines.join('\n');
    }
    createWarning(level, message, action) {
        return { level, message, action };
    }
}
//# sourceMappingURL=hook-handler.js.map