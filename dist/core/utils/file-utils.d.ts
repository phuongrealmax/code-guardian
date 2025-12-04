/**
 * Ensure directory exists
 */
export declare function ensureDir(dirPath: string): void;
/**
 * Read file safely
 */
export declare function readFileSafe(filePath: string): string | null;
/**
 * Get file info
 */
export declare function getFileInfo(filePath: string): {
    exists: boolean;
    size: number;
    isDirectory: boolean;
    extension: string;
    name: string;
    modifiedAt?: Date;
} | null;
/**
 * List directory contents
 */
export declare function listDirectory(dirPath: string, options?: {
    recursive?: boolean;
    includeHidden?: boolean;
    extensions?: string[];
    maxDepth?: number;
}): string[];
/**
 * Get relative path from project root
 */
export declare function getRelativePath(fullPath: string, projectRoot: string): string;
/**
 * Check if file is in directory
 */
export declare function isInDirectory(filePath: string, dirPath: string): boolean;
/**
 * Get file type category
 */
export declare function getFileCategory(filename: string): 'code' | 'config' | 'documentation' | 'test' | 'asset' | 'other';
//# sourceMappingURL=file-utils.d.ts.map