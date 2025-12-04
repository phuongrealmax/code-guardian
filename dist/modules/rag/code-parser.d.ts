/**
 * Code Parser - Extract chunks from source files
 * Uses regex-based parsing (Tree-sitter integration can be added later)
 */
import { CodeChunk } from './rag.types.js';
interface ParseResult {
    chunks: CodeChunk[];
    errors: string[];
}
/**
 * Parse a source file and extract code chunks
 */
export declare function parseSourceFile(filePath: string, content: string, language: string): ParseResult;
/**
 * Detect language from file extension
 */
export declare function detectLanguage(filePath: string): string;
export {};
//# sourceMappingURL=code-parser.d.ts.map