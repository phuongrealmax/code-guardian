// src/modules/guard/rules/path-traversal.rule.ts

import { ValidationIssue } from '../../../core/types.js';
import { IGuardRule, RuleCategory } from '../guard.types.js';

// ═══════════════════════════════════════════════════════════════
//                      PATH TRAVERSAL RULE
// ═══════════════════════════════════════════════════════════════

/**
 * Detects potential Path Traversal vulnerabilities.
 * OWASP Top 10 - A01:2021 (Broken Access Control)
 * CWE-22: Improper Limitation of a Pathname to a Restricted Directory
 */
export class PathTraversalRule implements IGuardRule {
  name = 'path-traversal';
  enabled = true;
  description = 'Detects potential path traversal vulnerabilities';
  category: RuleCategory = 'security';

  // Dangerous patterns that may lead to path traversal
  private dangerousPatterns: Array<{ pattern: RegExp; message: string; severity: 'error' | 'block' }> = [
    // Direct user input in file operations - Node.js
    {
      pattern: /fs\.(?:read|write|append|unlink|rmdir|mkdir|access|stat|open)\w*\s*\(\s*(?:req\.|request\.|params\.|body\.|query\.)/,
      message: 'User input directly in fs operation',
      severity: 'block',
    },
    // Path concatenation with user input
    {
      pattern: /(?:path\.join|path\.resolve)\s*\([^)]*(?:req\.|request\.|params\.|body\.|query\.)/,
      message: 'User input in path.join/resolve without validation',
      severity: 'error',
    },
    // Template literal in file path
    {
      pattern: /fs\.\w+\s*\(\s*`[^`]*\$\{(?:req\.|request\.|params\.|body\.|query\.)/,
      message: 'Template literal with user input in file operation',
      severity: 'block',
    },
    // String concatenation in file path
    {
      pattern: /fs\.\w+\s*\(\s*(?:['"][^'"]+['"]|[\w.]+)\s*\+\s*(?:req\.|request\.|params\.|body\.|query\.)/,
      message: 'String concatenation with user input in file path',
      severity: 'block',
    },
    // Python open() with user input
    {
      pattern: /open\s*\(\s*(?!['"])[^,)]*(?:request\.|args\.|kwargs)/,
      message: 'Python open() with user input',
      severity: 'block',
    },
    {
      pattern: /open\s*\(\s*f['"][^'"]*\{[^}]+\}[^'"]*['"]/,
      message: 'Python open() with f-string interpolation',
      severity: 'error',
    },
    // Python os.path with user input
    {
      pattern: /os\.path\.join\s*\([^)]*(?:request\.|args\.|form\.)/,
      message: 'Python os.path.join with user input',
      severity: 'error',
    },
    // PHP file operations with user input
    {
      pattern: /\b(?:file_get_contents|file_put_contents|fopen|readfile|include|require|include_once|require_once)\s*\(\s*\$/,
      message: 'PHP file operation with variable',
      severity: 'block',
    },
    {
      pattern: /\b(?:file_get_contents|fopen|readfile)\s*\(\s*\$_(?:GET|POST|REQUEST)/,
      message: 'PHP file operation with direct user input',
      severity: 'block',
    },
    // Java file operations
    {
      pattern: /new\s+File\s*\([^)]*\+[^)]*(?:request\.|getParameter)/,
      message: 'Java File constructor with user input',
      severity: 'block',
    },
    {
      pattern: /Files\.(?:read|write|delete|copy|move)\w*\s*\([^)]*\+[^)]*(?:request|getParameter)/,
      message: 'Java Files operation with user input',
      severity: 'block',
    },
    // Dangerous path patterns
    {
      pattern: /\.\.(?:\/|\\|%2f|%5c)/i,
      message: 'Literal path traversal sequence detected',
      severity: 'block',
    },
    // sendFile with user input
    {
      pattern: /\.sendFile\s*\(\s*(?!['"]|__dirname)[^)]+/,
      message: 'Express sendFile with variable (potential traversal)',
      severity: 'error',
    },
    // download endpoint without validation
    {
      pattern: /(?:download|file)\s*[=:]\s*req\.(?:params|query|body)\./,
      message: 'File download using user-controlled path',
      severity: 'error',
    },
    // Go file operations
    {
      pattern: /os\.(?:Open|ReadFile|WriteFile)\s*\([^)]*\+/,
      message: 'Go file operation with concatenation',
      severity: 'error',
    },
    {
      pattern: /ioutil\.(?:ReadFile|WriteFile)\s*\([^)]*\+/,
      message: 'Go ioutil operation with concatenation',
      severity: 'error',
    },
    // Ruby file operations
    {
      pattern: /File\.(?:read|write|open|delete)\s*\([^)]*#\{/,
      message: 'Ruby File operation with interpolation',
      severity: 'error',
    },
    // C# file operations
    {
      pattern: /File\.(?:ReadAll|WriteAll|Open|Delete|Move|Copy)\w*\s*\([^)]*\+/,
      message: 'C# File operation with concatenation',
      severity: 'error',
    },
  ];

  // Safe patterns
  private safePatterns = [
    /path\.basename/,              // Gets only filename
    /path\.normalize/,             // Normalizes path
    /\.replace\s*\(\s*['"]\.\.['"]/, // Removing ..
    /\.includes\s*\(\s*['"]\.\.['"]/, // Checking for ..
    /sanitize.*path/i,             // Custom sanitization
    /validatePath/i,               // Validation function
    /isAbsolute/,                  // Absolute path check
    /startsWith.*(?:baseDir|rootDir|uploadDir)/i, // Base directory check
    /allowedPaths/i,               // Whitelist check
    /realpath/i,                   // PHP realpath
    /SecurePath/i,                 // Security wrapper
  ];

  validate(code: string, filename: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const context = this.getContext(lines, i);

      // Skip if line has safe patterns
      if (this.isSafePattern(line) || this.isSafePattern(context)) {
        continue;
      }

      // Skip comments
      if (this.isComment(line)) {
        continue;
      }

      // Check for dangerous patterns
      for (const { pattern, message, severity } of this.dangerousPatterns) {
        if (pattern.test(line)) {
          issues.push({
            rule: this.name,
            severity,
            message: `Path Traversal Risk: ${message}`,
            location: {
              file: filename,
              line: i + 1,
              snippet: line.trim().slice(0, 100),
            },
            suggestion: this.getSuggestion(message),
            autoFixable: false,
          });
          break; // One issue per line
        }
      }
    }

    return issues;
  }

  // ═══════════════════════════════════════════════════════════════
  //                      PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════

  private getContext(lines: string[], index: number): string {
    const start = Math.max(0, index - 2);
    const end = Math.min(lines.length, index + 3);
    return lines.slice(start, end).join('\n');
  }

  private isSafePattern(text: string): boolean {
    return this.safePatterns.some(pattern => pattern.test(text));
  }

  private isComment(line: string): boolean {
    const trimmed = line.trim();
    return trimmed.startsWith('//') ||
           trimmed.startsWith('*') ||
           trimmed.startsWith('/*') ||
           trimmed.startsWith('#') ||
           trimmed.startsWith('<!--');
  }

  private getSuggestion(message: string): string {
    if (message.includes('user input')) {
      return 'Validate file paths: 1) Use path.basename() to get filename only, 2) Check path.resolve() stays within allowed directory, 3) Reject paths containing ".."';
    }
    if (message.includes('path.join') || message.includes('path.resolve')) {
      return 'After path.join/resolve, verify the result starts with your base directory using startsWith()';
    }
    if (message.includes('sendFile')) {
      return 'Use path.join(__dirname, "public", path.basename(filename)) and verify path is within allowed directory';
    }
    if (message.includes('download') || message.includes('File')) {
      return 'Use a whitelist of allowed files or validate that resolved path starts with your base directory';
    }
    if (message.includes('traversal sequence')) {
      return 'Remove or reject paths containing "..", "%2f", "%5c" or other encoded path separators';
    }
    if (message.includes('PHP')) {
      return 'Use realpath() and verify result starts with allowed directory. Use basename() for user-provided filenames.';
    }

    return 'Validate all file paths: use basename() for filenames, verify resolved paths stay within allowed directories, reject path traversal sequences';
  }
}
