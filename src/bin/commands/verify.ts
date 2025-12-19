// src/bin/commands/verify.ts

/**
 * Verify Command
 *
 * Verifies the integrity of a Proof Pack JSON file by checking its SHA-256 hash.
 * Returns exit code 0 for valid proof packs, 1 for invalid/tampered ones.
 *
 * Usage: ccg verify <proof-pack.json>
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { verifyProofPackHash } from '../../modules/proof-pack/integrity.js';

export function createVerifyCommand(): Command {
  const command = new Command('verify')
    .description('Verify a Proof Pack file integrity')
    .argument('<file>', 'Path to proof-pack.json file')
    .option('-q, --quiet', 'Only output pass/fail, no details')
    .option('-j, --json', 'Output result as JSON')
    .action(async (file: string, options: { quiet?: boolean; json?: boolean }) => {
      const exitCode = await executeVerify(file, options);
      process.exit(exitCode);
    });

  return command;
}

interface VerifyResult {
  valid: boolean;
  file: string;
  proofPackId?: string;
  trustLevel?: string;
  hashAlgorithm?: string;
  expectedHash?: string;
  actualHash?: string;
  error?: string;
}

async function executeVerify(
  filePath: string,
  options: { quiet?: boolean; json?: boolean }
): Promise<number> {
  const resolvedPath = resolve(process.cwd(), filePath);
  const result: VerifyResult = {
    valid: false,
    file: resolvedPath,
  };

  // Check if file exists
  if (!existsSync(resolvedPath)) {
    result.error = `File not found: ${resolvedPath}`;
    outputResult(result, options);
    return 1;
  }

  // Read and parse JSON
  let proofPack: Record<string, unknown>;
  try {
    const content = readFileSync(resolvedPath, 'utf-8');
    proofPack = JSON.parse(content);
  } catch (err) {
    result.error = `Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`;
    outputResult(result, options);
    return 1;
  }

  // Validate required fields
  if (!proofPack.hash) {
    result.error = 'Missing required field: hash';
    outputResult(result, options);
    return 1;
  }

  if (!proofPack.id) {
    result.error = 'Missing required field: id';
    outputResult(result, options);
    return 1;
  }

  // Extract metadata
  result.proofPackId = String(proofPack.id);
  result.trustLevel = String(proofPack.trustLevel ?? 'UNKNOWN');
  result.hashAlgorithm = String(proofPack.hashAlgorithm ?? 'SHA-256');

  // Verify hash
  const verification = verifyProofPackHash(proofPack);
  result.valid = verification.ok;
  result.expectedHash = verification.expected;
  result.actualHash = verification.actual;

  if (!verification.ok) {
    result.error = 'Hash mismatch - Proof Pack may have been tampered with';
  }

  outputResult(result, options);
  return result.valid ? 0 : 1;
}

function outputResult(
  result: VerifyResult,
  options: { quiet?: boolean; json?: boolean }
): void {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (options.quiet) {
    console.log(result.valid ? 'PASS' : 'FAIL');
    return;
  }

  // Detailed output
  console.log();
  console.log(chalk.blue('  Proof Pack Verification'));
  console.log(chalk.dim('  ══════════════════════════════════════════════════'));
  console.log();

  console.log(`  File:        ${chalk.dim(result.file)}`);

  if (result.proofPackId) {
    console.log(`  ID:          ${chalk.cyan(result.proofPackId)}`);
  }

  if (result.trustLevel) {
    console.log(`  Trust Level: ${chalk.yellow(result.trustLevel)}`);
  }

  if (result.hashAlgorithm) {
    console.log(`  Algorithm:   ${result.hashAlgorithm}`);
  }

  console.log();

  if (result.valid) {
    console.log(chalk.green('  Status: VALID'));
    console.log(chalk.dim(`  Hash:   ${result.actualHash}`));
  } else {
    console.log(chalk.red('  Status: INVALID'));
    if (result.error) {
      console.log(chalk.red(`  Error:  ${result.error}`));
    }
    if (result.expectedHash && result.actualHash && result.expectedHash !== result.actualHash) {
      console.log();
      console.log(chalk.dim('  Hash Comparison:'));
      console.log(chalk.red(`    Expected: ${result.expectedHash}`));
      console.log(chalk.red(`    Actual:   ${result.actualHash}`));
    }
  }

  console.log();
}
