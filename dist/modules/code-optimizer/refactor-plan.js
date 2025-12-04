// src/modules/code-optimizer/refactor-plan.ts
/**
 * Refactor Plan Generator
 *
 * Generates structured refactoring plans that integrate with
 * Latent Chain Mode phases (analysis -> plan -> impl -> review).
 */
import { randomUUID } from 'crypto';
// ═══════════════════════════════════════════════════════════════
//                      PLAN GENERATOR
// ═══════════════════════════════════════════════════════════════
export function buildRefactorPlan(input) {
    const { hotspots, goal, maxStepsPerFile = 5, constraints = [], } = input;
    const filePlans = [];
    let totalSteps = 0;
    let highRiskSteps = 0;
    // Generate plan for each hotspot
    for (let i = 0; i < hotspots.length; i++) {
        const hotspot = hotspots[i];
        const priority = i + 1;
        // Generate steps based on goal and reason
        const steps = generateStepsForFile(hotspot, goal, maxStepsPerFile, constraints);
        totalSteps += steps.length;
        highRiskSteps += steps.filter((s) => s.risk === 'high').length;
        // Estimate effort based on steps
        const estimatedEffort = estimateEffort(steps);
        // Determine dependencies (simplified: previous files in list)
        const dependencies = i > 0 ? [hotspots[i - 1].path] : undefined;
        filePlans.push({
            file: hotspot.path,
            goal: getGoalDescription(goal, hotspot.reason),
            priority,
            steps,
            estimatedEffort,
            dependencies,
        });
    }
    // Generate workflow info
    const phases = ['analysis', 'plan', 'impl', 'review'];
    const suggestedOrder = filePlans
        .sort((a, b) => a.priority - b.priority)
        .map((p) => p.file);
    // Estimate total effort
    const estimatedTotalEffort = estimateTotalEffort(filePlans);
    return {
        plan: filePlans,
        summary: {
            totalFiles: filePlans.length,
            totalSteps,
            estimatedTotalEffort,
            highRiskSteps,
        },
        workflow: {
            phases,
            suggestedOrder,
        },
    };
}
// ═══════════════════════════════════════════════════════════════
//                      STEP GENERATION
// ═══════════════════════════════════════════════════════════════
function generateStepsForFile(hotspot, goal, maxSteps, constraints) {
    const steps = [];
    const reason = hotspot.reason.toLowerCase();
    // Always start with analysis
    steps.push(createStep({
        title: 'Analyze current implementation',
        description: `Review the file structure, identify key functions, and understand the current logic. Reason for refactoring: ${hotspot.reason}`,
        phase: 'analysis',
        risk: 'low',
        estimatedImpact: 'Understand codebase before changes',
        suggestedTools: ['Read', 'Grep'],
    }));
    // Goal-specific steps
    switch (goal) {
        case 'readability':
            addReadabilitySteps(steps, reason, maxSteps);
            break;
        case 'performance':
            addPerformanceSteps(steps, reason, maxSteps);
            break;
        case 'architecture':
            addArchitectureSteps(steps, reason, maxSteps);
            break;
        case 'testing':
            addTestingSteps(steps, reason, maxSteps);
            break;
        case 'mixed':
        default:
            addMixedSteps(steps, reason, maxSteps);
            break;
    }
    // Always end with review
    if (steps.length < maxSteps) {
        steps.push(createStep({
            title: 'Review and verify changes',
            description: 'Run tests, check for regressions, and verify the refactoring achieves the intended goal.',
            phase: 'review',
            risk: 'low',
            estimatedImpact: 'Ensure quality and correctness',
            suggestedTools: ['testing_run', 'guard_validate'],
        }));
    }
    // Apply constraints
    if (constraints.length > 0) {
        for (const step of steps) {
            step.description += ` Constraints: ${constraints.join(', ')}`;
        }
    }
    return steps.slice(0, maxSteps);
}
function addReadabilitySteps(steps, reason, maxSteps) {
    if (reason.includes('nesting') || reason.includes('deep')) {
        steps.push(createStep({
            title: 'Reduce nesting depth',
            description: 'Extract deeply nested code into separate functions. Use early returns to flatten conditionals.',
            phase: 'impl',
            risk: 'medium',
            estimatedImpact: 'Reduce cognitive load, improve readability',
            suggestedTools: ['Edit', 'latent_apply_patch'],
        }));
    }
    if (reason.includes('large') || reason.includes('lines')) {
        steps.push(createStep({
            title: 'Split large file into modules',
            description: 'Identify logical groupings and extract into separate files. Update imports accordingly.',
            phase: 'impl',
            risk: 'medium',
            estimatedImpact: 'Improve modularity and maintainability',
            suggestedTools: ['Write', 'Edit'],
        }));
    }
    if (reason.includes('branch') || reason.includes('complex')) {
        steps.push(createStep({
            title: 'Simplify complex conditionals',
            description: 'Replace nested if-else with early returns, switch statements, or strategy pattern.',
            phase: 'impl',
            risk: 'medium',
            estimatedImpact: 'Reduce cyclomatic complexity',
            suggestedTools: ['Edit'],
        }));
    }
    steps.push(createStep({
        title: 'Improve naming and documentation',
        description: 'Rename variables and functions for clarity. Add JSDoc/docstrings where needed.',
        phase: 'impl',
        risk: 'low',
        estimatedImpact: 'Better code understanding',
        suggestedTools: ['Edit'],
    }));
}
function addPerformanceSteps(steps, reason, maxSteps) {
    steps.push(createStep({
        title: 'Profile and identify bottlenecks',
        description: 'Use profiling tools or add timing logs to identify slow operations.',
        phase: 'analysis',
        risk: 'low',
        estimatedImpact: 'Find actual performance issues',
        suggestedTools: ['Bash'],
    }));
    steps.push(createStep({
        title: 'Optimize hot paths',
        description: 'Apply caching, memoization, or algorithm improvements to frequently executed code.',
        phase: 'impl',
        risk: 'medium',
        estimatedImpact: 'Reduce execution time',
        suggestedTools: ['Edit'],
    }));
    steps.push(createStep({
        title: 'Add performance benchmarks',
        description: 'Create benchmark tests to track performance over time.',
        phase: 'impl',
        risk: 'low',
        estimatedImpact: 'Prevent future regressions',
        suggestedTools: ['Write'],
    }));
}
function addArchitectureSteps(steps, reason, maxSteps) {
    steps.push(createStep({
        title: 'Map dependencies',
        description: 'Identify all imports and usages. Create dependency diagram if needed.',
        phase: 'analysis',
        risk: 'low',
        estimatedImpact: 'Understand coupling',
        suggestedTools: ['Grep', 'rag_related_code'],
    }));
    steps.push(createStep({
        title: 'Define clear interfaces',
        description: 'Create TypeScript interfaces or abstract classes for the module boundaries.',
        phase: 'plan',
        risk: 'low',
        estimatedImpact: 'Better separation of concerns',
        suggestedTools: ['Write'],
    }));
    steps.push(createStep({
        title: 'Extract and reorganize modules',
        description: 'Move code to appropriate locations following the new architecture.',
        phase: 'impl',
        risk: 'high',
        estimatedImpact: 'Cleaner architecture',
        suggestedTools: ['Write', 'Edit', 'Bash'],
    }));
    steps.push(createStep({
        title: 'Update all references',
        description: 'Fix import paths and ensure all consumers use the new structure.',
        phase: 'impl',
        risk: 'medium',
        estimatedImpact: 'Complete the refactoring',
        suggestedTools: ['Edit', 'Grep'],
    }));
}
function addTestingSteps(steps, reason, maxSteps) {
    steps.push(createStep({
        title: 'Identify testable units',
        description: 'List functions and classes that should have tests. Prioritize by complexity and risk.',
        phase: 'analysis',
        risk: 'low',
        estimatedImpact: 'Focus testing efforts',
        suggestedTools: ['Read'],
    }));
    steps.push(createStep({
        title: 'Write unit tests',
        description: 'Create tests for the identified units. Cover happy path and edge cases.',
        phase: 'impl',
        risk: 'low',
        estimatedImpact: 'Improve code coverage',
        suggestedTools: ['Write', 'testing_run'],
    }));
    steps.push(createStep({
        title: 'Add integration tests',
        description: 'Test interactions between components. Mock external dependencies.',
        phase: 'impl',
        risk: 'low',
        estimatedImpact: 'Verify system behavior',
        suggestedTools: ['Write', 'testing_run'],
    }));
}
function addMixedSteps(steps, reason, maxSteps) {
    // Add steps based on what the reason suggests
    if (reason.includes('nesting') || reason.includes('complex')) {
        steps.push(createStep({
            title: 'Reduce complexity',
            description: 'Extract helper functions, simplify conditionals, and flatten nested structures.',
            phase: 'impl',
            risk: 'medium',
            estimatedImpact: 'Reduce cognitive load',
            suggestedTools: ['Edit'],
        }));
    }
    if (reason.includes('large') || reason.includes('lines')) {
        steps.push(createStep({
            title: 'Split into smaller modules',
            description: 'Identify cohesive groups of functionality and extract to separate files.',
            phase: 'impl',
            risk: 'medium',
            estimatedImpact: 'Better organization',
            suggestedTools: ['Write', 'Edit'],
        }));
    }
    if (reason.includes('todo') || reason.includes('fixme')) {
        steps.push(createStep({
            title: 'Address technical debt',
            description: 'Resolve TODOs and FIXMEs. Document any that cannot be resolved now.',
            phase: 'impl',
            risk: 'medium',
            estimatedImpact: 'Reduce tech debt',
            suggestedTools: ['Edit', 'memory_store'],
        }));
    }
    // Always add a general improvement step
    steps.push(createStep({
        title: 'Apply best practices',
        description: 'Review code against project conventions. Add type annotations, error handling, and documentation.',
        phase: 'impl',
        risk: 'low',
        estimatedImpact: 'Improve code quality',
        suggestedTools: ['Edit', 'guard_validate'],
    }));
}
// ═══════════════════════════════════════════════════════════════
//                      HELPERS
// ═══════════════════════════════════════════════════════════════
function createStep(params) {
    return {
        id: `step-${randomUUID().slice(0, 8)}`,
        ...params,
    };
}
function getGoalDescription(goal, reason) {
    const goalDescriptions = {
        readability: 'Improve code readability and maintainability',
        performance: 'Optimize for better performance',
        architecture: 'Restructure for better architecture',
        testing: 'Improve test coverage and testability',
        mixed: 'General code improvement',
    };
    return `${goalDescriptions[goal]}. Issue: ${reason}`;
}
function estimateEffort(steps) {
    const riskWeights = { low: 1, medium: 2, high: 4 };
    const totalWeight = steps.reduce((sum, s) => sum + riskWeights[s.risk], 0);
    if (totalWeight <= 4)
        return 'small';
    if (totalWeight <= 10)
        return 'medium';
    return 'large';
}
function estimateTotalEffort(plans) {
    const effortWeights = { small: 1, medium: 3, large: 6 };
    const total = plans.reduce((sum, p) => sum + effortWeights[p.estimatedEffort], 0);
    if (total <= 5)
        return '1-2 hours';
    if (total <= 15)
        return '2-4 hours';
    if (total <= 30)
        return '4-8 hours';
    return '1-2 days';
}
// ═══════════════════════════════════════════════════════════════
//                      UTILITIES
// ═══════════════════════════════════════════════════════════════
/**
 * Get steps for a specific phase
 */
export function getStepsForPhase(plan, phase) {
    const result = [];
    for (const filePlan of plan.plan) {
        for (const step of filePlan.steps) {
            if (step.phase === phase) {
                result.push({ file: filePlan.file, step });
            }
        }
    }
    return result;
}
/**
 * Get high-risk steps that need extra attention
 */
export function getHighRiskSteps(plan) {
    const result = [];
    for (const filePlan of plan.plan) {
        for (const step of filePlan.steps) {
            if (step.risk === 'high') {
                result.push({ file: filePlan.file, step });
            }
        }
    }
    return result;
}
//# sourceMappingURL=refactor-plan.js.map