// src/bin/commands/cloud.ts

/**
 * Cloud Commands
 *
 * CLI commands for Evidence Vault cloud features:
 * - login: Authenticate with cloud API
 * - push: Upload Proof Packs to Evidence Vault
 * - status: Check cloud connection status
 *
 * @since v2.1.0
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { createVaultService, DEFAULT_CLOUD_CONFIG } from '../../cloud/evidence-vault/vault.service.js';
import { createAuthService } from '../../cloud/evidence-vault/auth.service.js';
import type { CloudConfig } from '../../cloud/evidence-vault/vault.types.js';
import type { ProofPack } from '../../modules/proof-pack/proof-pack.types.js';

// ============================================================================
// Constants
// ============================================================================

const ENV_KEY_NAME = 'CCG_CLOUD_API_KEY';

// ============================================================================
// Main Command
// ============================================================================

export function createCloudCommand(): Command {
  const cloud = new Command('cloud')
    .description('Evidence Vault cloud commands');

  // Add subcommands
  cloud.addCommand(createLoginCommand());
  cloud.addCommand(createPushCommand());
  cloud.addCommand(createStatusCommand());

  return cloud;
}

// ============================================================================
// Login Command
// ============================================================================

function createLoginCommand(): Command {
  return new Command('login')
    .description('Authenticate with Evidence Vault')
    .option('-k, --key <apiKey>', 'API key (or set CCG_CLOUD_API_KEY env var)')
    .option('--verify', 'Verify authentication without storing')
    .action(async (options: { key?: string; verify?: boolean }) => {
      console.log();
      console.log(chalk.blue('  Evidence Vault Login'));
      console.log(chalk.dim('  ══════════════════════════════════════════════════'));
      console.log();

      try {
        // Get API key from option or environment
        let apiKey = options.key || process.env[ENV_KEY_NAME];

        if (!apiKey) {
          console.log(chalk.yellow('  No API key provided.'));
          console.log();
          console.log('  To authenticate, either:');
          console.log(`    1. Set ${chalk.cyan(ENV_KEY_NAME)} environment variable`);
          console.log(`    2. Run ${chalk.cyan('ccg cloud login --key <your-api-key>')}`);
          console.log();
          console.log('  Get your API key at: https://codeguardian.studio/settings/api-keys');
          console.log();
          process.exit(1);
        }

        // Validate key format
        if (!apiKey.startsWith('ccg_')) {
          console.log(chalk.red('  Invalid API key format.'));
          console.log(chalk.dim('  API keys must start with "ccg_"'));
          console.log();
          process.exit(1);
        }

        if (apiKey.length < 32) {
          console.log(chalk.red('  Invalid API key format.'));
          console.log(chalk.dim('  API key is too short'));
          console.log();
          process.exit(1);
        }

        // Create config for testing
        const config: CloudConfig = {
          ...DEFAULT_CLOUD_CONFIG,
          enabled: true,
          keyStorage: 'env',
        };

        // Temporarily set env for testing
        const originalEnv = process.env[ENV_KEY_NAME];
        process.env[ENV_KEY_NAME] = apiKey;

        const authService = createAuthService(config);
        const result = await authService.testAuth();

        // Restore original env
        if (originalEnv !== undefined) {
          process.env[ENV_KEY_NAME] = originalEnv;
        } else {
          delete process.env[ENV_KEY_NAME];
        }

        if (result.success) {
          console.log(chalk.green('  Authentication successful!'));
          console.log();

          if (options.verify) {
            console.log(chalk.dim('  (verify mode - key not stored)'));
          } else {
            console.log('  To persist this key, add to your environment:');
            console.log();
            console.log(chalk.cyan(`    export ${ENV_KEY_NAME}="${apiKey.substring(0, 12)}..."`));
            console.log();
            console.log(chalk.yellow('  Security Note:'));
            console.log('  - Add to ~/.bashrc or ~/.zshrc for persistence');
            console.log('  - Add to CI secrets for GitHub Actions');
            console.log('  - Never commit API keys to version control');
          }
        } else {
          console.log(chalk.red('  Authentication failed!'));
          console.log(chalk.dim(`  ${result.error?.message || 'Unknown error'}`));
          process.exit(1);
        }

        console.log();
      } catch (error) {
        console.log(chalk.red('  Error:'), error instanceof Error ? error.message : String(error));
        console.log();
        process.exit(1);
      }
    });
}

// ============================================================================
// Push Command
// ============================================================================

function createPushCommand(): Command {
  return new Command('push')
    .description('Upload Proof Pack to Evidence Vault')
    .argument('<file>', 'Path to proof-pack.json file')
    .option('-t, --tags <tags>', 'Comma-separated tags for organization')
    .option('-r, --retention <days>', 'Retention period in days (default: 90)', '90')
    .option('--repo <repo>', 'Repository context (owner/name)')
    .option('-q, --quiet', 'Minimal output')
    .option('-j, --json', 'Output result as JSON')
    .action(async (file: string, options: {
      tags?: string;
      retention?: string;
      repo?: string;
      quiet?: boolean;
      json?: boolean;
    }) => {
      const resolvedPath = resolve(process.cwd(), file);

      // Check API key
      if (!process.env[ENV_KEY_NAME]) {
        if (options.json) {
          console.log(JSON.stringify({
            success: false,
            error: 'Not authenticated. Run "ccg cloud login" first.',
          }));
        } else if (!options.quiet) {
          console.log();
          console.log(chalk.red('  Not authenticated.'));
          console.log(`  Run ${chalk.cyan('ccg cloud login')} first.`);
          console.log();
        } else {
          console.log('FAIL: Not authenticated');
        }
        process.exit(1);
      }

      // Check file exists
      if (!existsSync(resolvedPath)) {
        if (options.json) {
          console.log(JSON.stringify({
            success: false,
            error: `File not found: ${resolvedPath}`,
          }));
        } else if (!options.quiet) {
          console.log();
          console.log(chalk.red(`  File not found: ${resolvedPath}`));
          console.log();
        } else {
          console.log('FAIL: File not found');
        }
        process.exit(1);
      }

      // Parse Proof Pack
      let proofPack: ProofPack;
      try {
        const content = readFileSync(resolvedPath, 'utf-8');
        proofPack = JSON.parse(content) as ProofPack;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (options.json) {
          console.log(JSON.stringify({
            success: false,
            error: `Failed to parse JSON: ${errMsg}`,
          }));
        } else if (!options.quiet) {
          console.log();
          console.log(chalk.red(`  Failed to parse JSON: ${errMsg}`));
          console.log();
        } else {
          console.log('FAIL: Invalid JSON');
        }
        process.exit(1);
      }

      // Create vault service
      const config: CloudConfig = {
        ...DEFAULT_CLOUD_CONFIG,
        enabled: true,
        keyStorage: 'env',
      };

      const vaultService = createVaultService(config);

      // Parse repository if provided
      let repository: { owner: string; name: string } | undefined;
      if (options.repo) {
        const parts = options.repo.split('/');
        if (parts.length === 2) {
          repository = { owner: parts[0], name: parts[1] };
        }
      }

      if (!options.quiet && !options.json) {
        console.log();
        console.log(chalk.blue('  Uploading to Evidence Vault...'));
        console.log();
      }

      try {
        const response = await vaultService.upload({
          proofPack,
          tags: options.tags?.split(',').map(t => t.trim()),
          retentionDays: parseInt(options.retention || '90', 10),
          repository,
        });

        if (response.success) {
          if (options.json) {
            console.log(JSON.stringify({
              success: true,
              vaultId: response.vaultId,
              hashVerified: response.hashVerified,
              storedAt: response.storedAt,
              expiresAt: response.expiresAt,
            }));
          } else if (options.quiet) {
            console.log(`OK: ${response.vaultId}`);
          } else {
            console.log(chalk.green('  Upload successful!'));
            console.log();
            console.log(`  Vault ID:      ${chalk.cyan(response.vaultId)}`);
            console.log(`  Hash Verified: ${chalk.green('Yes')}`);
            console.log(`  Stored At:     ${response.storedAt}`);
            console.log(`  Expires At:    ${response.expiresAt}`);
            console.log();
            console.log(chalk.dim('  View at: https://codeguardian.studio/vault/' + response.vaultId));
            console.log();
          }
        } else {
          if (options.json) {
            console.log(JSON.stringify({
              success: false,
              error: response.error,
            }));
          } else if (options.quiet) {
            console.log(`FAIL: ${response.error}`);
          } else {
            console.log(chalk.red('  Upload failed!'));
            console.log(chalk.dim(`  ${response.error}`));
            console.log();
          }
          process.exit(1);
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        if (options.json) {
          console.log(JSON.stringify({
            success: false,
            error: errMsg,
          }));
        } else if (options.quiet) {
          console.log(`FAIL: ${errMsg}`);
        } else {
          console.log(chalk.red('  Error:'), errMsg);
          console.log();
        }
        process.exit(1);
      }
    });
}

// ============================================================================
// Status Command
// ============================================================================

function createStatusCommand(): Command {
  return new Command('status')
    .description('Check cloud connection status')
    .option('-j, --json', 'Output as JSON')
    .action(async (options: { json?: boolean }) => {
      const hasKey = !!process.env[ENV_KEY_NAME];

      if (options.json) {
        console.log(JSON.stringify({
          authenticated: hasKey,
          keyConfigured: hasKey,
          endpoint: DEFAULT_CLOUD_CONFIG.endpoint,
        }));
        return;
      }

      console.log();
      console.log(chalk.blue('  Evidence Vault Status'));
      console.log(chalk.dim('  ══════════════════════════════════════════════════'));
      console.log();

      console.log(`  Authenticated: ${hasKey ? chalk.green('Yes') : chalk.red('No')}`);
      console.log(`  Endpoint:      ${chalk.dim(DEFAULT_CLOUD_CONFIG.endpoint)}`);

      if (!hasKey) {
        console.log();
        console.log(chalk.yellow(`  Run ${chalk.cyan('ccg cloud login')} to authenticate.`));
      } else {
        // Test connection
        const config: CloudConfig = {
          ...DEFAULT_CLOUD_CONFIG,
          enabled: true,
          keyStorage: 'env',
        };

        const vaultService = createVaultService(config);
        try {
          const health = await vaultService.healthCheck();
          console.log(`  Connected:     ${health.healthy ? chalk.green('Yes') : chalk.red('No')}`);
          if (health.latencyMs > 0) {
            console.log(`  Latency:       ${health.latencyMs}ms`);
          }
          if (health.error) {
            console.log(`  Error:         ${chalk.red(health.error)}`);
          }
        } catch {
          console.log(`  Connected:     ${chalk.yellow('Unable to verify')}`);
        }
      }

      console.log();
    });
}
