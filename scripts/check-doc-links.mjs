#!/usr/bin/env node
/**
 * Docs Link Smoke Check
 *
 * Verifies that all doc links in site TSX files reference existing files.
 * Exits with code 1 if any broken links are found.
 *
 * Usage: node scripts/check-doc-links.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Patterns to find doc references in TSX files
const DOC_LINK_PATTERNS = [
  // GitHub blob links: /blob/<ref>/docs/<path>.md
  /\/blob\/[^/]+\/docs\/([^"'\s]+\.md)/g,
  // GitHub blob links to root files: /blob/<ref>/<file>.md
  /\/blob\/[^/]+\/([A-Z][A-Z_]+\.md)/g,
  // Local docs references: ./docs/<path> or docs/<path>
  /(?:\.\/)?docs\/([^"'\s]+\.md)/g,
];

// Directories to scan for TSX files
const SITE_DIRS = [
  'site/app',
  'site/app/components',
  'site/app/case-study',
  'site/app/pricing',
];

function getAllTsxFiles(dir) {
  const files = [];
  const fullPath = path.join(rootDir, dir);

  if (!fs.existsSync(fullPath)) {
    return files;
  }

  for (const entry of fs.readdirSync(fullPath, { withFileTypes: true })) {
    const entryPath = path.join(fullPath, entry.name);
    if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      files.push(entryPath);
    } else if (entry.isDirectory()) {
      // Recurse into subdirectories
      const subFiles = getAllTsxFiles(path.join(dir, entry.name));
      files.push(...subFiles.map(f => path.join(rootDir, dir, entry.name, path.basename(f))));
    }
  }

  return files;
}

function extractDocLinks(content) {
  const links = new Set();

  for (const pattern of DOC_LINK_PATTERNS) {
    let match;
    // Reset lastIndex for global regex
    pattern.lastIndex = 0;
    while ((match = pattern.exec(content)) !== null) {
      links.add(match[1]);
    }
  }

  return [...links];
}

function checkDocExists(docPath) {
  // Check in docs/ directory
  const fullPath = path.join(rootDir, 'docs', docPath);
  if (fs.existsSync(fullPath)) {
    return true;
  }

  // Check in root directory (for files like CHANGELOG.md)
  const rootPath = path.join(rootDir, docPath);
  if (fs.existsSync(rootPath)) {
    return true;
  }

  return false;
}

function main() {
  console.log('Docs Link Smoke Check');
  console.log('='.repeat(50));

  const allFiles = [];
  for (const dir of SITE_DIRS) {
    allFiles.push(...getAllTsxFiles(dir));
  }

  console.log(`Scanning ${allFiles.length} TSX files...\n`);

  const brokenLinks = [];
  const checkedLinks = new Set();

  for (const file of allFiles) {
    if (!fs.existsSync(file)) continue;

    const content = fs.readFileSync(file, 'utf-8');
    const links = extractDocLinks(content);

    for (const link of links) {
      if (checkedLinks.has(link)) continue;
      checkedLinks.add(link);

      if (!checkDocExists(link)) {
        brokenLinks.push({
          file: path.relative(rootDir, file),
          link,
        });
      }
    }
  }

  console.log(`Checked ${checkedLinks.size} unique doc references.\n`);

  if (brokenLinks.length > 0) {
    console.log('BROKEN LINKS FOUND:');
    console.log('-'.repeat(50));
    for (const { file, link } of brokenLinks) {
      console.log(`  ${file}`);
      console.log(`    -> Missing: ${link}`);
    }
    console.log('\nFix these broken links before deploying.');
    process.exit(1);
  }

  console.log('All doc links are valid.');
  process.exit(0);
}

main();
