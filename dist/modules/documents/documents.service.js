// src/modules/documents/documents.service.ts
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync, mkdirSync } from 'fs';
import { join, basename, extname, dirname } from 'path';
import { createHash } from 'crypto';
import { v4 as uuid } from 'uuid';
export class DocumentsService {
    config;
    eventBus;
    logger;
    projectRoot;
    registry;
    registryPath;
    constructor(config, eventBus, logger, projectRoot = process.cwd()) {
        this.config = config;
        this.eventBus = eventBus;
        this.logger = logger;
        this.projectRoot = projectRoot;
        this.registryPath = join(projectRoot, '.ccg', 'registry', 'documents.json');
        this.registry = {
            documents: [],
            lastScanned: new Date(),
            locations: config.locations,
        };
    }
    async initialize() {
        if (!this.config.enabled)
            return;
        await this.loadRegistry();
        await this.scanDocuments();
        this.logger.info(`Documents module initialized with ${this.registry.documents.length} documents`);
    }
    // ═══════════════════════════════════════════════════════════════
    //                      DOCUMENT SCANNING
    // ═══════════════════════════════════════════════════════════════
    async scanDocuments() {
        const docExtensions = ['.md', '.txt', '.rst', '.adoc'];
        const foundPaths = new Set();
        // Scan configured locations
        for (const [_type, location] of Object.entries(this.config.locations)) {
            const fullPath = join(this.projectRoot, location);
            if (existsSync(fullPath)) {
                const stat = statSync(fullPath);
                if (stat.isDirectory()) {
                    this.scanDirectory(fullPath, docExtensions, foundPaths);
                }
                else if (stat.isFile()) {
                    foundPaths.add(fullPath);
                }
            }
        }
        // Also scan for common doc files in root
        const rootDocs = ['README.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'LICENSE'];
        for (const doc of rootDocs) {
            const docPath = join(this.projectRoot, doc);
            if (existsSync(docPath)) {
                foundPaths.add(docPath);
            }
        }
        // Update registry
        const existingPaths = new Set(this.registry.documents.map(d => d.path));
        for (const path of foundPaths) {
            if (!existingPaths.has(path)) {
                await this.registerDocument(path);
            }
            else {
                const doc = this.registry.documents.find(d => d.path === path);
                await this.checkAndUpdateDocument(doc);
            }
        }
        // Remove documents that no longer exist
        this.registry.documents = this.registry.documents.filter(d => existsSync(d.path));
        this.registry.lastScanned = new Date();
        await this.saveRegistry();
    }
    scanDirectory(dirPath, extensions, found) {
        try {
            const entries = readdirSync(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = join(dirPath, entry.name);
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    this.scanDirectory(fullPath, extensions, found);
                }
                else if (entry.isFile() && extensions.includes(extname(entry.name).toLowerCase())) {
                    found.add(fullPath);
                }
            }
        }
        catch {
            this.logger.warn(`Failed to scan directory: ${dirPath}`);
        }
    }
    // ═══════════════════════════════════════════════════════════════
    //                      DOCUMENT REGISTRATION
    // ═══════════════════════════════════════════════════════════════
    async registerDocument(path, params) {
        const content = readFileSync(path, 'utf-8');
        const stat = statSync(path);
        const hash = this.hashContent(content);
        const document = {
            id: uuid(),
            path,
            name: basename(path),
            type: params?.type || this.detectDocumentType(path, content),
            createdAt: stat.birthtime,
            updatedAt: stat.mtime,
            hash,
            size: stat.size,
            description: params?.description || this.extractDescription(content),
            tags: params?.tags || this.extractTags(content),
            linkedFiles: this.extractLinkedFiles(content, dirname(path)),
        };
        // Check for duplicate
        const existing = this.registry.documents.find(d => d.path === path);
        if (existing) {
            Object.assign(existing, document);
            existing.id = existing.id; // Keep original ID
        }
        else {
            this.registry.documents.push(document);
        }
        await this.saveRegistry();
        return document;
    }
    async checkAndUpdateDocument(doc) {
        const stat = statSync(doc.path);
        if (stat.mtime > doc.updatedAt) {
            const content = readFileSync(doc.path, 'utf-8');
            const hash = this.hashContent(content);
            if (hash !== doc.hash) {
                doc.hash = hash;
                doc.updatedAt = stat.mtime;
                doc.size = stat.size;
                doc.description = this.extractDescription(content);
                doc.tags = this.extractTags(content);
                doc.linkedFiles = this.extractLinkedFiles(content, dirname(doc.path));
            }
        }
    }
    // ═══════════════════════════════════════════════════════════════
    //                      DOCUMENT SEARCH
    // ═══════════════════════════════════════════════════════════════
    searchDocuments(query) {
        const results = [];
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/);
        for (const doc of this.registry.documents) {
            let relevance = 0;
            const matchedIn = [];
            // Name match
            if (doc.name.toLowerCase().includes(queryLower)) {
                relevance += 10;
                matchedIn.push('name');
            }
            // Description match
            if (doc.description?.toLowerCase().includes(queryLower)) {
                relevance += 5;
                matchedIn.push('description');
            }
            // Tags match
            for (const tag of doc.tags) {
                if (tag.toLowerCase().includes(queryLower)) {
                    relevance += 3;
                    if (!matchedIn.includes('tags'))
                        matchedIn.push('tags');
                }
            }
            // Word-by-word matching
            for (const word of queryWords) {
                if (doc.name.toLowerCase().includes(word))
                    relevance += 2;
                if (doc.description?.toLowerCase().includes(word))
                    relevance += 1;
            }
            if (relevance > 0) {
                results.push({ document: doc, relevance, matchedIn });
            }
        }
        // Sort by relevance
        results.sort((a, b) => b.relevance - a.relevance);
        return results;
    }
    findDocumentByType(type) {
        return this.registry.documents.filter(d => d.type === type);
    }
    findDocumentByPath(path) {
        return this.registry.documents.find(d => d.path === path || d.path.endsWith(path));
    }
    // ═══════════════════════════════════════════════════════════════
    //                      DOCUMENT UPDATE LOGIC
    // ═══════════════════════════════════════════════════════════════
    shouldUpdateDocument(topic, _newContent) {
        const searchResults = this.searchDocuments(topic);
        if (searchResults.length === 0) {
            const suggestedPath = this.suggestDocumentPath(topic);
            return {
                document: {
                    id: '',
                    path: suggestedPath,
                    name: basename(suggestedPath),
                    type: 'other',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    hash: '',
                    size: 0,
                    tags: [],
                    linkedFiles: [],
                },
                shouldUpdate: false,
                reason: 'No existing document found',
                suggestedAction: 'create',
            };
        }
        const bestMatch = searchResults[0];
        const existingContent = readFileSync(bestMatch.document.path, 'utf-8');
        if (this.config.updateInsteadOfCreate) {
            return {
                document: bestMatch.document,
                shouldUpdate: true,
                reason: `Found existing document: ${bestMatch.document.name} (relevance: ${bestMatch.relevance})`,
                existingContent,
                suggestedAction: 'update',
            };
        }
        return {
            document: bestMatch.document,
            shouldUpdate: false,
            reason: 'Existing document found but updateInsteadOfCreate is disabled',
            existingContent,
            suggestedAction: 'skip',
        };
    }
    async updateDocument(path, content) {
        writeFileSync(path, content, 'utf-8');
        return this.registerDocument(path);
    }
    async createDocument(params) {
        const dir = dirname(params.path);
        mkdirSync(dir, { recursive: true });
        writeFileSync(params.path, params.content, 'utf-8');
        return this.registerDocument(params.path, params);
    }
    // ═══════════════════════════════════════════════════════════════
    //                      HELPER METHODS
    // ═══════════════════════════════════════════════════════════════
    detectDocumentType(path, content) {
        const name = basename(path).toLowerCase();
        const contentLower = content.toLowerCase();
        if (name.includes('readme'))
            return 'readme';
        if (name.includes('changelog') || name.includes('history'))
            return 'changelog';
        if (name.includes('api'))
            return 'api';
        if (name.includes('spec') || name.includes('specification'))
            return 'spec';
        if (name.includes('guide') || name.includes('tutorial'))
            return 'guide';
        if (name.includes('architecture') || name.includes('design'))
            return 'architecture';
        if (name.includes('config'))
            return 'config';
        // Content-based detection
        if (contentLower.includes('## api') || contentLower.includes('### endpoints'))
            return 'api';
        if (contentLower.includes('## architecture') || contentLower.includes('## design'))
            return 'architecture';
        return 'other';
    }
    extractDescription(content) {
        const lines = content.split('\n');
        let startIndex = 0;
        if (lines[0]?.startsWith('#')) {
            startIndex = 1;
        }
        let description = '';
        for (let i = startIndex; i < lines.length && i < 10; i++) {
            const line = lines[i].trim();
            if (line && !line.startsWith('#') && !line.startsWith('-') && !line.startsWith('*')) {
                description = line;
                break;
            }
        }
        if (description.length > 200) {
            description = description.substring(0, 197) + '...';
        }
        return description;
    }
    extractTags(content) {
        const tags = [];
        // Look for tags in frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (frontmatterMatch) {
            const tagsMatch = frontmatterMatch[1].match(/tags:\s*\[(.*?)\]/);
            if (tagsMatch) {
                tags.push(...tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, '')));
            }
        }
        // Extract from headers
        const headers = content.match(/^#{1,3}\s+(.+)$/gm) || [];
        for (const header of headers.slice(0, 5)) {
            const text = header.replace(/^#+\s+/, '').toLowerCase();
            if (text.length < 30) {
                tags.push(text);
            }
        }
        return [...new Set(tags)];
    }
    extractLinkedFiles(content, basePath) {
        const links = [];
        // Markdown links
        const mdLinks = content.match(/\[.*?\]\(([^)]+)\)/g) || [];
        for (const link of mdLinks) {
            const match = link.match(/\]\(([^)]+)\)/);
            if (match && !match[1].startsWith('http') && !match[1].startsWith('#')) {
                links.push(join(basePath, match[1]));
            }
        }
        return links.filter(l => existsSync(l));
    }
    hashContent(content) {
        return createHash('md5').update(content).digest('hex');
    }
    suggestDocumentPath(topic) {
        const filename = topic
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            + '.md';
        const docsLocation = this.config.locations['docs'] || 'docs';
        return join(this.projectRoot, docsLocation, filename);
    }
    // ═══════════════════════════════════════════════════════════════
    //                      PERSISTENCE
    // ═══════════════════════════════════════════════════════════════
    async loadRegistry() {
        if (existsSync(this.registryPath)) {
            try {
                const data = JSON.parse(readFileSync(this.registryPath, 'utf-8'));
                this.registry = {
                    ...data,
                    lastScanned: new Date(data.lastScanned),
                    documents: data.documents.map((d) => ({
                        ...d,
                        createdAt: new Date(d.createdAt),
                        updatedAt: new Date(d.updatedAt),
                    })),
                };
            }
            catch {
                this.logger.warn('Failed to load document registry');
            }
        }
    }
    async saveRegistry() {
        const dir = dirname(this.registryPath);
        mkdirSync(dir, { recursive: true });
        writeFileSync(this.registryPath, JSON.stringify(this.registry, null, 2));
    }
    // ═══════════════════════════════════════════════════════════════
    //                      STATUS
    // ═══════════════════════════════════════════════════════════════
    getStatus() {
        const byType = {};
        for (const doc of this.registry.documents) {
            byType[doc.type] = (byType[doc.type] || 0) + 1;
        }
        return {
            enabled: this.config.enabled,
            documentCount: this.registry.documents.length,
            byType,
            lastScanned: this.registry.lastScanned,
        };
    }
    getAllDocuments() {
        return this.registry.documents;
    }
}
//# sourceMappingURL=documents.service.js.map