// src/modules/documents/index.ts
import { DocumentsService } from './documents.service.js';
import { getDocumentsTools } from './documents.tools.js';
export class DocumentsModule {
    service;
    constructor(config, eventBus, logger, projectRoot) {
        this.service = new DocumentsService(config, eventBus, logger, projectRoot);
    }
    async initialize() {
        await this.service.initialize();
    }
    getTools() {
        return getDocumentsTools();
    }
    async handleTool(toolName, args) {
        switch (toolName) {
            case 'documents_search':
                return this.service.searchDocuments(args.query);
            case 'documents_find_by_type':
                return this.service.findDocumentByType(args.type);
            case 'documents_should_update':
                return this.service.shouldUpdateDocument(args.topic, args.content);
            case 'documents_update':
                return this.service.updateDocument(args.path, args.content);
            case 'documents_create':
                return this.service.createDocument({
                    path: args.path,
                    content: args.content,
                    type: args.type,
                    description: args.description,
                    tags: args.tags,
                });
            case 'documents_register':
                return this.service.registerDocument(args.path);
            case 'documents_scan':
                await this.service.scanDocuments();
                return { scanned: true };
            case 'documents_list':
                return this.service.getAllDocuments();
            case 'documents_status':
                return this.service.getStatus();
            default:
                throw new Error(`Unknown documents tool: ${toolName}`);
        }
    }
    getStatus() {
        return this.service.getStatus();
    }
    async shutdown() {
        // Cleanup logic if needed
    }
    // ═══════════════════════════════════════════════════════════════
    //                      WRAPPER METHODS
    // ═══════════════════════════════════════════════════════════════
    async registerDocument(path) {
        return this.service.registerDocument(path);
    }
    async scanDocuments() {
        return this.service.scanDocuments();
    }
    async updateDocument(path, content) {
        return this.service.updateDocument(path, content);
    }
    async searchDocuments(query) {
        return this.service.searchDocuments(query);
    }
    getAllDocuments() {
        return this.service.getAllDocuments();
    }
}
export { DocumentsService } from './documents.service.js';
export { getDocumentsTools } from './documents.tools.js';
export * from './documents.types.js';
//# sourceMappingURL=index.js.map