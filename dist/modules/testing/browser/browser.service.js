// src/modules/testing/browser/browser.service.ts
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { v4 as uuid } from 'uuid';
export class BrowserService {
    config;
    logger;
    projectRoot;
    browser = null;
    sessions = new Map();
    screenshotDir;
    constructor(config, logger, projectRoot = process.cwd()) {
        this.config = config;
        this.logger = logger;
        this.projectRoot = projectRoot;
        this.screenshotDir = join(projectRoot, '.ccg', 'screenshots');
    }
    async initialize() {
        if (!this.config.enabled)
            return;
        // Ensure screenshot directory exists
        if (!existsSync(this.screenshotDir)) {
            mkdirSync(this.screenshotDir, { recursive: true });
        }
    }
    async openPage(url) {
        // Lazy load playwright
        let chromium;
        try {
            const playwright = await import('playwright');
            chromium = playwright.chromium;
        }
        catch {
            throw new Error('Playwright is not installed. Run: npm install playwright');
        }
        // Lazy initialize browser
        if (!this.browser) {
            this.browser = await chromium.launch({
                headless: this.config.headless,
            });
        }
        const sessionId = uuid();
        const context = await this.browser.newContext();
        const page = await context.newPage();
        const session = {
            id: sessionId,
            url,
            startedAt: new Date(),
            status: 'active',
            consoleLogs: [],
            networkRequests: [],
            screenshots: [],
            errors: [],
        };
        // Set up listeners
        if (this.config.captureConsole) {
            page.on('console', (msg) => {
                session.consoleLogs.push({
                    type: msg.type(),
                    message: msg.text(),
                    timestamp: new Date(),
                    source: msg.location().url,
                    lineNumber: msg.location().lineNumber,
                });
            });
        }
        if (this.config.captureNetwork) {
            page.on('requestfinished', async (request) => {
                const response = await request.response();
                const timing = request.timing();
                session.networkRequests.push({
                    id: uuid(),
                    url: request.url(),
                    method: request.method(),
                    status: response?.status() || 0,
                    statusText: response?.statusText() || '',
                    duration: timing.responseEnd - timing.requestStart,
                    size: (await response?.body())?.length || 0,
                    type: request.resourceType(),
                    timestamp: new Date(),
                });
            });
            page.on('requestfailed', (request) => {
                session.networkRequests.push({
                    id: uuid(),
                    url: request.url(),
                    method: request.method(),
                    status: 0,
                    statusText: 'Failed',
                    duration: 0,
                    size: 0,
                    type: request.resourceType(),
                    error: request.failure()?.errorText,
                    timestamp: new Date(),
                });
            });
        }
        // Capture page errors
        page.on('pageerror', (error) => {
            session.errors.push({
                message: error.message,
                source: 'page',
                stack: error.stack,
                timestamp: new Date(),
            });
        });
        // Navigate to URL
        await page.goto(url, { waitUntil: 'networkidle' });
        this.sessions.set(sessionId, { page, context, data: session });
        this.logger.info(`Browser session opened: ${sessionId} -> ${url}`);
        return sessionId;
    }
    async takeScreenshot(sessionId, options) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        const screenshotId = uuid();
        const filename = `${screenshotId}.png`;
        const path = join(this.screenshotDir, filename);
        // Ensure screenshot directory exists
        if (!existsSync(this.screenshotDir)) {
            mkdirSync(this.screenshotDir, { recursive: true });
        }
        if (options?.selector) {
            await session.page.locator(options.selector).screenshot({ path });
        }
        else {
            await session.page.screenshot({
                path,
                fullPage: options?.fullPage ?? false,
            });
        }
        const viewport = session.page.viewportSize();
        const screenshot = {
            id: screenshotId,
            path,
            createdAt: new Date(),
            selector: options?.selector,
            fullPage: options?.fullPage ?? false,
            width: viewport?.width || 0,
            height: viewport?.height || 0,
        };
        session.data.screenshots.push(screenshot);
        this.logger.debug(`Screenshot taken: ${path}`);
        return path;
    }
    getConsoleLogs(sessionId) {
        const session = this.sessions.get(sessionId);
        return session?.data.consoleLogs || [];
    }
    getNetworkRequests(sessionId) {
        const session = this.sessions.get(sessionId);
        return session?.data.networkRequests || [];
    }
    getErrors(sessionId) {
        const session = this.sessions.get(sessionId);
        return session?.data.errors || [];
    }
    async closePage(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        await session.page.close();
        await session.context.close();
        session.data.status = 'closed';
        this.sessions.delete(sessionId);
        this.logger.info(`Browser session closed: ${sessionId}`);
    }
    async closeAll() {
        for (const [sessionId] of this.sessions) {
            await this.closePage(sessionId);
        }
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
    getActiveSessions() {
        return Array.from(this.sessions.keys());
    }
    getSession(sessionId) {
        return this.sessions.get(sessionId)?.data;
    }
}
//# sourceMappingURL=browser.service.js.map