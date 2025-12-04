import { TestingModuleConfig } from '../../core/types.js';
import { EventBus } from '../../core/event-bus.js';
import { Logger } from '../../core/logger.js';
import { TestResults, TestRunOptions, TestCleanupResult, TestingModuleStatus } from './testing.types.js';
export declare class TestingService {
    private config;
    private eventBus;
    private logger;
    private projectRoot;
    private browserService;
    private lastResults?;
    constructor(config: TestingModuleConfig, eventBus: EventBus, logger: Logger, projectRoot?: string);
    initialize(): Promise<void>;
    runTests(options?: TestRunOptions): Promise<TestResults>;
    runAffectedTests(files: string[]): Promise<TestResults>;
    private buildTestCommand;
    private parseTestOutput;
    private findRelatedTestFiles;
    openBrowser(url: string): Promise<string>;
    takeScreenshot(sessionId: string, options?: {
        selector?: string;
        fullPage?: boolean;
    }): Promise<string>;
    getConsoleLogs(sessionId: string): Promise<import("./testing.types.js").ConsoleLog[]>;
    getNetworkRequests(sessionId: string): Promise<import("./testing.types.js").NetworkRequest[]>;
    getBrowserErrors(sessionId: string): Promise<import("./testing.types.js").BrowserError[]>;
    closeBrowser(sessionId: string): Promise<void>;
    closeAllBrowsers(): Promise<void>;
    cleanup(): Promise<TestCleanupResult>;
    getStatus(): TestingModuleStatus;
    getLastResults(): TestResults | undefined;
}
//# sourceMappingURL=testing.service.d.ts.map