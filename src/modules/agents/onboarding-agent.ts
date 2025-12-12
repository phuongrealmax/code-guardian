// src/modules/agents/onboarding-agent.ts

/**
 * Onboarding Agent
 *
 * Specialized agent for helping users:
 * - Migrate from old config formats
 * - Set up initial configuration
 * - Guide new users through CCG features
 * - Validate and repair configurations
 * - Detect and fix common setup issues
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { Logger } from '../../core/logger.js';
import { DEFAULT_CONFIG } from '../../core/config-manager.js';
import { CCGConfig } from '../../core/types.js';

// ═══════════════════════════════════════════════════════════════
//                      TYPES
// ═══════════════════════════════════════════════════════════════

export interface MigrationResult {
  success: boolean;
  migratedFields: string[];
  warnings: string[];
  errors: string[];
  backupPath?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  suggestions: string[];
}

export interface ValidationIssue {
  path: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  fix?: string;
}

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'skipped' | 'failed';
  required: boolean;
  command?: string;
}

export interface OnboardingStatus {
  initialized: boolean;
  configVersion: string;
  lastMigration?: string;
  setupSteps: SetupStep[];
  completionPercentage: number;
}

// ═══════════════════════════════════════════════════════════════
//                      CONFIG VERSION MIGRATIONS
// ═══════════════════════════════════════════════════════════════

interface Migration {
  from: string;
  to: string;
  description: string;
  migrate: (config: Record<string, unknown>) => Record<string, unknown>;
}

const MIGRATIONS: Migration[] = [
  {
    from: '0.x',
    to: '1.0.0',
    description: 'Migrate from pre-1.0 config format',
    migrate: (config) => {
      const migrated = { ...config };

      // Rename old module keys
      if (migrated.guardRails) {
        migrated.modules = migrated.modules || {};
        (migrated.modules as Record<string, unknown>).guard = migrated.guardRails;
        delete migrated.guardRails;
      }

      // Convert flat process config to nested
      if (migrated.processManager) {
        migrated.modules = migrated.modules || {};
        (migrated.modules as Record<string, unknown>).process = migrated.processManager;
        delete migrated.processManager;
      }

      // Add version
      migrated.version = '1.0.0';

      return migrated;
    },
  },
  {
    from: '1.0.0',
    to: '1.1.0',
    description: 'Add latent chain mode configuration',
    migrate: (config) => {
      const migrated = { ...config };
      const modules = migrated.modules as Record<string, unknown> || {};

      if (!modules.latent) {
        modules.latent = {
          enabled: true,
          maxContexts: 50,
          autoMerge: true,
          persist: true,
        };
      }

      migrated.version = '1.1.0';
      migrated.modules = modules;

      return migrated;
    },
  },
  {
    from: '1.1.0',
    to: '1.2.0',
    description: 'Add auto-agent configuration',
    migrate: (config) => {
      const migrated = { ...config };
      const modules = migrated.modules as Record<string, unknown> || {};

      if (!modules.autoAgent) {
        modules.autoAgent = {
          enabled: true,
          decomposer: { maxSubtasks: 10, autoDecompose: true },
          router: { enabled: true },
          fixLoop: { enabled: true, maxRetries: 3 },
          errorMemory: { enabled: true, maxErrors: 100 },
        };
      }

      migrated.version = '1.2.0';
      migrated.modules = modules;

      return migrated;
    },
  },
];

// ═══════════════════════════════════════════════════════════════
//                      ONBOARDING SERVICE
// ═══════════════════════════════════════════════════════════════

export class OnboardingService {
  private logger: Logger;
  private projectRoot: string;
  private ccgDir: string;
  private configPath: string;

  constructor(projectRoot: string = process.cwd(), logger?: Logger) {
    this.projectRoot = projectRoot;
    this.ccgDir = join(projectRoot, '.ccg');
    this.configPath = join(this.ccgDir, 'config.json');
    this.logger = logger || new Logger('info', 'OnboardingAgent');
  }

  // ═══════════════════════════════════════════════════════════════
  //                      INITIALIZATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Initialize CCG in the project
   */
  async initialize(options: {
    force?: boolean;
    template?: 'minimal' | 'standard' | 'full';
    projectType?: string;
  } = {}): Promise<{ success: boolean; message: string; configPath: string }> {
    // Check if already initialized
    if (existsSync(this.configPath) && !options.force) {
      return {
        success: false,
        message: 'CCG already initialized. Use force: true to reinitialize.',
        configPath: this.configPath,
      };
    }

    // Create .ccg directory
    if (!existsSync(this.ccgDir)) {
      mkdirSync(this.ccgDir, { recursive: true });
    }

    // Create config based on template
    let config = this.getTemplateConfig(options.template || 'standard');

    // Auto-detect project type if not specified
    if (!options.projectType) {
      config.project.type = this.detectProjectType();
    } else {
      config.project.type = options.projectType as CCGConfig['project']['type'];
    }

    config.project.name = this.detectProjectName();

    // Save config
    writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf-8');

    this.logger.info('CCG initialized successfully');

    return {
      success: true,
      message: `Initialized CCG with ${options.template || 'standard'} template`,
      configPath: this.configPath,
    };
  }

  /**
   * Get template configuration
   */
  private getTemplateConfig(template: 'minimal' | 'standard' | 'full'): CCGConfig {
    const base = { ...DEFAULT_CONFIG };

    switch (template) {
      case 'minimal':
        // Disable non-essential modules
        base.modules.testing.enabled = false;
        base.modules.documents.enabled = false;
        base.modules.workflow.enabled = false;
        base.modules.latent.enabled = false;
        base.modules.autoAgent.enabled = false;
        break;

      case 'full':
        // All modules enabled with enhanced settings
        base.modules.guard.strictMode = true;
        base.modules.testing.autoRun = true;
        base.modules.workflow.requireTaskForLargeChanges = true;
        base.modules.latent.strictValidation = true;
        break;

      case 'standard':
      default:
        // Use defaults
        break;
    }

    return base;
  }

  /**
   * Detect project type from package.json or file structure
   */
  private detectProjectType(): CCGConfig['project']['type'] {
    const packageJsonPath = join(this.projectRoot, 'package.json');

    if (existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };

        if (deps.react || deps['react-dom']) {
          return 'typescript-react';
        }
        if (deps.typescript) {
          return 'typescript-node';
        }
        return 'javascript';
      } catch {
        // Ignore parse errors
      }
    }

    // Check for Python
    if (existsSync(join(this.projectRoot, 'requirements.txt')) ||
        existsSync(join(this.projectRoot, 'setup.py')) ||
        existsSync(join(this.projectRoot, 'pyproject.toml'))) {
      return 'python';
    }

    return 'other';
  }

  /**
   * Detect project name from package.json or directory name
   */
  private detectProjectName(): string {
    const packageJsonPath = join(this.projectRoot, 'package.json');

    if (existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        if (pkg.name) return pkg.name;
      } catch {
        // Ignore parse errors
      }
    }

    // Fall back to directory name
    return this.projectRoot.split(/[/\\]/).pop() || 'unknown';
  }

  // ═══════════════════════════════════════════════════════════════
  //                      MIGRATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Migrate configuration from old format
   */
  async migrate(options: {
    createBackup?: boolean;
    dryRun?: boolean;
  } = {}): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      migratedFields: [],
      warnings: [],
      errors: [],
    };

    if (!existsSync(this.configPath)) {
      result.errors.push('No config file found. Run initialize first.');
      return result;
    }

    let config: Record<string, unknown>;
    try {
      config = JSON.parse(readFileSync(this.configPath, 'utf-8'));
    } catch (error) {
      result.errors.push(`Failed to parse config: ${error}`);
      return result;
    }

    // Create backup if requested
    if (options.createBackup && !options.dryRun) {
      const backupPath = `${this.configPath}.backup.${Date.now()}`;
      writeFileSync(backupPath, JSON.stringify(config, null, 2), 'utf-8');
      result.backupPath = backupPath;
    }

    // Get current version
    const currentVersion = (config.version as string) || '0.x';
    let migratedConfig = { ...config };

    // Apply migrations in order
    for (const migration of MIGRATIONS) {
      if (this.shouldApplyMigration(currentVersion, migration.from, migration.to)) {
        this.logger.info(`Applying migration: ${migration.description}`);

        const beforeKeys = Object.keys(migratedConfig);
        migratedConfig = migration.migrate(migratedConfig);
        const afterKeys = Object.keys(migratedConfig);

        // Track migrated fields
        const newKeys = afterKeys.filter(k => !beforeKeys.includes(k));
        result.migratedFields.push(...newKeys);
      }
    }

    // Merge with defaults to ensure all fields exist
    migratedConfig = this.deepMergeWithDefaults(migratedConfig);

    // Save migrated config
    if (!options.dryRun) {
      writeFileSync(this.configPath, JSON.stringify(migratedConfig, null, 2), 'utf-8');
    }

    result.success = true;
    this.logger.info('Migration completed successfully');

    return result;
  }

  /**
   * Check if a migration should be applied
   */
  private shouldApplyMigration(current: string, from: string, to: string): boolean {
    // Simple version comparison - could be more sophisticated
    return current === from || current < to;
  }

  /**
   * Deep merge config with defaults
   */
  private deepMergeWithDefaults(config: Record<string, unknown>): Record<string, unknown> {
    const merged = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

    const merge = (target: Record<string, unknown>, source: Record<string, unknown>) => {
      for (const key of Object.keys(source)) {
        if (
          typeof source[key] === 'object' &&
          source[key] !== null &&
          !Array.isArray(source[key]) &&
          key in target &&
          typeof target[key] === 'object' &&
          target[key] !== null
        ) {
          merge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
        } else if (source[key] !== undefined) {
          target[key] = source[key];
        }
      }
    };

    merge(merged, config);
    return merged;
  }

  // ═══════════════════════════════════════════════════════════════
  //                      VALIDATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Validate current configuration
   */
  validate(): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      issues: [],
      suggestions: [],
    };

    if (!existsSync(this.configPath)) {
      result.valid = false;
      result.issues.push({
        path: '.ccg/config.json',
        severity: 'error',
        message: 'Configuration file not found',
        fix: 'Run ccg init to create configuration',
      });
      return result;
    }

    let config: CCGConfig;
    try {
      config = JSON.parse(readFileSync(this.configPath, 'utf-8'));
    } catch (error) {
      result.valid = false;
      result.issues.push({
        path: '.ccg/config.json',
        severity: 'error',
        message: `Invalid JSON: ${error}`,
        fix: 'Fix JSON syntax errors in config file',
      });
      return result;
    }

    // Check version
    if (!config.version) {
      result.issues.push({
        path: 'version',
        severity: 'warning',
        message: 'Config version not specified',
        fix: 'Add version field to config',
      });
    }

    // Check modules
    if (!config.modules) {
      result.valid = false;
      result.issues.push({
        path: 'modules',
        severity: 'error',
        message: 'Modules configuration missing',
        fix: 'Add modules object to config',
      });
      return result;
    }

    // Check each module
    const requiredModules = ['memory', 'guard', 'process', 'resource', 'testing', 'documents', 'workflow'];
    for (const moduleName of requiredModules) {
      const moduleConfig = config.modules[moduleName as keyof typeof config.modules];
      if (!moduleConfig) {
        result.issues.push({
          path: `modules.${moduleName}`,
          severity: 'warning',
          message: `Module ${moduleName} configuration missing`,
          fix: `Add ${moduleName} module configuration`,
        });
      } else if (typeof moduleConfig.enabled !== 'boolean') {
        result.issues.push({
          path: `modules.${moduleName}.enabled`,
          severity: 'warning',
          message: `Module ${moduleName} missing enabled field`,
          fix: `Add enabled: true/false to ${moduleName} config`,
        });
      }
    }

    // Check resource thresholds
    if (config.modules.resource) {
      if (config.modules.resource.warningThreshold >= config.modules.resource.pauseThreshold) {
        result.issues.push({
          path: 'modules.resource.warningThreshold',
          severity: 'error',
          message: 'Warning threshold must be less than pause threshold',
          fix: 'Adjust thresholds so warning < pause',
        });
        result.valid = false;
      }
    }

    // Suggestions
    if (config.modules.guard?.enabled && !config.modules.guard?.strictMode) {
      result.suggestions.push('Consider enabling strictMode for Guard module in production');
    }

    if (!config.modules.latent?.enabled) {
      result.suggestions.push('Enable Latent Chain Mode for better task tracking');
    }

    if (!config.modules.autoAgent?.enabled) {
      result.suggestions.push('Enable Auto-Agent for automatic task decomposition');
    }

    result.valid = result.valid && !result.issues.some(i => i.severity === 'error');

    return result;
  }

  /**
   * Auto-fix configuration issues
   */
  async autoFix(): Promise<{ fixed: string[]; remaining: string[] }> {
    const validation = this.validate();
    const fixed: string[] = [];
    const remaining: string[] = [];

    if (!existsSync(this.configPath)) {
      remaining.push('Configuration file not found - run initialize first');
      return { fixed, remaining };
    }

    let config: Record<string, unknown>;
    try {
      config = JSON.parse(readFileSync(this.configPath, 'utf-8'));
    } catch {
      remaining.push('Cannot parse config file - manual fix required');
      return { fixed, remaining };
    }

    // Apply fixes
    for (const issue of validation.issues) {
      if (issue.severity === 'warning' && issue.path.startsWith('modules.')) {
        // Auto-add missing module configs
        const parts = issue.path.split('.');
        if (parts.length === 2) {
          const moduleName = parts[1];
          const defaultModules = DEFAULT_CONFIG.modules as unknown as Record<string, unknown>;
          const defaultModule = defaultModules[moduleName];
          if (defaultModule && !config.modules) {
            config.modules = {};
          }
          if (defaultModule && !(config.modules as Record<string, unknown>)[moduleName]) {
            (config.modules as Record<string, unknown>)[moduleName] = defaultModule;
            fixed.push(`Added default config for module: ${moduleName}`);
          }
        }
      }

      if (issue.path === 'version' && !config.version) {
        config.version = DEFAULT_CONFIG.version;
        fixed.push('Added config version');
      }

      if (issue.severity === 'error') {
        remaining.push(issue.message);
      }
    }

    // Save fixed config
    if (fixed.length > 0) {
      writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
    }

    return { fixed, remaining };
  }

  // ═══════════════════════════════════════════════════════════════
  //                      SETUP GUIDE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get onboarding status and next steps
   */
  getStatus(): OnboardingStatus {
    const steps = this.getSetupSteps();
    const completed = steps.filter(s => s.status === 'completed').length;
    const total = steps.filter(s => s.required).length;

    return {
      initialized: existsSync(this.configPath),
      configVersion: this.getConfigVersion(),
      lastMigration: this.getLastMigration(),
      setupSteps: steps,
      completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  /**
   * Get setup steps with current status
   */
  private getSetupSteps(): SetupStep[] {
    const steps: SetupStep[] = [
      {
        id: 'init',
        title: 'Initialize CCG',
        description: 'Create .ccg directory and config.json',
        status: existsSync(this.configPath) ? 'completed' : 'pending',
        required: true,
        command: 'ccg init',
      },
      {
        id: 'validate',
        title: 'Validate Configuration',
        description: 'Ensure configuration is valid',
        status: this.isConfigValid() ? 'completed' : 'pending',
        required: true,
        command: 'ccg doctor',
      },
      {
        id: 'gitignore',
        title: 'Update .gitignore',
        description: 'Add .ccg to .gitignore',
        status: this.isGitIgnoreConfigured() ? 'completed' : 'pending',
        required: false,
      },
      {
        id: 'agents',
        title: 'Configure Agents',
        description: 'Set up AGENTS.md for multi-agent coordination',
        status: existsSync(join(this.projectRoot, 'AGENTS.md')) ? 'completed' : 'pending',
        required: false,
      },
      {
        id: 'claude-commands',
        title: 'Add Claude Commands',
        description: 'Set up .claude/commands for custom workflows',
        status: existsSync(join(this.projectRoot, '.claude', 'commands')) ? 'completed' : 'pending',
        required: false,
      },
    ];

    return steps;
  }

  /**
   * Get current config version
   */
  private getConfigVersion(): string {
    if (!existsSync(this.configPath)) {
      return 'not initialized';
    }

    try {
      const config = JSON.parse(readFileSync(this.configPath, 'utf-8'));
      return config.version || 'unknown';
    } catch {
      return 'error';
    }
  }

  /**
   * Get last migration info
   */
  private getLastMigration(): string | undefined {
    const version = this.getConfigVersion();
    const migration = MIGRATIONS.find(m => m.to === version);
    return migration?.description;
  }

  /**
   * Check if config is valid
   */
  private isConfigValid(): boolean {
    try {
      const validation = this.validate();
      return validation.valid;
    } catch {
      return false;
    }
  }

  /**
   * Check if .gitignore is configured
   */
  private isGitIgnoreConfigured(): boolean {
    const gitignorePath = join(this.projectRoot, '.gitignore');
    if (!existsSync(gitignorePath)) {
      return false;
    }

    try {
      const content = readFileSync(gitignorePath, 'utf-8');
      return content.includes('.ccg') || content.includes('.ccg/');
    } catch {
      return false;
    }
  }

  /**
   * Generate a welcome message for new users
   */
  getWelcomeMessage(): string {
    const status = this.getStatus();

    let message = `
# Welcome to Code Guardian (CCG)

`;

    if (!status.initialized) {
      message += `## Getting Started

Run \`ccg init\` to initialize CCG in your project.

This will create a \`.ccg\` directory with your configuration.
`;
    } else {
      message += `## Status

- **Config Version**: ${status.configVersion}
- **Setup Progress**: ${status.completionPercentage}%

## Next Steps

`;

      const pendingSteps = status.setupSteps.filter(s => s.status === 'pending' && s.required);
      if (pendingSteps.length > 0) {
        for (const step of pendingSteps) {
          message += `- [ ] ${step.title}: ${step.description}\n`;
          if (step.command) {
            message += `  - Command: \`${step.command}\`\n`;
          }
        }
      } else {
        message += `All required setup steps completed!\n\n`;
        message += `Run \`ccg help\` to see available commands.\n`;
      }
    }

    message += `
## Features

- **Guard Module**: Validates code against best practices
- **Memory Module**: Persistent context across sessions
- **Latent Chain Mode**: Track reasoning and decisions
- **Auto-Agent**: Automatic task decomposition
- **Security Agent**: STRIDE threat modeling

## Documentation

Visit https://codeguardian.studio/docs for full documentation.
`;

    return message;
  }
}

// ═══════════════════════════════════════════════════════════════
//                      FACTORY
// ═══════════════════════════════════════════════════════════════

export function createOnboardingService(projectRoot?: string, logger?: Logger): OnboardingService {
  return new OnboardingService(projectRoot, logger);
}
