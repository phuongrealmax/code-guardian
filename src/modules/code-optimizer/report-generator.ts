// src/modules/code-optimizer/report-generator.ts

/**
 * Report Generator for Code Optimizer
 *
 * Generates formatted markdown reports for optimization sessions.
 * Integrates with Documents module for registration and Memory for storage.
 *
 * License gating:
 * - Free (dev): Basic report with current metrics and hotspots
 * - Team/Enterprise: Advanced sections (Tech Debt Summary, Before vs After, ROI notes)
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  GenerateReportInput,
  GenerateReportOutput,
  ReportSection,
  MetricsOutput,
  HotspotsOutput,
  RefactorPlanOutput,
  ScanRepositoryOutput,
} from './types.js';
import { SessionStorage, type SessionSnapshot, type TechDebtIndexBreakdown } from './session-storage.js';

// ═══════════════════════════════════════════════════════════════
//                      LICENSE UTILITIES
// ═══════════════════════════════════════════════════════════════

type LicenseTier = 'dev' | 'team' | 'enterprise';

interface LicenseConfig {
  licenseKey: string;
  tier: LicenseTier;
  status: string;
  activatedAt: number;
  features: string[];
}

/**
 * Get current license tier from config file
 * Returns 'dev' (free) if no license is found
 */
function getCurrentLicenseTier(projectRoot: string): LicenseTier {
  // Check project-level license first
  const projectLicensePath = path.join(projectRoot, '.ccg', 'license.json');
  if (fs.existsSync(projectLicensePath)) {
    try {
      const config = JSON.parse(fs.readFileSync(projectLicensePath, 'utf-8')) as LicenseConfig;
      if (config.status === 'active') {
        return config.tier;
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  // Check global license
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  if (homeDir) {
    const globalLicensePath = path.join(homeDir, '.ccg', 'license.json');
    if (fs.existsSync(globalLicensePath)) {
      try {
        const config = JSON.parse(fs.readFileSync(globalLicensePath, 'utf-8')) as LicenseConfig;
        if (config.status === 'active') {
          return config.tier;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  return 'dev'; // Free tier default
}

/**
 * Check if a tier has access to advanced reports
 */
function hasAdvancedReports(tier: LicenseTier): boolean {
  return tier === 'team' || tier === 'enterprise';
}

// ═══════════════════════════════════════════════════════════════
//                      REPORT GENERATOR
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a formatted markdown report for an optimization session
 */
export function generateReport(
  input: GenerateReportInput,
  projectRoot: string,
  previousSession?: SessionSnapshot | null
): GenerateReportOutput {
  const sections: ReportSection[] = [];
  const date = new Date().toISOString().split('T')[0];
  const repoName = input.repoName || path.basename(projectRoot);

  // Check license tier for advanced features
  const licenseTier = getCurrentLicenseTier(projectRoot);
  const isAdvanced = hasAdvancedReports(licenseTier);

  // Header
  sections.push({
    title: 'header',
    content: generateHeader(input.sessionId, repoName, date, input.strategy || 'mixed', licenseTier),
  });

  // Overview Section
  if (input.scanResult) {
    sections.push({
      title: 'Overview',
      content: generateOverviewSection(input.scanResult),
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // TEAM+ ADVANCED SECTIONS: Tech Debt Index + Summary + Before vs After
  // ═══════════════════════════════════════════════════════════════
  if (isAdvanced && input.hotspots && input.metricsBefore && input.scanResult) {
    // Initialize session storage for trend data
    const sessionStorage = new SessionStorage(projectRoot);

    // Tech Debt Index (Team+ only)
    sections.push({
      title: 'Tech Debt Index',
      content: generateTechDebtIndexSection(
        input.hotspots,
        input.metricsBefore,
        input.scanResult,
        previousSession,
        sessionStorage,
        repoName
      ),
    });

    // Tech Debt Summary (Team+ only)
    sections.push({
      title: 'Tech Debt Summary',
      content: generateTechDebtSummary(input.hotspots, input.metricsBefore, previousSession),
    });

    // Before vs After comparison (Team+ only, when previous session exists)
    if (previousSession) {
      sections.push({
        title: 'Before vs After',
        content: generateBeforeAfterSection(previousSession, input.hotspots, input.metricsBefore),
      });
    }

    // Trend Chart (Team+ only, when multiple sessions exist)
    const trendChart = sessionStorage.generateTrendChart(repoName, 5);
    if (!trendChart.includes('Not enough data')) {
      sections.push({
        title: 'Trend',
        content: `## Trend\n\n${trendChart}`,
      });
    }
  }

  // Metrics Section (basic for all, enhanced for Team+)
  if (input.metricsBefore || input.metricsAfter) {
    sections.push({
      title: 'Metrics',
      content: generateMetricsSection(input.metricsBefore, input.metricsAfter),
    });
  }

  // Hotspots Section
  if (input.hotspots) {
    sections.push({
      title: 'Hotspots',
      content: generateHotspotsSection(input.hotspots),
    });
  }

  // Files Changed
  if (input.filesChanged && input.filesChanged.length > 0) {
    sections.push({
      title: 'Files Changed',
      content: generateFilesChangedSection(input.filesChanged, input.changesDescription),
    });
  }

  // Refactor Plan Summary
  if (input.refactorPlan) {
    sections.push({
      title: 'Refactor Plan',
      content: generateRefactorPlanSection(input.refactorPlan),
    });
  }

  // Test Results
  if (input.testsStatus) {
    sections.push({
      title: 'Test Results',
      content: generateTestResultsSection(input),
    });
  }

  // Next Iterations
  sections.push({
    title: 'Next Steps',
    content: generateNextStepsSection(input.hotspots),
  });

  // ROI Notes (Team+ only)
  if (isAdvanced && previousSession) {
    sections.push({
      title: 'ROI Notes',
      content: generateROISection(previousSession, input.hotspots, input.metricsBefore),
    });
  }

  // Free tier upgrade prompt
  if (!isAdvanced) {
    sections.push({
      title: 'Upgrade',
      content: generateUpgradePrompt(),
    });
  }

  // Footer
  sections.push({
    title: 'footer',
    content: generateFooter(licenseTier),
  });

  // Combine all sections
  const markdown = sections.map((s) => s.content).join('\n\n');

  // Calculate summary
  const summary = calculateSummary(input);

  // Determine output path
  const outputPath =
    input.outputPath || `docs/reports/optimization-${date}-${input.sessionId}.md`;
  const fullPath = path.join(projectRoot, outputPath);

  // Ensure directory exists
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write report
  fs.writeFileSync(fullPath, markdown, 'utf-8');

  return {
    success: true,
    reportPath: outputPath,
    markdown,
    sections,
    summary,
  };
}

// ═══════════════════════════════════════════════════════════════
//                      SECTION GENERATORS
// ═══════════════════════════════════════════════════════════════

function generateHeader(
  sessionId: string,
  repoName: string,
  date: string,
  strategy: string,
  licenseTier: LicenseTier
): string {
  const tierBadge = licenseTier === 'dev' ? '' : ` | **${licenseTier.toUpperCase()}** License`;
  return `# Code Guardian Optimization Report

**Repository**: ${repoName}
**Session ID**: ${sessionId}
**Date**: ${date}
**Strategy**: ${strategy}${tierBadge}

---`;
}

function generateOverviewSection(scan: ScanRepositoryOutput): string {
  return `## Overview

| Metric | Value |
|--------|-------|
| Total Files | ${scan.totalFiles.toLocaleString()} |
| Total Lines (approx) | ${scan.totalLinesApprox.toLocaleString()} |
| Root Path | \`${scan.rootPath}\` |

### Top Large Files
${scan.topLargeFiles
  .slice(0, 5)
  .map((f, i) => `${i + 1}. \`${f.path}\` (~${f.linesApprox.toLocaleString()} lines)`)
  .join('\n')}`;
}

function generateMetricsSection(
  before?: MetricsOutput,
  after?: MetricsOutput
): string {
  if (!before && !after) {
    return '## Metrics\n\n_No metrics data available._';
  }

  let content = '## Metrics\n\n';

  if (before && after) {
    // Before/After comparison
    const complexityChange = calculatePercentChange(
      before.aggregate.avgComplexityScore,
      after.aggregate.avgComplexityScore
    );
    const linesChange = calculatePercentChange(
      before.aggregate.totalLines,
      after.aggregate.totalLines
    );

    content += `### Comparison (Before → After)

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Files Analyzed | ${before.aggregate.totalFiles} | ${after.aggregate.totalFiles} | - |
| Total Lines | ${before.aggregate.totalLines.toLocaleString()} | ${after.aggregate.totalLines.toLocaleString()} | ${linesChange} |
| Avg Complexity | ${before.aggregate.avgComplexityScore.toFixed(1)} | ${after.aggregate.avgComplexityScore.toFixed(1)} | ${complexityChange} |
| TODOs | ${before.aggregate.totalTodos} | ${after.aggregate.totalTodos} | ${after.aggregate.totalTodos - before.aggregate.totalTodos} |
| FIXMEs | ${before.aggregate.totalFixmes} | ${after.aggregate.totalFixmes} | ${after.aggregate.totalFixmes - before.aggregate.totalFixmes} |`;
  } else {
    const metrics = before || after!;
    content += `### Current Metrics

| Metric | Value |
|--------|-------|
| Files Analyzed | ${metrics.aggregate.totalFiles} |
| Total Lines | ${metrics.aggregate.totalLines.toLocaleString()} |
| Code Lines | ${metrics.aggregate.totalCodeLines.toLocaleString()} |
| Avg Complexity | ${metrics.aggregate.avgComplexityScore.toFixed(1)} |
| TODOs | ${metrics.aggregate.totalTodos} |
| FIXMEs | ${metrics.aggregate.totalFixmes} |`;
  }

  return content;
}

function generateHotspotsSection(hotspots: HotspotsOutput): string {
  if (hotspots.hotspots.length === 0) {
    return '## Hotspots\n\n_No hotspots detected._';
  }

  let content = `## Hotspots

**Total Analyzed**: ${hotspots.summary.totalAnalyzed}
**Hotspots Found**: ${hotspots.summary.hotspotsFound}
**Top Reason**: ${hotspots.summary.topReason}

| Rank | File | Score | Reasons | Suggested |
|------|------|-------|---------|-----------|
`;

  for (const h of hotspots.hotspots.slice(0, 10)) {
    content += `| #${h.rank} | \`${h.path}\` | ${h.score.toFixed(1)} | ${h.reasons.slice(0, 2).join(', ')} | ${h.suggestedGoal} |\n`;
  }

  return content;
}

function generateFilesChangedSection(
  filesChanged: string[],
  descriptions?: string[]
): string {
  let content = `## Files Changed

**Total**: ${filesChanged.length} files

`;

  for (let i = 0; i < filesChanged.length; i++) {
    const file = filesChanged[i];
    const desc = descriptions?.[i] || '';
    content += `- \`${file}\`${desc ? ` - ${desc}` : ''}\n`;
  }

  return content;
}

function generateRefactorPlanSection(plan: RefactorPlanOutput): string {
  let content = `## Refactor Plan Summary

**Total Files**: ${plan.summary.totalFiles}
**Total Steps**: ${plan.summary.totalSteps}
**High-Risk Steps**: ${plan.summary.highRiskSteps}
**Estimated Effort**: ${plan.summary.estimatedTotalEffort}

### Workflow Phases
\`${plan.workflow.phases.join(' → ')}\`

### Files in Plan
`;

  for (const fp of plan.plan.slice(0, 10)) {
    content += `\n#### ${fp.file}
- **Goal**: ${fp.goal}
- **Priority**: ${fp.priority}
- **Effort**: ${fp.estimatedEffort}
- **Steps**: ${fp.steps.length}
`;
  }

  return content;
}

function generateTestResultsSection(input: GenerateReportInput): string {
  const statusEmoji = {
    passed: '✅',
    failed: '❌',
    partial: '⚠️',
    skipped: '⏭️',
  };

  let content = `## Test Results

**Status**: ${statusEmoji[input.testsStatus!]} ${input.testsStatus!.toUpperCase()}
`;

  if (input.testsPassed !== undefined || input.testsFailed !== undefined) {
    content += `
| Passed | Failed |
|--------|--------|
| ${input.testsPassed || 0} | ${input.testsFailed || 0} |
`;
  }

  if (input.testsRun && input.testsRun.length > 0) {
    content += `\n### Tests Run\n`;
    for (const test of input.testsRun.slice(0, 10)) {
      content += `- \`${test}\`\n`;
    }
  }

  return content;
}

function generateNextStepsSection(hotspots?: HotspotsOutput): string {
  let content = `## Next Steps

### Recommended Iterations

`;

  if (hotspots && hotspots.hotspots.length > 0) {
    const remaining = hotspots.hotspots.slice(0, 5);
    content += `Based on remaining hotspots:\n\n`;
    for (const h of remaining) {
      content += `1. **${h.path}** (score: ${h.score.toFixed(1)})\n   - Goal: ${h.suggestedGoal}\n   - Reasons: ${h.reasons.join(', ')}\n\n`;
    }
  } else {
    content += `- Run \`code_quick_analysis\` periodically to monitor code health\n`;
    content += `- Set up pre-commit hooks to catch complexity increases\n`;
    content += `- Consider adding more tests to high-complexity areas\n`;
  }

  return content;
}

// ═══════════════════════════════════════════════════════════════
//                  TEAM+ ADVANCED SECTIONS
// ═══════════════════════════════════════════════════════════════

function generateTechDebtIndexSection(
  currentHotspots: HotspotsOutput,
  currentMetrics: MetricsOutput,
  scanResult: ScanRepositoryOutput,
  previousSession: SessionSnapshot | null | undefined,
  sessionStorage: SessionStorage,
  repoName: string
): string {
  // Calculate current Tech Debt Index
  const highComplexityFiles = currentMetrics.files.filter(f => f.complexityScore > 50).length;
  const largeFiles = currentMetrics.files.filter(f => f.lines > 500).length;
  const totalHotspotScore = currentHotspots.hotspots.reduce((sum, h) => sum + h.score, 0);

  const currentIndex = sessionStorage.calculateTechDebtIndex(
    currentHotspots.summary.hotspotsFound,
    totalHotspotScore,
    currentMetrics.aggregate.avgComplexityScore,
    highComplexityFiles,
    largeFiles,
    currentMetrics.files.length,
    scanResult.totalLinesApprox
  );

  // Get grade
  let grade: string;
  let gradeEmoji: string;
  let interpretation: string;

  if (currentIndex <= 20) {
    grade = 'A';
    gradeEmoji = '🟢';
    interpretation = 'Excellent! Your codebase is well-maintained with minimal tech debt.';
  } else if (currentIndex <= 40) {
    grade = 'B';
    gradeEmoji = '🟢';
    interpretation = 'Good condition. A few areas could use attention, but overall healthy.';
  } else if (currentIndex <= 60) {
    grade = 'C';
    gradeEmoji = '🟡';
    interpretation = 'Fair. Tech debt is accumulating - consider allocating time for cleanup.';
  } else if (currentIndex <= 80) {
    grade = 'D';
    gradeEmoji = '🟠';
    interpretation = 'Poor. Significant tech debt is impacting maintainability. Prioritize refactoring.';
  } else {
    grade = 'F';
    gradeEmoji = '🔴';
    interpretation = 'Critical! High tech debt is likely causing bugs and slowing development.';
  }

  let content = `## Tech Debt Index

> Your codebase health at a glance (Team/Enterprise feature)

### Current Score

| ${gradeEmoji} Grade **${grade}** | Index: **${currentIndex}/100** |
|:---:|:---:|

*${interpretation}*

`;

  // Calculate component breakdown
  const hotspotCountScore = Math.min(currentHotspots.summary.hotspotsFound / 20, 1) * 20;
  const hotspotScoreComponent = Math.min(totalHotspotScore / 1000, 1) * 20;
  const hotspotComponent = Math.round(hotspotCountScore + hotspotScoreComponent);

  const complexityBase = Math.min(Math.max(currentMetrics.aggregate.avgComplexityScore - 20, 0) / 30, 1) * 15;
  const highComplexityPenalty = Math.min(highComplexityFiles / 10, 1) * 15;
  const complexityComponent = Math.round(complexityBase + highComplexityPenalty);

  const largeFileRatio = currentMetrics.files.length > 0 ? largeFiles / currentMetrics.files.length : 0;
  const sizeComponent = Math.round(Math.min(largeFileRatio * 4, 1) * 20);

  const debtDensity = scanResult.totalLinesApprox > 0
    ? (currentHotspots.summary.hotspotsFound / (scanResult.totalLinesApprox / 1000))
    : 0;
  const densityComponent = Math.round(Math.min(debtDensity / 5, 1) * 10);

  content += `### Score Breakdown

| Component | Score | Max | Description |
|-----------|-------|-----|-------------|
| Hotspots | ${hotspotComponent} | 40 | Based on hotspot count and total score |
| Complexity | ${complexityComponent} | 30 | Based on avg complexity and high-complexity files |
| File Size | ${sizeComponent} | 20 | Based on large file ratio |
| Debt Density | ${densityComponent} | 10 | Hotspots per 1000 LOC |
| **Total** | **${currentIndex}** | **100** | Lower is better |

`;

  // Show delta if previous session exists
  if (previousSession && previousSession.summary.techDebtIndex !== undefined) {
    const prevIndex = previousSession.summary.techDebtIndex;
    const delta = currentIndex - prevIndex;
    const deltaEmoji = delta < 0 ? '📉' : delta > 0 ? '📈' : '➡️';
    const deltaText = delta < 0 ? 'improved' : delta > 0 ? 'increased' : 'unchanged';

    content += `### Change from Previous

| Previous | Current | Delta |
|----------|---------|-------|
| ${prevIndex} | ${currentIndex} | ${deltaEmoji} ${delta > 0 ? '+' : ''}${delta} (${deltaText}) |

`;
  }

  return content;
}

function generateTechDebtSummary(
  currentHotspots: HotspotsOutput,
  currentMetrics: MetricsOutput,
  previousSession?: SessionSnapshot | null
): string {
  let content = `## Tech Debt Summary

> This section is available with Team/Enterprise license.

`;

  // Calculate current totals
  const currentHotspotCount = currentHotspots.summary.hotspotsFound;
  const currentTotalScore = currentHotspots.hotspots.reduce((sum, h) => sum + h.score, 0);
  const currentHighComplexityFiles = currentMetrics.files.filter(f => f.complexityScore > 50).length;
  const currentLargeFiles = currentMetrics.files.filter(f => f.lines > 500).length;

  if (previousSession) {
    // Calculate deltas
    const prevHotspotCount = previousSession.summary.totalHotspots;
    const prevTotalScore = previousSession.hotspots.hotspots.reduce((sum, h) => sum + h.score, 0);
    const prevHighComplexityFiles = previousSession.metrics.files.filter((f: any) => f.complexityScore > 50).length;
    const prevLargeFiles = previousSession.metrics.files.filter((f: any) => f.lines > 500).length;

    const hotspotDelta = currentHotspotCount - prevHotspotCount;
    const scoreDelta = currentTotalScore - prevTotalScore;
    const complexityDelta = currentHighComplexityFiles - prevHighComplexityFiles;
    const sizeDelta = currentLargeFiles - prevLargeFiles;

    const formatDelta = (delta: number): string => {
      if (delta === 0) return '—';
      const sign = delta > 0 ? '+' : '';
      const color = delta > 0 ? '🔴' : '🟢';
      return `${color} ${sign}${delta}`;
    };

    const formatPercent = (prev: number, curr: number): string => {
      if (prev === 0) return 'N/A';
      const pct = ((curr - prev) / prev) * 100;
      const sign = pct > 0 ? '+' : '';
      return `${sign}${pct.toFixed(0)}%`;
    };

    content += `### Comparison with Previous Session

| Metric | Previous | Current | Delta | Change |
|--------|----------|---------|-------|--------|
| Hotspots | ${prevHotspotCount} | ${currentHotspotCount} | ${formatDelta(hotspotDelta)} | ${formatPercent(prevHotspotCount, currentHotspotCount)} |
| Total Score | ${prevTotalScore.toFixed(0)} | ${currentTotalScore.toFixed(0)} | ${formatDelta(Math.round(scoreDelta))} | ${formatPercent(prevTotalScore, currentTotalScore)} |
| High-complexity files (>50) | ${prevHighComplexityFiles} | ${currentHighComplexityFiles} | ${formatDelta(complexityDelta)} | ${formatPercent(prevHighComplexityFiles, currentHighComplexityFiles)} |
| Large files (>500 LOC) | ${prevLargeFiles} | ${currentLargeFiles} | ${formatDelta(sizeDelta)} | ${formatPercent(prevLargeFiles, currentLargeFiles)} |

*Previous session: ${previousSession.sessionId} (${new Date(previousSession.timestamp).toLocaleDateString()})*
`;
  } else {
    content += `### Current State

| Metric | Value |
|--------|-------|
| Total Hotspots | ${currentHotspotCount} |
| Total Hotspot Score | ${currentTotalScore.toFixed(0)} |
| High-complexity files (>50) | ${currentHighComplexityFiles} |
| Large files (>500 LOC) | ${currentLargeFiles} |

*This is your first analysis. Run another analysis after making improvements to see progress!*
`;
  }

  return content;
}

function generateBeforeAfterSection(
  previousSession: SessionSnapshot,
  currentHotspots: HotspotsOutput,
  currentMetrics: MetricsOutput
): string {
  let content = `## Before vs After

> Track your progress over time with session comparisons.

`;

  const prevDate = new Date(previousSession.timestamp).toLocaleDateString();
  const currDate = new Date().toLocaleDateString();

  content += `| Aspect | Before (${prevDate}) | After (${currDate}) |
|--------|----------------------|---------------------|
| Files Analyzed | ${previousSession.summary.filesAnalyzed} | ${currentMetrics.files.length} |
| Avg Complexity | ${previousSession.summary.avgComplexity.toFixed(1)} | ${currentMetrics.aggregate.avgComplexityScore.toFixed(1)} |
| Hotspots | ${previousSession.summary.totalHotspots} | ${currentHotspots.summary.hotspotsFound} |
| Top Hotspot Score | ${previousSession.summary.topHotspotScore.toFixed(1)} | ${currentHotspots.hotspots[0]?.score.toFixed(1) || 0} |
`;

  // Highlight improvements
  const complexityImproved = currentMetrics.aggregate.avgComplexityScore < previousSession.summary.avgComplexity;
  const hotspotsReduced = currentHotspots.summary.hotspotsFound < previousSession.summary.totalHotspots;

  if (complexityImproved || hotspotsReduced) {
    content += `\n### Improvements\n\n`;
    if (complexityImproved) {
      const reduction = previousSession.summary.avgComplexity - currentMetrics.aggregate.avgComplexityScore;
      content += `- Complexity reduced by ${reduction.toFixed(1)} points\n`;
    }
    if (hotspotsReduced) {
      const reduction = previousSession.summary.totalHotspots - currentHotspots.summary.hotspotsFound;
      content += `- ${reduction} fewer hotspots\n`;
    }
  }

  return content;
}

function generateROISection(
  previousSession: SessionSnapshot,
  currentHotspots?: HotspotsOutput,
  currentMetrics?: MetricsOutput
): string {
  let content = `## ROI Notes

> Understand the business value of your optimization efforts.

`;

  if (!currentHotspots || !currentMetrics) {
    content += `_Complete an optimization session to see ROI estimates._\n`;
    return content;
  }

  const hotspotsReduced = previousSession.summary.totalHotspots - currentHotspots.summary.hotspotsFound;
  const complexityReduced = previousSession.summary.avgComplexity - currentMetrics.aggregate.avgComplexityScore;

  // Estimate time savings (very rough estimates)
  // Assume each hotspot addressed saves ~2 hours of future maintenance
  // Assume each complexity point reduced saves ~15 minutes of review time
  const estimatedHoursSaved = hotspotsReduced > 0 ? hotspotsReduced * 2 : 0;
  const estimatedReviewMinutes = complexityReduced > 0 ? complexityReduced * 15 : 0;

  content += `### Estimated Benefits

`;

  if (hotspotsReduced > 0) {
    content += `- **${hotspotsReduced} hotspots addressed**: Estimated ~${estimatedHoursSaved} hours of future maintenance avoided\n`;
  }

  if (complexityReduced > 0) {
    content += `- **Complexity reduced by ${complexityReduced.toFixed(1)}**: Easier code reviews, ~${Math.round(estimatedReviewMinutes)} minutes saved per review cycle\n`;
  }

  if (hotspotsReduced <= 0 && complexityReduced <= 0) {
    content += `- No measurable improvement yet. Continue addressing hotspots to see benefits.\n`;
  }

  content += `
### Tips for Maximizing ROI

1. **Focus on high-score hotspots first** - they represent the biggest maintenance burden
2. **Track progress weekly** - run \`ccg code-optimize --report\` regularly
3. **Set team goals** - aim to reduce total hotspot score by 20% per sprint
`;

  return content;
}

function generateUpgradePrompt(): string {
  return `## Unlock Advanced Reports

> **Upgrade to Team** for powerful insights:
>
> - **Tech Debt Summary**: Track hotspots, complexity, and file metrics over time
> - **Before vs After**: Visual comparisons between analysis sessions
> - **ROI Notes**: Estimate time and cost savings from your improvements
> - **Trend Analysis**: See your codebase health trajectory
>
> Visit [codeguardian.studio/pricing](https://codeguardian.studio/pricing) to upgrade.
>
> Or run \`ccg activate\` if you have a license key.
`;
}

function generateFooter(licenseTier: LicenseTier): string {
  const tierNote = licenseTier === 'dev'
    ? '\n\n*Free tier - Upgrade to Team for advanced reports*'
    : `\n\n*${licenseTier.charAt(0).toUpperCase() + licenseTier.slice(1)} license - Thank you for your support!*`;

  return `---

*Generated by Code Guardian Studio v3.1 - Code Optimizer Module*

*Report generated on: ${new Date().toISOString()}*${tierNote}`;
}

// ═══════════════════════════════════════════════════════════════
//                      HELPERS
// ═══════════════════════════════════════════════════════════════

function calculatePercentChange(before: number, after: number): string {
  if (before === 0) return 'N/A';
  const change = ((after - before) / before) * 100;
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

function calculateSummary(input: GenerateReportInput): GenerateReportOutput['summary'] {
  const summary: GenerateReportOutput['summary'] = {
    hotspotsAnalyzed: input.hotspots?.summary.hotspotsFound || 0,
    filesChanged: input.filesChanged?.length || 0,
    testsStatus: input.testsStatus,
  };

  // Calculate complexity reduction
  if (input.metricsBefore && input.metricsAfter) {
    const complexityBefore = input.metricsBefore.aggregate.avgComplexityScore;
    const complexityAfter = input.metricsAfter.aggregate.avgComplexityScore;
    summary.complexityReduction = calculatePercentChange(complexityBefore, complexityAfter);

    const linesBefore = input.metricsBefore.aggregate.totalLines;
    const linesAfter = input.metricsAfter.aggregate.totalLines;
    summary.linesReduction = calculatePercentChange(linesBefore, linesAfter);
  }

  return summary;
}
