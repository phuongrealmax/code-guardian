/**
 * Test Templates Module
 *
 * Provides test templates for different stacks following Enterprise Toolkit patterns.
 */
export type TestStack = 'laravel' | 'react' | 'python' | 'node';
export type TestType = 'crud' | 'component' | 'backtest' | 'worker' | 'unit' | 'integration';
export interface TestTemplate {
    name: string;
    stack: TestStack;
    type: TestType;
    description: string;
    template: string;
    variables: string[];
}
export declare const LARAVEL_CRUD_TEST: TestTemplate;
export declare const REACT_COMPONENT_TEST: TestTemplate;
export declare const PYTHON_BACKTEST_TEST: TestTemplate;
export declare const NODE_WORKER_TEST: TestTemplate;
export declare const TEST_TEMPLATES: TestTemplate[];
/**
 * Get template by stack and type
 */
export declare function getTestTemplate(stack: TestStack, type: TestType): TestTemplate | undefined;
/**
 * Get all templates for a stack
 */
export declare function getTemplatesForStack(stack: TestStack): TestTemplate[];
/**
 * Apply variables to template
 */
export declare function applyTemplate(template: TestTemplate, values: Record<string, string>): string;
/**
 * List available templates
 */
export declare function listTemplates(): Array<{
    name: string;
    stack: TestStack;
    type: TestType;
    description: string;
}>;
//# sourceMappingURL=test-templates.d.ts.map