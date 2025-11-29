// src/modules/resource/resource.tools.ts

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function getResourceTools(): Tool[] {
  return [
    {
      name: 'resource_status',
      description: 'Get current token usage and checkpoint status',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    {
      name: 'resource_update_tokens',
      description: 'Update token usage tracking',
      inputSchema: {
        type: 'object',
        properties: {
          used: {
            type: 'number',
            description: 'Tokens used so far',
          },
          estimated: {
            type: 'number',
            description: 'Estimated total context window',
          },
        },
        required: ['used'],
      },
    },
    {
      name: 'resource_estimate_task',
      description: 'Estimate token usage for a task',
      inputSchema: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'Task description',
          },
          filesCount: {
            type: 'number',
            description: 'Number of files to modify',
          },
          linesEstimate: {
            type: 'number',
            description: 'Estimated lines of code',
          },
          hasTests: {
            type: 'boolean',
            description: 'Whether task includes writing tests',
          },
          hasBrowserTesting: {
            type: 'boolean',
            description: 'Whether task includes browser testing',
          },
        },
        required: ['description'],
      },
    },
    {
      name: 'resource_checkpoint_create',
      description: 'Create a checkpoint to save current progress',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Checkpoint name',
          },
          reason: {
            type: 'string',
            enum: ['manual', 'before_risky_operation', 'task_complete'],
            description: 'Reason for checkpoint',
          },
        },
        required: [],
      },
    },
    {
      name: 'resource_checkpoint_list',
      description: 'List all checkpoints',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    {
      name: 'resource_checkpoint_restore',
      description: 'Restore from a checkpoint',
      inputSchema: {
        type: 'object',
        properties: {
          checkpointId: {
            type: 'string',
            description: 'Checkpoint ID to restore',
          },
        },
        required: ['checkpointId'],
      },
    },
    {
      name: 'resource_checkpoint_delete',
      description: 'Delete a checkpoint',
      inputSchema: {
        type: 'object',
        properties: {
          checkpointId: {
            type: 'string',
            description: 'Checkpoint ID to delete',
          },
        },
        required: ['checkpointId'],
      },
    },
  ];
}
