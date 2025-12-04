/**
 * AutoAgent MCP Tools
 *
 * Exposes AutoAgent capabilities via MCP protocol.
 */
import { z } from 'zod';
import { AutoAgentService } from './auto-agent.service.js';
declare const DecomposeTaskSchema: z.ZodObject<{
    taskName: z.ZodString;
    taskDescription: z.ZodOptional<z.ZodString>;
    files: z.ZodOptional<z.ZodArray<z.ZodString>>;
    constraints: z.ZodOptional<z.ZodArray<z.ZodString>>;
    domain: z.ZodOptional<z.ZodString>;
    forceDecompose: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
declare const RouteToolsSchema: z.ZodObject<{
    action: z.ZodString;
    phase: z.ZodOptional<z.ZodString>;
    files: z.ZodOptional<z.ZodArray<z.ZodString>>;
    currentTask: z.ZodOptional<z.ZodString>;
    domain: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
declare const StartFixLoopSchema: z.ZodObject<{
    errorType: z.ZodString;
    errorMessage: z.ZodString;
    file: z.ZodOptional<z.ZodString>;
    line: z.ZodOptional<z.ZodNumber>;
    code: z.ZodOptional<z.ZodString>;
    taskId: z.ZodOptional<z.ZodString>;
    maxRetries: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
declare const StoreErrorSchema: z.ZodObject<{
    errorType: z.ZodString;
    errorMessage: z.ZodString;
    file: z.ZodOptional<z.ZodString>;
    fixType: z.ZodEnum<{
        config: "config";
        custom: "custom";
        patch: "patch";
        rollback: "rollback";
        dependency: "dependency";
    }>;
    fixTarget: z.ZodString;
    fixDescription: z.ZodString;
    success: z.ZodBoolean;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
declare const RecallErrorsSchema: z.ZodObject<{
    errorType: z.ZodOptional<z.ZodString>;
    errorMessage: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    limit: z.ZodOptional<z.ZodNumber>;
    minSimilarity: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare function createAutoAgentTools(service: AutoAgentService): ({
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        taskName: z.ZodString;
        taskDescription: z.ZodOptional<z.ZodString>;
        files: z.ZodOptional<z.ZodArray<z.ZodString>>;
        constraints: z.ZodOptional<z.ZodArray<z.ZodString>>;
        domain: z.ZodOptional<z.ZodString>;
        forceDecompose: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
    handler: (input: z.infer<typeof DecomposeTaskSchema>) => Promise<{
        success: boolean;
        taskId: string;
        complexity: {
            score: number;
            suggestDecompose: boolean;
            factors: string[];
        };
        subtasks: {
            id: string;
            name: string;
            description: string;
            order: number;
            phase: "analysis" | "review" | "plan" | "impl";
            tools: string[];
            estimatedTokens: number;
        }[];
        suggestedOrder: string[];
    }>;
} | {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        domain: z.ZodOptional<z.ZodString>;
        files: z.ZodOptional<z.ZodArray<z.ZodString>>;
        constraints: z.ZodOptional<z.ZodArray<z.ZodString>>;
        taskName: z.ZodString;
        taskDescription: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    handler: (input: z.infer<typeof DecomposeTaskSchema>) => Promise<{
        score: number;
        suggestDecompose: boolean;
        estimatedSubtasks: number;
        factors: {
            name: string;
            weight: number;
            description: string;
        }[];
    }>;
} | {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        action: z.ZodString;
        phase: z.ZodOptional<z.ZodString>;
        files: z.ZodOptional<z.ZodArray<z.ZodString>>;
        currentTask: z.ZodOptional<z.ZodString>;
        domain: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    handler: (input: z.infer<typeof RouteToolsSchema>) => Promise<{
        success: boolean;
        suggestedTools: {
            name: string;
            reason: string;
            priority: number;
        }[];
        matchedRules: string[];
        confidence: number;
    }>;
} | {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        errorType: z.ZodString;
        errorMessage: z.ZodString;
        file: z.ZodOptional<z.ZodString>;
        line: z.ZodOptional<z.ZodNumber>;
        code: z.ZodOptional<z.ZodString>;
        taskId: z.ZodOptional<z.ZodString>;
        maxRetries: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
    handler: (input: z.infer<typeof StartFixLoopSchema>) => Promise<{
        success: boolean;
        status: import("./auto-agent.types.js").FixLoopStatus;
        totalAttempts: number;
        rolledBack: boolean;
        attempts: {
            attemptNumber: number;
            fix: string;
            result: "failed" | "partial" | "success";
            durationMs: number;
        }[];
        finalError: {
            type: string;
            message: string;
        } | undefined;
    }>;
} | {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{}, z.core.$strip>;
    handler: () => Promise<{
        status: import("./auto-agent.types.js").FixLoopStatus;
    }>;
} | {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        errorType: z.ZodString;
        errorMessage: z.ZodString;
        file: z.ZodOptional<z.ZodString>;
        fixType: z.ZodEnum<{
            config: "config";
            custom: "custom";
            patch: "patch";
            rollback: "rollback";
            dependency: "dependency";
        }>;
        fixTarget: z.ZodString;
        fixDescription: z.ZodString;
        success: z.ZodBoolean;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    handler: (input: z.infer<typeof StoreErrorSchema>) => Promise<{
        success: boolean;
        errorId: string;
        message: string;
    }>;
} | {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        errorType: z.ZodOptional<z.ZodString>;
        errorMessage: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        limit: z.ZodOptional<z.ZodNumber>;
        minSimilarity: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
    handler: (input: z.infer<typeof RecallErrorsSchema>) => Promise<{
        matchCount: number;
        matches: {
            errorType: string;
            errorMessage: string;
            fixDescription: string;
            success: boolean;
            similarity: number | undefined;
        }[];
        suggestedFix: {
            type: "config" | "custom" | "patch" | "rollback" | "dependency";
            target: string;
            description: string;
        } | undefined;
        confidence: number;
    }>;
} | {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{}, z.core.$strip>;
    handler: () => Promise<import("./auto-agent.types.js").AutoAgentStatus>;
})[];
export {};
//# sourceMappingURL=auto-agent.tools.d.ts.map