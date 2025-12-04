// src/modules/guard/rules/prompt-injection.rule.ts

import { ValidationIssue } from '../../../core/types.js';
import { IGuardRule, RuleCategory } from '../guard.types.js';

// ═══════════════════════════════════════════════════════════════
//                      PROMPT INJECTION RULE
// ═══════════════════════════════════════════════════════════════

/**
 * Detects potential Prompt Injection vulnerabilities in AI/LLM applications.
 * This rule checks for patterns that could allow users to manipulate AI prompts.
 *
 * Categories:
 * 1. Direct injection - User input directly in prompts
 * 2. Indirect injection - Data from external sources in prompts
 * 3. Jailbreak attempts - Patterns that try to bypass AI restrictions
 */
export class PromptInjectionRule implements IGuardRule {
  name = 'prompt-injection';
  enabled = true;
  description = 'Detects potential prompt injection vulnerabilities in AI/LLM code';
  category: RuleCategory = 'security';

  // Patterns that indicate vulnerable prompt construction
  private dangerousPatterns: Array<{ pattern: RegExp; message: string; severity: 'error' | 'block' }> = [
    // Direct user input in prompt template
    {
      pattern: /prompt\s*[=:+]\s*.*(?:req\.|request\.|params\.|body\.|query\.|user(?:Input|Message|Query))/i,
      message: 'User input directly concatenated into prompt',
      severity: 'block',
    },
    // Template literal with user input
    {
      pattern: /(?:prompt|message|instruction)\s*=\s*`[^`]*\$\{(?:req\.|request\.|user|input)/i,
      message: 'User input in prompt template literal',
      severity: 'block',
    },
    // OpenAI API with unvalidated content
    {
      pattern: /content\s*:\s*(?:req\.|request\.|params\.|body\.|query\.)/,
      message: 'Direct user input in OpenAI message content',
      severity: 'error',
    },
    // f-string in Python with user input
    {
      pattern: /f["'].*(?:system|user|assistant).*\{(?:user|input|request|query)/i,
      message: 'Python f-string prompt with user input',
      severity: 'block',
    },
    // .format() with user input
    {
      pattern: /(?:prompt|message).*\.format\s*\([^)]*(?:user|input|request)/i,
      message: 'String format with user input in prompt',
      severity: 'error',
    },
    // Langchain with user input
    {
      pattern: /(?:PromptTemplate|ChatPromptTemplate).*input_variables.*(?:user|query|question)/i,
      message: 'LangChain prompt with potentially unsafe input variable',
      severity: 'error',
    },
    // Anthropic Claude API
    {
      pattern: /human\s*:\s*(?:req\.|request\.|user)/i,
      message: 'Direct user input in Claude Human message',
      severity: 'error',
    },
    // System prompt modification
    {
      pattern: /(?:system|instruction)\s*(?:prompt|message)\s*[=+:].*(?:req\.|request\.|user)/i,
      message: 'User input potentially modifying system prompt',
      severity: 'block',
    },
    // Concatenation with + operator
    {
      pattern: /(?:prompt|message|instruction)\s*\+\s*=?\s*(?:req\.|request\.|user|input)/i,
      message: 'User input concatenated to prompt',
      severity: 'block',
    },
    // No sanitization before AI call
    {
      pattern: /(?:openai|anthropic|cohere|ai21).*(?:create|complete|generate)\s*\([^)]*(?:req\.|body\.)/i,
      message: 'AI API call with unsanitized user input',
      severity: 'error',
    },
    // Embedding user content in messages array
    {
      pattern: /messages\s*:\s*\[[^\]]*\{\s*(?:role|content)\s*:.*(?:req\.|request\.)/i,
      message: 'User input directly in messages array',
      severity: 'error',
    },
  ];

  // Jailbreak/manipulation patterns in prompts or user input
  private jailbreakPatterns: Array<{ pattern: RegExp; message: string }> = [
    {
      pattern: /ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions/i,
      message: 'Potential jailbreak: "ignore previous instructions"',
    },
    {
      pattern: /disregard\s+(?:your|all)\s+(?:rules|guidelines|instructions)/i,
      message: 'Potential jailbreak: "disregard rules"',
    },
    {
      pattern: /you\s+are\s+now\s+(?:a|an)\s+(?:new|different)/i,
      message: 'Potential jailbreak: role reassignment',
    },
    {
      pattern: /pretend\s+(?:you\s+are|to\s+be)\s+(?:a|an)/i,
      message: 'Potential jailbreak: pretend prompt',
    },
    {
      pattern: /forget\s+(?:everything|all|your)\s+(?:you|previous|training)/i,
      message: 'Potential jailbreak: forget training',
    },
    {
      pattern: /system\s*:\s*['"]/,
      message: 'Potential jailbreak: embedded system prompt',
    },
    {
      pattern: /\[\s*SYSTEM\s*\]/i,
      message: 'Potential jailbreak: system tag injection',
    },
    {
      pattern: /DAN\s+mode|jailbreak|bypass\s+(?:filter|restriction)/i,
      message: 'Potential jailbreak: explicit bypass attempt',
    },
    {
      pattern: /\{\{.*\}\}.*\{\{/,
      message: 'Potential template injection: multiple brackets',
    },
    {
      pattern: /\<\|.*\|\>/,
      message: 'Potential injection: special delimiters',
    },
  ];

  // Safe patterns indicating proper handling
  private safePatterns = [
    /sanitize(?:Prompt|Input|Message)/i,
    /escape(?:Prompt|Input)/i,
    /validate(?:Prompt|Input|UserMessage)/i,
    /filterInput/i,
    /cleanUserInput/i,
    /promptInjection(?:Guard|Filter|Check)/i,
    /guardrails/i,
    /contentFilter/i,
    /moderationCheck/i,
    /inputValidation/i,
  ];

  validate(code: string, filename: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const lines = code.split('\n');

    // Skip non-AI related files (heuristic)
    if (!this.isAiRelatedFile(code, filename)) {
      return issues;
    }

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

      // Check for dangerous construction patterns
      for (const { pattern, message, severity } of this.dangerousPatterns) {
        if (pattern.test(line)) {
          issues.push({
            rule: this.name,
            severity,
            message: `Prompt Injection Risk: ${message}`,
            location: {
              file: filename,
              line: i + 1,
              snippet: line.trim().slice(0, 100),
            },
            suggestion: 'Sanitize user input before including in prompts. Use dedicated input validation and consider content filtering.',
            autoFixable: false,
          });
          break;
        }
      }

      // Check for jailbreak patterns (in string literals that might be prompts)
      if (this.containsStringLiteral(line)) {
        for (const { pattern, message } of this.jailbreakPatterns) {
          if (pattern.test(line)) {
            issues.push({
              rule: this.name,
              severity: 'error',
              message: `Potential Jailbreak: ${message}`,
              location: {
                file: filename,
                line: i + 1,
                snippet: line.trim().slice(0, 100),
              },
              suggestion: 'Review this content for prompt injection attempts. If from user input, implement content filtering.',
              autoFixable: false,
            });
            break;
          }
        }
      }
    }

    return issues;
  }

  /**
   * Validate user input for prompt injection patterns
   * Can be called directly for runtime validation
   */
  validateUserInput(input: string): { safe: boolean; issues: string[] } {
    const issues: string[] = [];

    for (const { pattern, message } of this.jailbreakPatterns) {
      if (pattern.test(input)) {
        issues.push(message);
      }
    }

    return {
      safe: issues.length === 0,
      issues,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  //                      PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════

  private isAiRelatedFile(code: string, filename: string): boolean {
    // Check filename patterns
    const aiFilePatterns = [
      /ai/i, /llm/i, /gpt/i, /claude/i, /chat/i, /prompt/i,
      /agent/i, /assistant/i, /bot/i, /completion/i,
    ];

    if (aiFilePatterns.some(p => p.test(filename))) {
      return true;
    }

    // Check code content for AI-related imports/usage
    const aiCodePatterns = [
      /openai/i, /anthropic/i, /langchain/i, /cohere/i,
      /ChatCompletion/i, /createCompletion/i, /PromptTemplate/i,
      /gpt-3|gpt-4|claude|palm/i, /embedding/i,
    ];

    return aiCodePatterns.some(p => p.test(code));
  }

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
           trimmed.startsWith('"""') ||
           trimmed.startsWith("'''");
  }

  private containsStringLiteral(line: string): boolean {
    return /['"`]/.test(line);
  }
}
