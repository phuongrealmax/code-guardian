// src/modules/thinking/thinking.data.ts
// ═══════════════════════════════════════════════════════════════
//                      THINKING MODELS
// ═══════════════════════════════════════════════════════════════
export const DEFAULT_THINKING_MODELS = {
    'chain-of-thought': {
        id: 'chain-of-thought',
        name: 'Chain-of-Thought (CoT)',
        description: 'Step-by-step reasoning with clear, transparent logic',
        whenToUse: [
            'Solving complex logic problems',
            'Debugging code with multiple steps',
            'Analyzing root cause of issues',
            'Mathematical or algorithmic problems',
        ],
        steps: [
            {
                step: 1,
                name: 'Understand',
                action: 'Read carefully and understand the problem. List all known information.',
                tips: ['Identify inputs and expected outputs', 'Note any constraints'],
            },
            {
                step: 2,
                name: 'Break Down',
                action: 'Divide the problem into smaller, manageable sub-problems.',
                tips: ['Each sub-problem should be independently solvable'],
            },
            {
                step: 3,
                name: 'Solve Step-by-Step',
                action: 'Solve each sub-problem one at a time, documenting reasoning.',
                tips: ['Show your work', 'Explain each decision'],
            },
            {
                step: 4,
                name: 'Verify',
                action: 'Check results for consistency and correctness.',
                tips: ['Test edge cases', 'Validate logic flow'],
            },
            {
                step: 5,
                name: 'Conclude',
                action: 'Synthesize results and present final conclusion.',
                tips: ['Summarize key findings', 'State confidence level'],
            },
        ],
        examplePrompt: 'Let me think through this step by step...',
        tags: ['reasoning', 'debug', 'logic', 'analysis'],
    },
    'tree-of-thoughts': {
        id: 'tree-of-thoughts',
        name: 'Tree of Thoughts (ToT)',
        description: 'Explore multiple solution paths in parallel, choose the best',
        whenToUse: [
            'Multiple valid approaches exist',
            'Comparing trade-offs between solutions',
            'Architecture/design decisions',
            'Optimization problems',
        ],
        steps: [
            {
                step: 1,
                name: 'Generate Branches',
                action: 'List all possible approaches (minimum 3 different paths).',
                tips: ['Think creatively', 'Include unconventional options'],
            },
            {
                step: 2,
                name: 'Evaluate Each Branch',
                action: 'Analyze pros and cons of each approach.',
                tips: ['Consider: performance, maintainability, complexity, time'],
            },
            {
                step: 3,
                name: 'Prune',
                action: 'Eliminate approaches with major drawbacks.',
                tips: ['Remove if: too complex, too slow, unmaintainable'],
            },
            {
                step: 4,
                name: 'Deep Dive',
                action: 'Develop the top 1-2 approaches in detail.',
                tips: ['Sketch implementation', 'Identify potential issues'],
            },
            {
                step: 5,
                name: 'Select & Justify',
                action: 'Choose the best approach and explain why.',
                tips: ['Document decision rationale for future reference'],
            },
        ],
        examplePrompt: 'Let me explore multiple approaches to this...',
        tags: ['architecture', 'design', 'comparison', 'decision'],
    },
    'react': {
        id: 'react',
        name: 'ReAct (Reasoning + Acting)',
        description: 'Interleave thinking with action, learn from results',
        whenToUse: [
            'Debugging requires experimentation',
            'Exploring unfamiliar codebase',
            'Tasks requiring system interaction',
            'Iterative problem solving',
        ],
        steps: [
            {
                step: 1,
                name: 'Thought',
                action: 'Think: What do I need to do next? Why?',
                tips: ['Be explicit about reasoning'],
            },
            {
                step: 2,
                name: 'Action',
                action: 'Take a specific action (read file, run command, etc.)',
                tips: ['One action at a time', 'Be precise'],
            },
            {
                step: 3,
                name: 'Observation',
                action: 'Observe and record the result of the action.',
                tips: ['Note unexpected results', 'Record exact output'],
            },
            {
                step: 4,
                name: 'Reflect',
                action: 'What does this result tell me? What should I adjust?',
                tips: ['Update hypothesis if needed'],
            },
            {
                step: 5,
                name: 'Loop or Conclude',
                action: 'Repeat if more info needed, or conclude if sufficient.',
                tips: ['Know when to stop', 'Summarize learnings'],
            },
        ],
        examplePrompt: 'Thought: I need to... Action: Let me...',
        tags: ['exploration', 'debug', 'interactive', 'iterative'],
    },
    'self-consistency': {
        id: 'self-consistency',
        name: 'Self-Consistency',
        description: 'Generate multiple independent solutions, choose the most common',
        whenToUse: [
            'Problem can be solved multiple ways',
            'High reliability required',
            'Verifying correctness of solution',
            'Complex calculations',
        ],
        steps: [
            {
                step: 1,
                name: 'Generate Multiple Solutions',
                action: 'Create at least 3 independent solutions to the same problem.',
                tips: ['Use different methods', 'Dont copy previous solutions'],
            },
            {
                step: 2,
                name: 'Compare Results',
                action: 'Compare the results from each solution.',
                tips: ['Note matches and differences'],
            },
            {
                step: 3,
                name: 'Identify Consensus',
                action: 'Find the result that majority of solutions agree on.',
                tips: ['Majority vote', 'Weight by solution quality'],
            },
            {
                step: 4,
                name: 'Analyze Discrepancies',
                action: 'If results differ, analyze why and find errors.',
                tips: ['Check assumptions', 'Verify calculations'],
            },
            {
                step: 5,
                name: 'Final Answer',
                action: 'Select the most reliable answer with confidence level.',
                tips: ['State confidence: high/medium/low'],
            },
        ],
        examplePrompt: 'Let me solve this multiple ways to verify...',
        tags: ['verification', 'reliability', 'validation', 'calculation'],
    },
    'decomposition': {
        id: 'decomposition',
        name: 'Problem Decomposition',
        description: 'Break complex problems into independent sub-problems',
        whenToUse: [
            'Large, complex tasks',
            'Work needs to be distributed',
            'Refactoring large systems',
            'Feature development with multiple parts',
        ],
        steps: [
            {
                step: 1,
                name: 'Identify Components',
                action: 'List all major components or aspects of the problem.',
                tips: ['Use domain knowledge', 'Consider boundaries'],
            },
            {
                step: 2,
                name: 'Define Dependencies',
                action: 'Map dependencies between components.',
                tips: ['Draw dependency graph', 'Identify cycles'],
            },
            {
                step: 3,
                name: 'Order by Priority',
                action: 'Sort by priority and dependency order.',
                tips: ['Start with no-dependency items', 'Critical path first'],
            },
            {
                step: 4,
                name: 'Solve Independently',
                action: 'Solve each component as a standalone problem.',
                tips: ['Define clear interfaces', 'Test individually'],
            },
            {
                step: 5,
                name: 'Integrate',
                action: 'Combine solutions and verify the whole system.',
                tips: ['Integration testing', 'Check boundaries'],
            },
        ],
        examplePrompt: 'This is a complex problem. Let me break it down...',
        tags: ['planning', 'architecture', 'organization', 'large-task'],
    },
    'first-principles': {
        id: 'first-principles',
        name: 'First Principles Thinking',
        description: 'Return to fundamental truths to solve novel problems',
        whenToUse: [
            'Novel problem never seen before',
            'Conventional solutions dont work',
            'Need creative/innovative approach',
            'Challenging assumptions',
        ],
        steps: [
            {
                step: 1,
                name: 'Question Assumptions',
                action: 'List all current assumptions and question each one.',
                tips: ['Ask "why" repeatedly', 'Challenge "best practices"'],
            },
            {
                step: 2,
                name: 'Identify Fundamentals',
                action: 'Find the irreducible basic principles.',
                tips: ['What must be true?', 'Physical/logical constraints'],
            },
            {
                step: 3,
                name: 'Rebuild from Scratch',
                action: 'Build solution from fundamentals, ignoring conventions.',
                tips: ['Fresh perspective', 'No legacy constraints'],
            },
            {
                step: 4,
                name: 'Validate Logic',
                action: 'Verify the new solution is logically sound.',
                tips: ['Check against fundamentals', 'Peer review'],
            },
            {
                step: 5,
                name: 'Compare with Convention',
                action: 'Compare new solution with traditional approach.',
                tips: ['Document differences', 'Note trade-offs'],
            },
        ],
        examplePrompt: 'Let me think about this from first principles...',
        tags: ['innovation', 'creative', 'fundamental', 'novel'],
    },
};
// ═══════════════════════════════════════════════════════════════
//                      STANDARD WORKFLOWS
// ═══════════════════════════════════════════════════════════════
export const DEFAULT_WORKFLOWS = {
    'pre-commit': {
        id: 'pre-commit',
        name: 'Pre-Commit Checklist',
        description: 'Standard checks before committing code',
        triggerKeywords: ['commit', 'push', 'git add', 'pre-commit'],
        steps: [
            {
                step: 1,
                name: 'Security Scan',
                action: 'Check for hardcoded secrets, API keys, passwords',
                checkItems: [
                    'No hardcoded credentials',
                    'No API keys in code',
                    'No sensitive data in logs',
                    '.env files in .gitignore',
                ],
                required: true,
                autoRun: true,
            },
            {
                step: 2,
                name: 'Code Cleanup',
                action: 'Remove debug code and console.logs',
                checkItems: [
                    'No console.log (except intentional)',
                    'No debugger statements',
                    'No TODO comments (or documented)',
                    'No commented-out code blocks',
                ],
                required: true,
            },
            {
                step: 3,
                name: 'Linting',
                action: 'Run linter and fix issues',
                checkItems: ['No lint errors', 'No lint warnings (or justified)'],
                required: true,
                autoRun: true,
                command: 'npm run lint',
            },
            {
                step: 4,
                name: 'Type Check',
                action: 'Run TypeScript compiler',
                checkItems: ['No type errors', 'No implicit any'],
                required: true,
                autoRun: true,
                command: 'npx tsc --noEmit',
            },
            {
                step: 5,
                name: 'Tests',
                action: 'Run test suite',
                checkItems: ['All tests pass', 'No skipped tests', 'Coverage acceptable'],
                required: true,
                autoRun: true,
                command: 'npm test',
            },
            {
                step: 6,
                name: 'Commit Message',
                action: 'Write clear, conventional commit message',
                checkItems: [
                    'Follows conventional commits format',
                    'Clear description of changes',
                    'References issue if applicable',
                ],
                required: true,
            },
        ],
        estimatedTime: '5-10 minutes',
        tags: ['git', 'quality', 'ci'],
    },
    'code-review': {
        id: 'code-review',
        name: 'Code Review Checklist',
        description: 'Systematic code review process',
        triggerKeywords: ['review', 'check code', 'PR review', 'code review'],
        steps: [
            {
                step: 1,
                name: 'Understand Context',
                action: 'Read PR description, understand the goal',
                checkItems: ['Clear purpose', 'Linked issue/ticket', 'Scope is appropriate'],
                required: true,
            },
            {
                step: 2,
                name: 'Architecture Review',
                action: 'Check overall design and structure',
                checkItems: [
                    'Follows project patterns',
                    'No unnecessary complexity',
                    'Proper separation of concerns',
                    'No code duplication',
                ],
                required: true,
            },
            {
                step: 3,
                name: 'Logic Review',
                action: 'Verify correctness of implementation',
                checkItems: [
                    'Logic is correct',
                    'Edge cases handled',
                    'Error handling present',
                    'No obvious bugs',
                ],
                required: true,
            },
            {
                step: 4,
                name: 'Security Review',
                action: 'Check for security vulnerabilities',
                checkItems: [
                    'Input validation',
                    'No SQL injection',
                    'No XSS vulnerabilities',
                    'Proper authentication/authorization',
                ],
                required: true,
            },
            {
                step: 5,
                name: 'Performance Review',
                action: 'Check for performance issues',
                checkItems: [
                    'No N+1 queries',
                    'Efficient algorithms',
                    'No memory leaks',
                    'Proper caching',
                ],
                required: false,
            },
            {
                step: 6,
                name: 'Test Review',
                action: 'Verify test coverage and quality',
                checkItems: [
                    'Tests exist for new code',
                    'Tests are meaningful',
                    'Edge cases tested',
                    'No flaky tests',
                ],
                required: true,
            },
        ],
        estimatedTime: '15-30 minutes',
        tags: ['review', 'quality', 'pr'],
    },
    'refactoring': {
        id: 'refactoring',
        name: 'Safe Refactoring Workflow',
        description: 'Systematic approach to refactoring without breaking things',
        triggerKeywords: ['refactor', 'restructure', 'clean up', 'reorganize'],
        steps: [
            {
                step: 1,
                name: 'Backup',
                action: 'Create backup/checkpoint before changes',
                checkItems: ['Git commit before refactor', 'Checkpoint created'],
                required: true,
            },
            {
                step: 2,
                name: 'Verify Tests',
                action: 'Ensure existing tests pass',
                checkItems: ['All tests green', 'Coverage is known'],
                required: true,
                autoRun: true,
                command: 'npm test',
            },
            {
                step: 3,
                name: 'Small Steps',
                action: 'Make one small change at a time',
                checkItems: [
                    'Single responsibility per change',
                    'Tests after each change',
                    'Commit frequently',
                ],
                required: true,
            },
            {
                step: 4,
                name: 'Run Tests',
                action: 'Run tests after each change',
                checkItems: ['Tests still pass', 'No new failures'],
                required: true,
                autoRun: true,
                command: 'npm test',
            },
            {
                step: 5,
                name: 'Review Changes',
                action: 'Review all changes before finalizing',
                checkItems: [
                    'Code is cleaner',
                    'No behavior changes',
                    'Documentation updated',
                ],
                required: true,
            },
        ],
        estimatedTime: 'Varies',
        tags: ['refactor', 'cleanup', 'improvement'],
    },
    'deploy': {
        id: 'deploy',
        name: 'Deployment Workflow',
        description: 'Safe deployment process',
        triggerKeywords: ['deploy', 'release', 'ship', 'production'],
        steps: [
            {
                step: 1,
                name: 'Pre-Deploy Checks',
                action: 'Verify everything is ready for deployment',
                checkItems: [
                    'All tests pass',
                    'No pending changes',
                    'Version bumped',
                    'Changelog updated',
                ],
                required: true,
            },
            {
                step: 2,
                name: 'Build',
                action: 'Create production build',
                checkItems: ['Build succeeds', 'No warnings', 'Assets optimized'],
                required: true,
                autoRun: true,
                command: 'npm run build',
            },
            {
                step: 3,
                name: 'Staging Test',
                action: 'Deploy to staging and verify',
                checkItems: ['Staging deployment works', 'Manual smoke test passed'],
                required: true,
            },
            {
                step: 4,
                name: 'Production Deploy',
                action: 'Deploy to production',
                checkItems: ['Deployment successful', 'No errors in logs'],
                required: true,
            },
            {
                step: 5,
                name: 'Post-Deploy Verify',
                action: 'Verify production is working',
                checkItems: [
                    'Health checks pass',
                    'Key features work',
                    'Monitoring active',
                    'Rollback plan ready',
                ],
                required: true,
            },
        ],
        estimatedTime: '30-60 minutes',
        tags: ['deploy', 'release', 'production'],
    },
    'bug-fix': {
        id: 'bug-fix',
        name: 'Bug Fix Workflow',
        description: 'Systematic approach to fixing bugs',
        triggerKeywords: ['fix bug', 'debug', 'fix issue', 'bug fix'],
        steps: [
            {
                step: 1,
                name: 'Reproduce',
                action: 'Reliably reproduce the bug',
                checkItems: [
                    'Can reproduce consistently',
                    'Documented reproduction steps',
                    'Identified environment/conditions',
                ],
                required: true,
            },
            {
                step: 2,
                name: 'Write Failing Test',
                action: 'Write a test that demonstrates the bug',
                checkItems: ['Test fails as expected', 'Test captures the bug scenario'],
                required: true,
            },
            {
                step: 3,
                name: 'Find Root Cause',
                action: 'Investigate and find the root cause',
                checkItems: [
                    'Root cause identified',
                    'Understand why it happened',
                    'Check for similar issues',
                ],
                required: true,
            },
            {
                step: 4,
                name: 'Fix',
                action: 'Implement the fix',
                checkItems: [
                    'Minimal change',
                    'Fix addresses root cause',
                    'No side effects',
                ],
                required: true,
            },
            {
                step: 5,
                name: 'Verify',
                action: 'Verify the fix works',
                checkItems: [
                    'Failing test now passes',
                    'All other tests pass',
                    'Manual verification done',
                ],
                required: true,
                autoRun: true,
                command: 'npm test',
            },
            {
                step: 6,
                name: 'Document',
                action: 'Document the fix for future reference',
                checkItems: [
                    'Commit message explains fix',
                    'Post-mortem if significant',
                    'Update docs if needed',
                ],
                required: true,
            },
        ],
        estimatedTime: 'Varies',
        tags: ['bug', 'fix', 'debug'],
    },
    'feature-development': {
        id: 'feature-development',
        name: 'Feature Development Workflow',
        description: 'Structured approach to building new features',
        triggerKeywords: ['new feature', 'implement', 'add feature', 'build'],
        steps: [
            {
                step: 1,
                name: 'Requirements',
                action: 'Understand and document requirements',
                checkItems: [
                    'Requirements clear',
                    'Acceptance criteria defined',
                    'Edge cases identified',
                ],
                required: true,
            },
            {
                step: 2,
                name: 'Design',
                action: 'Design the implementation approach',
                checkItems: [
                    'Architecture decided',
                    'API contracts defined',
                    'Dependencies identified',
                ],
                required: true,
            },
            {
                step: 3,
                name: 'Branch',
                action: 'Create feature branch',
                checkItems: ['Branch from main/develop', 'Descriptive branch name'],
                required: true,
                command: 'git checkout -b feature/...',
            },
            {
                step: 4,
                name: 'Implement',
                action: 'Build the feature incrementally',
                checkItems: [
                    'Small commits',
                    'Tests written alongside',
                    'Code follows patterns',
                ],
                required: true,
            },
            {
                step: 5,
                name: 'Test',
                action: 'Comprehensive testing',
                checkItems: [
                    'Unit tests pass',
                    'Integration tests pass',
                    'Manual testing done',
                ],
                required: true,
                autoRun: true,
                command: 'npm test',
            },
            {
                step: 6,
                name: 'Review',
                action: 'Self-review and PR creation',
                checkItems: [
                    'Code self-reviewed',
                    'PR created with description',
                    'Ready for review',
                ],
                required: true,
            },
        ],
        estimatedTime: 'Varies by feature',
        tags: ['feature', 'development', 'implementation'],
    },
    'security-audit': {
        id: 'security-audit',
        name: 'Security Audit Checklist',
        description: 'Comprehensive security review',
        triggerKeywords: ['security', 'audit', 'security check', 'vulnerability'],
        steps: [
            {
                step: 1,
                name: 'Dependencies',
                action: 'Check for vulnerable dependencies',
                checkItems: [
                    'npm audit clean',
                    'No known CVEs',
                    'Dependencies up to date',
                ],
                required: true,
                autoRun: true,
                command: 'npm audit',
            },
            {
                step: 2,
                name: 'Secrets',
                action: 'Scan for exposed secrets',
                checkItems: [
                    'No hardcoded secrets',
                    'Environment variables used',
                    '.env not committed',
                ],
                required: true,
            },
            {
                step: 3,
                name: 'Input Validation',
                action: 'Check all user inputs are validated',
                checkItems: [
                    'All inputs sanitized',
                    'Type validation present',
                    'Length limits enforced',
                ],
                required: true,
            },
            {
                step: 4,
                name: 'Authentication',
                action: 'Review authentication implementation',
                checkItems: [
                    'Secure password handling',
                    'Session management correct',
                    'Token handling secure',
                ],
                required: true,
            },
            {
                step: 5,
                name: 'Authorization',
                action: 'Review authorization logic',
                checkItems: [
                    'RBAC implemented correctly',
                    'No privilege escalation',
                    'Sensitive routes protected',
                ],
                required: true,
            },
            {
                step: 6,
                name: 'Data Protection',
                action: 'Review data handling',
                checkItems: [
                    'Sensitive data encrypted',
                    'PII handled correctly',
                    'Logging doesnt expose secrets',
                ],
                required: true,
            },
        ],
        estimatedTime: '1-2 hours',
        tags: ['security', 'audit', 'compliance'],
    },
    'code-optimization': {
        id: 'code-optimization',
        name: 'Code Optimization Workflow',
        description: 'Systematic approach to analyzing and optimizing large codebases',
        triggerKeywords: ['optimize', 'refactor large', 'code analysis', 'hotspots', 'technical debt'],
        steps: [
            {
                step: 1,
                name: 'Scan Repository',
                action: 'Scan repository structure and gather statistics',
                checkItems: [
                    'Run code_scan_repository or code_quick_analysis',
                    'Note total files and lines',
                    'Identify largest files and folders',
                ],
                required: true,
                autoRun: true,
            },
            {
                step: 2,
                name: 'Calculate Metrics',
                action: 'Compute code metrics for source files',
                checkItems: [
                    'Run code_metrics on source files',
                    'Review complexity scores',
                    'Note nesting depths and branch counts',
                    'Identify TODO/FIXME counts',
                ],
                required: true,
                autoRun: true,
            },
            {
                step: 3,
                name: 'Detect Hotspots',
                action: 'Identify code hotspots that need attention',
                checkItems: [
                    'Run code_hotspots with mixed strategy',
                    'Review top hotspots by score',
                    'Understand reasons for each hotspot',
                    'Note suggested goals (refactor, split, test)',
                ],
                required: true,
                autoRun: true,
            },
            {
                step: 4,
                name: 'Generate Refactor Plan',
                action: 'Create structured refactoring plan',
                checkItems: [
                    'Run code_refactor_plan with goal',
                    'Review plan phases (analysis → plan → impl → review)',
                    'Identify high-risk steps',
                    'Set constraints (no breaking changes)',
                ],
                required: true,
            },
            {
                step: 5,
                name: 'Execute with Latent Chain',
                action: 'Execute plan using Latent Chain Mode',
                checkItems: [
                    'Create latent context for refactor session',
                    'Follow phase transitions',
                    'Apply patches with validation',
                    'Run tests after each change',
                ],
                required: true,
            },
            {
                step: 6,
                name: 'Validate with Guard',
                action: 'Validate all changes with Guard module',
                checkItems: [
                    'Run guard_validate on modified files',
                    'No security vulnerabilities',
                    'No empty catch blocks',
                    'No fake tests',
                ],
                required: true,
                autoRun: true,
            },
            {
                step: 7,
                name: 'Record Results',
                action: 'Record optimization session for future reference',
                checkItems: [
                    'Run code_record_optimization',
                    'Store metrics improvement in memory',
                    'Document decisions made',
                ],
                required: true,
            },
        ],
        estimatedTime: '1-4 hours per hotspot',
        tags: ['optimization', 'refactor', 'metrics', 'hotspots', 'technical-debt'],
    },
};
// ═══════════════════════════════════════════════════════════════
//                      HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════
/**
 * Get all thinking model names
 */
export function getThinkingModelNames() {
    return Object.keys(DEFAULT_THINKING_MODELS);
}
/**
 * Get all workflow names
 */
export function getWorkflowNames() {
    return Object.keys(DEFAULT_WORKFLOWS);
}
/**
 * Suggest thinking model based on task description
 */
export function suggestThinkingModel(taskDescription) {
    const desc = taskDescription.toLowerCase();
    // Check for keywords that match specific models
    if (desc.includes('debug') || desc.includes('trace') || desc.includes('step by step')) {
        return 'chain-of-thought';
    }
    if (desc.includes('compare') || desc.includes('choose') || desc.includes('option') || desc.includes('approach')) {
        return 'tree-of-thoughts';
    }
    if (desc.includes('explore') || desc.includes('investigate') || desc.includes('experiment')) {
        return 'react';
    }
    if (desc.includes('verify') || desc.includes('reliable') || desc.includes('certain')) {
        return 'self-consistency';
    }
    if (desc.includes('complex') || desc.includes('large') || desc.includes('break down')) {
        return 'decomposition';
    }
    if (desc.includes('novel') || desc.includes('new approach') || desc.includes('fundamental')) {
        return 'first-principles';
    }
    // Default to chain-of-thought
    return 'chain-of-thought';
}
/**
 * Suggest workflow based on task description
 */
export function suggestWorkflow(taskDescription) {
    const desc = taskDescription.toLowerCase();
    // Check for code optimization keywords first (higher priority)
    if (desc.includes('optimize') || desc.includes('hotspot') || desc.includes('technical debt') ||
        desc.includes('code analysis') || (desc.includes('refactor') && desc.includes('large'))) {
        return 'code-optimization';
    }
    for (const [workflowId, workflow] of Object.entries(DEFAULT_WORKFLOWS)) {
        for (const keyword of workflow.triggerKeywords) {
            if (desc.includes(keyword.toLowerCase())) {
                return workflowId;
            }
        }
    }
    return null;
}
//# sourceMappingURL=thinking.data.js.map