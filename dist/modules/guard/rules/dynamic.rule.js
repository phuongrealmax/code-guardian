// src/modules/guard/rules/dynamic.rule.ts
export class DynamicRule {
    name;
    enabled = true;
    description;
    category = 'custom';
    pattern;
    message;
    severity;
    constructor(config) {
        this.name = `custom:${config.name}`;
        this.description = config.message;
        this.message = config.message;
        this.severity = config.severity;
        // Parse pattern - can be string or regex literal
        try {
            if (config.pattern.startsWith('/') && config.pattern.lastIndexOf('/') > 0) {
                // Regex literal format: /pattern/flags
                const lastSlash = config.pattern.lastIndexOf('/');
                const pattern = config.pattern.slice(1, lastSlash);
                const flags = config.pattern.slice(lastSlash + 1);
                this.pattern = new RegExp(pattern, flags);
            }
            else {
                // Plain string - treat as regex pattern
                this.pattern = new RegExp(config.pattern, 'gi');
            }
        }
        catch (error) {
            // Invalid regex - create a pattern that never matches
            this.pattern = /(?!)/;
            this.enabled = false;
        }
    }
    validate(code, filename) {
        const issues = [];
        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const matches = line.matchAll(new RegExp(this.pattern.source, this.pattern.flags));
            for (const match of matches) {
                issues.push({
                    rule: this.name,
                    severity: this.severity,
                    message: this.message,
                    location: {
                        file: filename,
                        line: i + 1,
                        column: match.index !== undefined ? match.index + 1 : 1,
                        snippet: line.trim(),
                    },
                    suggestion: `Review and fix: ${match[0]}`,
                    autoFixable: false,
                });
            }
        }
        return issues;
    }
}
//# sourceMappingURL=dynamic.rule.js.map