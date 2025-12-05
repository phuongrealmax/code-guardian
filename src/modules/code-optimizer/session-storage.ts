// src/modules/code-optimizer/session-storage.ts

/**
 * Session Storage for Code Optimizer
 *
 * Stores optimization session snapshots to .ccg/sessions/ for:
 * - Before/after comparison
 * - Session history tracking
 * - Trend analysis (Team tier)
 * - Tech Debt Index tracking
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  ScanRepositoryOutput,
  MetricsOutput,
  HotspotsOutput,
} from './types.js';

// ═══════════════════════════════════════════════════════════════
//                      TYPES
// ═══════════════════════════════════════════════════════════════

export interface SessionSnapshot {
  sessionId: string;
  timestamp: number;
  repoName: string;
  strategy: 'size' | 'complexity' | 'mixed';

  // Analysis results
  scan: ScanRepositoryOutput;
  metrics: MetricsOutput;
  hotspots: HotspotsOutput;

  // Summary metrics for quick access
  summary: {
    filesAnalyzed: number;
    avgComplexity: number;
    totalHotspots: number;
    topHotspotScore: number;
    linesOfCode: number;
    // Tech Debt Index (Team tier feature)
    techDebtIndex: number;
    highComplexityFiles: number;
    largeFiles: number;
    totalHotspotScore: number;
  };
}

/**
 * Tech Debt Index breakdown for detailed analysis
 */
export interface TechDebtIndexBreakdown {
  index: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  components: {
    hotspotScore: number;      // 0-40 points (40% weight)
    complexityScore: number;   // 0-30 points (30% weight)
    sizeScore: number;         // 0-20 points (20% weight)
    debtDensity: number;       // 0-10 points (10% weight)
  };
  interpretation: string;
}

/**
 * Trend data for multiple sessions
 */
export interface SessionTrend {
  sessions: Array<{
    sessionId: string;
    date: string;
    techDebtIndex: number;
    hotspots: number;
    avgComplexity: number;
  }>;
  trend: 'improving' | 'stable' | 'degrading';
  indexDelta: number;
  percentChange: number;
}

export interface SessionFilter {
  repoName?: string;
  startDate?: number; // Unix timestamp
  endDate?: number;
  strategy?: 'size' | 'complexity' | 'mixed';
  limit?: number;
}

export interface SessionListResult {
  sessions: SessionSnapshot[];
  total: number;
}

// ═══════════════════════════════════════════════════════════════
//                      SESSION STORAGE
// ═══════════════════════════════════════════════════════════════

export class SessionStorage {
  private sessionsDir: string;

  constructor(projectRoot: string = process.cwd()) {
    this.sessionsDir = path.join(projectRoot, '.ccg', 'sessions');
    this.ensureSessionsDir();
  }

  private ensureSessionsDir(): void {
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  /**
   * Save a session snapshot
   */
  saveSession(
    sessionId: string,
    repoName: string,
    strategy: 'size' | 'complexity' | 'mixed',
    scan: ScanRepositoryOutput,
    metrics: MetricsOutput,
    hotspots: HotspotsOutput
  ): void {
    // Calculate derived metrics
    const highComplexityFiles = metrics.files.filter(f => f.complexityScore > 50).length;
    const largeFiles = metrics.files.filter(f => f.lines > 500).length;
    const totalHotspotScore = hotspots.hotspots.reduce((sum, h) => sum + h.score, 0);

    // Calculate Tech Debt Index
    const techDebtIndex = this.calculateTechDebtIndex(
      hotspots.hotspots.length,
      totalHotspotScore,
      metrics.aggregate.avgComplexityScore,
      highComplexityFiles,
      largeFiles,
      metrics.files.length,
      scan.totalLinesApprox
    );

    const snapshot: SessionSnapshot = {
      sessionId,
      timestamp: Date.now(),
      repoName,
      strategy,
      scan,
      metrics,
      hotspots,
      summary: {
        filesAnalyzed: metrics.files.length,
        avgComplexity: metrics.aggregate.avgComplexityScore,
        totalHotspots: hotspots.hotspots.length,
        topHotspotScore: hotspots.hotspots[0]?.score || 0,
        linesOfCode: scan.totalLinesApprox,
        techDebtIndex,
        highComplexityFiles,
        largeFiles,
        totalHotspotScore,
      },
    };

    const filename = `${sessionId}.json`;
    const filepath = path.join(this.sessionsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2), 'utf-8');
  }

  /**
   * Calculate Tech Debt Index (0-100 scale, lower is better)
   *
   * Formula:
   * - Hotspot component (40%): Based on hotspot count and total score
   * - Complexity component (30%): Based on avg complexity and high-complexity files
   * - Size component (20%): Based on large file count
   * - Debt density (10%): Hotspots per 1000 LOC
   *
   * The index is normalized to 0-100 where:
   * - 0-20: Excellent (Grade A)
   * - 21-40: Good (Grade B)
   * - 41-60: Fair (Grade C)
   * - 61-80: Poor (Grade D)
   * - 81-100: Critical (Grade F)
   */
  calculateTechDebtIndex(
    hotspotCount: number,
    totalHotspotScore: number,
    avgComplexity: number,
    highComplexityFiles: number,
    largeFiles: number,
    totalFiles: number,
    totalLines: number
  ): number {
    // Hotspot component (0-40 points)
    // - 0 hotspots = 0 points
    // - 20+ hotspots or 1000+ total score = 40 points
    const hotspotCountScore = Math.min(hotspotCount / 20, 1) * 20;
    const hotspotScoreComponent = Math.min(totalHotspotScore / 1000, 1) * 20;
    const hotspotComponent = hotspotCountScore + hotspotScoreComponent;

    // Complexity component (0-30 points)
    // - Avg complexity < 20 = 0 points
    // - Avg complexity 20-50 = linear scale
    // - Avg complexity > 50 = max 15 points
    // Plus high-complexity file penalty
    const complexityBase = Math.min(Math.max(avgComplexity - 20, 0) / 30, 1) * 15;
    const highComplexityPenalty = Math.min(highComplexityFiles / 10, 1) * 15;
    const complexityComponent = complexityBase + highComplexityPenalty;

    // Size component (0-20 points)
    // Based on large files ratio
    const largeFileRatio = totalFiles > 0 ? largeFiles / totalFiles : 0;
    const sizeComponent = Math.min(largeFileRatio * 4, 1) * 20;

    // Debt density component (0-10 points)
    // Hotspots per 1000 lines of code
    const debtDensity = totalLines > 0 ? (hotspotCount / (totalLines / 1000)) : 0;
    const densityComponent = Math.min(debtDensity / 5, 1) * 10;

    // Total index (0-100)
    const index = Math.round(
      hotspotComponent + complexityComponent + sizeComponent + densityComponent
    );

    return Math.min(100, Math.max(0, index));
  }

  /**
   * Get Tech Debt Index breakdown with interpretation
   */
  getTechDebtBreakdown(session: SessionSnapshot): TechDebtIndexBreakdown {
    const index = session.summary.techDebtIndex;

    // Calculate component scores (for display)
    const hotspotCountScore = Math.min(session.summary.totalHotspots / 20, 1) * 20;
    const hotspotScoreComponent = Math.min(session.summary.totalHotspotScore / 1000, 1) * 20;
    const hotspotScore = Math.round(hotspotCountScore + hotspotScoreComponent);

    const complexityBase = Math.min(Math.max(session.summary.avgComplexity - 20, 0) / 30, 1) * 15;
    const highComplexityPenalty = Math.min(session.summary.highComplexityFiles / 10, 1) * 15;
    const complexityScore = Math.round(complexityBase + highComplexityPenalty);

    const largeFileRatio = session.summary.filesAnalyzed > 0
      ? session.summary.largeFiles / session.summary.filesAnalyzed
      : 0;
    const sizeScore = Math.round(Math.min(largeFileRatio * 4, 1) * 20);

    const debtDensity = session.summary.linesOfCode > 0
      ? (session.summary.totalHotspots / (session.summary.linesOfCode / 1000))
      : 0;
    const densityScore = Math.round(Math.min(debtDensity / 5, 1) * 10);

    // Determine grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    let interpretation: string;

    if (index <= 20) {
      grade = 'A';
      interpretation = 'Excellent! Your codebase is well-maintained with minimal tech debt.';
    } else if (index <= 40) {
      grade = 'B';
      interpretation = 'Good condition. A few areas could use attention, but overall healthy.';
    } else if (index <= 60) {
      grade = 'C';
      interpretation = 'Fair. Tech debt is accumulating - consider allocating time for cleanup.';
    } else if (index <= 80) {
      grade = 'D';
      interpretation = 'Poor. Significant tech debt is impacting maintainability. Prioritize refactoring.';
    } else {
      grade = 'F';
      interpretation = 'Critical! High tech debt is likely causing bugs and slowing development.';
    }

    return {
      index,
      grade,
      components: {
        hotspotScore,
        complexityScore,
        sizeScore,
        debtDensity: densityScore,
      },
      interpretation,
    };
  }

  /**
   * Load a session snapshot by ID
   */
  loadSession(sessionId: string): SessionSnapshot | null {
    const filename = `${sessionId}.json`;
    const filepath = path.join(this.sessionsDir, filename);

    if (!fs.existsSync(filepath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(filepath, 'utf-8');
      return JSON.parse(content) as SessionSnapshot;
    } catch (error) {
      console.error(`Failed to load session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * List sessions with optional filtering
   */
  listSessions(filter?: SessionFilter): SessionListResult {
    this.ensureSessionsDir();

    const files = fs.readdirSync(this.sessionsDir)
      .filter(f => f.endsWith('.json'));

    let sessions: SessionSnapshot[] = [];

    for (const file of files) {
      try {
        const filepath = path.join(this.sessionsDir, file);
        const content = fs.readFileSync(filepath, 'utf-8');
        const snapshot = JSON.parse(content) as SessionSnapshot;
        sessions.push(snapshot);
      } catch (error) {
        console.error(`Failed to parse session file ${file}:`, error);
      }
    }

    // Apply filters
    if (filter) {
      if (filter.repoName) {
        sessions = sessions.filter(s => s.repoName === filter.repoName);
      }

      if (filter.startDate) {
        sessions = sessions.filter(s => s.timestamp >= filter.startDate!);
      }

      if (filter.endDate) {
        sessions = sessions.filter(s => s.timestamp <= filter.endDate!);
      }

      if (filter.strategy) {
        sessions = sessions.filter(s => s.strategy === filter.strategy);
      }
    }

    // Sort by timestamp descending (newest first)
    sessions.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit
    const total = sessions.length;
    if (filter?.limit) {
      sessions = sessions.slice(0, filter.limit);
    }

    return { sessions, total };
  }

  /**
   * Get the most recent session for a repository
   */
  getLatestSession(repoName?: string): SessionSnapshot | null {
    const result = this.listSessions({
      repoName,
      limit: 1,
    });

    return result.sessions[0] || null;
  }

  /**
   * Delete old sessions (keep last N sessions)
   */
  cleanupOldSessions(keepCount: number = 50): number {
    const { sessions } = this.listSessions();

    if (sessions.length <= keepCount) {
      return 0;
    }

    const toDelete = sessions.slice(keepCount);
    let deleted = 0;

    for (const session of toDelete) {
      const filename = `${session.sessionId}.json`;
      const filepath = path.join(this.sessionsDir, filename);

      try {
        fs.unlinkSync(filepath);
        deleted++;
      } catch (error) {
        console.error(`Failed to delete session ${session.sessionId}:`, error);
      }
    }

    return deleted;
  }

  /**
   * Calculate improvement metrics between two sessions
   */
  calculateImprovement(
    beforeSession: SessionSnapshot,
    afterSession: SessionSnapshot
  ): {
    complexityDelta: number;
    complexityPercentChange: number;
    hotspotsDelta: number;
    hotspotsPercentChange: number;
    filesAnalyzedDelta: number;
  } {
    const beforeComplexity = beforeSession.summary.avgComplexity;
    const afterComplexity = afterSession.summary.avgComplexity;
    const complexityDelta = afterComplexity - beforeComplexity;
    const complexityPercentChange = beforeComplexity > 0
      ? ((complexityDelta / beforeComplexity) * 100)
      : 0;

    const beforeHotspots = beforeSession.summary.totalHotspots;
    const afterHotspots = afterSession.summary.totalHotspots;
    const hotspotsDelta = afterHotspots - beforeHotspots;
    const hotspotsPercentChange = beforeHotspots > 0
      ? ((hotspotsDelta / beforeHotspots) * 100)
      : 0;

    const beforeFiles = beforeSession.summary.filesAnalyzed;
    const afterFiles = afterSession.summary.filesAnalyzed;
    const filesAnalyzedDelta = afterFiles - beforeFiles;

    return {
      complexityDelta,
      complexityPercentChange,
      hotspotsDelta,
      hotspotsPercentChange,
      filesAnalyzedDelta,
    };
  }

  /**
   * Get trend data for the last N sessions
   */
  getTrend(repoName?: string, count: number = 5): SessionTrend {
    const { sessions } = this.listSessions({
      repoName,
      limit: count,
    });

    // Reverse to get oldest first for trend display
    const orderedSessions = [...sessions].reverse();

    const trendData = orderedSessions.map(s => ({
      sessionId: s.sessionId,
      date: new Date(s.timestamp).toLocaleDateString(),
      techDebtIndex: s.summary.techDebtIndex ?? this.calculateTechDebtIndexFromSession(s),
      hotspots: s.summary.totalHotspots,
      avgComplexity: s.summary.avgComplexity,
    }));

    // Calculate trend direction
    let trend: 'improving' | 'stable' | 'degrading' = 'stable';
    let indexDelta = 0;
    let percentChange = 0;

    if (trendData.length >= 2) {
      const oldest = trendData[0].techDebtIndex;
      const newest = trendData[trendData.length - 1].techDebtIndex;
      indexDelta = newest - oldest;
      percentChange = oldest > 0 ? ((indexDelta / oldest) * 100) : 0;

      if (indexDelta < -5) {
        trend = 'improving';
      } else if (indexDelta > 5) {
        trend = 'degrading';
      }
    }

    return {
      sessions: trendData,
      trend,
      indexDelta,
      percentChange,
    };
  }

  /**
   * Calculate Tech Debt Index from an existing session (for backward compatibility)
   */
  private calculateTechDebtIndexFromSession(session: SessionSnapshot): number {
    const highComplexityFiles = session.metrics.files.filter(
      (f: any) => f.complexityScore > 50
    ).length;
    const largeFiles = session.metrics.files.filter(
      (f: any) => f.lines > 500
    ).length;
    const totalHotspotScore = session.hotspots.hotspots.reduce(
      (sum, h) => sum + h.score, 0
    );

    return this.calculateTechDebtIndex(
      session.summary.totalHotspots,
      totalHotspotScore,
      session.summary.avgComplexity,
      highComplexityFiles,
      largeFiles,
      session.summary.filesAnalyzed,
      session.summary.linesOfCode
    );
  }

  /**
   * Generate ASCII trend chart for markdown reports
   */
  generateTrendChart(repoName?: string, count: number = 5): string {
    const trend = this.getTrend(repoName, count);

    if (trend.sessions.length < 2) {
      return '_Not enough data for trend chart. Run more analyses to see trends._';
    }

    const maxIndex = Math.max(...trend.sessions.map(s => s.techDebtIndex), 100);
    const barWidth = 20;

    let chart = '```\n';
    chart += 'Tech Debt Index Trend (lower is better)\n';
    chart += '─'.repeat(40) + '\n';

    for (const session of trend.sessions) {
      const barLength = Math.round((session.techDebtIndex / maxIndex) * barWidth);
      const bar = '█'.repeat(barLength) + '░'.repeat(barWidth - barLength);
      const grade = this.getGrade(session.techDebtIndex);
      chart += `${session.date.padEnd(12)} ${bar} ${session.techDebtIndex.toString().padStart(3)} (${grade})\n`;
    }

    chart += '─'.repeat(40) + '\n';

    // Trend indicator
    const trendArrow = trend.trend === 'improving' ? '↓' : trend.trend === 'degrading' ? '↑' : '→';
    const trendLabel = trend.trend === 'improving' ? 'Improving' : trend.trend === 'degrading' ? 'Degrading' : 'Stable';
    chart += `Trend: ${trendArrow} ${trendLabel} (${trend.indexDelta > 0 ? '+' : ''}${trend.indexDelta.toFixed(0)})\n`;
    chart += '```';

    return chart;
  }

  /**
   * Get grade letter from index
   */
  private getGrade(index: number): string {
    if (index <= 20) return 'A';
    if (index <= 40) return 'B';
    if (index <= 60) return 'C';
    if (index <= 80) return 'D';
    return 'F';
  }
}
