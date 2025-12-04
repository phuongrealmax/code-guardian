// src/modules/guard/rules/command-injection.rule.ts

import { ValidationIssue } from '../../../core/types.js';
import { IGuardRule, RuleCategory } from '../guard.types.js';

// ═══════════════════════════════════════════════════════════════
//                      COMMAND INJECTION RULE
// ═══════════════════════════════════════════════════════════════

/**
 * Detects potential Command Injection (OS Command Injection) vulnerabilities.
 * OWASP Top 10 - A03:2021 (Injection)
 * CWE-78: Improper Neutralization of Special Elements used in an OS Command
 */
export class CommandInjectionRule implements IGuardRule {
  name = 'command-injection';
  enabled = true;
  description = 'Detects potential OS command injection vulnerabilities';
  category: RuleCategory = 'security';

  // Dangerous patterns that may lead to command injection
  private dangerousPatterns: Array<{ pattern: RegExp; message: string; severity: 'error' | 'block' }> = [
    // Node.js child_process.exec with variable
    {
      pattern: /child_process\.exec\s*\(\s*(?!['"`])[^,)]+/,
      message: 'child_process.exec() with variable input',
      severity: 'block',
    },
    {
      pattern: /exec\s*\(\s*`[^`]*\$\{[^}]+\}[^`]*`/,
      message: 'exec() with template literal interpolation',
      severity: 'block',
    },
    {
      pattern: /execSync\s*\(\s*(?!['"`])[^,)]+/,
      message: 'execSync() with variable input',
      severity: 'block',
    },
    // spawn with shell: true
    {
      pattern: /spawn\s*\([^)]*shell\s*:\s*true/,
      message: 'spawn() with shell: true option',
      severity: 'error',
    },
    // Node.js require('child_process') direct call
    {
      pattern: /require\s*\(\s*['"]child_process['"]\s*\)\.exec\s*\(/,
      message: 'Direct child_process.exec() call',
      severity: 'error',
    },
    // Python os.system with variable
    {
      pattern: /os\.system\s*\(\s*(?!['"])[^)]+\)/,
      message: 'Python os.system() with variable',
      severity: 'block',
    },
    {
      pattern: /os\.system\s*\(\s*f['"][^'"]*\{[^}]+\}[^'"]*['"]\s*\)/,
      message: 'Python os.system() with f-string',
      severity: 'block',
    },
    // Python subprocess with shell=True
    {
      pattern: /subprocess\.\w+\s*\([^)]*shell\s*=\s*True/,
      message: 'Python subprocess with shell=True',
      severity: 'error',
    },
    // Python os.popen
    {
      pattern: /os\.popen\s*\(\s*(?!['"])[^)]+\)/,
      message: 'Python os.popen() with variable',
      severity: 'block',
    },
    // PHP exec/system/passthru/shell_exec
    {
      pattern: /\b(?:exec|system|passthru|shell_exec|popen|proc_open)\s*\(\s*\$/,
      message: 'PHP command execution with variable',
      severity: 'block',
    },
    {
      pattern: /`\s*\$[^`]+`/,  // PHP backtick operator with variable
      message: 'PHP backtick operator with variable',
      severity: 'block',
    },
    // Ruby backticks/system
    {
      pattern: /`[^`]*#\{[^}]+\}[^`]*`/,
      message: 'Ruby backtick with interpolation',
      severity: 'block',
    },
    {
      pattern: /system\s*\(\s*["'][^"']*#\{/,
      message: 'Ruby system() with interpolation',
      severity: 'block',
    },
    // Go exec.Command with variable
    {
      pattern: /exec\.Command\s*\(\s*(?!")[^,)]+/,
      message: 'Go exec.Command with variable',
      severity: 'error',
    },
    // Java Runtime.exec
    {
      pattern: /Runtime\.getRuntime\(\)\.exec\s*\(\s*(?!")[^)]+\)/,
      message: 'Java Runtime.exec() with variable',
      severity: 'block',
    },
    {
      pattern: /ProcessBuilder\s*\([^)]*\+[^)]+\)/,
      message: 'Java ProcessBuilder with concatenation',
      severity: 'error',
    },
    // C# Process.Start
    {
      pattern: /Process\.Start\s*\(\s*(?!")[^,)]+/,
      message: 'C# Process.Start with variable',
      severity: 'error',
    },
    // Template literal in exec
    {
      pattern: /\.exec\s*\(\s*`[^`]*\$\{(?!['"`])/,
      message: 'Template literal with variable in exec()',
      severity: 'block',
    },
    // User input directly in command
    {
      pattern: /exec\s*\([^)]*(?:req\.|request\.|params\.|body\.|query\.)/,
      message: 'User input directly in exec() call',
      severity: 'block',
    },
    // Concatenation in shell command
    {
      pattern: /(?:exec|system|spawn)\s*\(\s*["'][^"']+["']\s*\+/,
      message: 'String concatenation in command execution',
      severity: 'block',
    },
  ];

  // Safe patterns that indicate proper handling
  private safePatterns = [
    /execFile/,                    // execFile is safer than exec
    /spawnSync?\s*\(\s*['"]/,     // spawn with direct string (no shell)
    /escapeshellarg/i,             // PHP escaping
    /escapeshellcmd/i,             // PHP escaping
    /shlex\.quote/,                // Python safe quoting
    /shellescape/i,                // Ruby escaping
    /sanitize.*command/i,          // Custom sanitization
    /whitelist/i,                  // Whitelist approach
    /allowed.*commands/i,          // Allowed commands check
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
      if (this.isComment(line, filename)) {
        continue;
      }

      // Check for dangerous patterns
      for (const { pattern, message, severity } of this.dangerousPatterns) {
        if (pattern.test(line)) {
          issues.push({
            rule: this.name,
            severity,
            message: `Command Injection Risk: ${message}`,
            location: {
              file: filename,
              line: i + 1,
              snippet: line.trim().slice(0, 100),
            },
            suggestion: this.getSuggestion(message, filename),
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

  private isComment(line: string, filename: string): boolean {
    const trimmed = line.trim();

    // Language-specific comment detection
    if (filename.endsWith('.py')) {
      return trimmed.startsWith('#');
    }
    if (filename.endsWith('.rb')) {
      return trimmed.startsWith('#');
    }
    if (filename.endsWith('.php')) {
      return trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*');
    }

    return trimmed.startsWith('//') ||
           trimmed.startsWith('*') ||
           trimmed.startsWith('/*');
  }

  private getSuggestion(message: string, filename: string): string {
    // Node.js suggestions
    if (message.includes('child_process') || message.includes('exec()')) {
      return 'Use execFile() or spawn() without shell option instead of exec(). Validate and whitelist commands.';
    }

    // Python suggestions
    if (message.includes('os.system') || message.includes('os.popen')) {
      return 'Use subprocess.run() with shell=False and pass arguments as a list. Use shlex.quote() for arguments.';
    }
    if (message.includes('subprocess') && message.includes('shell=True')) {
      return 'Remove shell=True and pass command/arguments as a list instead of string.';
    }

    // PHP suggestions
    if (message.includes('PHP')) {
      return 'Use escapeshellarg() for arguments and escapeshellcmd() for commands. Consider using specific functions instead.';
    }

    // Ruby suggestions
    if (message.includes('Ruby')) {
      return 'Use system() with array arguments or Shellwords.escape() for escaping.';
    }

    // Java suggestions
    if (message.includes('Java')) {
      return 'Use ProcessBuilder with separate command and arguments. Never concatenate user input.';
    }

    // Go suggestions
    if (message.includes('Go')) {
      return 'Pass command and arguments separately to exec.Command(). Validate input against whitelist.';
    }

    return 'Never pass user input directly to shell commands. Use parameterized commands or whitelist allowed operations.';
  }
}
