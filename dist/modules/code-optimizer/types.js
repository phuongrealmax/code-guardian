// src/modules/code-optimizer/types.ts
export const DEFAULT_CODE_OPTIMIZER_CONFIG = {
    enabled: true,
    defaultExcludePatterns: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
        '**/.ccg/**',
        '**/coverage/**',
        '**/*.min.js',
        '**/*.bundle.js',
    ],
    maxFilesToScan: 5000,
    maxFileSizeBytes: 512 * 1024, // 512KB
    cacheResults: true,
    cacheTTLSeconds: 300, // 5 minutes
};
//# sourceMappingURL=types.js.map