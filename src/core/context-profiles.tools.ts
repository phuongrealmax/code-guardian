// src/core/context-profiles.tools.ts

/**
 * MCP Tools for Context Profiles
 *
 * Provides tools for managing context profiles via MCP.
 */

import {
  ProfileManager,
  ContextProfile,
  ProfileOverrides,
} from './context-profiles.js';

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

export const PROFILE_TOOL_DEFINITIONS: MCPToolDefinition[] = [
  {
    name: 'profile_list',
    description: `List all available context profiles.

Returns built-in profiles (cli, vscode, cursor, mcp) and any custom profiles.

Example output:
{
  "profiles": [
    { "id": "vscode", "name": "VSCode Extension", "type": "vscode", "active": true },
    { "id": "cursor", "name": "Cursor IDE", "type": "cursor", "active": false }
  ]
}`,
    inputSchema: {
      type: 'object',
      properties: {
        includeDisabled: {
          type: 'boolean',
          description: 'Include disabled profiles (default: false)',
        },
      },
    },
  },

  {
    name: 'profile_get',
    description: `Get details of a specific profile or the active profile.

Returns profile configuration including overrides.

Example:
{
  "profileId": "vscode"
}`,
    inputSchema: {
      type: 'object',
      properties: {
        profileId: {
          type: 'string',
          description: 'Profile ID to get (omit for active profile)',
        },
      },
    },
  },

  {
    name: 'profile_switch',
    description: `Switch to a different context profile.

Changes the active profile which affects module configurations.

Example:
{
  "profileId": "cursor"
}`,
    inputSchema: {
      type: 'object',
      properties: {
        profileId: {
          type: 'string',
          description: 'Profile ID to switch to',
        },
      },
      required: ['profileId'],
    },
  },

  {
    name: 'profile_create',
    description: `Create a new custom context profile.

Example:
{
  "id": "my-project",
  "name": "My Project Profile",
  "description": "Custom profile for my project",
  "extends": "vscode",
  "overrides": {
    "modules": {
      "guard": { "strictMode": true }
    }
  }
}`,
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Unique profile ID',
        },
        name: {
          type: 'string',
          description: 'Display name',
        },
        description: {
          type: 'string',
          description: 'Profile description',
        },
        extends: {
          type: 'string',
          description: 'ID of profile to extend from',
        },
        overrides: {
          type: 'object',
          description: 'Configuration overrides',
          properties: {
            modules: { type: 'object' },
            conventions: { type: 'object' },
            notifications: { type: 'object' },
            custom: { type: 'object' },
          },
        },
      },
      required: ['id', 'name'],
    },
  },

  {
    name: 'profile_update',
    description: `Update an existing profile.

Example:
{
  "profileId": "my-project",
  "updates": {
    "description": "Updated description",
    "overrides": {
      "modules": { "guard": { "strictMode": false } }
    }
  }
}`,
    inputSchema: {
      type: 'object',
      properties: {
        profileId: {
          type: 'string',
          description: 'Profile ID to update',
        },
        updates: {
          type: 'object',
          description: 'Updates to apply',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            enabled: { type: 'boolean' },
            extends: { type: 'string' },
            overrides: { type: 'object' },
          },
        },
      },
      required: ['profileId', 'updates'],
    },
  },

  {
    name: 'profile_delete',
    description: `Delete a custom profile.

Note: Built-in profiles cannot be deleted.

Example:
{
  "profileId": "my-project"
}`,
    inputSchema: {
      type: 'object',
      properties: {
        profileId: {
          type: 'string',
          description: 'Profile ID to delete',
        },
      },
      required: ['profileId'],
    },
  },

  {
    name: 'profile_detect',
    description: `Auto-detect the best profile for current environment.

Checks environment variables, IDE markers, and process info to suggest a profile.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  {
    name: 'profile_status',
    description: `Get profile manager status.

Returns active profile, auto-detect setting, and profile counts.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// ═══════════════════════════════════════════════════════════════
//                      TOOL HANDLER
// ═══════════════════════════════════════════════════════════════

export async function handleProfileTool(
  manager: ProfileManager,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    case 'profile_list': {
      const includeDisabled = args.includeDisabled as boolean | undefined;
      let profiles = manager.listProfiles();

      if (!includeDisabled) {
        profiles = profiles.filter(p => p.enabled);
      }

      const activeId = manager.getActiveProfile().id;

      return {
        success: true,
        activeProfile: activeId,
        profiles: profiles.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type,
          description: p.description,
          enabled: p.enabled,
          active: p.id === activeId,
          extends: p.extends,
        })),
      };
    }

    case 'profile_get': {
      const profileId = args.profileId as string | undefined;
      const profile = profileId
        ? manager.getProfile(profileId)
        : manager.getActiveProfile();

      if (!profile) {
        return {
          success: false,
          error: `Profile not found: ${profileId}`,
        };
      }

      return {
        success: true,
        profile: {
          id: profile.id,
          name: profile.name,
          type: profile.type,
          description: profile.description,
          enabled: profile.enabled,
          extends: profile.extends,
          autoActivate: profile.autoActivate,
          overrides: profile.overrides,
          metadata: profile.metadata,
        },
      };
    }

    case 'profile_switch': {
      const profileId = args.profileId as string;
      const success = manager.switchProfile(profileId);

      if (!success) {
        return {
          success: false,
          error: `Failed to switch to profile: ${profileId}`,
        };
      }

      const active = manager.getActiveProfile();
      await manager.saveProfiles();

      return {
        success: true,
        activeProfile: active.id,
        activeProfileName: active.name,
        message: `Switched to profile: ${active.name}`,
      };
    }

    case 'profile_create': {
      const id = args.id as string;
      const name = args.name as string;
      const description = args.description as string | undefined;
      const extendsFrom = args.extends as string | undefined;
      const overrides = (args.overrides as ProfileOverrides) || { modules: {}, conventions: {}, notifications: {} };

      // Check if profile already exists
      if (manager.getProfile(id)) {
        return {
          success: false,
          error: `Profile already exists: ${id}`,
        };
      }

      const profile = manager.createProfile({
        id,
        name,
        description,
        extends: extendsFrom,
        enabled: true,
        overrides,
      });

      await manager.saveProfiles();

      return {
        success: true,
        profile: {
          id: profile.id,
          name: profile.name,
          type: profile.type,
        },
        message: `Created profile: ${profile.name}`,
      };
    }

    case 'profile_update': {
      const profileId = args.profileId as string;
      const updates = args.updates as Partial<ContextProfile>;

      const updated = manager.updateProfile(profileId, updates);

      if (!updated) {
        return {
          success: false,
          error: `Profile not found: ${profileId}`,
        };
      }

      await manager.saveProfiles();

      return {
        success: true,
        profile: {
          id: updated.id,
          name: updated.name,
          type: updated.type,
        },
        message: `Updated profile: ${updated.name}`,
      };
    }

    case 'profile_delete': {
      const profileId = args.profileId as string;
      const deleted = manager.deleteProfile(profileId);

      if (!deleted) {
        return {
          success: false,
          error: `Cannot delete profile: ${profileId} (built-in or not found)`,
        };
      }

      await manager.saveProfiles();

      return {
        success: true,
        deletedProfile: profileId,
        message: `Deleted profile: ${profileId}`,
      };
    }

    case 'profile_detect': {
      const detectedId = manager.detectProfile();

      if (!detectedId) {
        return {
          success: true,
          detected: null,
          message: 'No profile auto-detected, using default (cli)',
          suggestion: 'cli',
        };
      }

      const profile = manager.getProfile(detectedId)!;

      return {
        success: true,
        detected: detectedId,
        detectedName: profile.name,
        detectedType: profile.type,
        message: `Detected profile: ${profile.name}`,
      };
    }

    case 'profile_status': {
      const status = manager.getStatus();

      return {
        success: true,
        ...status,
      };
    }

    default:
      throw new Error(`Unknown profile tool: ${toolName}`);
  }
}
