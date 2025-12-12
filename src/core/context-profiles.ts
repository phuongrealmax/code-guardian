// src/core/context-profiles.ts

/**
 * Context Profiles Module
 *
 * Provides environment-aware configuration profiles for different IDEs and contexts:
 * - VSCode profile: Optimized for VSCode extension
 * - Cursor profile: Optimized for Cursor IDE
 * - CLI profile: Standalone command-line usage
 * - Custom profiles: User-defined configurations
 *
 * Features:
 * - Auto-detection of IDE environment
 * - Profile switching via environment variable or explicit API
 * - Profile-specific module overrides
 * - Profile inheritance (extend from base profiles)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { CCGConfig, ModulesConfig } from './types.js';
import { DEFAULT_CONFIG } from './config-manager.js';
import { Logger } from './logger.js';

// ═══════════════════════════════════════════════════════════════
//                      TYPES
// ═══════════════════════════════════════════════════════════════

export type ProfileType = 'vscode' | 'cursor' | 'cli' | 'mcp' | 'custom';

export interface ContextProfile {
  id: string;
  name: string;
  type: ProfileType;
  description?: string;
  extends?: string; // Inherit from another profile
  enabled: boolean;
  autoActivate?: AutoActivateConfig;
  overrides: ProfileOverrides;
  metadata?: Record<string, unknown>;
}

export interface AutoActivateConfig {
  envVar?: string; // e.g., 'VSCODE_PID', 'CURSOR_SESSION'
  envValue?: string; // Optional specific value to match
  processName?: string; // Match parent process name
  fileMarker?: string; // Check for file existence (e.g., '.vscode/settings.json')
}

export interface ProfileOverrides {
  modules?: Partial<{
    [K in keyof ModulesConfig]: Partial<ModulesConfig[K]>;
  }>;
  conventions?: Partial<CCGConfig['conventions']>;
  notifications?: Partial<CCGConfig['notifications']>;
  custom?: Record<string, unknown>;
}

export interface ProfilesConfig {
  activeProfile: string;
  autoDetect: boolean;
  profiles: ContextProfile[];
}

// ═══════════════════════════════════════════════════════════════
//                      BUILT-IN PROFILES
// ═══════════════════════════════════════════════════════════════

export const BUILTIN_PROFILES: ContextProfile[] = [
  {
    id: 'cli',
    name: 'CLI Default',
    type: 'cli',
    description: 'Default profile for command-line usage',
    enabled: true,
    autoActivate: {
      envVar: 'CCG_PROFILE',
      envValue: 'cli',
    },
    overrides: {
      notifications: {
        showStatusBar: false,
        verbosity: 'normal',
      },
      modules: {
        testing: {
          browser: {
            enabled: true,
            headless: true,
            captureConsole: true,
            captureNetwork: true,
            screenshotOnError: true,
          },
        },
      },
    },
  },
  {
    id: 'vscode',
    name: 'VSCode Extension',
    type: 'vscode',
    description: 'Optimized for VSCode extension with Claude Code',
    enabled: true,
    autoActivate: {
      envVar: 'VSCODE_PID',
      fileMarker: '.vscode',
    },
    overrides: {
      notifications: {
        showStatusBar: true,
        showInline: true,
        verbosity: 'normal',
      },
      modules: {
        latent: {
          autoAttach: true,
        },
        workflow: {
          autoTrackTasks: true,
        },
        testing: {
          browser: {
            enabled: true,
            headless: true,
            captureConsole: true,
            captureNetwork: true,
            screenshotOnError: true,
          },
        },
      },
    },
  },
  {
    id: 'cursor',
    name: 'Cursor IDE',
    type: 'cursor',
    description: 'Optimized for Cursor IDE with AI-first workflow',
    enabled: true,
    autoActivate: {
      processName: 'Cursor',
      fileMarker: '.cursor',
    },
    overrides: {
      notifications: {
        showStatusBar: true,
        showInline: true,
        verbosity: 'minimal',
      },
      modules: {
        latent: {
          autoAttach: true,
          autoMerge: true,
        },
        agents: {
          enableCoordination: true,
        },
        autoAgent: {
          decomposer: {
            autoDecompose: true,
            minComplexityForDecompose: 3,
            maxSubtasks: 10,
          },
        },
      },
    },
  },
  {
    id: 'mcp',
    name: 'MCP Server',
    type: 'mcp',
    description: 'Profile for MCP server mode (used by Claude Desktop, etc.)',
    enabled: true,
    autoActivate: {
      envVar: 'CCG_MCP_MODE',
      envValue: 'true',
    },
    overrides: {
      notifications: {
        showStatusBar: false,
        showInline: false,
        verbosity: 'minimal',
      },
      modules: {
        testing: {
          browser: {
            headless: true,
            enabled: true,
            captureConsole: true,
            captureNetwork: true,
            screenshotOnError: true,
          },
        },
        latent: {
          persist: true,
          autoAttach: true,
        },
      },
    },
  },
];

// ═══════════════════════════════════════════════════════════════
//                      PROFILE MANAGER
// ═══════════════════════════════════════════════════════════════

export class ProfileManager {
  private profiles: Map<string, ContextProfile> = new Map();
  private activeProfileId: string = 'cli';
  private autoDetect: boolean = true;
  private logger: Logger;
  private projectRoot: string;
  private profilesPath: string;

  constructor(projectRoot: string = process.cwd(), logger?: Logger) {
    this.projectRoot = projectRoot;
    this.profilesPath = join(projectRoot, '.ccg', 'profiles.json');
    this.logger = logger || new Logger('info', 'ProfileManager');

    // Load built-in profiles
    for (const profile of BUILTIN_PROFILES) {
      this.profiles.set(profile.id, profile);
    }
  }

  /**
   * Initialize profiles from config file
   */
  async initialize(): Promise<void> {
    await this.loadProfiles();

    if (this.autoDetect) {
      const detected = this.detectProfile();
      if (detected) {
        this.activeProfileId = detected;
        this.logger.info(`Auto-detected profile: ${detected}`);
      }
    }

    // Check environment variable override
    const envProfile = process.env.CCG_PROFILE;
    if (envProfile && this.profiles.has(envProfile)) {
      this.activeProfileId = envProfile;
      this.logger.info(`Profile set from CCG_PROFILE: ${envProfile}`);
    }
  }

  /**
   * Load custom profiles from file
   */
  private async loadProfiles(): Promise<void> {
    if (!existsSync(this.profilesPath)) {
      return;
    }

    try {
      const content = readFileSync(this.profilesPath, 'utf-8');
      const config: ProfilesConfig = JSON.parse(content);

      this.autoDetect = config.autoDetect ?? true;

      // Load custom profiles
      for (const profile of config.profiles) {
        if (profile.type === 'custom' || !this.profiles.has(profile.id)) {
          this.profiles.set(profile.id, profile);
        } else {
          // Merge with built-in profile
          const existing = this.profiles.get(profile.id)!;
          this.profiles.set(profile.id, this.mergeProfiles(existing, profile));
        }
      }

      if (config.activeProfile && this.profiles.has(config.activeProfile)) {
        this.activeProfileId = config.activeProfile;
      }
    } catch (error) {
      this.logger.error('Failed to load profiles', error);
    }
  }

  /**
   * Save profiles configuration
   */
  async saveProfiles(): Promise<void> {
    const config: ProfilesConfig = {
      activeProfile: this.activeProfileId,
      autoDetect: this.autoDetect,
      profiles: Array.from(this.profiles.values()).filter(
        p => p.type === 'custom' || !BUILTIN_PROFILES.find(b => b.id === p.id)
      ),
    };

    try {
      writeFileSync(this.profilesPath, JSON.stringify(config, null, 2), 'utf-8');
      this.logger.info('Profiles saved');
    } catch (error) {
      this.logger.error('Failed to save profiles', error);
    }
  }

  /**
   * Detect which profile to use based on environment
   */
  detectProfile(): string | null {
    for (const profile of this.profiles.values()) {
      if (!profile.enabled || !profile.autoActivate) continue;

      const { envVar, envValue, processName, fileMarker } = profile.autoActivate;

      // Check environment variable
      if (envVar) {
        const value = process.env[envVar];
        if (value !== undefined) {
          if (envValue === undefined || value === envValue) {
            return profile.id;
          }
        }
      }

      // Check process name (parent process)
      if (processName) {
        // Note: Full implementation would check parent process
        // For now, check CCG_IDE env which extensions should set
        const ide = process.env.CCG_IDE;
        if (ide && ide.toLowerCase().includes(processName.toLowerCase())) {
          return profile.id;
        }
      }

      // Check file marker
      if (fileMarker) {
        const markerPath = join(this.projectRoot, fileMarker);
        if (existsSync(markerPath)) {
          return profile.id;
        }
      }
    }

    return null;
  }

  /**
   * Get the currently active profile
   */
  getActiveProfile(): ContextProfile {
    return this.profiles.get(this.activeProfileId) || BUILTIN_PROFILES[0];
  }

  /**
   * Get profile by ID
   */
  getProfile(id: string): ContextProfile | undefined {
    return this.profiles.get(id);
  }

  /**
   * List all available profiles
   */
  listProfiles(): ContextProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Switch to a different profile
   */
  switchProfile(profileId: string): boolean {
    if (!this.profiles.has(profileId)) {
      this.logger.warn(`Profile not found: ${profileId}`);
      return false;
    }

    const profile = this.profiles.get(profileId)!;
    if (!profile.enabled) {
      this.logger.warn(`Profile is disabled: ${profileId}`);
      return false;
    }

    this.activeProfileId = profileId;
    this.logger.info(`Switched to profile: ${profile.name}`);
    return true;
  }

  /**
   * Create a custom profile
   */
  createProfile(profile: Omit<ContextProfile, 'type'> & { type?: ProfileType }): ContextProfile {
    const newProfile: ContextProfile = {
      ...profile,
      type: profile.type || 'custom',
    };

    this.profiles.set(newProfile.id, newProfile);
    this.logger.info(`Created profile: ${newProfile.name}`);
    return newProfile;
  }

  /**
   * Update an existing profile
   */
  updateProfile(id: string, updates: Partial<ContextProfile>): ContextProfile | null {
    const existing = this.profiles.get(id);
    if (!existing) {
      this.logger.warn(`Profile not found: ${id}`);
      return null;
    }

    const updated = this.mergeProfiles(existing, updates as ContextProfile);
    this.profiles.set(id, updated);
    this.logger.info(`Updated profile: ${updated.name}`);
    return updated;
  }

  /**
   * Delete a custom profile
   */
  deleteProfile(id: string): boolean {
    const profile = this.profiles.get(id);
    if (!profile) {
      return false;
    }

    // Cannot delete built-in profiles
    if (BUILTIN_PROFILES.find(p => p.id === id)) {
      this.logger.warn(`Cannot delete built-in profile: ${id}`);
      return false;
    }

    this.profiles.delete(id);

    // Switch to default if deleted profile was active
    if (this.activeProfileId === id) {
      this.activeProfileId = 'cli';
    }

    this.logger.info(`Deleted profile: ${id}`);
    return true;
  }

  /**
   * Apply profile overrides to a base config
   */
  applyProfile(baseConfig: CCGConfig, profile?: ContextProfile): CCGConfig {
    const activeProfile = profile || this.getActiveProfile();
    const overrides = this.resolveOverrides(activeProfile);

    return this.deepMergeConfig(baseConfig, overrides);
  }

  /**
   * Resolve overrides including inherited profiles
   */
  private resolveOverrides(profile: ContextProfile): ProfileOverrides {
    let overrides = { ...profile.overrides };

    // Handle inheritance
    if (profile.extends) {
      const parent = this.profiles.get(profile.extends);
      if (parent) {
        const parentOverrides = this.resolveOverrides(parent);
        overrides = this.mergeOverrides(parentOverrides, overrides);
      }
    }

    return overrides;
  }

  /**
   * Merge two override objects
   */
  private mergeOverrides(base: ProfileOverrides, overlay: ProfileOverrides): ProfileOverrides {
    return {
      modules: this.deepMerge(base.modules || {}, overlay.modules || {}),
      conventions: this.deepMerge(base.conventions || {}, overlay.conventions || {}),
      notifications: this.deepMerge(base.notifications || {}, overlay.notifications || {}),
      custom: this.deepMerge(base.custom || {}, overlay.custom || {}),
    };
  }

  /**
   * Merge two profiles
   */
  private mergeProfiles(base: ContextProfile, overlay: ContextProfile): ContextProfile {
    return {
      ...base,
      ...overlay,
      overrides: this.mergeOverrides(base.overrides, overlay.overrides),
    };
  }

  /**
   * Apply overrides to config
   */
  private deepMergeConfig(config: CCGConfig, overrides: ProfileOverrides): CCGConfig {
    const result = { ...config };

    if (overrides.modules) {
      result.modules = this.deepMerge(config.modules, overrides.modules) as typeof config.modules;
    }

    if (overrides.conventions) {
      result.conventions = this.deepMerge(config.conventions, overrides.conventions) as typeof config.conventions;
    }

    if (overrides.notifications) {
      result.notifications = this.deepMerge(config.notifications, overrides.notifications) as typeof config.notifications;
    }

    return result;
  }

  /**
   * Deep merge utility
   */
  private deepMerge<T extends object>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key of Object.keys(source) as (keyof T)[]) {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (
        sourceValue !== undefined &&
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        !Array.isArray(sourceValue) &&
        typeof targetValue === 'object' &&
        targetValue !== null &&
        !Array.isArray(targetValue)
      ) {
        result[key] = this.deepMerge(
          targetValue as object,
          sourceValue as object
        ) as T[keyof T];
      } else if (sourceValue !== undefined) {
        result[key] = sourceValue as T[keyof T];
      }
    }

    return result;
  }

  /**
   * Get status summary
   */
  getStatus(): {
    activeProfile: string;
    activeProfileName: string;
    profileType: ProfileType;
    autoDetect: boolean;
    totalProfiles: number;
    customProfiles: number;
  } {
    const active = this.getActiveProfile();
    const custom = Array.from(this.profiles.values()).filter(p => p.type === 'custom');

    return {
      activeProfile: this.activeProfileId,
      activeProfileName: active.name,
      profileType: active.type,
      autoDetect: this.autoDetect,
      totalProfiles: this.profiles.size,
      customProfiles: custom.length,
    };
  }

  /**
   * Enable/disable auto-detection
   */
  setAutoDetect(enabled: boolean): void {
    this.autoDetect = enabled;
    this.logger.info(`Auto-detect ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// ═══════════════════════════════════════════════════════════════
//                      FACTORY & EXPORTS
// ═══════════════════════════════════════════════════════════════

let globalProfileManager: ProfileManager | null = null;

/**
 * Get or create the global profile manager
 */
export function getProfileManager(projectRoot?: string, logger?: Logger): ProfileManager {
  if (!globalProfileManager) {
    globalProfileManager = new ProfileManager(projectRoot, logger);
  }
  return globalProfileManager;
}

/**
 * Create a new profile manager instance
 */
export function createProfileManager(projectRoot?: string, logger?: Logger): ProfileManager {
  return new ProfileManager(projectRoot, logger);
}

/**
 * Reset the global profile manager
 */
export function resetProfileManager(): void {
  globalProfileManager = null;
}
