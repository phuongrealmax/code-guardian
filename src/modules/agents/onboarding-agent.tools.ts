// src/modules/agents/onboarding-agent.tools.ts

/**
 * MCP Tools for Onboarding Agent
 *
 * Provides tools for helping users set up and configure CCG.
 */

import { OnboardingService } from './onboarding-agent.js';

// ═══════════════════════════════════════════════════════════════
//                      TOOL DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const ONBOARDING_TOOL_DEFINITIONS: MCPToolDefinition[] = [
  {
    name: 'onboarding_status',
    description: `Get current onboarding status and setup progress.

Returns:
- Whether CCG is initialized
- Config version
- Setup steps and completion percentage
- Next recommended actions

Use this to understand what setup steps remain.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  {
    name: 'onboarding_init',
    description: `Initialize CCG in the current project.

Creates .ccg directory and config.json with sensible defaults.

Templates:
- minimal: Only essential modules (memory, guard)
- standard: Default configuration (recommended)
- full: All features enabled with enhanced settings

Example:
{
  "template": "standard",
  "projectType": "typescript-react"
}`,
    inputSchema: {
      type: 'object',
      properties: {
        template: {
          type: 'string',
          enum: ['minimal', 'standard', 'full'],
          description: 'Configuration template (default: standard)',
        },
        projectType: {
          type: 'string',
          enum: ['typescript-react', 'typescript-node', 'javascript', 'python', 'other'],
          description: 'Project type (auto-detected if not specified)',
        },
        force: {
          type: 'boolean',
          description: 'Force reinitialize even if already initialized',
        },
      },
    },
  },

  {
    name: 'onboarding_migrate',
    description: `Migrate configuration from older format.

Automatically upgrades config to latest version while preserving settings.

Example:
{
  "createBackup": true,
  "dryRun": false
}`,
    inputSchema: {
      type: 'object',
      properties: {
        createBackup: {
          type: 'boolean',
          description: 'Create backup before migration (default: true)',
        },
        dryRun: {
          type: 'boolean',
          description: 'Preview changes without applying (default: false)',
        },
      },
    },
  },

  {
    name: 'onboarding_validate',
    description: `Validate current CCG configuration.

Checks for:
- Required fields
- Valid module configurations
- Threshold consistency
- Best practices

Returns issues and suggestions.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  {
    name: 'onboarding_autofix',
    description: `Automatically fix configuration issues.

Applies safe fixes for common problems:
- Missing module configs (adds defaults)
- Missing version field
- Missing optional fields

Will NOT fix:
- Invalid JSON syntax
- Logic errors in thresholds

Use onboarding_validate first to see issues.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  {
    name: 'onboarding_welcome',
    description: `Get welcome message and quick start guide.

Returns formatted markdown with:
- Current status
- Next setup steps
- Feature overview
- Documentation links

Good for new users or refresher on features.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// ═══════════════════════════════════════════════════════════════
//                      TOOL HANDLER
// ═══════════════════════════════════════════════════════════════

export async function handleOnboardingTool(
  service: OnboardingService,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    case 'onboarding_status': {
      const status = service.getStatus();

      return {
        success: true,
        ...status,
        summary: status.initialized
          ? `CCG initialized (v${status.configVersion}), ${status.completionPercentage}% setup complete`
          : 'CCG not initialized - run onboarding_init to get started',
      };
    }

    case 'onboarding_init': {
      const result = await service.initialize({
        template: args.template as 'minimal' | 'standard' | 'full',
        projectType: args.projectType as string,
        force: args.force as boolean,
      });

      return {
        success: result.success,
        message: result.message,
        configPath: result.configPath,
      };
    }

    case 'onboarding_migrate': {
      const createBackup = args.createBackup !== false;
      const dryRun = args.dryRun as boolean || false;

      const result = await service.migrate({ createBackup, dryRun });

      return {
        success: result.success,
        migratedFields: result.migratedFields,
        warnings: result.warnings,
        errors: result.errors,
        backupPath: result.backupPath,
        message: result.success
          ? `Migration complete. ${result.migratedFields.length} fields migrated.`
          : `Migration failed: ${result.errors.join(', ')}`,
      };
    }

    case 'onboarding_validate': {
      const result = service.validate();

      return {
        success: true,
        valid: result.valid,
        issues: result.issues,
        suggestions: result.suggestions,
        summary: result.valid
          ? 'Configuration is valid'
          : `Found ${result.issues.filter(i => i.severity === 'error').length} errors and ${result.issues.filter(i => i.severity === 'warning').length} warnings`,
      };
    }

    case 'onboarding_autofix': {
      const result = await service.autoFix();

      return {
        success: true,
        fixed: result.fixed,
        remaining: result.remaining,
        message: result.fixed.length > 0
          ? `Fixed ${result.fixed.length} issue(s)`
          : 'No issues could be automatically fixed',
      };
    }

    case 'onboarding_welcome': {
      const message = service.getWelcomeMessage();

      return {
        success: true,
        message,
        format: 'markdown',
      };
    }

    default:
      throw new Error(`Unknown onboarding tool: ${toolName}`);
  }
}
