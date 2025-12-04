import { ScanRepositoryInput, ScanRepositoryOutput } from './types.js';
export declare function scanRepository(input: ScanRepositoryInput): Promise<ScanRepositoryOutput>;
/**
 * Get language from file extension
 */
export declare function getLanguageFromExtension(extension: string): string;
/**
 * Check if file is a source code file
 */
export declare function isSourceCodeFile(extension: string): boolean;
/**
 * Check if file is a test file
 */
export declare function isTestFile(filePath: string): boolean;
//# sourceMappingURL=repo-scanner.d.ts.map