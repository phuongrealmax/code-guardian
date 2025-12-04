// src/modules/testing/index.ts
import { TestingService } from './testing.service.js';
import { getTestingTools } from './testing.tools.js';
export class TestingModule {
    service;
    constructor(config, eventBus, logger, projectRoot) {
        this.service = new TestingService(config, eventBus, logger, projectRoot);
    }
    async initialize() {
        await this.service.initialize();
    }
    async shutdown() {
        await this.service.closeAllBrowsers();
    }
    getTools() {
        return getTestingTools();
    }
    async handleTool(toolName, args) {
        switch (toolName) {
            case 'testing_run':
                return this.service.runTests({
                    files: args.files,
                    grep: args.grep,
                    coverage: args.coverage,
                    timeout: args.timeout,
                });
            case 'testing_run_affected':
                return this.service.runAffectedTests(args.files);
            case 'testing_browser_open':
                return { sessionId: await this.service.openBrowser(args.url) };
            case 'testing_browser_screenshot':
                return {
                    path: await this.service.takeScreenshot(args.sessionId, {
                        selector: args.selector,
                        fullPage: args.fullPage,
                    })
                };
            case 'testing_browser_logs':
                return this.service.getConsoleLogs(args.sessionId);
            case 'testing_browser_network':
                return this.service.getNetworkRequests(args.sessionId);
            case 'testing_browser_errors':
                return this.service.getBrowserErrors(args.sessionId);
            case 'testing_browser_close':
                await this.service.closeBrowser(args.sessionId);
                return { closed: true };
            case 'testing_cleanup':
                return this.service.cleanup();
            case 'testing_status':
                return this.service.getStatus();
            default:
                throw new Error(`Unknown testing tool: ${toolName}`);
        }
    }
    getStatus() {
        return this.service.getStatus();
    }
    // ═══════════════════════════════════════════════════════════════
    //                      WRAPPER METHODS
    // ═══════════════════════════════════════════════════════════════
    async runTests(options) {
        return this.service.runTests(options);
    }
    async runAffectedTests(files) {
        return this.service.runAffectedTests(files);
    }
}
export { TestingService } from './testing.service.js';
export { BrowserService } from './browser/browser.service.js';
export { getTestingTools } from './testing.tools.js';
export * from './testing.types.js';
//# sourceMappingURL=index.js.map