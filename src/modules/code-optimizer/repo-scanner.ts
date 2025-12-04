// src/modules/code-optimizer/repo-scanner.ts

/**
 * Repository Scanner
 *
 * Scans repository structure and provides basic statistics
 * for code optimization analysis.
 */

import { existsSync, statSync, readdirSync } from 'fs';
import { join, extname, dirname, resolve, relative } from 'path';
import { glob } from 'glob';
import {
  ScanRepositoryInput,
  ScanRepositoryOutput,
  FileInfo,
  FolderInfo,
  DEFAULT_CODE_OPTIMIZER_CONFIG,
} from './types.js';

// ═══════════════════════════════════════════════════════════════
//                      REPOSITORY SCANNER
// ═══════════════════════════════════════════════════════════════

export async function scanRepository(
  input: ScanRepositoryInput
): Promise<ScanRepositoryOutput> {
  const rootPath = resolve(input.rootPath || process.cwd());
  const maxFiles = input.maxFiles || DEFAULT_CODE_OPTIMIZER_CONFIG.maxFilesToScan;

  // Validate root path
  if (!existsSync(rootPath)) {
    throw new Error(`Root path does not exist: ${rootPath}`);
  }

  // Build glob patterns
  const includePatterns = input.includePatterns?.length
    ? input.includePatterns
    : ['**/*.*'];

  const excludePatterns = input.excludePatterns?.length
    ? input.excludePatterns
    : DEFAULT_CODE_OPTIMIZER_CONFIG.defaultExcludePatterns;

  // Scan files using glob
  const matchedFiles = await glob(includePatterns, {
    cwd: rootPath,
    ignore: excludePatterns,
    nodir: true,
    absolute: false,
    dot: false,
  });

  // Limit files
  const limitedFiles = matchedFiles.slice(0, maxFiles);

  // Collect file info
  const filesInfo: FileInfo[] = [];
  const folderMap = new Map<string, { files: number; linesApprox: number }>();

  for (const relativePath of limitedFiles) {
    const absolutePath = join(rootPath, relativePath);

    try {
      const stat = statSync(absolutePath);
      if (!stat.isFile()) continue;

      const extension = extname(relativePath) || '.unknown';
      const sizeBytes = stat.size;

      // Approximate lines based on file type and size
      const linesApprox = estimateLineCount(extension, sizeBytes);

      const fileInfo: FileInfo = {
        path: relativePath.replace(/\\/g, '/'),
        extension,
        sizeBytes,
        linesApprox,
      };
      filesInfo.push(fileInfo);

      // Aggregate folder stats
      const folderPath = dirname(relativePath).replace(/\\/g, '/') || '.';
      const folderEntry = folderMap.get(folderPath) || { files: 0, linesApprox: 0 };
      folderEntry.files += 1;
      folderEntry.linesApprox += linesApprox;
      folderMap.set(folderPath, folderEntry);
    } catch {
      // Skip files that can't be accessed
      continue;
    }
  }

  // Calculate totals
  const totalFiles = filesInfo.length;
  const totalLinesApprox = filesInfo.reduce((sum, f) => sum + f.linesApprox, 0);

  // Get top large files
  const topLargeFiles = [...filesInfo]
    .sort((a, b) => b.linesApprox - a.linesApprox)
    .slice(0, 50)
    .map((f) => ({ path: f.path, linesApprox: f.linesApprox }));

  // Get top large folders
  const topLargeFolders: FolderInfo[] = [...folderMap.entries()]
    .map(([path, data]) => ({ path, ...data }))
    .sort((a, b) => b.linesApprox - a.linesApprox)
    .slice(0, 50);

  return {
    rootPath,
    totalFiles,
    totalLinesApprox,
    files: filesInfo,
    topLargeFiles,
    topLargeFolders,
  };
}

// ═══════════════════════════════════════════════════════════════
//                      HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Estimate line count based on file extension and size
 * Different file types have different average bytes per line
 */
function estimateLineCount(extension: string, sizeBytes: number): number {
  // Average bytes per line by file type
  const bytesPerLine: Record<string, number> = {
    // Code files (shorter lines on average)
    '.ts': 35,
    '.tsx': 40,
    '.js': 35,
    '.jsx': 40,
    '.py': 30,
    '.rb': 30,
    '.go': 35,
    '.rs': 35,
    '.java': 40,
    '.kt': 35,
    '.swift': 35,
    '.c': 35,
    '.cpp': 40,
    '.h': 35,
    '.cs': 40,
    '.php': 40,
    '.vue': 45,
    '.svelte': 45,

    // Config/Data files
    '.json': 25,
    '.yaml': 30,
    '.yml': 30,
    '.toml': 30,
    '.xml': 50,
    '.html': 50,
    '.css': 30,
    '.scss': 30,
    '.less': 30,

    // Documentation
    '.md': 60,
    '.txt': 60,
    '.rst': 55,

    // Default
    default: 45,
  };

  const avgBytesPerLine = bytesPerLine[extension.toLowerCase()] || bytesPerLine.default;
  return Math.max(1, Math.round(sizeBytes / avgBytesPerLine));
}

/**
 * Get language from file extension
 */
export function getLanguageFromExtension(extension: string): string {
  const languageMap: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.py': 'python',
    '.rb': 'ruby',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java',
    '.kt': 'kotlin',
    '.swift': 'swift',
    '.c': 'c',
    '.cpp': 'cpp',
    '.h': 'c',
    '.cs': 'csharp',
    '.php': 'php',
    '.vue': 'vue',
    '.svelte': 'svelte',
  };

  return languageMap[extension.toLowerCase()] || 'unknown';
}

/**
 * Check if file is a source code file
 */
export function isSourceCodeFile(extension: string): boolean {
  const sourceExtensions = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
    '.py', '.rb', '.go', '.rs', '.java', '.kt', '.swift',
    '.c', '.cpp', '.h', '.hpp', '.cs', '.php',
    '.vue', '.svelte',
  ]);

  return sourceExtensions.has(extension.toLowerCase());
}

/**
 * Check if file is a test file
 */
export function isTestFile(filePath: string): boolean {
  const testPatterns = [
    /\.test\.[jt]sx?$/,
    /\.spec\.[jt]sx?$/,
    /_test\.[jt]sx?$/,
    /_spec\.[jt]sx?$/,
    /test_.*\.[jt]sx?$/,
    /spec_.*\.[jt]sx?$/,
    /__tests__\//,
    /tests?\//,
    /specs?\//,
    /\.test\.py$/,
    /_test\.py$/,
    /test_.*\.py$/,
  ];

  return testPatterns.some((pattern) => pattern.test(filePath));
}
