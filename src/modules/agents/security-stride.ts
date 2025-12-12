// src/modules/agents/security-stride.ts

/**
 * STRIDE Threat Modeling Service
 *
 * STRIDE Categories:
 * - Spoofing: Impersonating something or someone else
 * - Tampering: Modifying data or code
 * - Repudiation: Claiming to have not performed an action
 * - Information Disclosure: Exposing information to unauthorized users
 * - Denial of Service: Deny or degrade service to users
 * - Elevation of Privilege: Gain capabilities without authorization
 */

import { Logger } from '../../core/logger.js';

// ═══════════════════════════════════════════════════════════════
//                      TYPES
// ═══════════════════════════════════════════════════════════════

export type STRIDECategory =
  | 'spoofing'
  | 'tampering'
  | 'repudiation'
  | 'information_disclosure'
  | 'denial_of_service'
  | 'elevation_of_privilege';

export interface ThreatDefinition {
  id: string;
  category: STRIDECategory;
  name: string;
  description: string;
  mitigations: string[];
  cweIds?: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface CodePattern {
  pattern: RegExp;
  threat: ThreatDefinition;
  context?: string;
}

export interface ThreatFinding {
  threatId: string;
  category: STRIDECategory;
  name: string;
  description: string;
  filePath: string;
  lineNumber?: number;
  codeSnippet?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigations: string[];
  cweIds?: string[];
}

export interface ThreatAnalysisResult {
  success: boolean;
  filesAnalyzed: number;
  findingsCount: number;
  findings: ThreatFinding[];
  summary: Record<STRIDECategory, number>;
  severitySummary: Record<string, number>;
  recommendations: string[];
}

export interface SecurityChecklistItem {
  id: string;
  category: STRIDECategory;
  question: string;
  guidance: string;
  checked?: boolean;
}

// ═══════════════════════════════════════════════════════════════
//                      THREAT DATABASE
// ═══════════════════════════════════════════════════════════════

export const STRIDE_THREATS: ThreatDefinition[] = [
  // Spoofing Threats
  {
    id: 'S001',
    category: 'spoofing',
    name: 'Hardcoded Credentials',
    description: 'Credentials hardcoded in source code can be extracted and used for impersonation',
    mitigations: [
      'Use environment variables or secure vaults',
      'Implement secrets management (HashiCorp Vault, AWS Secrets Manager)',
      'Rotate credentials regularly',
    ],
    cweIds: ['CWE-798', 'CWE-259'],
    severity: 'critical',
  },
  {
    id: 'S002',
    category: 'spoofing',
    name: 'Weak Authentication',
    description: 'Missing or weak authentication allows unauthorized access',
    mitigations: [
      'Implement strong authentication (OAuth2, JWT with proper validation)',
      'Use multi-factor authentication for sensitive operations',
      'Implement account lockout after failed attempts',
    ],
    cweIds: ['CWE-287', 'CWE-306'],
    severity: 'high',
  },
  {
    id: 'S003',
    category: 'spoofing',
    name: 'Session Fixation',
    description: 'Session IDs not regenerated after authentication',
    mitigations: [
      'Regenerate session ID after login',
      'Use secure session management libraries',
      'Set proper session timeout',
    ],
    cweIds: ['CWE-384'],
    severity: 'high',
  },

  // Tampering Threats
  {
    id: 'T001',
    category: 'tampering',
    name: 'SQL Injection',
    description: 'Unsanitized input used in SQL queries allows data manipulation',
    mitigations: [
      'Use parameterized queries / prepared statements',
      'Use ORM with proper escaping',
      'Validate and sanitize all inputs',
    ],
    cweIds: ['CWE-89'],
    severity: 'critical',
  },
  {
    id: 'T002',
    category: 'tampering',
    name: 'Command Injection',
    description: 'Unsanitized input passed to system commands',
    mitigations: [
      'Avoid shell commands with user input',
      'Use libraries instead of system commands',
      'Whitelist allowed characters/values',
    ],
    cweIds: ['CWE-78', 'CWE-77'],
    severity: 'critical',
  },
  {
    id: 'T003',
    category: 'tampering',
    name: 'Path Traversal',
    description: 'User input used to construct file paths without validation',
    mitigations: [
      'Validate and sanitize file paths',
      'Use path.resolve() and check against base directory',
      'Implement whitelist of allowed directories',
    ],
    cweIds: ['CWE-22'],
    severity: 'high',
  },
  {
    id: 'T004',
    category: 'tampering',
    name: 'Insecure Deserialization',
    description: 'Untrusted data deserialized without validation',
    mitigations: [
      'Validate serialized data before deserializing',
      'Use safe serialization formats (JSON instead of pickle/eval)',
      'Implement integrity checks (HMAC)',
    ],
    cweIds: ['CWE-502'],
    severity: 'critical',
  },

  // Repudiation Threats
  {
    id: 'R001',
    category: 'repudiation',
    name: 'Missing Audit Logging',
    description: 'Security-relevant actions not logged',
    mitigations: [
      'Log all authentication attempts',
      'Log access to sensitive data',
      'Log administrative actions',
      'Use structured logging with timestamps and user context',
    ],
    cweIds: ['CWE-778'],
    severity: 'medium',
  },
  {
    id: 'R002',
    category: 'repudiation',
    name: 'Log Injection',
    description: 'User input written to logs without sanitization',
    mitigations: [
      'Sanitize log messages',
      'Use structured logging',
      'Encode special characters',
    ],
    cweIds: ['CWE-117'],
    severity: 'medium',
  },

  // Information Disclosure Threats
  {
    id: 'I001',
    category: 'information_disclosure',
    name: 'Sensitive Data Exposure',
    description: 'Sensitive data logged, exposed in errors, or sent unencrypted',
    mitigations: [
      'Never log sensitive data (passwords, tokens, PII)',
      'Use TLS for all communications',
      'Encrypt sensitive data at rest',
      'Sanitize error messages',
    ],
    cweIds: ['CWE-200', 'CWE-532'],
    severity: 'high',
  },
  {
    id: 'I002',
    category: 'information_disclosure',
    name: 'Verbose Error Messages',
    description: 'Stack traces or internal details exposed to users',
    mitigations: [
      'Return generic error messages to users',
      'Log detailed errors server-side only',
      'Use custom error handlers',
    ],
    cweIds: ['CWE-209'],
    severity: 'medium',
  },
  {
    id: 'I003',
    category: 'information_disclosure',
    name: 'Cross-Site Scripting (XSS)',
    description: 'User input rendered without escaping allows script injection',
    mitigations: [
      'Escape output based on context (HTML, JS, URL)',
      'Use Content Security Policy',
      'Use template engines with auto-escaping',
    ],
    cweIds: ['CWE-79'],
    severity: 'high',
  },

  // Denial of Service Threats
  {
    id: 'D001',
    category: 'denial_of_service',
    name: 'Resource Exhaustion',
    description: 'No limits on resource consumption',
    mitigations: [
      'Implement rate limiting',
      'Set timeouts on operations',
      'Limit file upload sizes',
      'Use pagination for large datasets',
    ],
    cweIds: ['CWE-400', 'CWE-770'],
    severity: 'medium',
  },
  {
    id: 'D002',
    category: 'denial_of_service',
    name: 'Regular Expression DoS',
    description: 'Complex regex patterns vulnerable to ReDoS attacks',
    mitigations: [
      'Avoid nested quantifiers',
      'Use timeout for regex matching',
      'Use linear-time regex engines where possible',
    ],
    cweIds: ['CWE-1333'],
    severity: 'medium',
  },

  // Elevation of Privilege Threats
  {
    id: 'E001',
    category: 'elevation_of_privilege',
    name: 'Missing Authorization',
    description: 'Actions performed without checking user permissions',
    mitigations: [
      'Implement authorization checks on all endpoints',
      'Use RBAC or ABAC patterns',
      'Verify ownership for resource access',
    ],
    cweIds: ['CWE-285', 'CWE-862'],
    severity: 'critical',
  },
  {
    id: 'E002',
    category: 'elevation_of_privilege',
    name: 'Insecure Direct Object Reference',
    description: 'Users can access objects by manipulating IDs',
    mitigations: [
      'Verify user owns/can access the resource',
      'Use indirect references (UUIDs with ACL)',
      'Implement proper access control',
    ],
    cweIds: ['CWE-639'],
    severity: 'high',
  },
  {
    id: 'E003',
    category: 'elevation_of_privilege',
    name: 'Mass Assignment',
    description: 'User input directly mapped to model attributes',
    mitigations: [
      'Whitelist allowed attributes',
      'Use DTOs for input validation',
      'Never bind request directly to models',
    ],
    cweIds: ['CWE-915'],
    severity: 'high',
  },
];

// ═══════════════════════════════════════════════════════════════
//                      CODE PATTERNS
// ═══════════════════════════════════════════════════════════════

export const CODE_PATTERNS: CodePattern[] = [
  // Hardcoded secrets
  {
    pattern: /(?:password|secret|api[_-]?key|token)\s*[=:]\s*["'][^"']+["']/i,
    threat: STRIDE_THREATS.find(t => t.id === 'S001')!,
    context: 'Potential hardcoded credential',
  },
  // SQL Injection
  {
    pattern: /(?:query|execute|raw)\s*\([^)]*\+[^)]*\)|(?:SELECT|INSERT|UPDATE|DELETE)[^;]*\$\{/i,
    threat: STRIDE_THREATS.find(t => t.id === 'T001')!,
    context: 'Potential SQL injection via string concatenation',
  },
  // Command injection
  {
    pattern: /(?:exec|spawn|system)\s*\([^)]*\+[^)]*\)|child_process.*\$\{/i,
    threat: STRIDE_THREATS.find(t => t.id === 'T002')!,
    context: 'Potential command injection',
  },
  // Path traversal
  {
    pattern: /(?:readFile|writeFile|createReadStream)\s*\([^)]*(?:req\.|params\.|query\.)/i,
    threat: STRIDE_THREATS.find(t => t.id === 'T003')!,
    context: 'Potential path traversal - user input in file path',
  },
  // Eval and unsafe deserialization
  {
    pattern: /\beval\s*\(|new\s+Function\s*\(|JSON\.parse\([^)]*req\./i,
    threat: STRIDE_THREATS.find(t => t.id === 'T004')!,
    context: 'Potential unsafe code execution or deserialization',
  },
  // Missing logging
  {
    pattern: /catch\s*\([^)]*\)\s*\{\s*(?:\/\/.*)?(?:\}|return)/,
    threat: STRIDE_THREATS.find(t => t.id === 'R001')!,
    context: 'Empty catch block - errors may go unlogged',
  },
  // XSS
  {
    pattern: /innerHTML\s*=|dangerouslySetInnerHTML|document\.write\(/i,
    threat: STRIDE_THREATS.find(t => t.id === 'I003')!,
    context: 'Potential XSS via unsafe HTML rendering',
  },
  // Sensitive data in logs
  {
    pattern: /(?:console\.log|logger\.\w+)\s*\([^)]*(?:password|token|secret|apikey)/i,
    threat: STRIDE_THREATS.find(t => t.id === 'I001')!,
    context: 'Potential sensitive data in logs',
  },
  // No rate limiting (heuristic)
  {
    pattern: /app\.(?:get|post|put|delete)\s*\([^)]+,\s*(?:async\s*)?\(/,
    threat: STRIDE_THREATS.find(t => t.id === 'D001')!,
    context: 'Route handler - verify rate limiting is applied',
  },
];

// ═══════════════════════════════════════════════════════════════
//                      SECURITY CHECKLIST
// ═══════════════════════════════════════════════════════════════

export const SECURITY_CHECKLIST: SecurityChecklistItem[] = [
  // Spoofing
  {
    id: 'CL-S01',
    category: 'spoofing',
    question: 'Is authentication required for all sensitive endpoints?',
    guidance: 'Implement authentication middleware on all protected routes',
  },
  {
    id: 'CL-S02',
    category: 'spoofing',
    question: 'Are session tokens properly generated and validated?',
    guidance: 'Use cryptographically secure random tokens, validate on each request',
  },
  // Tampering
  {
    id: 'CL-T01',
    category: 'tampering',
    question: 'Is all user input validated and sanitized?',
    guidance: 'Use validation libraries, define schemas, reject invalid input',
  },
  {
    id: 'CL-T02',
    category: 'tampering',
    question: 'Are database queries parameterized?',
    guidance: 'Use prepared statements or ORM, never concatenate SQL strings',
  },
  // Repudiation
  {
    id: 'CL-R01',
    category: 'repudiation',
    question: 'Are security-relevant events logged?',
    guidance: 'Log auth attempts, access changes, admin actions with user context',
  },
  // Information Disclosure
  {
    id: 'CL-I01',
    category: 'information_disclosure',
    question: 'Is sensitive data encrypted in transit and at rest?',
    guidance: 'Use TLS, encrypt PII and credentials in database',
  },
  {
    id: 'CL-I02',
    category: 'information_disclosure',
    question: 'Are error messages sanitized?',
    guidance: 'Return generic errors to users, log details server-side',
  },
  // DoS
  {
    id: 'CL-D01',
    category: 'denial_of_service',
    question: 'Is rate limiting implemented?',
    guidance: 'Use rate limiting middleware, implement backoff strategies',
  },
  // Elevation of Privilege
  {
    id: 'CL-E01',
    category: 'elevation_of_privilege',
    question: 'Are authorization checks performed for all resources?',
    guidance: 'Check permissions before every action, verify resource ownership',
  },
];

// ═══════════════════════════════════════════════════════════════
//                      STRIDE SERVICE
// ═══════════════════════════════════════════════════════════════

export class STRIDEService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Analyze code for STRIDE threats
   */
  analyzeCode(code: string, filePath: string): ThreatFinding[] {
    const findings: ThreatFinding[] = [];
    const lines = code.split('\n');

    for (const pattern of CODE_PATTERNS) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (pattern.pattern.test(line)) {
          findings.push({
            threatId: pattern.threat.id,
            category: pattern.threat.category,
            name: pattern.threat.name,
            description: pattern.context || pattern.threat.description,
            filePath,
            lineNumber: i + 1,
            codeSnippet: line.trim().slice(0, 100),
            severity: pattern.threat.severity,
            mitigations: pattern.threat.mitigations,
            cweIds: pattern.threat.cweIds,
          });
        }
      }
    }

    return findings;
  }

  /**
   * Perform full STRIDE analysis on multiple files
   */
  analyzeFiles(files: { path: string; content: string }[]): ThreatAnalysisResult {
    const allFindings: ThreatFinding[] = [];

    for (const file of files) {
      const findings = this.analyzeCode(file.content, file.path);
      allFindings.push(...findings);
    }

    // Build summary
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

    for (const finding of allFindings) {
      summary[finding.category]++;
      severitySummary[finding.severity]++;
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(allFindings, summary);

    return {
      success: true,
      filesAnalyzed: files.length,
      findingsCount: allFindings.length,
      findings: allFindings,
      summary,
      severitySummary,
      recommendations,
    };
  }

  /**
   * Generate recommendations based on findings
   */
  private generateRecommendations(
    findings: ThreatFinding[],
    summary: Record<STRIDECategory, number>
  ): string[] {
    const recommendations: string[] = [];

    if (summary.spoofing > 0) {
      recommendations.push('Review authentication mechanisms and credential management');
    }
    if (summary.tampering > 0) {
      recommendations.push('Audit all input validation and sanitization');
    }
    if (summary.repudiation > 0) {
      recommendations.push('Implement comprehensive audit logging');
    }
    if (summary.information_disclosure > 0) {
      recommendations.push('Review data exposure points and implement proper encryption');
    }
    if (summary.denial_of_service > 0) {
      recommendations.push('Implement rate limiting and resource quotas');
    }
    if (summary.elevation_of_privilege > 0) {
      recommendations.push('Audit all authorization checks and access controls');
    }

    // Add critical finding recommendations
    const criticalFindings = findings.filter(f => f.severity === 'critical');
    if (criticalFindings.length > 0) {
      recommendations.unshift(`URGENT: ${criticalFindings.length} critical vulnerabilities found - address immediately`);
    }

    return recommendations;
  }

  /**
   * Get threat definition by ID
   */
  getThreat(threatId: string): ThreatDefinition | undefined {
    return STRIDE_THREATS.find(t => t.id === threatId);
  }

  /**
   * Get all threats by category
   */
  getThreatsByCategory(category: STRIDECategory): ThreatDefinition[] {
    return STRIDE_THREATS.filter(t => t.category === category);
  }

  /**
   * Get security checklist
   */
  getChecklist(category?: STRIDECategory): SecurityChecklistItem[] {
    if (category) {
      return SECURITY_CHECKLIST.filter(item => item.category === category);
    }
    return SECURITY_CHECKLIST;
  }

  /**
   * Get STRIDE category description
   */
  getCategoryDescription(category: STRIDECategory): string {
    const descriptions: Record<STRIDECategory, string> = {
      spoofing: 'Spoofing: Impersonating something or someone else',
      tampering: 'Tampering: Modifying data or code without authorization',
      repudiation: 'Repudiation: Claiming to have not performed an action',
      information_disclosure: 'Information Disclosure: Exposing information to unauthorized users',
      denial_of_service: 'Denial of Service: Denying or degrading service to legitimate users',
      elevation_of_privilege: 'Elevation of Privilege: Gaining capabilities without proper authorization',
    };
    return descriptions[category];
  }
}

/**
 * Create STRIDE service instance
 */
export function createSTRIDEService(logger: Logger): STRIDEService {
  return new STRIDEService(logger);
}
