/**
 * Code Parser - Extract chunks from source files
 * Uses regex-based parsing (Tree-sitter integration can be added later)
 */

import * as crypto from 'crypto';
import { CodeChunk } from './rag.types.js';

interface ParseResult {
  chunks: CodeChunk[];
  errors: string[];
}

// Language-specific patterns for code extraction
const LANGUAGE_PATTERNS: Record<string, {
  function: RegExp;
  class: RegExp;
  method: RegExp;
  interface: RegExp;
  type: RegExp;
  import: RegExp;
  export: RegExp;
}> = {
  typescript: {
    function: /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*(?:<[^>]*>)?\s*\([^)]*\)(?:\s*:\s*[^{]+)?\s*\{/g,
    class: /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?(?:\s+implements\s+[\w,\s]+)?\s*\{/g,
    method: /(?:async\s+)?(\w+)\s*(?:<[^>]*>)?\s*\([^)]*\)(?:\s*:\s*[^{]+)?\s*\{/g,
    interface: /(?:export\s+)?interface\s+(\w+)(?:\s+extends\s+[\w,\s]+)?\s*\{/g,
    type: /(?:export\s+)?type\s+(\w+)(?:\s*<[^>]*>)?\s*=/g,
    import: /import\s+(?:(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]+\}|\w+))*\s+from\s+)?['"][^'"]+['"]/g,
    export: /export\s+(?:default\s+)?(?:\{[^}]+\}|(?:const|let|var|function|class|interface|type)\s+\w+)/g,
  },
  javascript: {
    function: /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/g,
    class: /(?:export\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?\s*\{/g,
    method: /(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/g,
    interface: /$/g, // JS doesn't have interfaces
    type: /$/g, // JS doesn't have type aliases
    import: /import\s+(?:(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]+\}|\w+))*\s+from\s+)?['"][^'"]+['"]/g,
    export: /export\s+(?:default\s+)?(?:\{[^}]+\}|(?:const|let|var|function|class)\s+\w+)/g,
  },
  python: {
    function: /(?:async\s+)?def\s+(\w+)\s*\([^)]*\)(?:\s*->\s*[^:]+)?:/g,
    class: /class\s+(\w+)(?:\([^)]*\))?:/g,
    method: /(?:async\s+)?def\s+(\w+)\s*\(self[^)]*\)(?:\s*->\s*[^:]+)?:/g,
    interface: /$/g,
    type: /$/g,
    import: /(?:from\s+[\w.]+\s+)?import\s+[\w,\s*]+/g,
    export: /$/g, // Python uses __all__
  },
  go: {
    function: /func\s+(\w+)\s*(?:\([^)]*\))?\s*\([^)]*\)(?:\s*(?:\([^)]*\)|[\w*]+))?\s*\{/g,
    class: /type\s+(\w+)\s+struct\s*\{/g,
    method: /func\s+\(\w+\s+\*?(\w+)\)\s+(\w+)\s*\([^)]*\)(?:\s*(?:\([^)]*\)|[\w*]+))?\s*\{/g,
    interface: /type\s+(\w+)\s+interface\s*\{/g,
    type: /type\s+(\w+)\s+(?!struct|interface)/g,
    import: /import\s+(?:\(\s*[\s\S]*?\)|"[^"]+")/g,
    export: /$/g, // Go uses capitalization
  },
};

/**
 * Parse a source file and extract code chunks
 */
export function parseSourceFile(
  filePath: string,
  content: string,
  language: string
): ParseResult {
  const chunks: CodeChunk[] = [];
  const errors: string[] = [];
  const lines = content.split('\n');

  const patterns = LANGUAGE_PATTERNS[language] || LANGUAGE_PATTERNS.typescript;

  try {
    // Extract imports
    const imports = extractImports(content, patterns.import);

    // Extract functions
    chunks.push(...extractFunctions(filePath, content, lines, language, patterns.function, imports));

    // Extract classes
    chunks.push(...extractClasses(filePath, content, lines, language, patterns.class, imports));

    // Extract interfaces (TypeScript/Go)
    chunks.push(...extractInterfaces(filePath, content, lines, language, patterns.interface));

    // Extract type aliases
    chunks.push(...extractTypes(filePath, content, lines, language, patterns.type));

    // If no chunks found, treat whole file as a module chunk
    if (chunks.length === 0) {
      chunks.push(createModuleChunk(filePath, content, lines, language, imports));
    }
  } catch (error) {
    errors.push(`Error parsing ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }

  return { chunks, errors };
}

/**
 * Extract import statements
 */
function extractImports(content: string, pattern: RegExp): string[] {
  const imports: string[] = [];
  let match;

  while ((match = pattern.exec(content)) !== null) {
    imports.push(match[0]);
  }

  return imports;
}

/**
 * Extract function definitions
 */
function extractFunctions(
  filePath: string,
  content: string,
  lines: string[],
  language: string,
  pattern: RegExp,
  imports: string[]
): CodeChunk[] {
  const chunks: CodeChunk[] = [];
  let match;

  while ((match = pattern.exec(content)) !== null) {
    const name = match[1];
    const startIndex = match.index;
    const startLine = getLineNumber(content, startIndex);
    const { endLine, blockContent } = extractBlock(content, startIndex, language);

    chunks.push({
      id: generateChunkId(filePath, 'function', name, startLine),
      filePath,
      language,
      type: 'function',
      name,
      content: blockContent,
      signature: extractSignature(match[0]),
      docstring: extractDocstring(lines, startLine - 1),
      startLine,
      endLine,
      imports,
      hash: hashContent(blockContent),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return chunks;
}

/**
 * Extract class definitions
 */
function extractClasses(
  filePath: string,
  content: string,
  lines: string[],
  language: string,
  pattern: RegExp,
  imports: string[]
): CodeChunk[] {
  const chunks: CodeChunk[] = [];
  let match;

  while ((match = pattern.exec(content)) !== null) {
    const name = match[1];
    const startIndex = match.index;
    const startLine = getLineNumber(content, startIndex);
    const { endLine, blockContent } = extractBlock(content, startIndex, language);

    chunks.push({
      id: generateChunkId(filePath, 'class', name, startLine),
      filePath,
      language,
      type: 'class',
      name,
      content: blockContent,
      signature: extractSignature(match[0]),
      docstring: extractDocstring(lines, startLine - 1),
      startLine,
      endLine,
      imports,
      hash: hashContent(blockContent),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return chunks;
}

/**
 * Extract interface definitions
 */
function extractInterfaces(
  filePath: string,
  content: string,
  lines: string[],
  language: string,
  pattern: RegExp
): CodeChunk[] {
  const chunks: CodeChunk[] = [];
  let match;

  while ((match = pattern.exec(content)) !== null) {
    const name = match[1];
    const startIndex = match.index;
    const startLine = getLineNumber(content, startIndex);
    const { endLine, blockContent } = extractBlock(content, startIndex, language);

    chunks.push({
      id: generateChunkId(filePath, 'interface', name, startLine),
      filePath,
      language,
      type: 'interface',
      name,
      content: blockContent,
      docstring: extractDocstring(lines, startLine - 1),
      startLine,
      endLine,
      hash: hashContent(blockContent),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return chunks;
}

/**
 * Extract type aliases
 */
function extractTypes(
  filePath: string,
  content: string,
  lines: string[],
  language: string,
  pattern: RegExp
): CodeChunk[] {
  const chunks: CodeChunk[] = [];
  let match;

  while ((match = pattern.exec(content)) !== null) {
    const name = match[1];
    const startIndex = match.index;
    const startLine = getLineNumber(content, startIndex);
    const endLine = findStatementEnd(content, startIndex, lines);
    const blockContent = lines.slice(startLine - 1, endLine).join('\n');

    chunks.push({
      id: generateChunkId(filePath, 'type', name, startLine),
      filePath,
      language,
      type: 'type',
      name,
      content: blockContent,
      docstring: extractDocstring(lines, startLine - 1),
      startLine,
      endLine,
      hash: hashContent(blockContent),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return chunks;
}

/**
 * Create a module-level chunk for files without extractable functions/classes
 */
function createModuleChunk(
  filePath: string,
  content: string,
  lines: string[],
  language: string,
  imports: string[]
): CodeChunk {
  const name = filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || 'module';

  return {
    id: generateChunkId(filePath, 'module', name, 1),
    filePath,
    language,
    type: 'module',
    name,
    content: content.slice(0, 2000), // Limit content size
    imports,
    startLine: 1,
    endLine: lines.length,
    hash: hashContent(content),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Extract a code block (function body, class body, etc.)
 */
function extractBlock(
  content: string,
  startIndex: number,
  language: string
): { endLine: number; blockContent: string } {
  const openBracket = language === 'python' ? ':' : '{';
  const closeBracket = language === 'python' ? null : '}';

  let depth = 0;
  let endIndex = startIndex;
  let started = false;

  if (language === 'python') {
    // Python: use indentation
    const lines = content.slice(startIndex).split('\n');
    let baseIndent = -1;
    let lineCount = 0;

    for (const line of lines) {
      lineCount++;
      if (line.trim() === '' || line.trim().startsWith('#')) continue;

      const indent = line.match(/^\s*/)?.[0].length || 0;

      if (baseIndent === -1 && line.includes(':')) {
        baseIndent = indent;
        continue;
      }

      if (baseIndent !== -1 && indent <= baseIndent && line.trim() !== '') {
        endIndex = startIndex + lines.slice(0, lineCount - 1).join('\n').length;
        break;
      }
    }

    if (endIndex === startIndex) {
      endIndex = startIndex + content.slice(startIndex).length;
    }
  } else {
    // Bracket-based languages
    for (let i = startIndex; i < content.length; i++) {
      const char = content[i];

      if (char === '{') {
        depth++;
        started = true;
      } else if (char === '}') {
        depth--;
        if (started && depth === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }
  }

  const blockContent = content.slice(startIndex, endIndex);
  const endLine = getLineNumber(content, endIndex);

  return { endLine, blockContent };
}

/**
 * Get line number from character index
 */
function getLineNumber(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}

/**
 * Find end of a statement (for type aliases, etc.)
 */
function findStatementEnd(content: string, startIndex: number, lines: string[]): number {
  const startLine = getLineNumber(content, startIndex);
  let depth = 0;

  for (let i = startLine - 1; i < lines.length; i++) {
    const line = lines[i];
    depth += (line.match(/[{<(]/g) || []).length;
    depth -= (line.match(/[}>)]/g) || []).length;

    if (depth <= 0 && (line.includes(';') || line.trim().endsWith(';') || !line.trim().endsWith(','))) {
      return i + 1;
    }
  }

  return startLine;
}

/**
 * Extract function/class signature
 */
function extractSignature(match: string): string {
  return match.replace(/\s*\{.*$/, '').trim();
}

/**
 * Extract docstring/JSDoc comment before a definition
 */
function extractDocstring(lines: string[], lineIndex: number): string | undefined {
  const docLines: string[] = [];

  for (let i = lineIndex - 1; i >= 0 && i >= lineIndex - 20; i--) {
    const line = lines[i]?.trim() || '';

    if (line.startsWith('*/')) {
      // Found end of JSDoc
      docLines.unshift(line);
      for (let j = i - 1; j >= 0; j--) {
        const docLine = lines[j]?.trim() || '';
        docLines.unshift(docLine);
        if (docLine.startsWith('/**') || docLine.startsWith('/*')) {
          break;
        }
      }
      break;
    } else if (line.startsWith('//') || line.startsWith('#')) {
      docLines.unshift(line);
    } else if (line.startsWith('"""') || line.startsWith("'''")) {
      // Python docstring
      docLines.unshift(line);
      if (!line.endsWith('"""') && !line.endsWith("'''")) {
        for (let j = i - 1; j >= 0; j--) {
          const docLine = lines[j]?.trim() || '';
          docLines.unshift(docLine);
          if (docLine.startsWith('"""') || docLine.startsWith("'''")) {
            break;
          }
        }
      }
      break;
    } else if (line !== '') {
      break;
    }
  }

  return docLines.length > 0 ? docLines.join('\n') : undefined;
}

/**
 * Generate unique chunk ID
 */
function generateChunkId(
  filePath: string,
  type: string,
  name: string,
  line: number
): string {
  const input = `${filePath}:${type}:${name}:${line}`;
  return crypto.createHash('md5').update(input).digest('hex').slice(0, 12);
}

/**
 * Hash content for change detection
 */
function hashContent(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Detect language from file extension
 */
export function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';

  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    py: 'python',
    go: 'go',
    rs: 'rust',
    java: 'java',
    php: 'php',
    rb: 'ruby',
    c: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    h: 'c',
    hpp: 'cpp',
  };

  return languageMap[ext] || 'unknown';
}
