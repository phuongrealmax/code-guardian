// src/modules/latent/diff-editor.ts

/**
 * Diff-Based Editor with Fuzzy Conflict Detection
 *
 * Features:
 * - Fuzzy matching for conflict detection
 * - Confirm policy for risky edits
 * - Better error recovery with rollback
 * - Line-level and hunk-level diffing
 */

import { readFile, writeFile, mkdir, copyFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { Logger } from '../../core/logger.js';

// ═══════════════════════════════════════════════════════════════
//                      TYPES
// ═══════════════════════════════════════════════════════════════

export type ConfirmPolicy = 'auto' | 'prompt' | 'never';

export interface DiffEditorConfig {
  /** Confirm policy for edits */
  confirmPolicy: ConfirmPolicy;

  /** Fuzzy match threshold (0-1), default 0.8 */
  fuzzyThreshold: number;

  /** Create backup before editing */
  createBackup: boolean;

  /** Max lines to show in conflict preview */
  maxConflictPreview: number;

  /** Auto-rollback on failure */
  autoRollback: boolean;
}

export interface DiffHunk {
  /** Original line start (1-indexed) */
  oldStart: number;

  /** Original line count */
  oldCount: number;

  /** New line start (1-indexed) */
  newStart: number;

  /** New line count */
  newCount: number;

  /** Lines in this hunk */
  lines: DiffLine[];

  /** Context before hunk (for fuzzy matching) */
  contextBefore?: string[];

  /** Context after hunk (for fuzzy matching) */
  contextAfter?: string[];
}

export interface DiffLine {
  type: 'context' | 'add' | 'remove';
  content: string;
  lineNumber?: number;
}

export interface ConflictInfo {
  /** Type of conflict */
  type: 'missing_context' | 'modified_content' | 'line_mismatch' | 'file_not_found';

  /** Hunk index where conflict occurred */
  hunkIndex: number;

  /** Expected content */
  expected: string[];

  /** Actual content found */
  actual: string[];

  /** Similarity score (0-1) */
  similarity: number;

  /** Suggested resolution */
  suggestion?: string;

  /** Can be auto-resolved with fuzzy matching */
  canFuzzyResolve: boolean;
}

export interface DiffEditResult {
  /** Success status */
  success: boolean;

  /** Target file */
  target: string;

  /** Backup file path (if created) */
  backupPath?: string;

  /** Conflicts detected */
  conflicts: ConflictInfo[];

  /** Was fuzzy matching used */
  usedFuzzyMatch: boolean;

  /** Lines changed */
  linesAdded: number;
  linesRemoved: number;

  /** Error message if failed */
  error?: string;

  /** Requires user confirmation */
  requiresConfirm: boolean;

  /** Preview of changes */
  preview?: string;
}

export interface ConfirmRequest {
  /** File being edited */
  target: string;

  /** Conflicts found */
  conflicts: ConflictInfo[];

  /** Preview of changes */
  preview: string;

  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high';
}

// ═══════════════════════════════════════════════════════════════
//                      DEFAULT CONFIG
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_DIFF_EDITOR_CONFIG: DiffEditorConfig = {
  confirmPolicy: 'auto',
  fuzzyThreshold: 0.8,
  createBackup: true,
  maxConflictPreview: 10,
  autoRollback: true,
};

// ═══════════════════════════════════════════════════════════════
//                      DIFF EDITOR CLASS
// ═══════════════════════════════════════════════════════════════

export class DiffEditor {
  private config: DiffEditorConfig;
  private pendingConfirms: Map<string, ConfirmRequest> = new Map();

  constructor(
    private projectRoot: string,
    private logger: Logger,
    config?: Partial<DiffEditorConfig>
  ) {
    this.config = { ...DEFAULT_DIFF_EDITOR_CONFIG, ...config };
  }

  /**
   * Apply a unified diff to a file
   */
  async applyDiff(
    target: string,
    diffContent: string,
    options?: { dryRun?: boolean; forceApply?: boolean }
  ): Promise<DiffEditResult> {
    const { dryRun = false, forceApply = false } = options || {};
    const targetPath = join(this.projectRoot, target);

    const result: DiffEditResult = {
      success: false,
      target,
      conflicts: [],
      usedFuzzyMatch: false,
      linesAdded: 0,
      linesRemoved: 0,
      requiresConfirm: false,
    };

    try {
      // Parse the diff
      const hunks = this.parseDiff(diffContent);
      if (hunks.length === 0) {
        result.error = 'No valid hunks found in diff';
        return result;
      }

      // Check if file exists
      if (!existsSync(targetPath)) {
        // Handle new file creation
        if (this.isNewFileDiff(diffContent)) {
          return await this.createNewFile(targetPath, hunks, dryRun, result);
        }
        result.error = `File not found: ${target}`;
        result.conflicts.push({
          type: 'file_not_found',
          hunkIndex: 0,
          expected: [],
          actual: [],
          similarity: 0,
          canFuzzyResolve: false,
        });
        return result;
      }

      // Read current content
      const currentContent = await readFile(targetPath, 'utf-8');
      const currentLines = currentContent.split('\n');

      // Detect conflicts
      const conflicts = this.detectConflicts(currentLines, hunks);
      result.conflicts = conflicts;

      // Check if we need confirmation
      if (conflicts.length > 0 && !forceApply) {
        const canAutoResolve = conflicts.every(c => c.canFuzzyResolve);

        if (this.config.confirmPolicy === 'never') {
          result.error = 'Conflicts detected and confirmPolicy is "never"';
          return result;
        }

        if (this.config.confirmPolicy === 'prompt' || !canAutoResolve) {
          result.requiresConfirm = true;
          result.preview = this.generatePreview(currentLines, hunks, conflicts);

          // Store pending confirm
          this.pendingConfirms.set(target, {
            target,
            conflicts,
            preview: result.preview,
            riskLevel: this.assessRiskLevel(conflicts),
          });

          return result;
        }

        // Auto-resolve with fuzzy matching
        result.usedFuzzyMatch = true;
      }

      // Create backup if configured
      if (this.config.createBackup && !dryRun) {
        result.backupPath = await this.createBackup(targetPath);
      }

      // Apply the diff
      if (!dryRun) {
        const { newContent, added, removed } = this.applyHunks(
          currentLines,
          hunks,
          result.usedFuzzyMatch
        );

        await writeFile(targetPath, newContent.join('\n'));
        result.linesAdded = added;
        result.linesRemoved = removed;
      } else {
        // Dry run - just calculate changes
        const { added, removed } = this.calculateChanges(hunks);
        result.linesAdded = added;
        result.linesRemoved = removed;
        result.preview = this.generatePreview(currentLines, hunks, conflicts);
      }

      result.success = true;
      this.logger.info(`Applied diff to ${target}: +${result.linesAdded}/-${result.linesRemoved}`);
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to apply diff to ${target}: ${result.error}`);

      // Auto-rollback if we have a backup
      if (this.config.autoRollback && result.backupPath) {
        await this.rollback(target);
      }
    }

    return result;
  }

  /**
   * Confirm a pending edit
   */
  async confirmEdit(target: string): Promise<DiffEditResult> {
    const pending = this.pendingConfirms.get(target);
    if (!pending) {
      return {
        success: false,
        target,
        conflicts: [],
        usedFuzzyMatch: false,
        linesAdded: 0,
        linesRemoved: 0,
        requiresConfirm: false,
        error: `No pending confirmation for ${target}`,
      };
    }

    this.pendingConfirms.delete(target);

    // Re-apply with force
    return await this.applyDiff(target, '', { forceApply: true });
  }

  /**
   * Reject a pending edit
   */
  rejectEdit(target: string): boolean {
    return this.pendingConfirms.delete(target);
  }

  /**
   * Rollback to backup
   */
  async rollback(target: string): Promise<boolean> {
    const targetPath = join(this.projectRoot, target);
    const backupPath = this.getBackupPath(targetPath);

    if (!existsSync(backupPath)) {
      this.logger.warn(`No backup found for ${target}`);
      return false;
    }

    try {
      await copyFile(backupPath, targetPath);
      await unlink(backupPath);
      this.logger.info(`Rolled back ${target} from backup`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to rollback ${target}: ${error}`);
      return false;
    }
  }

  /**
   * Parse unified diff into hunks
   */
  parseDiff(diffContent: string): DiffHunk[] {
    const lines = diffContent.split('\n');
    const hunks: DiffHunk[] = [];
    let currentHunk: DiffHunk | null = null;

    for (const line of lines) {
      // Skip file headers
      if (line.startsWith('---') || line.startsWith('+++')) {
        continue;
      }

      // Hunk header
      const hunkMatch = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
      if (hunkMatch) {
        if (currentHunk) {
          hunks.push(currentHunk);
        }
        currentHunk = {
          oldStart: parseInt(hunkMatch[1], 10),
          oldCount: parseInt(hunkMatch[2] || '1', 10),
          newStart: parseInt(hunkMatch[3], 10),
          newCount: parseInt(hunkMatch[4] || '1', 10),
          lines: [],
        };
        continue;
      }

      if (currentHunk) {
        if (line.startsWith('-')) {
          currentHunk.lines.push({
            type: 'remove',
            content: line.substring(1),
          });
        } else if (line.startsWith('+')) {
          currentHunk.lines.push({
            type: 'add',
            content: line.substring(1),
          });
        } else if (line.startsWith(' ') || line === '') {
          currentHunk.lines.push({
            type: 'context',
            content: line.startsWith(' ') ? line.substring(1) : line,
          });
        }
      }
    }

    if (currentHunk) {
      hunks.push(currentHunk);
    }

    return hunks;
  }

  /**
   * Detect conflicts between current content and hunks
   */
  private detectConflicts(currentLines: string[], hunks: DiffHunk[]): ConflictInfo[] {
    const conflicts: ConflictInfo[] = [];

    for (let i = 0; i < hunks.length; i++) {
      const hunk = hunks[i];
      const startIndex = hunk.oldStart - 1;

      // Extract expected context and remove lines
      const expectedLines: string[] = [];
      for (const line of hunk.lines) {
        if (line.type === 'context' || line.type === 'remove') {
          expectedLines.push(line.content);
        }
      }

      // Get actual lines from file
      const actualLines = currentLines.slice(startIndex, startIndex + expectedLines.length);

      // Check for exact match first
      const exactMatch = this.linesMatch(expectedLines, actualLines);
      if (exactMatch) {
        continue; // No conflict
      }

      // Calculate similarity for fuzzy matching
      const similarity = this.calculateSimilarity(expectedLines, actualLines);
      const canFuzzyResolve = similarity >= this.config.fuzzyThreshold;

      conflicts.push({
        type: similarity > 0.5 ? 'modified_content' : 'missing_context',
        hunkIndex: i,
        expected: expectedLines.slice(0, this.config.maxConflictPreview),
        actual: actualLines.slice(0, this.config.maxConflictPreview),
        similarity,
        canFuzzyResolve,
        suggestion: canFuzzyResolve
          ? `Can auto-resolve with ${Math.round(similarity * 100)}% similarity`
          : `Manual review required (${Math.round(similarity * 100)}% similarity)`,
      });
    }

    return conflicts;
  }

  /**
   * Check if two line arrays match exactly
   */
  private linesMatch(expected: string[], actual: string[]): boolean {
    if (expected.length !== actual.length) return false;
    return expected.every((line, i) => line === actual[i]);
  }

  /**
   * Calculate similarity between two line arrays
   */
  private calculateSimilarity(expected: string[], actual: string[]): number {
    if (expected.length === 0 && actual.length === 0) return 1;
    if (expected.length === 0 || actual.length === 0) return 0;

    let matchScore = 0;
    const maxLen = Math.max(expected.length, actual.length);

    for (let i = 0; i < expected.length; i++) {
      if (i < actual.length) {
        matchScore += this.lineSimilarity(expected[i], actual[i]);
      }
    }

    return matchScore / maxLen;
  }

  /**
   * Calculate similarity between two lines using Levenshtein distance
   */
  private lineSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    // Normalize whitespace
    const normA = a.trim().replace(/\s+/g, ' ');
    const normB = b.trim().replace(/\s+/g, ' ');
    if (normA === normB) return 0.95;

    // Levenshtein distance
    const distance = this.levenshteinDistance(normA, normB);
    const maxLen = Math.max(normA.length, normB.length);
    return 1 - distance / maxLen;
  }

  /**
   * Levenshtein distance calculation
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= a.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= b.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[a.length][b.length];
  }

  /**
   * Apply hunks to content
   */
  private applyHunks(
    currentLines: string[],
    hunks: DiffHunk[],
    useFuzzy: boolean
  ): { newContent: string[]; added: number; removed: number } {
    const result = [...currentLines];
    let offset = 0;
    let added = 0;
    let removed = 0;

    for (const hunk of hunks) {
      let lineIndex = hunk.oldStart - 1 + offset;

      // If using fuzzy matching, find best match position
      if (useFuzzy) {
        const contextLines = hunk.lines
          .filter(l => l.type === 'context' || l.type === 'remove')
          .map(l => l.content);
        lineIndex = this.findBestMatchPosition(result, contextLines, lineIndex);
      }

      for (const line of hunk.lines) {
        if (line.type === 'remove') {
          result.splice(lineIndex, 1);
          offset--;
          removed++;
        } else if (line.type === 'add') {
          result.splice(lineIndex, 0, line.content);
          lineIndex++;
          offset++;
          added++;
        } else {
          lineIndex++;
        }
      }
    }

    return { newContent: result, added, removed };
  }

  /**
   * Find best match position using fuzzy matching
   */
  private findBestMatchPosition(
    lines: string[],
    contextLines: string[],
    suggestedStart: number
  ): number {
    const searchRadius = 50; // Search within 50 lines
    let bestPos = suggestedStart;
    let bestScore = 0;

    const start = Math.max(0, suggestedStart - searchRadius);
    const end = Math.min(lines.length, suggestedStart + searchRadius);

    for (let pos = start; pos < end; pos++) {
      const actualLines = lines.slice(pos, pos + contextLines.length);
      const score = this.calculateSimilarity(contextLines, actualLines);
      if (score > bestScore) {
        bestScore = score;
        bestPos = pos;
      }
    }

    return bestPos;
  }

  /**
   * Calculate total changes from hunks
   */
  private calculateChanges(hunks: DiffHunk[]): { added: number; removed: number } {
    let added = 0;
    let removed = 0;

    for (const hunk of hunks) {
      for (const line of hunk.lines) {
        if (line.type === 'add') added++;
        if (line.type === 'remove') removed++;
      }
    }

    return { added, removed };
  }

  /**
   * Generate preview of changes
   */
  private generatePreview(
    currentLines: string[],
    hunks: DiffHunk[],
    conflicts: ConflictInfo[]
  ): string {
    const preview: string[] = [];
    preview.push('=== DIFF PREVIEW ===\n');

    for (let i = 0; i < hunks.length; i++) {
      const hunk = hunks[i];
      const conflict = conflicts.find(c => c.hunkIndex === i);

      preview.push(`--- Hunk ${i + 1} (lines ${hunk.oldStart}-${hunk.oldStart + hunk.oldCount - 1}) ---`);

      if (conflict) {
        preview.push(`[CONFLICT: ${conflict.type}] Similarity: ${Math.round(conflict.similarity * 100)}%`);
        if (conflict.suggestion) {
          preview.push(`Suggestion: ${conflict.suggestion}`);
        }
      }

      for (const line of hunk.lines.slice(0, this.config.maxConflictPreview)) {
        const prefix =
          line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';
        preview.push(`${prefix}${line.content}`);
      }

      if (hunk.lines.length > this.config.maxConflictPreview) {
        preview.push(`... (${hunk.lines.length - this.config.maxConflictPreview} more lines)`);
      }

      preview.push('');
    }

    return preview.join('\n');
  }

  /**
   * Assess risk level of conflicts
   */
  private assessRiskLevel(conflicts: ConflictInfo[]): 'low' | 'medium' | 'high' {
    if (conflicts.length === 0) return 'low';

    const avgSimilarity =
      conflicts.reduce((sum, c) => sum + c.similarity, 0) / conflicts.length;

    if (avgSimilarity >= 0.9) return 'low';
    if (avgSimilarity >= 0.7) return 'medium';
    return 'high';
  }

  /**
   * Check if diff is for new file creation
   */
  private isNewFileDiff(diffContent: string): boolean {
    return diffContent.includes('--- /dev/null') || diffContent.includes('--- a/dev/null');
  }

  /**
   * Create new file from diff
   */
  private async createNewFile(
    targetPath: string,
    hunks: DiffHunk[],
    dryRun: boolean,
    result: DiffEditResult
  ): Promise<DiffEditResult> {
    const lines: string[] = [];

    for (const hunk of hunks) {
      for (const line of hunk.lines) {
        if (line.type === 'add') {
          lines.push(line.content);
          result.linesAdded++;
        }
      }
    }

    if (!dryRun) {
      await mkdir(dirname(targetPath), { recursive: true });
      await writeFile(targetPath, lines.join('\n'));
    }

    result.success = true;
    result.preview = `New file with ${result.linesAdded} lines`;
    return result;
  }

  /**
   * Create backup of file
   */
  private async createBackup(targetPath: string): Promise<string> {
    const backupPath = this.getBackupPath(targetPath);
    await mkdir(dirname(backupPath), { recursive: true });
    await copyFile(targetPath, backupPath);
    return backupPath;
  }

  /**
   * Get backup path for a file
   */
  private getBackupPath(targetPath: string): string {
    const timestamp = Date.now();
    return `${targetPath}.bak.${timestamp}`;
  }

  /**
   * Get pending confirmations
   */
  getPendingConfirms(): Map<string, ConfirmRequest> {
    return this.pendingConfirms;
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<DiffEditorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): DiffEditorConfig {
    return { ...this.config };
  }
}

/**
 * Create a DiffEditor instance
 */
export function createDiffEditor(
  projectRoot: string,
  logger: Logger,
  config?: Partial<DiffEditorConfig>
): DiffEditor {
  return new DiffEditor(projectRoot, logger, config);
}
