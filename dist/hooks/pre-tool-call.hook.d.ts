import { HookHandler, Modules } from './hook-handler.js';
import { PreToolCallInput, PreToolCallResult, HookContext } from './types.js';
import { Logger } from '../core/logger.js';
import { ConfigManager } from '../core/config-manager.js';
import { StateManager } from '../core/state-manager.js';
import { EventBus } from '../core/event-bus.js';
export declare class PreToolCallHook extends HookHandler {
    constructor(modules: Modules, context: HookContext, logger: Logger, config: ConfigManager, state: StateManager, eventBus: EventBus);
    execute(input: PreToolCallInput): Promise<PreToolCallResult>;
    private isWriteOperation;
    private estimateTask;
    private analyzeImpact;
    private extractContent;
    private extractFilename;
    private extractBashCommand;
    private isDangerousCommand;
    /**
     * Determine if this tool call should auto-attach latent context
     * Uses config's autoAttachTriggerTools list
     */
    private shouldAutoAttachLatent;
    /**
     * Auto-attach latent context if:
     * 1. Latent module is enabled and autoAttach is true
     * 2. There's a current workflow task OR tool is a write operation
     * 3. No existing latent context for this task
     *
     * MCP-First Mode: Ensures every significant action is tracked via MCP
     */
    private autoAttachLatentContext;
}
//# sourceMappingURL=pre-tool-call.hook.d.ts.map