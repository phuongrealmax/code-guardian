import { DocumentsModuleConfig } from '../../core/types.js';
import { EventBus } from '../../core/event-bus.js';
import { Logger } from '../../core/logger.js';
import { Document, DocumentType, DocumentSearchResult, DocumentUpdateCheck, DocumentCreateParams, DocumentsModuleStatus } from './documents.types.js';
export declare class DocumentsService {
    private config;
    private eventBus;
    private logger;
    private projectRoot;
    private registry;
    private registryPath;
    constructor(config: DocumentsModuleConfig, eventBus: EventBus, logger: Logger, projectRoot?: string);
    initialize(): Promise<void>;
    scanDocuments(): Promise<void>;
    private scanDirectory;
    registerDocument(path: string, params?: Partial<DocumentCreateParams>): Promise<Document>;
    private checkAndUpdateDocument;
    searchDocuments(query: string): DocumentSearchResult[];
    findDocumentByType(type: DocumentType): Document[];
    findDocumentByPath(path: string): Document | undefined;
    shouldUpdateDocument(topic: string, _newContent: string): DocumentUpdateCheck;
    updateDocument(path: string, content: string): Promise<Document>;
    createDocument(params: DocumentCreateParams): Promise<Document>;
    private detectDocumentType;
    private extractDescription;
    private extractTags;
    private extractLinkedFiles;
    private hashContent;
    private suggestDocumentPath;
    private loadRegistry;
    private saveRegistry;
    getStatus(): DocumentsModuleStatus;
    getAllDocuments(): Document[];
}
//# sourceMappingURL=documents.service.d.ts.map