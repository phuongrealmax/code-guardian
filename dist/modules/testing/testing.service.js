// src/modules/testing/testing.service.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, readdirSync, rmSync } from 'fs';
import { join, basename } from 'path';
import { BrowserService } from './browser/browser.service.js';
const execAsync = promisify(exec);
export class TestingService {
    config;
    eventBus;
    logger;
    projectRoot;
    browserService;
    lastResults;
    constructor(config, eventBus, logger, projectRoot = process.cwd()) {
        this.config = config;
        this.eventBus = eventBus;
        this.logger = logger;
        this.projectRoot = projectRoot;
        this.browserService = new BrowserService(config.browser, logger, projectRoot);
    }
    async initialize() {
        if (!this.config.enabled)
            return;
        await this.browserService.initialize();
        this.logger.info('Testing module initialized');
    }
    // ═══════════════════════════════════════════════════════════════
    //                      TEST RUNNING
    // ═══════════════════════════════════════════════════════════════
    async runTests(options = {}) {
        this.eventBus.emit({
            type: 'test:start',
            timestamp: new Date(),
        });
        const command = this.buildTestCommand(options);
        const startTime = Date.now();
        try {
            const { stdout, stderr } = await execAsync(command, {
                cwd: this.projectRoot,
                timeout: (options.timeout || 60) * 1000,
            });
            const results = this.parseTestOutput(stdout, stderr);
            results.duration = Date.now() - startTime;
            this.lastResults = results;
            this.eventBus.emit({
                type: results.failed > 0 ? 'test:fail' : 'test:complete',
                timestamp: new Date(),
                data: { results },
                source: 'TestingService',
            });
            return results;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const results = {
                passed: 0,
                failed: 1,
                skipped: 0,
                duration: Date.now() - startTime,
                tests: [{
                        name: 'Test execution',
                        file: '',
                        status: 'failed',
                        duration: 0,
                        error: errorMessage,
                        assertions: 0,
                    }],
                summary: `Test execution failed: ${errorMessage}`,
            };
            this.lastResults = results;
            this.eventBus.emit({
                type: 'test:fail',
                timestamp: new Date(),
                data: { results },
                source: 'TestingService',
            });
            return results;
        }
    }
    async runAffectedTests(files) {
        // Find test files that correspond to changed files
        const testFiles = this.findRelatedTestFiles(files);
        if (testFiles.length === 0) {
            return {
                passed: 0,
                failed: 0,
                skipped: 0,
                duration: 0,
                tests: [],
                summary: 'No related test files found',
            };
        }
        return this.runTests({ files: testFiles });
    }
    buildTestCommand(options) {
        let command = this.config.testCommand;
        if (options.files && options.files.length > 0) {
            command += ` ${options.files.join(' ')}`;
        }
        if (options.grep) {
            // Detect test runner and add appropriate flag
            if (command.includes('jest')) {
                command += ` -t "${options.grep}"`;
            }
            else if (command.includes('vitest') || command.includes('mocha')) {
                command += ` --grep "${options.grep}"`;
            }
        }
        if (options.coverage) {
            if (command.includes('jest') || command.includes('vitest')) {
                command += ' --coverage';
            }
        }
        return command;
    }
    parseTestOutput(stdout, stderr) {
        const output = stdout + stderr;
        const tests = [];
        let passed = 0;
        let failed = 0;
        let skipped = 0;
        // Try to parse Jest/Vitest output
        const passMatch = output.match(/(\d+)\s+pass(?:ed|ing)?/i);
        const failMatch = output.match(/(\d+)\s+fail(?:ed|ing)?/i);
        const skipMatch = output.match(/(\d+)\s+skip(?:ped)?/i);
        if (passMatch)
            passed = parseInt(passMatch[1], 10);
        if (failMatch)
            failed = parseInt(failMatch[1], 10);
        if (skipMatch)
            skipped = parseInt(skipMatch[1], 10);
        // Parse individual test results
        const testLines = output.match(/(?:✓|✗|○|●)\s+(.+?)(?:\s+\((\d+)\s*ms\))?$/gm) || [];
        for (const line of testLines) {
            const isPassed = line.includes('✓') || line.includes('●');
            const isFailed = line.includes('✗');
            const nameMatch = line.match(/(?:✓|✗|○|●)\s+(.+?)(?:\s+\((\d+)\s*ms\))?$/);
            if (nameMatch) {
                tests.push({
                    name: nameMatch[1].trim(),
                    file: '',
                    status: isPassed ? 'passed' : isFailed ? 'failed' : 'skipped',
                    duration: nameMatch[2] ? parseInt(nameMatch[2], 10) : 0,
                    assertions: 1,
                });
            }
        }
        // Parse coverage if present
        let coverage;
        const coverageMatch = output.match(/All files.*?\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/);
        if (coverageMatch) {
            coverage = {
                statements: parseFloat(coverageMatch[1]),
                branches: parseFloat(coverageMatch[2]),
                functions: parseFloat(coverageMatch[3]),
                lines: parseFloat(coverageMatch[4]),
            };
        }
        const summary = `${passed} passed, ${failed} failed, ${skipped} skipped`;
        return {
            passed,
            failed,
            skipped,
            duration: 0,
            tests,
            coverage,
            summary,
        };
    }
    findRelatedTestFiles(files) {
        const testFiles = [];
        for (const file of files) {
            const baseName = basename(file).replace(/\.(ts|tsx|js|jsx)$/, '');
            // Common test file patterns
            const patterns = [
                `${baseName}.test.ts`,
                `${baseName}.test.tsx`,
                `${baseName}.test.js`,
                `${baseName}.spec.ts`,
                `${baseName}.spec.tsx`,
                `${baseName}.spec.js`,
                `__tests__/${baseName}.ts`,
                `__tests__/${baseName}.tsx`,
            ];
            // Check if any test files exist
            for (const pattern of patterns) {
                const testPath = join(this.projectRoot, pattern);
                if (existsSync(testPath)) {
                    testFiles.push(pattern);
                }
            }
        }
        return [...new Set(testFiles)];
    }
    // ═══════════════════════════════════════════════════════════════
    //                      BROWSER TESTING
    // ═══════════════════════════════════════════════════════════════
    async openBrowser(url) {
        return this.browserService.openPage(url);
    }
    async takeScreenshot(sessionId, options) {
        return this.browserService.takeScreenshot(sessionId, options);
    }
    async getConsoleLogs(sessionId) {
        return this.browserService.getConsoleLogs(sessionId);
    }
    async getNetworkRequests(sessionId) {
        return this.browserService.getNetworkRequests(sessionId);
    }
    async getBrowserErrors(sessionId) {
        return this.browserService.getErrors(sessionId);
    }
    async closeBrowser(sessionId) {
        return this.browserService.closePage(sessionId);
    }
    async closeAllBrowsers() {
        return this.browserService.closeAll();
    }
    // ═══════════════════════════════════════════════════════════════
    //                      TEST CLEANUP
    // ═══════════════════════════════════════════════════════════════
    async cleanup() {
        if (!this.config.cleanup.autoCleanTestData) {
            return { filesRemoved: 0, dataCleared: 0, locations: [] };
        }
        let filesRemoved = 0;
        const dataCleared = 0;
        const cleanedLocations = [];
        const prefix = this.config.cleanup.testDataPrefix;
        const locations = this.config.cleanup.testDataLocations;
        for (const location of locations) {
            const fullPath = join(this.projectRoot, location);
            if (!existsSync(fullPath))
                continue;
            try {
                const files = readdirSync(fullPath);
                for (const file of files) {
                    if (file.startsWith(prefix) || file.includes('test') || file.includes('mock')) {
                        const filePath = join(fullPath, file);
                        try {
                            rmSync(filePath, { recursive: true, force: true });
                            filesRemoved++;
                        }
                        catch {
                            this.logger.warn(`Failed to remove: ${filePath}`);
                        }
                    }
                }
                cleanedLocations.push(location);
            }
            catch {
                this.logger.warn(`Failed to clean location: ${location}`);
            }
        }
        this.logger.info(`Test cleanup: ${filesRemoved} files removed from ${cleanedLocations.length} locations`);
        return {
            filesRemoved,
            dataCleared,
            locations: cleanedLocations,
        };
    }
    // ═══════════════════════════════════════════════════════════════
    //                      STATUS
    // ═══════════════════════════════════════════════════════════════
    getStatus() {
        return {
            enabled: this.config.enabled,
            lastResults: this.lastResults,
            browserSessions: this.browserService.getActiveSessions().length,
        };
    }
    getLastResults() {
        return this.lastResults;
    }
}
//# sourceMappingURL=testing.service.js.map