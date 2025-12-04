/**
 * Convert string to different naming conventions
 */
export declare function toCamelCase(str: string): string;
export declare function toPascalCase(str: string): string;
export declare function toKebabCase(str: string): string;
export declare function toSnakeCase(str: string): string;
export declare function toScreamingSnakeCase(str: string): string;
/**
 * Truncate string with ellipsis
 */
export declare function truncate(str: string, maxLength: number, ellipsis?: string): string;
/**
 * Pluralize a word
 */
export declare function pluralize(word: string, count: number): string;
/**
 * Format duration in human-readable form
 */
export declare function formatDuration(ms: number): string;
/**
 * Format bytes in human-readable form
 */
export declare function formatBytes(bytes: number): string;
/**
 * Generate a random string
 */
export declare function randomString(length: number, chars?: string): string;
/**
 * Escape string for regex
 */
export declare function escapeRegex(str: string): string;
/**
 * Check if string is valid identifier
 */
export declare function isValidIdentifier(str: string): boolean;
//# sourceMappingURL=string-utils.d.ts.map