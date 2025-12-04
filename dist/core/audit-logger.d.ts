/**
 * Immutable Audit Logger for compliance (SOC 2, GDPR, HIPAA)
 *
 * Features:
 * - Append-only logging (no modification/deletion)
 * - Cryptographic hash chain for integrity verification
 * - SIEM-compatible output formats (JSON, Syslog, CEF)
 * - Tamper detection
 */
export interface AuditEntry {
    id: string;
    timestamp: string;
    sequence: number;
    action: AuditAction;
    actor: AuditActor;
    resource: AuditResource;
    details: Record<string, unknown>;
    outcome: 'success' | 'failure' | 'blocked';
    previousHash: string;
    hash: string;
}
export type AuditAction = 'session:start' | 'session:end' | 'memory:store' | 'memory:recall' | 'memory:delete' | 'guard:validate' | 'guard:block' | 'task:create' | 'task:complete' | 'process:spawn' | 'process:kill' | 'config:change' | 'auth:login' | 'auth:logout' | 'permission:grant' | 'permission:revoke' | 'data:export' | 'data:import';
export interface AuditActor {
    type: 'user' | 'system' | 'agent';
    id: string;
    name?: string;
    ip?: string;
}
export interface AuditResource {
    type: string;
    id: string;
    name?: string;
}
export interface AuditConfig {
    enabled: boolean;
    logPath: string;
    format: 'json' | 'syslog' | 'cef';
    rotationSizeMB: number;
    retentionDays: number;
    hashAlgorithm: 'sha256' | 'sha512';
}
export declare class AuditLogger {
    private config;
    private sequence;
    private lastHash;
    private initialized;
    constructor(config?: Partial<AuditConfig>);
    /**
     * Initialize the audit logger
     */
    initialize(): Promise<void>;
    /**
     * Log an audit entry
     */
    log(action: AuditAction, actor: AuditActor, resource: AuditResource, details?: Record<string, unknown>, outcome?: 'success' | 'failure' | 'blocked'): Promise<AuditEntry | null>;
    /**
     * Verify the integrity of the audit log
     */
    verifyIntegrity(): Promise<boolean>;
    /**
     * Export audit logs in SIEM format
     */
    exportSIEM(format: 'json' | 'syslog' | 'cef', startDate?: Date, endDate?: Date): Promise<string>;
    /**
     * Get audit statistics
     */
    getStats(): {
        totalEntries: number;
        lastEntry?: string;
        integrityValid: boolean;
        logSizeMB: number;
    };
    private calculateHash;
    private appendToLog;
    private parseEntry;
    private saveState;
    private sanitizeDetails;
    private toSyslog;
    private toCEF;
    private formatJSON;
    private formatSyslog;
    private formatCEF;
}
export declare function getAuditLogger(config?: Partial<AuditConfig>): AuditLogger;
export declare function initAuditLogger(config?: Partial<AuditConfig>): Promise<AuditLogger>;
//# sourceMappingURL=audit-logger.d.ts.map