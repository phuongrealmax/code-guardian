// src/bin/commands/code-optimize.ts

/**
 * Code Optimize Command
 *
 * Extracted from ccg.ts to reduce file size and improve maintainability.
 * Provides codebase analysis with hotspot detection and reporting.
 */

import { Command, Option } from 'commander';
import chalk from 'chalk';
import { join, basename } from 'path';
import { existsSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import {
  MultiRepoConfigManager,
  isMultiRepoEnabled,
  getEffectiveRepoName,
} from '../../core/multi-repo-config.js';

interface CodeOptimizeOptions {
  report?: boolean;
  strategy?: string;
  maxFiles?: string;
  maxHotspots?: string;
  output?: string;
  json?: boolean;
  ci?: boolean;
  threshold?: string;
  helpAdvanced?: boolean;
  repo?: string;
}

export function createCodeOptimizeCommand(): Command {
  const command = new Command('code-optimize')
    .description('Analyze and optimize codebase (Quick Analysis preset)\n\n' +
      'Examples:\n' +
      '  ccg code-optimize              # Quick scan with defaults\n' +
      '  ccg code-optimize --report     # Generate markdown report\n' +
      '  ccg code-optimize --repo core  # Analyze specific repo\n' +
      '  ccg code-optimize --json       # Output as JSON\n\n' +
      'For advanced options, use: ccg code-optimize --help-advanced')
    .option('-r, --report', 'Generate optimization report')
    .option('-j, --json', 'Output results as JSON')
    .option('--repo <name>', 'Target a specific repository (requires .ccg/config.yml)')
    .option('--help-advanced', 'Show advanced options for power users')
    .addOption(new Option('-s, --strategy <strategy>', 'Scoring strategy (size, complexity, mixed)').default('mixed').hideHelp())
    .addOption(new Option('-m, --max-files <number>', 'Maximum files to scan').default('1000').hideHelp())
    .addOption(new Option('-t, --max-hotspots <number>', 'Maximum hotspots to return').default('20').hideHelp())
    .addOption(new Option('-o, --output <path>', 'Custom report output path').hideHelp())
    .addOption(new Option('--ci', 'CI mode - exit with error code if hotspots exceed threshold').hideHelp())
    .addOption(new Option('--threshold <number>', 'Hotspot score threshold for CI mode').default('50').hideHelp())
    .action(async (options: CodeOptimizeOptions) => {
      await executeCodeOptimize(options);
    });

  return command;
}

async function executeCodeOptimize(options: CodeOptimizeOptions): Promise<void> {
  // Handle --help-advanced
  if (options.helpAdvanced) {
    printAdvancedHelp();
    return;
  }

  const cwd = process.cwd();
  const ccgDir = join(cwd, '.ccg');

  if (!existsSync(ccgDir)) {
    console.error(chalk.red('\n  CCG not initialized. Run "ccg init" first.\n'));
    process.exit(1);
  }

  // Handle multi-repo mode
  const { targetPath, repoName } = resolveRepository(options, cwd);

  console.log(chalk.blue('\n  CCG Code Optimizer\n'));
  if (options.repo || isMultiRepoEnabled(cwd)) {
    console.log(chalk.dim(`  Repository: ${repoName}`));
  }
  console.log(chalk.dim('  ═'.repeat(25)));

  try {
    const { EventBus } = await import('../../core/event-bus.js');
    const { Logger } = await import('../../core/logger.js');
    const { CodeOptimizerService } = await import('../../modules/code-optimizer/code-optimizer.service.js');

    const eventBus = new EventBus();
    const logger = new Logger('info', 'code-optimize');
    const service = new CodeOptimizerService({}, eventBus, logger, targetPath);
    await service.initialize();

    // Run quick analysis
    console.log(chalk.dim('\n  Scanning repository...'));
    const result = await service.quickAnalysis({
      maxFiles: parseInt(options.maxFiles || '1000', 10),
      maxHotspots: parseInt(options.maxHotspots || '20', 10),
      strategy: (options.strategy as 'size' | 'complexity' | 'mixed') || 'mixed',
    });

    // Save optimizer cache for programmatic access
    const ccgDir = join(targetPath, '.ccg');
    if (!existsSync(ccgDir)) {
      mkdirSync(ccgDir, { recursive: true });
    }
    const cachePath = join(ccgDir, 'optimizer-cache.json');
    writeFileSync(cachePath, JSON.stringify({
      scanResult: {
        totalFiles: result.scan.totalFiles,
        totalLines: result.scan.totalLinesApprox,
        rootPath: result.scan.rootPath,
      },
      metrics: {
        filesAnalyzed: result.metrics.files.length,
        aggregate: result.metrics.aggregate,
      },
      hotspots: result.hotspots.hotspots,
      summary: result.hotspots.summary,
      timestamp: new Date().toISOString(),
    }, null, 2), 'utf-8');

    // Output results
    if (options.json) {
      outputJson(result, options);
    } else {
      outputConsole(result);
    }

    // Generate report if requested
    if (options.report) {
      console.log(chalk.dim('\n  Generating report...'));
      const sessionId = `cli-${Date.now()}`;
      const reportResult = service.generateReport({
        sessionId,
        repoName,
        strategy: (options.strategy as 'size' | 'complexity' | 'mixed') || 'mixed',
        scanResult: result.scan,
        metricsBefore: result.metrics,
        hotspots: result.hotspots,
        outputPath: options.output,
      });

      // Create optimization-latest.md symlink/copy for convenience
      const latestReportPath = join(targetPath, 'docs', 'reports', 'optimization-latest.md');
      const fullReportPath = join(targetPath, reportResult.reportPath);
      try {
        // Ensure docs/reports directory exists
        const reportsDir = join(targetPath, 'docs', 'reports');
        if (!existsSync(reportsDir)) {
          mkdirSync(reportsDir, { recursive: true });
        }
        // Copy to latest (more portable than symlinks on Windows)
        copyFileSync(fullReportPath, latestReportPath);
      } catch {
        // Ignore copy errors - not critical
      }

      console.log(chalk.green(`\n  Report saved: ${reportResult.reportPath}`));
    }

    // CI mode - check thresholds
    if (options.ci) {
      handleCiMode(result, options);
    }

    console.log();
    await service.shutdown();
  } catch (error) {
    console.error(chalk.red('\n  Error:'), error);
    process.exit(1);
  }
}

function printAdvancedHelp(): void {
  console.log(chalk.blue('\n  CCG Code Optimizer - Advanced Options\n'));
  console.log('Usage: ccg code-optimize [options]\n');
  console.log('Basic Options:');
  console.log('  -r, --report                    Generate optimization report');
  console.log('  -j, --json                      Output results as JSON');
  console.log('  --help-advanced                 Show this help\n');
  console.log('Advanced Options (for power users):');
  console.log('  -s, --strategy <strategy>       Scoring strategy: size, complexity, or mixed (default: mixed)');
  console.log('  -m, --max-files <number>        Maximum files to scan (default: 1000)');
  console.log('  -t, --max-hotspots <number>     Maximum hotspots to return (default: 20)');
  console.log('  -o, --output <path>             Custom report output path');
  console.log('  --ci                            CI mode - exit with error if hotspots exceed threshold');
  console.log('  --threshold <number>            Hotspot score threshold for CI mode (default: 50)\n');
  console.log('Examples:');
  console.log('  ccg code-optimize --strategy size --max-files 5000');
  console.log('  ccg code-optimize --ci --threshold 70');
  console.log('  ccg code-optimize --report --output custom-report.md\n');
}

function resolveRepository(options: CodeOptimizeOptions, cwd: string): { targetPath: string; repoName: string } {
  let targetPath = cwd;
  let repoName = basename(cwd);

  if (options.repo || isMultiRepoEnabled(cwd)) {
    const multiRepoManager = new MultiRepoConfigManager(cwd);

    if (!multiRepoManager.exists()) {
      if (options.repo) {
        console.log(chalk.red('\n  Error: --repo flag requires .ccg/config.yml'));
        console.log(`  Run ${chalk.cyan('ccg init --multi-repo')} to create one.\n`);
        process.exit(1);
      }
    } else {
      const effectiveRepoName = getEffectiveRepoName(options.repo, cwd);

      if (!effectiveRepoName) {
        console.log(chalk.red(`\n  Error: Repository "${options.repo}" not found in config.yml`));
        console.log(`  Available repos: ${multiRepoManager.getRepoNames().join(', ')}\n`);
        process.exit(1);
      }

      const resolvedRepo = multiRepoManager.getRepo(effectiveRepoName);
      if (!resolvedRepo) {
        console.log(chalk.red(`\n  Error: Failed to resolve repository "${effectiveRepoName}"`));
        process.exit(1);
      }

      if (!resolvedRepo.exists) {
        console.log(chalk.red(`\n  Error: Repository path does not exist: ${resolvedRepo.absolutePath}`));
        process.exit(1);
      }

      targetPath = resolvedRepo.absolutePath;
      repoName = effectiveRepoName;
    }
  }

  return { targetPath, repoName };
}

function outputJson(result: any, options: CodeOptimizeOptions): void {
  console.log(JSON.stringify({
    scan: {
      totalFiles: result.scan.totalFiles,
      totalLines: result.scan.totalLinesApprox,
      rootPath: result.scan.rootPath,
    },
    metrics: {
      filesAnalyzed: result.metrics.files.length,
      aggregate: result.metrics.aggregate,
    },
    hotspots: {
      hotspots: result.hotspots.hotspots,
      summary: result.hotspots.summary,
    },
    ci: {
      threshold: parseInt(options.threshold || '50', 10),
      criticalCount: result.hotspots.hotspots.filter((h: any) => h.score >= 80).length,
      failedCount: result.hotspots.hotspots.filter((h: any) => h.score >= parseInt(options.threshold || '50', 10)).length,
      passed: result.hotspots.hotspots.filter((h: any) => h.score >= parseInt(options.threshold || '50', 10)).length === 0,
    },
    timestamp: new Date().toISOString(),
  }, null, 2));
}

function outputConsole(result: any): void {
  console.log();
  console.log(chalk.cyan('  SCAN RESULTS'));
  console.log(`    Files: ${result.scan.totalFiles.toLocaleString()}`);
  console.log(`    Lines: ~${result.scan.totalLinesApprox.toLocaleString()}`);
  console.log();
  console.log(chalk.cyan('  METRICS'));
  console.log(`    Analyzed: ${result.metrics.files.length} source files`);
  console.log(`    Avg Complexity: ${result.metrics.aggregate.avgComplexityScore.toFixed(1)}`);
  console.log(`    TODOs: ${result.metrics.aggregate.totalTodos}`);
  console.log(`    FIXMEs: ${result.metrics.aggregate.totalFixmes}`);
  console.log();
  console.log(chalk.cyan('  HOTSPOTS'));
  console.log(`    Found: ${result.hotspots.summary.hotspotsFound}`);
  console.log(`    Top Reason: ${result.hotspots.summary.topReason}`);
  console.log();

  // List top 5 hotspots
  for (const h of result.hotspots.hotspots.slice(0, 5)) {
    const scoreColor = h.score > 70 ? chalk.red : h.score > 50 ? chalk.yellow : chalk.green;
    console.log(`    ${chalk.dim(`#${h.rank}`)} ${scoreColor(`[${h.score.toFixed(0)}]`)} ${h.path}`);
    console.log(chalk.dim(`       ${h.suggestedGoal}: ${h.reasons.slice(0, 2).join(', ')}`));
  }

  if (result.hotspots.hotspots.length > 5) {
    console.log(chalk.dim(`    ... and ${result.hotspots.hotspots.length - 5} more`));
  }
}

function handleCiMode(result: any, options: CodeOptimizeOptions): void {
  const threshold = parseInt(options.threshold || '50', 10);
  const highScoreHotspots = result.hotspots.hotspots.filter((h: any) => h.score >= threshold);

  if (highScoreHotspots.length > 0) {
    console.log(chalk.red(`\n  CI CHECK FAILED: ${highScoreHotspots.length} hotspots above threshold (${threshold})`));
    process.exit(1);
  } else {
    console.log(chalk.green(`\n  CI CHECK PASSED: No hotspots above threshold (${threshold})`));
  }
}
