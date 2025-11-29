import { describe, it, expect, beforeEach } from 'vitest';
import { GuardService } from '../../src/modules/guard/guard.service.js';
import { EventBus } from '../../src/core/event-bus.js';
import { Logger } from '../../src/core/logger.js';

// Mock dependencies
const mockEventBus = new EventBus();
const mockLogger = new Logger('silent');

describe('GuardService', () => {
  let guardService: GuardService;

  beforeEach(async () => {
    guardService = new GuardService({
      enabled: true,
      strictMode: true,
      rules: {
        blockFakeTests: true,
        blockDisabledFeatures: true,
        blockEmptyCatch: true,
        blockEmojiInCode: true,
        blockSwallowedExceptions: true,
      },
    }, mockEventBus, mockLogger);
    await guardService.initialize();
  });

  describe('EmptyCatchRule', () => {
    it('should detect empty catch blocks', async () => {
      const code = `
        try {
          doSomething();
        } catch (e) {}
      `;
      const result = await guardService.validate(code, 'test.ts');

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].rule).toBe('empty-catch');
      expect(result.issues[0].message).toContain('Empty catch block');
    });

    it('should allow catch blocks with error logging', async () => {
      const code = `
        try {
          doSomething();
        } catch (e) { console.error(e); }
      `;
      const result = await guardService.validate(code, 'test.ts');
      const emptyCatchIssues = result.issues.filter(i => i.rule === 'empty-catch');
      expect(emptyCatchIssues).toHaveLength(0);
    });

    it('should allow catch blocks with throw', async () => {
      const code = `
        try {
          doSomething();
        } catch (e) { throw new Error('Failed'); }
      `;
      const result = await guardService.validate(code, 'test.ts');
      const emptyCatchIssues = result.issues.filter(i => i.rule === 'empty-catch');
      expect(emptyCatchIssues).toHaveLength(0);
    });

    it('should detect Promise .catch with empty handler', async () => {
      const code = `
        fetch('/api').catch(() => {});
      `;
      const result = await guardService.validate(code, 'test.ts');
      const emptyCatchIssues = result.issues.filter(i => i.rule === 'empty-catch');
      expect(emptyCatchIssues.length).toBeGreaterThan(0);
    });
  });

  describe('FakeTestRule', () => {
    it('should detect tests without assertions', async () => {
      const code = `
        it('should do something', () => {
          const a = 1 + 1;
        });
      `;
      const result = await guardService.validate(code, 'app.test.ts');

      // FakeTestRule uses severity='block', so in strictMode it should block
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].message).toContain('no assertions');
    });

    it('should pass valid tests with expect()', async () => {
      const code = `
        it('should do something', () => {
          expect(1 + 1).toBe(2);
        });
      `;
      const result = await guardService.validate(code, 'app.test.ts');
      const fakeTestIssues = result.issues.filter(i => i.rule === 'fake-test');
      expect(fakeTestIssues).toHaveLength(0);
    });

    it('should pass valid tests with assert()', async () => {
      const code = `
        test('should calculate correctly', () => {
          assert.equal(2 + 2, 4);
        });
      `;
      const result = await guardService.validate(code, 'app.test.ts');
      const fakeTestIssues = result.issues.filter(i => i.rule === 'fake-test');
      expect(fakeTestIssues).toHaveLength(0);
    });

    it('should skip tests marked as skipped', async () => {
      const code = `
        it.skip('should do something', () => {
          const a = 1 + 1;
        });
      `;
      const result = await guardService.validate(code, 'app.test.ts');
      const fakeTestIssues = result.issues.filter(i => i.rule === 'fake-test');
      expect(fakeTestIssues).toHaveLength(0);
    });
  });

  describe('EmojiCodeRule', () => {
    it('should detect emoji in code', async () => {
      const code = `const message = "Hello";`;
      const result = await guardService.validate(code, 'app.ts');
      // Should pass because no emoji
      const emojiIssues = result.issues.filter(i => i.rule === 'emoji-code');
      expect(emojiIssues).toHaveLength(0);
    });

    it('should detect emoji in string literals', async () => {
      const code = `const message = "Hello \u{1F680}";`;
      const result = await guardService.validate(code, 'app.ts');

      const emojiIssues = result.issues.filter(i => i.rule === 'emoji-code');
      expect(emojiIssues.length).toBeGreaterThan(0);
    });

    it('should skip markdown files', async () => {
      const code = `# Hello \u{1F680} World`;
      const result = await guardService.validate(code, 'README.md');
      const emojiIssues = result.issues.filter(i => i.rule === 'emoji-code');
      expect(emojiIssues).toHaveLength(0);
    });
  });

  describe('Rule Management', () => {
    it('should list available rules', () => {
      const rules = guardService.getRules();
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.some(r => r.name === 'empty-catch')).toBe(true);
      expect(rules.some(r => r.name === 'fake-test')).toBe(true);
      expect(rules.some(r => r.name === 'emoji-code')).toBe(true);
    });

    it('should enable/disable rules', () => {
      const success = guardService.setRuleEnabled('empty-catch', false);
      expect(success).toBe(true);

      const rules = guardService.getRules();
      const emptyCatchRule = rules.find(r => r.name === 'empty-catch');
      expect(emptyCatchRule?.enabled).toBe(false);
    });

    it('should return false for unknown rules', () => {
      const success = guardService.setRuleEnabled('unknown-rule', true);
      expect(success).toBe(false);
    });
  });

  describe('Module Status', () => {
    it('should return correct status', async () => {
      // Run a validation first
      await guardService.validate('const x = 1;', 'test.ts');

      const status = guardService.getStatus();
      expect(status.enabled).toBe(true);
      expect(status.strictMode).toBe(true);
      expect(status.rules.length).toBeGreaterThan(0);
      expect(status.stats.validationsRun).toBe(1);
    });
  });
});

describe('GuardService - Disabled', () => {
  it('should skip validation when disabled', async () => {
    const guardService = new GuardService({
      enabled: false,
      strictMode: true,
      rules: {
        blockFakeTests: true,
        blockDisabledFeatures: true,
        blockEmptyCatch: true,
        blockEmojiInCode: true,
        blockSwallowedExceptions: true,
      },
    }, mockEventBus, mockLogger);
    await guardService.initialize();

    const code = `try {} catch (e) {}`;
    const result = await guardService.validate(code, 'test.ts');

    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });
});
