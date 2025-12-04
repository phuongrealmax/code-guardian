import { BrowserTestConfig } from '../../../core/types.js';
import { Logger } from '../../../core/logger.js';
import { BrowserSession, ConsoleLog, NetworkRequest, BrowserError } from '../testing.types.js';
export declare class BrowserService {
    private config;
    private logger;
    private projectRoot;
    private browser;
    private sessions;
    private screenshotDir;
    constructor(config: BrowserTestConfig, logger: Logger, projectRoot?: string);
    initialize(): Promise<void>;
    openPage(url: string): Promise<string>;
    takeScreenshot(sessionId: string, options?: {
        selector?: string;
        fullPage?: boolean;
    }): Promise<string>;
    getConsoleLogs(sessionId: string): ConsoleLog[];
    getNetworkRequests(sessionId: string): NetworkRequest[];
    getErrors(sessionId: string): BrowserError[];
    closePage(sessionId: string): Promise<void>;
    closeAll(): Promise<void>;
    getActiveSessions(): string[];
    getSession(sessionId: string): BrowserSession | undefined;
}
//# sourceMappingURL=browser.service.d.ts.map