import { DocumentsModuleConfig } from '../../core/types.js';
import { EventBus } from '../../core/event-bus.js';
import { Logger } from '../../core/logger.js';
export declare class DocumentsModule {
    private service;
    constructor(config: DocumentsModuleConfig, eventBus: EventBus, logger: Logger, projectRoot?: string);
    initialize(): Promise<void>;
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
    getStatus(): import("./documents.types.js").DocumentsModuleStatus;
    shutdown(): Promise<void>;
    registerDocument(path: string): Promise<import("./documents.types.js").Document>;
    scanDocuments(): Promise<void>;
    updateDocument(path: string, content: string): Promise<import("./documents.types.js").Document>;
    searchDocuments(query: string): Promise<import("./documents.types.js").DocumentSearchResult[]>;
    getAllDocuments(): import("./documents.types.js").Document[];
}
export { DocumentsService } from './documents.service.js';
export { getDocumentsTools } from './documents.tools.js';
export * from './documents.types.js';
//# sourceMappingURL=index.d.ts.map