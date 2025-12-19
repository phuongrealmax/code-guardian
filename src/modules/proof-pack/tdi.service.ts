// src/modules/proof-pack/tdi.service.ts
// TDI (Technical Debt Index) Service - Budget Calculation & Gate Logic
//
// Reference: SPRINT1_BACKLOG.md Task 9-10, IMPLEMENTATION_CHECKLIST.md 1.2.1

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, relative, normalize } from 'node:path';
import { TDIMetrics } from './proof-pack.types.js';

// ═══════════════════════════════════════════════════════════════
//                 BUDGET CONFIGURATION TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Budget configuration from .ccg/budgets.yaml
 *
 * Example:
 * ```yaml
 * tdi:
 *   default: 50
 *   budgets:
 *     "src/api/": 40
 *     "src/legacy/": 70
 *     "src/core/": 30
 * ```
 */
export interface BudgetConfig {
  tdi: {
    default: number;
    budgets: Record<string, number>;  // path pattern -> max TDI budget
  };
}

/**
 * TDI calculation input from code analysis
 */
export interface TDICalculationInput {
  complexity: number;       // Cyclomatic complexity score (0-100)
  nesting: number;          // Max nesting depth
  lines: number;            // Lines of code
  issues: number;           // Number of issues found
  coverage?: number;        // Test coverage (0-100)
}

/**
 * TDI calculation result
 */
export interface TDICalculationResult {
  score: number;            // 0-100, lower is better
  breakdown: {
    complexity: number;     // Contribution from complexity
    nesting: number;        // Contribution from nesting depth
    size: number;           // Contribution from file size
    issues: number;         // Contribution from issues
    coverage: number;       // Contribution from low coverage
  };
}

/**
 * Budget check result
 */
export interface BudgetCheckResult {
  path: string;
  tdiScore: number;
  budget: number;
  exceeded: boolean;
  margin: number;           // How much under/over budget
  source: 'path-specific' | 'default';
}

// ═══════════════════════════════════════════════════════════════
//                 DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  tdi: {
    default: 50,
    budgets: {}
  }
};

// TDI calculation weights (must sum to 100)
const TDI_WEIGHTS = {
  complexity: 35,   // Cyclomatic complexity weight
  nesting: 20,      // Nesting depth weight
  size: 15,         // File size weight
  issues: 20,       // Issues count weight
  coverage: 10      // Coverage weight (inverse - low coverage = higher TDI)
};

// Thresholds for normalization
const THRESHOLDS = {
  complexity: { low: 10, high: 50 },    // Normalized 0-100
  nesting: { low: 3, high: 8 },         // Depth levels
  lines: { low: 100, high: 500 },       // Lines of code
  issues: { low: 0, high: 20 },         // Issue count
  coverage: { low: 80, high: 50 }       // Inverse: <50% = bad
};

// ═══════════════════════════════════════════════════════════════
//                 TDI SERVICE CLASS
// ═══════════════════════════════════════════════════════════════

export class TDIService {
  private budgetConfig: BudgetConfig = DEFAULT_BUDGET_CONFIG;
  private configPath: string;
  private loaded = false;

  constructor(private workspacePath: string = process.cwd()) {
    this.configPath = join(workspacePath, '.ccg', 'budgets.yaml');
  }

  // ─────────────────────────────────────────────────────────────
  //                 BUDGET LOADING
  // ─────────────────────────────────────────────────────────────

  /**
   * Load budget configuration from .ccg/budgets.yaml
   * Creates default config if file doesn't exist
   */
  loadBudgets(): BudgetConfig {
    if (this.loaded) {
      return this.budgetConfig;
    }

    if (existsSync(this.configPath)) {
      try {
        const content = readFileSync(this.configPath, 'utf-8');
        const parsed = this.parseYaml(content);
        this.budgetConfig = this.validateConfig(parsed);
      } catch (error) {
        // Use default on parse error
        console.warn(`[TDI] Failed to parse ${this.configPath}, using defaults:`, error);
        this.budgetConfig = DEFAULT_BUDGET_CONFIG;
      }
    } else {
      this.budgetConfig = DEFAULT_BUDGET_CONFIG;
    }

    this.loaded = true;
    return this.budgetConfig;
  }

  /**
   * Create default budgets.yaml configuration file
   */
  createDefaultConfig(): void {
    const dir = dirname(this.configPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const defaultYaml = `# CCG TDI Budget Configuration
# Lower TDI = lower technical debt, aim for < 50

tdi:
  default: 50
  budgets:
    # Example path-specific budgets:
    # "src/api/": 40
    # "src/legacy/": 70
    # "src/core/": 30
`;

    writeFileSync(this.configPath, defaultYaml, 'utf-8');
  }

  /**
   * Get budget for a specific file path
   * Matches the most specific path pattern first
   */
  getBudgetForPath(filePath: string): { budget: number; source: 'path-specific' | 'default' } {
    this.loadBudgets();

    // Normalize path to use forward slashes
    let checkPath = filePath.replace(/\\/g, '/');

    // If absolute path, try to make it relative to workspace
    const normalizedWorkspace = this.workspacePath.replace(/\\/g, '/');
    if (checkPath.startsWith(normalizedWorkspace)) {
      checkPath = checkPath.slice(normalizedWorkspace.length);
      if (checkPath.startsWith('/')) {
        checkPath = checkPath.slice(1);
      }
    }

    // Find most specific matching pattern
    let matchedBudget: number | null = null;
    let matchedLength = 0;

    for (const [pattern, budget] of Object.entries(this.budgetConfig.tdi.budgets)) {
      const normalizedPattern = pattern.replace(/\\/g, '/');

      if (checkPath.startsWith(normalizedPattern) && normalizedPattern.length > matchedLength) {
        matchedBudget = budget;
        matchedLength = normalizedPattern.length;
      }
    }

    if (matchedBudget !== null) {
      return { budget: matchedBudget, source: 'path-specific' };
    }

    return { budget: this.budgetConfig.tdi.default, source: 'default' };
  }

  // ─────────────────────────────────────────────────────────────
  //                 TDI CALCULATION
  // ─────────────────────────────────────────────────────────────

  /**
   * Calculate TDI score from code metrics
   * Score range: 0-100 (lower is better)
   */
  calculateTDI(input: TDICalculationInput): TDICalculationResult {
    const breakdown = {
      complexity: this.normalizeMetric(
        input.complexity,
        THRESHOLDS.complexity.low,
        THRESHOLDS.complexity.high
      ) * (TDI_WEIGHTS.complexity / 100),

      nesting: this.normalizeMetric(
        input.nesting,
        THRESHOLDS.nesting.low,
        THRESHOLDS.nesting.high
      ) * (TDI_WEIGHTS.nesting / 100),

      size: this.normalizeMetric(
        input.lines,
        THRESHOLDS.lines.low,
        THRESHOLDS.lines.high
      ) * (TDI_WEIGHTS.size / 100),

      issues: this.normalizeMetric(
        input.issues,
        THRESHOLDS.issues.low,
        THRESHOLDS.issues.high
      ) * (TDI_WEIGHTS.issues / 100),

      // Coverage is inverse: high coverage = low TDI contribution
      coverage: input.coverage !== undefined
        ? this.normalizeMetric(
            100 - input.coverage,  // Invert: 0% coverage = 100, 100% coverage = 0
            100 - THRESHOLDS.coverage.low,
            100 - THRESHOLDS.coverage.high
          ) * (TDI_WEIGHTS.coverage / 100)
        : 0  // No coverage data = no contribution
    };

    const score = Math.round(
      breakdown.complexity +
      breakdown.nesting +
      breakdown.size +
      breakdown.issues +
      breakdown.coverage
    );

    return {
      score: Math.min(100, Math.max(0, score)),
      breakdown: {
        complexity: Math.round(breakdown.complexity),
        nesting: Math.round(breakdown.nesting),
        size: Math.round(breakdown.size),
        issues: Math.round(breakdown.issues),
        coverage: Math.round(breakdown.coverage)
      }
    };
  }

  /**
   * Quick TDI calculation from complexity score only
   * Useful when only complexity is available
   */
  calculateTDIFromComplexity(complexity: number): number {
    const result = this.calculateTDI({
      complexity,
      nesting: 0,
      lines: 0,
      issues: 0
    });
    return result.score;
  }

  // ─────────────────────────────────────────────────────────────
  //                 BUDGET CHECKING
  // ─────────────────────────────────────────────────────────────

  /**
   * Check if TDI exceeds budget for a file
   */
  checkBudget(filePath: string, tdiScore: number): BudgetCheckResult {
    const { budget, source } = this.getBudgetForPath(filePath);

    return {
      path: filePath,
      tdiScore,
      budget,
      exceeded: tdiScore > budget,
      margin: budget - tdiScore,
      source
    };
  }

  /**
   * Create TDIMetrics for ProofPack from before/after analysis
   */
  createTDIMetrics(
    filePath: string,
    before: TDICalculationInput,
    after: TDICalculationInput
  ): TDIMetrics {
    const beforeResult = this.calculateTDI(before);
    const afterResult = this.calculateTDI(after);
    const { budget } = this.getBudgetForPath(filePath);

    return {
      before: beforeResult.score,
      after: afterResult.score,
      delta: afterResult.score - beforeResult.score,
      budget,
      budgetExceeded: afterResult.score > budget
    };
  }

  /**
   * Create TDIMetrics from raw scores (for simpler use cases)
   */
  createTDIMetricsFromScores(
    filePath: string,
    beforeScore: number,
    afterScore: number
  ): TDIMetrics {
    const { budget } = this.getBudgetForPath(filePath);

    return {
      before: beforeScore,
      after: afterScore,
      delta: afterScore - beforeScore,
      budget,
      budgetExceeded: afterScore > budget
    };
  }

  // ─────────────────────────────────────────────────────────────
  //                 PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────

  /**
   * Normalize a metric value to 0-100 scale
   */
  private normalizeMetric(value: number, low: number, high: number): number {
    if (value <= low) return 0;
    if (value >= high) return 100;
    return ((value - low) / (high - low)) * 100;
  }

  /**
   * Simple YAML parser for budget config
   * Handles basic YAML structure without external dependencies
   */
  private parseYaml(content: string): unknown {
    const result: Record<string, unknown> = {};
    const lines = content.split('\n');
    let inTdi = false;
    let inBudgets = false;
    let tdiSection: Record<string, unknown> = {};

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (trimmed.startsWith('#') || trimmed === '') continue;

      // Calculate indentation level
      const indent = line.length - line.trimStart().length;

      // Handle top-level "tdi:" key
      if (indent === 0 && trimmed === 'tdi:') {
        inTdi = true;
        inBudgets = false;
        tdiSection = { budgets: {} };
        result.tdi = tdiSection;
        continue;
      }

      // Reset if we hit another top-level key
      if (indent === 0 && trimmed.endsWith(':') && trimmed !== 'tdi:') {
        inTdi = false;
        inBudgets = false;
        continue;
      }

      // Handle tdi section content (indent = 2)
      if (inTdi && indent === 2) {
        if (trimmed === 'budgets:') {
          inBudgets = true;
          continue;
        }

        // Parse "default: 50"
        const defaultMatch = trimmed.match(/^default:\s*(\d+)$/);
        if (defaultMatch) {
          tdiSection.default = parseInt(defaultMatch[1], 10);
          continue;
        }
      }

      // Handle budget entries (indent = 4 or more)
      if (inTdi && inBudgets && indent >= 4) {
        // Parse: "src/api/": 30  OR  src/api/: 30
        const budgetMatch = trimmed.match(/^["']?([^"':]+)["']?\s*:\s*(\d+)$/);
        if (budgetMatch) {
          const pathKey = budgetMatch[1].trim();
          const budgetValue = parseInt(budgetMatch[2], 10);
          (tdiSection.budgets as Record<string, number>)[pathKey] = budgetValue;
        }
      }
    }

    return result;
  }

  /**
   * Validate parsed config and merge with defaults
   */
  private validateConfig(parsed: unknown): BudgetConfig {
    const config = parsed as Record<string, unknown>;

    if (!config.tdi || typeof config.tdi !== 'object') {
      return DEFAULT_BUDGET_CONFIG;
    }

    const tdi = config.tdi as Record<string, unknown>;

    return {
      tdi: {
        default: typeof tdi.default === 'number' ? tdi.default : DEFAULT_BUDGET_CONFIG.tdi.default,
        budgets: typeof tdi.budgets === 'object' && tdi.budgets !== null
          ? tdi.budgets as Record<string, number>
          : {}
      }
    };
  }

  /**
   * Reload budgets from file (useful after config changes)
   */
  reload(): BudgetConfig {
    this.loaded = false;
    return this.loadBudgets();
  }

  /**
   * Get current budget configuration
   */
  getConfig(): BudgetConfig {
    return this.loadBudgets();
  }
}

// ═══════════════════════════════════════════════════════════════
//                 SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════

let defaultInstance: TDIService | null = null;

/**
 * Get or create default TDI service instance
 */
export function getTDIService(workspacePath?: string): TDIService {
  if (!defaultInstance || (workspacePath && workspacePath !== process.cwd())) {
    defaultInstance = new TDIService(workspacePath);
  }
  return defaultInstance;
}

/**
 * Reset the default instance (useful for testing)
 */
export function resetTDIService(): void {
  defaultInstance = null;
}
