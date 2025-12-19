// tests/unit/proof-pack/tdi.service.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  TDIService,
  getTDIService,
  resetTDIService,
  TDICalculationInput,
} from '../../../src/modules/proof-pack/tdi.service.js';

describe('TDIService', () => {
  let testDir: string;
  let service: TDIService;

  beforeEach(() => {
    // Create temp directory for each test
    testDir = join(tmpdir(), `ccg-tdi-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    service = new TDIService(testDir);
    resetTDIService();
  });

  afterEach(() => {
    // Cleanup
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('loadBudgets', () => {
    it('returns default config when budgets.yaml does not exist', () => {
      const config = service.loadBudgets();

      expect(config.tdi.default).toBe(50);
      expect(config.tdi.budgets).toEqual({});
    });

    it('parses budgets.yaml correctly', () => {
      // Create .ccg directory and budgets.yaml
      const ccgDir = join(testDir, '.ccg');
      mkdirSync(ccgDir, { recursive: true });

      const yamlContent = `
tdi:
  default: 40
  budgets:
    "src/api/": 30
    "src/legacy/": 70
`;
      writeFileSync(join(ccgDir, 'budgets.yaml'), yamlContent);

      const config = service.loadBudgets();

      expect(config.tdi.default).toBe(40);
      expect(config.tdi.budgets['src/api/']).toBe(30);
      expect(config.tdi.budgets['src/legacy/']).toBe(70);
    });

    it('handles malformed YAML gracefully', () => {
      const ccgDir = join(testDir, '.ccg');
      mkdirSync(ccgDir, { recursive: true });
      writeFileSync(join(ccgDir, 'budgets.yaml'), 'invalid: yaml: content: [');

      const config = service.loadBudgets();

      // Should return defaults on parse error
      expect(config.tdi.default).toBe(50);
    });
  });

  describe('createDefaultConfig', () => {
    it('creates budgets.yaml with default content', () => {
      service.createDefaultConfig();

      const configPath = join(testDir, '.ccg', 'budgets.yaml');
      expect(existsSync(configPath)).toBe(true);

      const content = readFileSync(configPath, 'utf-8');
      expect(content).toContain('default: 50');
      expect(content).toContain('budgets:');
    });
  });

  describe('getBudgetForPath', () => {
    beforeEach(() => {
      const ccgDir = join(testDir, '.ccg');
      mkdirSync(ccgDir, { recursive: true });
      writeFileSync(join(ccgDir, 'budgets.yaml'), `tdi:
  default: 50
  budgets:
    "src/api/": 30
    "src/legacy/": 70
    "src/core/utils/": 25
`);
      // Create fresh service after config is written
      service = new TDIService(testDir);
    });

    it('returns path-specific budget for matching path', () => {
      const result = service.getBudgetForPath('src/api/handler.ts');

      expect(result.budget).toBe(30);
      expect(result.source).toBe('path-specific');
    });

    it('returns default budget for non-matching path', () => {
      const result = service.getBudgetForPath('src/other/file.ts');

      expect(result.budget).toBe(50);
      expect(result.source).toBe('default');
    });

    it('matches most specific pattern', () => {
      const result = service.getBudgetForPath('src/core/utils/helper.ts');

      // src/core/utils/ is more specific than any other pattern
      expect(result.budget).toBe(25);
      expect(result.source).toBe('path-specific');
    });
  });

  describe('calculateTDI', () => {
    it('calculates TDI score from metrics', () => {
      const input: TDICalculationInput = {
        complexity: 30,
        nesting: 5,
        lines: 200,
        issues: 5,
        coverage: 80,
      };

      const result = service.calculateTDI(input);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.breakdown).toHaveProperty('complexity');
      expect(result.breakdown).toHaveProperty('nesting');
      expect(result.breakdown).toHaveProperty('size');
      expect(result.breakdown).toHaveProperty('issues');
      expect(result.breakdown).toHaveProperty('coverage');
    });

    it('returns 0 for minimal metrics', () => {
      const input: TDICalculationInput = {
        complexity: 0,
        nesting: 0,
        lines: 0,
        issues: 0,
        coverage: 100,
      };

      const result = service.calculateTDI(input);

      expect(result.score).toBe(0);
    });

    it('returns high score for poor metrics', () => {
      const input: TDICalculationInput = {
        complexity: 80,
        nesting: 10,
        lines: 1000,
        issues: 30,
        coverage: 0,
      };

      const result = service.calculateTDI(input);

      expect(result.score).toBeGreaterThan(50);
    });

    it('handles missing coverage gracefully', () => {
      const input: TDICalculationInput = {
        complexity: 30,
        nesting: 5,
        lines: 200,
        issues: 5,
        // coverage is undefined
      };

      const result = service.calculateTDI(input);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.coverage).toBe(0);
    });
  });

  describe('calculateTDIFromComplexity', () => {
    it('calculates TDI from complexity only', () => {
      const score = service.calculateTDIFromComplexity(50);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('returns 0 for low complexity', () => {
      const score = service.calculateTDIFromComplexity(5);

      expect(score).toBe(0);
    });
  });

  describe('checkBudget', () => {
    beforeEach(() => {
      const ccgDir = join(testDir, '.ccg');
      mkdirSync(ccgDir, { recursive: true });
      writeFileSync(join(ccgDir, 'budgets.yaml'), `tdi:
  default: 50
  budgets:
    "src/api/": 30
`);
      // Create fresh service after config is written
      service = new TDIService(testDir);
    });

    it('returns exceeded=false when under budget', () => {
      const result = service.checkBudget('src/api/handler.ts', 25);

      expect(result.exceeded).toBe(false);
      expect(result.margin).toBe(5);  // 30 - 25 = 5
    });

    it('returns exceeded=true when over budget', () => {
      const result = service.checkBudget('src/api/handler.ts', 40);

      expect(result.exceeded).toBe(true);
      expect(result.margin).toBe(-10);  // 30 - 40 = -10
    });

    it('includes correct budget and source', () => {
      const result = service.checkBudget('src/api/handler.ts', 25);

      expect(result.budget).toBe(30);
      expect(result.source).toBe('path-specific');
    });
  });

  describe('createTDIMetrics', () => {
    beforeEach(() => {
      const ccgDir = join(testDir, '.ccg');
      mkdirSync(ccgDir, { recursive: true });
      writeFileSync(join(ccgDir, 'budgets.yaml'), `
tdi:
  default: 50
`);
    });

    it('creates TDIMetrics with before/after delta', () => {
      const before: TDICalculationInput = {
        complexity: 40,
        nesting: 6,
        lines: 300,
        issues: 10,
      };
      const after: TDICalculationInput = {
        complexity: 30,
        nesting: 4,
        lines: 250,
        issues: 5,
      };

      const metrics = service.createTDIMetrics('src/file.ts', before, after);

      expect(metrics.before).toBeGreaterThan(0);
      expect(metrics.after).toBeGreaterThan(0);
      expect(metrics.after).toBeLessThan(metrics.before);  // Improved
      expect(metrics.delta).toBeLessThan(0);  // Negative = improved
      expect(metrics.budget).toBe(50);
      expect(typeof metrics.budgetExceeded).toBe('boolean');
    });
  });

  describe('createTDIMetricsFromScores', () => {
    beforeEach(() => {
      const ccgDir = join(testDir, '.ccg');
      mkdirSync(ccgDir, { recursive: true });
      writeFileSync(join(ccgDir, 'budgets.yaml'), `
tdi:
  default: 50
`);
    });

    it('creates TDIMetrics from raw scores', () => {
      const metrics = service.createTDIMetricsFromScores('src/file.ts', 60, 40);

      expect(metrics.before).toBe(60);
      expect(metrics.after).toBe(40);
      expect(metrics.delta).toBe(-20);
      expect(metrics.budget).toBe(50);
      expect(metrics.budgetExceeded).toBe(false);  // 40 < 50
    });

    it('sets budgetExceeded correctly', () => {
      const metrics = service.createTDIMetricsFromScores('src/file.ts', 40, 60);

      expect(metrics.budgetExceeded).toBe(true);  // 60 > 50
    });
  });

  describe('singleton', () => {
    it('getTDIService returns same instance for same workspace', () => {
      resetTDIService();
      const instance1 = getTDIService();
      const instance2 = getTDIService();

      // Should be same instance when called without workspace path
      expect(instance1).toBe(instance2);
    });

    it('resetTDIService clears singleton', () => {
      resetTDIService();
      const instance1 = getTDIService();
      resetTDIService();
      const instance2 = getTDIService();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('reload', () => {
    it('reloads config from file', () => {
      // Load initial default
      service.loadBudgets();

      // Create new config
      const ccgDir = join(testDir, '.ccg');
      mkdirSync(ccgDir, { recursive: true });
      writeFileSync(join(ccgDir, 'budgets.yaml'), `
tdi:
  default: 75
`);

      // Reload
      const config = service.reload();

      expect(config.tdi.default).toBe(75);
    });
  });
});
