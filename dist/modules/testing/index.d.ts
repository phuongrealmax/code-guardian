import { TestingModuleConfig } from '../../core/types.js';
import { EventBus } from '../../core/event-bus.js';
import { Logger } from '../../core/logger.js';
export declare class TestingModule {
    private service;
    constructor(config: TestingModuleConfig, eventBus: EventBus, logger: Logger, projectRoot?: string);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    getTools(): {
        inputSchema: {
            [x: string]: unknown;
            type: "object";
            properties?: {
                [x: string]: object;
            } | undefined;
            required?: string[] | undefined;
        };
        name: string;
        description?: string | undefined;
        outputSchema?: {
            [x: string]: unknown;
            type: "object";
            properties?: {
                [x: string]: object;
            } | undefined;
            required?: string[] | undefined;
        } | undefined;
        annotations?: {
            title?: string | undefined;
            readOnlyHint?: boolean | undefined;
            destructiveHint?: boolean | undefined;
            idempotentHint?: boolean | undefined;
            openWorldHint?: boolean | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
        icons?: {
            src: string;
            mimeType?: string | undefined;
            sizes?: string[] | undefined;
        }[] | undefined;
        title?: string | undefined;
    }[];
    handleTool(toolName: string, args: Record<string, unknown>): Promise<unknown>;
    getStatus(): import("./testing.types.js").TestingModuleStatus;
    runTests(options?: {
        files?: string[];
        grep?: string;
        coverage?: boolean;
        timeout?: number;
    }): Promise<import("./testing.types.js").TestResults>;
    runAffectedTests(files: string[]): Promise<import("./testing.types.js").TestResults>;
}
export { TestingService } from './testing.service.js';
export { BrowserService } from './browser/browser.service.js';
export { getTestingTools } from './testing.tools.js';
export * from './testing.types.js';
//# sourceMappingURL=index.d.ts.map