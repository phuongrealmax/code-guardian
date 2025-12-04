export interface InitOptions {
    projectName?: string;
    projectType?: 'typescript-react' | 'typescript-node' | 'javascript' | 'python' | 'other';
    force?: boolean;
    minimal?: boolean;
    strict?: boolean;
    frontend?: boolean;
}
/**
 * Initialize CCG in the target directory
 */
export declare function initializeProject(targetDir: string, options?: InitOptions): void;
/**
 * Find the templates directory
 */
declare function findTemplatesDir(): string;
/**
 * Copy a template file
 */
declare function copyTemplate(templatesDir: string, targetDir: string, templatePath: string, targetPath: string, force?: boolean): boolean;
/**
 * Write a file, optionally overwriting
 */
declare function writeFile(path: string, content: string, force?: boolean): void;
/**
 * Update .gitignore with CCG entries
 */
declare function updateGitignore(targetDir: string): void;
export { findTemplatesDir, copyTemplate, writeFile, updateGitignore };
//# sourceMappingURL=init-templates.d.ts.map