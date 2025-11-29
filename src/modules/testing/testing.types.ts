// src/modules/testing/testing.types.ts

export interface TestResults {
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  tests: TestResult[];
  coverage?: CoverageReport;
  summary: string;
}

export interface TestResult {
  name: string;
  file: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  stack?: string;
  assertions: number;
}

export interface CoverageReport {
  lines: number;
  branches: number;
  functions: number;
  statements: number;
}

export interface BrowserSession {
  id: string;
  url: string;
  startedAt: Date;
  status: 'active' | 'closed';
  consoleLogs: ConsoleLog[];
  networkRequests: NetworkRequest[];
  screenshots: Screenshot[];
  errors: BrowserError[];
}

export interface ConsoleLog {
  type: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  timestamp: Date;
  source?: string;
  lineNumber?: number;
}

export interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  status: number;
  statusText: string;
  duration: number;
  size: number;
  type: string;
  error?: string;
  timestamp: Date;
}

export interface Screenshot {
  id: string;
  path: string;
  createdAt: Date;
  selector?: string;
  fullPage: boolean;
  width: number;
  height: number;
}

export interface BrowserError {
  message: string;
  source: string;
  lineNumber?: number;
  columnNumber?: number;
  stack?: string;
  timestamp: Date;
}

export interface TestRunOptions {
  files?: string[];
  grep?: string;
  coverage?: boolean;
  watch?: boolean;
  timeout?: number;
}

export interface BrowserOptions {
  headless?: boolean;
  viewport?: { width: number; height: number };
  timeout?: number;
}

export interface TestCleanupResult {
  filesRemoved: number;
  dataCleared: number;
  locations: string[];
}

export interface TestingModuleStatus {
  enabled: boolean;
  lastResults?: TestResults;
  browserSessions: number;
}
