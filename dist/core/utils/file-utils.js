// src/core/utils/file-utils.ts
import { existsSync, readFileSync, readdirSync, statSync, mkdirSync } from 'fs';
import { join, basename, extname, relative } from 'path';
/**
 * Ensure directory exists
 */
export function ensureDir(dirPath) {
    if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
    }
}
/**
 * Read file safely
 */
export function readFileSafe(filePath) {
    try {
        if (!existsSync(filePath)) {
            return null;
        }
        return readFileSync(filePath, 'utf-8');
    }
    catch {
        return null;
    }
}
/**
 * Get file info
 */
export function getFileInfo(filePath) {
    try {
        if (!existsSync(filePath)) {
            return {
                exists: false,
                size: 0,
                isDirectory: false,
                extension: extname(filePath),
                name: basename(filePath),
            };
        }
        const stat = statSync(filePath);
        return {
            exists: true,
            size: stat.size,
            isDirectory: stat.isDirectory(),
            extension: extname(filePath),
            name: basename(filePath),
            modifiedAt: stat.mtime,
        };
    }
    catch {
        return null;
    }
}
/**
 * List directory contents
 */
export function listDirectory(dirPath, options) {
    const files = [];
    const { recursive = false, includeHidden = false, extensions, maxDepth = 10 } = options || {};
    function scan(currentPath, depth) {
        if (depth > maxDepth)
            return;
        try {
            const entries = readdirSync(currentPath, { withFileTypes: true });
            for (const entry of entries) {
                if (!includeHidden && entry.name.startsWith('.'))
                    continue;
                if (entry.name === 'node_modules')
                    continue;
                const fullPath = join(currentPath, entry.name);
                if (entry.isDirectory()) {
                    if (recursive) {
                        scan(fullPath, depth + 1);
                    }
                }
                else {
                    if (extensions) {
                        const ext = extname(entry.name);
                        if (!extensions.includes(ext))
                            continue;
                    }
                    files.push(fullPath);
                }
            }
        }
        catch {
            // Ignore permission errors
        }
    }
    scan(dirPath, 0);
    return files;
}
/**
 * Get relative path from project root
 */
export function getRelativePath(fullPath, projectRoot) {
    return relative(projectRoot, fullPath);
}
/**
 * Check if file is in directory
 */
export function isInDirectory(filePath, dirPath) {
    const rel = relative(dirPath, filePath);
    return !rel.startsWith('..') && !rel.startsWith('/');
}
/**
 * Get file type category
 */
export function getFileCategory(filename) {
    const ext = extname(filename).toLowerCase();
    const name = basename(filename).toLowerCase();
    // Test files
    if (name.includes('.test.') || name.includes('.spec.') || name.includes('__tests__')) {
        return 'test';
    }
    // Code files
    const codeExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.rb', '.go', '.rs', '.java', '.kt', '.cs', '.cpp', '.c', '.php', '.swift'];
    if (codeExts.includes(ext)) {
        return 'code';
    }
    // Config files
    const configExts = ['.json', '.yaml', '.yml', '.toml', '.ini', '.env'];
    const configNames = ['package.json', 'tsconfig.json', '.eslintrc', '.prettierrc', 'webpack.config', 'vite.config'];
    if (configExts.includes(ext) || configNames.some(n => name.includes(n))) {
        return 'config';
    }
    // Documentation
    const docExts = ['.md', '.txt', '.rst', '.adoc'];
    if (docExts.includes(ext)) {
        return 'documentation';
    }
    // Assets
    const assetExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.mp3', '.mp4', '.wav', '.ttf', '.woff', '.woff2'];
    if (assetExts.includes(ext)) {
        return 'asset';
    }
    return 'other';
}
//# sourceMappingURL=file-utils.js.map