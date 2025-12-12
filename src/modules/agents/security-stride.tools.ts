// src/modules/agents/security-stride.tools.ts

/**
 * STRIDE Threat Modeling MCP Tools
 *
 * Provides MCP tools for security analysis:
 * - stride_analyze: Analyze code for STRIDE threats
 * - stride_threats: Get threat definitions
 * - stride_checklist: Get security checklist
 * - stride_category: Get category information
 */

import {
  STRIDEService,
  STRIDECategory,
  ThreatAnalysisResult,
} from './security-stride.js';

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * STRIDE MCP Tool Definitions
 */
export const STRIDE_TOOL_DEFINITIONS: MCPToolDefinition[] = [
  {
    name: 'stride_analyze',
    description: `Analyze code for STRIDE security threats.

STRIDE Categories:
- Spoofing: Identity impersonation
- Tampering: Data/code modification
- Repudiation: Denying actions
- Information Disclosure: Data leaks
- Denial of Service: Service disruption
- Elevation of Privilege: Unauthorized access

Example:
{
  "code": "const password = 'hardcoded123';",
  "filePath": "src/config.ts"
}`,
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Code content to analyze',
        },
        filePath: {
          type: 'string',
          description: 'File path for context',
        },
      },
      required: ['code', 'filePath'],
    },
  },

  {
    name: 'stride_analyze_files',
    description: `Analyze multiple files for STRIDE threats.

Returns comprehensive analysis with:
- Findings grouped by category
- Severity summary
- Recommendations

Example:
{
  "files": [
    { "path": "src/auth.ts", "content": "..." },
    { "path": "src/api.ts", "content": "..." }
  ]
}`,
    inputSchema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              content: { type: 'string' },
            },
            required: ['path', 'content'],
          },
          description: 'Files to analyze',
        },
      },
      required: ['files'],
    },
  },

  {
    name: 'stride_threats',
    description: `Get STRIDE threat definitions.

Can filter by category:
- spoofing
- tampering
- repudiation
- information_disclosure
- denial_of_service
- elevation_of_privilege

Example:
{
  "category": "tampering"
}`,
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: [
            'spoofing',
            'tampering',
            'repudiation',
            'information_disclosure',
            'denial_of_service',
            'elevation_of_privilege',
          ],
          description: 'Filter by category (optional)',
        },
        threatId: {
          type: 'string',
          description: 'Get specific threat by ID (e.g., "T001")',
        },
      },
    },
  },

  {
    name: 'stride_checklist',
    description: `Get security checklist based on STRIDE.

Returns questions and guidance for security review.

Example:
{
  "category": "tampering"
}`,
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: [
            'spoofing',
            'tampering',
            'repudiation',
            'information_disclosure',
            'denial_of_service',
            'elevation_of_privilege',
          ],
          description: 'Filter by category (optional)',
        },
      },
    },
  },

  {
    name: 'stride_categories',
    description: 'Get all STRIDE categories with descriptions.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

/**
 * Handle STRIDE tool calls
 */
export async function handleSTRIDETool(
  service: STRIDEService,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    case 'stride_analyze': {
      const code = args.code as string;
      const filePath = args.filePath as string;

      const findings = service.analyzeCode(code, filePath);

      const summary: Record<STRIDECategory, number> = {
        spoofing: 0,
        tampering: 0,
        repudiation: 0,
        information_disclosure: 0,
        denial_of_service: 0,
        elevation_of_privilege: 0,
      };

      const severitySummary: Record<string, number> = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      };

      for (const finding of findings) {
        summary[finding.category]++;
        severitySummary[finding.severity]++;
      }

      return {
        success: true,
        filePath,
        findingsCount: findings.length,
        findings: findings.map(f => ({
          threatId: f.threatId,
          category: f.category,
          name: f.name,
          description: f.description,
          lineNumber: f.lineNumber,
          codeSnippet: f.codeSnippet,
          severity: f.severity,
          mitigations: f.mitigations,
          cweIds: f.cweIds,
        })),
        summary,
        severitySummary,
        message: findings.length > 0
          ? `Found ${findings.length} potential security issue(s)`
          : 'No security issues detected',
      };
    }

    case 'stride_analyze_files': {
      const files = args.files as { path: string; content: string }[];
      const result = service.analyzeFiles(files);

      return {
        success: result.success,
        filesAnalyzed: result.filesAnalyzed,
        findingsCount: result.findingsCount,
        findings: result.findings.slice(0, 50), // Limit response size
        summary: result.summary,
        severitySummary: result.severitySummary,
        recommendations: result.recommendations,
        message: result.findingsCount > 0
          ? `Found ${result.findingsCount} potential security issue(s) in ${result.filesAnalyzed} file(s)`
          : `No security issues detected in ${result.filesAnalyzed} file(s)`,
      };
    }

    case 'stride_threats': {
      const category = args.category as STRIDECategory | undefined;
      const threatId = args.threatId as string | undefined;

      if (threatId) {
        const threat = service.getThreat(threatId);
        if (!threat) {
          return {
            success: false,
            error: `Threat not found: ${threatId}`,
          };
        }
        return {
          success: true,
          threat,
        };
      }

      const threats = category
        ? service.getThreatsByCategory(category)
        : service.getThreatsByCategory('spoofing')
            .concat(service.getThreatsByCategory('tampering'))
            .concat(service.getThreatsByCategory('repudiation'))
            .concat(service.getThreatsByCategory('information_disclosure'))
            .concat(service.getThreatsByCategory('denial_of_service'))
            .concat(service.getThreatsByCategory('elevation_of_privilege'));

      return {
        success: true,
        category: category || 'all',
        count: threats.length,
        threats: threats.map(t => ({
          id: t.id,
          category: t.category,
          name: t.name,
          description: t.description,
          severity: t.severity,
          mitigations: t.mitigations,
          cweIds: t.cweIds,
        })),
      };
    }

    case 'stride_checklist': {
      const category = args.category as STRIDECategory | undefined;
      const checklist = service.getChecklist(category);

      return {
        success: true,
        category: category || 'all',
        count: checklist.length,
        items: checklist,
      };
    }

    case 'stride_categories': {
      const categories: STRIDECategory[] = [
        'spoofing',
        'tampering',
        'repudiation',
        'information_disclosure',
        'denial_of_service',
        'elevation_of_privilege',
      ];

      return {
        success: true,
        categories: categories.map(cat => ({
          id: cat,
          description: service.getCategoryDescription(cat),
          shortName: cat.charAt(0).toUpperCase(),
        })),
        message: 'STRIDE: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege',
      };
    }

    default:
      throw new Error(`Unknown STRIDE tool: ${toolName}`);
  }
}
