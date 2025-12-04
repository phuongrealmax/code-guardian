import { RefactorPlanInput, RefactorPlanOutput, RefactorStep, RefactorPhase } from './types.js';
export declare function buildRefactorPlan(input: RefactorPlanInput): RefactorPlanOutput;
/**
 * Get steps for a specific phase
 */
export declare function getStepsForPhase(plan: RefactorPlanOutput, phase: RefactorPhase): Array<{
    file: string;
    step: RefactorStep;
}>;
/**
 * Get high-risk steps that need extra attention
 */
export declare function getHighRiskSteps(plan: RefactorPlanOutput): Array<{
    file: string;
    step: RefactorStep;
}>;
//# sourceMappingURL=refactor-plan.d.ts.map