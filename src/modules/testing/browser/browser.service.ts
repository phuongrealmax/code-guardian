// src/modules/testing/browser/browser.service.ts

import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { v4 as uuid } from 'uuid';
import { BrowserTestConfig } from '../../../core/types.js';
import { Logger } from '../../../core/logger.js';
import {
  BrowserSession,
  ConsoleLog,
  NetworkRequest,
  Screenshot,
  BrowserError,
} from '../testing.types.js';

// Playwright types (optional import - may not be available)
type Browser = any;
type Page = any;
type BrowserContext = any;

export class BrowserService {
  private browser: Browser | null = null;
  private sessions: Map<string, {
    page: Page;
    context: BrowserContext;
    data: BrowserSession;
  }> = new Map();
  private screenshotDir: string;

  constructor(
    private config: BrowserTestConfig,
    private logger: Logger,
    private projectRoot: string = process.cwd()
  ) {
    this.screenshotDir = join(projectRoot, '.ccg', 'screenshots');
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) return;

    // Ensure screenshot directory exists
    if (!existsSync(this.screenshotDir)) {
      mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  async openPage(url: string): Promise<string> {
    // Lazy load playwright
    let chromium: any;
    try {
      const playwright = await import('playwright');
      chromium = playwright.chromium;
    } catch {
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

    const session: BrowserSession = {
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
      page.on('console', (msg: any) => {
        session.consoleLogs.push({
          type: msg.type() as ConsoleLog['type'],
          message: msg.text(),
          timestamp: new Date(),
          source: msg.location().url,
          lineNumber: msg.location().lineNumber,
        });
      });
    }

    if (this.config.captureNetwork) {
      page.on('requestfinished', async (request: any) => {
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

      page.on('requestfailed', (request: any) => {
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
    page.on('pageerror', (error: Error) => {
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

  async takeScreenshot(sessionId: string, options?: {
    selector?: string;
    fullPage?: boolean;
  }): Promise<string> {
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
    } else {
      await session.page.screenshot({
        path,
        fullPage: options?.fullPage ?? false,
      });
    }

    const viewport = session.page.viewportSize();

    const screenshot: Screenshot = {
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

  getConsoleLogs(sessionId: string): ConsoleLog[] {
    const session = this.sessions.get(sessionId);
    return session?.data.consoleLogs || [];
  }

  getNetworkRequests(sessionId: string): NetworkRequest[] {
    const session = this.sessions.get(sessionId);
    return session?.data.networkRequests || [];
  }

  getErrors(sessionId: string): BrowserError[] {
    const session = this.sessions.get(sessionId);
    return session?.data.errors || [];
  }

  async closePage(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    await session.page.close();
    await session.context.close();

    session.data.status = 'closed';
    this.sessions.delete(sessionId);

    this.logger.info(`Browser session closed: ${sessionId}`);
  }

  async closeAll(): Promise<void> {
    for (const [sessionId] of this.sessions) {
      await this.closePage(sessionId);
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  getSession(sessionId: string): BrowserSession | undefined {
    return this.sessions.get(sessionId)?.data;
  }
}
