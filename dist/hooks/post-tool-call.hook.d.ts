import { HookHandler, Modules } from './hook-handler.js';
import { PostToolCallInput, PostToolCallResult, HookContext } from './types.js';
import { Logger } from '../core/logger.js';
import { ConfigManager } from '../core/config-manager.js';
import { StateManager } from '../core/state-manager.js';
import { EventBus } from '../core/event-bus.js';
export declare class PostToolCallHook extends HookHandler {
    constructor(modules: Modules, context: HookContext, logger: Logger, config: ConfigManager, state: StateManager, eventBus: EventBus);
    execute(input: PostToolCallInput): Promise<PostToolCallResult>;
    private isWriteOperation;
    private extractFilename;
    private validateWrittenContent;
    private runAffectedTests;
    private isUIFile;
    private performBrowserCheck;
    private isDocumentFile;
    private isSignificantChange;
    private summarizeChange;
    /**
     * Auto-create latent context when workflow task is created
     * This enables token-efficient hidden-state reasoning for all tasks
     */
    private autoCreateLatentContext;
    /**
     * Auto-complete latent context when workflow task completes
     */
    private autoCompleteLatentContext;
}
//# sourceMappingURL=post-tool-call.hook.d.ts.map