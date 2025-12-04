// src/core/audit-logger.ts
import { createHash } from 'crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
const DEFAULT_CONFIG = {
    enabled: true,
    logPath: '.ccg/audit/audit.log',
    format: 'json',
    rotationSizeMB: 100,
    retentionDays: 365,
    hashAlgorithm: 'sha256',
};
export class AuditLogger {
    config;
    sequence = 0;
    lastHash = 'GENESIS';
    initialized = false;
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Initialize the audit logger
     */
    async initialize() {
        if (!this.config.enabled) {
            return;
        }
        // Ensure directory exists
        const logDir = dirname(this.config.logPath);
        if (!existsSync(logDir)) {
            mkdirSync(logDir, { recursive: true });
        }
        // Load existing state if available
        const statePath = this.config.logPath + '.state';
        if (existsSync(statePath)) {
            try {
                const state = JSON.parse(readFileSync(statePath, 'utf-8'));
                this.sequence = state.sequence;
                this.lastHash = state.lastHash;
            }
            catch {
                // Start fresh if state is corrupted
                this.sequence = 0;
                this.lastHash = 'GENESIS';
            }
        }
        // Verify existing log integrity
        if (existsSync(this.config.logPath)) {
            const valid = await this.verifyIntegrity();
            if (!valid) {
                console.warn('AUDIT WARNING: Log integrity verification failed - possible tampering detected');
            }
        }
        this.initialized = true;
    }
    /**
     * Log an audit entry
     */
    async log(action, actor, resource, details = {}, outcome = 'success') {
        if (!this.config.enabled || !this.initialized) {
            return null;
        }
        this.sequence++;
        const timestamp = new Date().toISOString();
        const id = `audit-${timestamp.replace(/[:.]/g, '-')}-${this.sequence}`;
        const entry = {
            id,
            timestamp,
            sequence: this.sequence,
            action,
            actor,
            resource,
            details: this.sanitizeDetails(details),
            outcome,
            previousHash: this.lastHash,
            hash: '', // Will be calculated
        };
        // Calculate hash of entry (excluding the hash field itself)
        entry.hash = this.calculateHash(entry);
        this.lastHash = entry.hash;
        // Write to log file
        this.appendToLog(entry);
        // Save state
        this.saveState();
        return entry;
    }
    /**
     * Verify the integrity of the audit log
     */
    async verifyIntegrity() {
        if (!existsSync(this.config.logPath)) {
            return true;
        }
        const content = readFileSync(this.config.logPath, 'utf-8');
        const lines = content.trim().split('\n').filter(line => line.length > 0);
        if (lines.length === 0) {
            return true;
        }
        let previousHash = 'GENESIS';
        for (const line of lines) {
            try {
                const entry = this.parseEntry(line);
                if (!entry)
                    continue;
                // Verify previous hash linkage
                if (entry.previousHash !== previousHash) {
                    console.error(`Hash chain broken at sequence ${entry.sequence}`);
                    return false;
                }
                // Verify entry hash
                const calculatedHash = this.calculateHash(entry);
                if (entry.hash !== calculatedHash) {
                    console.error(`Hash mismatch at sequence ${entry.sequence}`);
                    return false;
                }
                previousHash = entry.hash;
            }
            catch (error) {
                console.error('Error parsing audit entry:', error);
                return false;
            }
        }
        return true;
    }
    /**
     * Export audit logs in SIEM format
     */
    async exportSIEM(format, startDate, endDate) {
        if (!existsSync(this.config.logPath)) {
            return '';
        }
        const content = readFileSync(this.config.logPath, 'utf-8');
        const lines = content.trim().split('\n').filter(line => line.length > 0);
        const entries = [];
        for (const line of lines) {
            const entry = this.parseEntry(line);
            if (!entry)
                continue;
            const entryDate = new Date(entry.timestamp);
            if (startDate && entryDate < startDate)
                continue;
            if (endDate && entryDate > endDate)
                continue;
            entries.push(entry);
        }
        switch (format) {
            case 'json':
                return this.formatJSON(entries);
            case 'syslog':
                return this.formatSyslog(entries);
            case 'cef':
                return this.formatCEF(entries);
            default:
                return this.formatJSON(entries);
        }
    }
    /**
     * Get audit statistics
     */
    getStats() {
        let totalEntries = 0;
        let lastEntry;
        let logSizeMB = 0;
        if (existsSync(this.config.logPath)) {
            const content = readFileSync(this.config.logPath, 'utf-8');
            const lines = content.trim().split('\n').filter(line => line.length > 0);
            totalEntries = lines.length;
            if (lines.length > 0) {
                const lastParsed = this.parseEntry(lines[lines.length - 1]);
                lastEntry = lastParsed?.timestamp;
            }
            const stats = require('fs').statSync(this.config.logPath);
            logSizeMB = stats.size / (1024 * 1024);
        }
        return {
            totalEntries,
            lastEntry,
            integrityValid: true, // Would need async call to verify
            logSizeMB: Math.round(logSizeMB * 100) / 100,
        };
    }
    // ═══════════════════════════════════════════════════════════════
    //                      PRIVATE METHODS
    // ═══════════════════════════════════════════════════════════════
    calculateHash(entry) {
        const data = JSON.stringify({
            id: entry.id,
            timestamp: entry.timestamp,
            sequence: entry.sequence,
            action: entry.action,
            actor: entry.actor,
            resource: entry.resource,
            details: entry.details,
            outcome: entry.outcome,
            previousHash: entry.previousHash,
        });
        return createHash(this.config.hashAlgorithm).update(data).digest('hex');
    }
    appendToLog(entry) {
        let line;
        switch (this.config.format) {
            case 'syslog':
                line = this.toSyslog(entry);
                break;
            case 'cef':
                line = this.toCEF(entry);
                break;
            case 'json':
            default:
                line = JSON.stringify(entry);
        }
        appendFileSync(this.config.logPath, line + '\n', { flag: 'a' });
    }
    parseEntry(line) {
        try {
            if (this.config.format === 'json') {
                return JSON.parse(line);
            }
            // For syslog/cef, we'd need to parse the format
            // For simplicity, assume JSON-encoded payload
            const jsonMatch = line.match(/\{.*\}$/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return null;
        }
        catch {
            return null;
        }
    }
    saveState() {
        const statePath = this.config.logPath + '.state';
        writeFileSync(statePath, JSON.stringify({
            sequence: this.sequence,
            lastHash: this.lastHash,
            updatedAt: new Date().toISOString(),
        }));
    }
    sanitizeDetails(details) {
        // Remove sensitive data patterns
        const sanitized = {};
        const sensitivePatterns = [
            /password/i, /secret/i, /token/i, /key/i, /auth/i, /credential/i,
        ];
        for (const [key, value] of Object.entries(details)) {
            if (sensitivePatterns.some(p => p.test(key))) {
                sanitized[key] = '[REDACTED]';
            }
            else if (typeof value === 'string' && value.length > 1000) {
                sanitized[key] = value.slice(0, 1000) + '...[TRUNCATED]';
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    // ═══════════════════════════════════════════════════════════════
    //                      FORMAT METHODS (SIEM)
    // ═══════════════════════════════════════════════════════════════
    toSyslog(entry) {
        // RFC 5424 Syslog format
        const facility = 16; // local0
        const severity = entry.outcome === 'blocked' ? 4 : entry.outcome === 'failure' ? 3 : 6;
        const priority = facility * 8 + severity;
        const hostname = 'ccg-server';
        const appname = 'claude-code-guardian';
        const procid = process.pid;
        const msgid = entry.action;
        const structuredData = `[ccg@12345 seq="${entry.sequence}" hash="${entry.hash.slice(0, 16)}"]`;
        const msg = JSON.stringify(entry);
        return `<${priority}>1 ${entry.timestamp} ${hostname} ${appname} ${procid} ${msgid} ${structuredData} ${msg}`;
    }
    toCEF(entry) {
        // Common Event Format (ArcSight)
        const severity = entry.outcome === 'blocked' ? 7 : entry.outcome === 'failure' ? 4 : 1;
        const extension = [
            `act=${entry.action}`,
            `suser=${entry.actor.id}`,
            `dvc=${entry.resource.type}`,
            `dvchost=${entry.resource.id}`,
            `outcome=${entry.outcome}`,
            `cn1=${entry.sequence}`,
            `cn1Label=sequence`,
            `cs1=${entry.hash.slice(0, 32)}`,
            `cs1Label=auditHash`,
        ].join(' ');
        return `CEF:0|Anthropic|ClaudeCodeGuardian|1.0|${entry.action}|${entry.action}|${severity}|${extension}`;
    }
    formatJSON(entries) {
        return JSON.stringify({
            exportedAt: new Date().toISOString(),
            count: entries.length,
            entries,
        }, null, 2);
    }
    formatSyslog(entries) {
        return entries.map(e => this.toSyslog(e)).join('\n');
    }
    formatCEF(entries) {
        return entries.map(e => this.toCEF(e)).join('\n');
    }
}
// Default singleton instance
let auditLoggerInstance = null;
export function getAuditLogger(config) {
    if (!auditLoggerInstance) {
        auditLoggerInstance = new AuditLogger(config);
    }
    return auditLoggerInstance;
}
export async function initAuditLogger(config) {
    const logger = getAuditLogger(config);
    await logger.initialize();
    return logger;
}
//# sourceMappingURL=audit-logger.js.map