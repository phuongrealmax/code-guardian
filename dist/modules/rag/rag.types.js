/**
 * CCG-RAG Module Types
 * Semantic codebase search using embeddings and knowledge graphs
 */
// Default RAG configuration
export const DEFAULT_RAG_CONFIG = {
    enabled: true,
    indexPath: '.ccg/rag-index.json',
    embeddingProvider: 'local',
    chunkSize: 512,
    chunkOverlap: 50,
    searchDefaults: {
        limit: 10,
        minScore: 0.5,
        rerank: true,
    },
    autoIndex: false,
    excludePatterns: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '.git/**',
        '*.min.js',
        '*.bundle.js',
        'package-lock.json',
        'yarn.lock',
    ],
    supportedLanguages: [
        'typescript',
        'javascript',
        'python',
        'java',
        'go',
        'rust',
        'php',
        'ruby',
        'c',
        'cpp',
    ],
};
//# sourceMappingURL=rag.types.js.map