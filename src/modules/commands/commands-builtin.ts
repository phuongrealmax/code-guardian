// src/modules/commands/commands-builtin.ts

/**
 * Built-in Slash Command Definitions
 *
 * Pre-defined commands for various domains.
 */

import { SlashCommand } from './commands.types.js';

export const BASE_COMMANDS: SlashCommand[] = [
  {
    name: 'add-endpoint',
    description: 'Add a new API endpoint with controller, service, and tests',
    category: 'base',
    arguments: [
      { name: 'resource', description: 'Resource name (e.g., users, products)', required: true, type: 'string' },
      { name: 'method', description: 'HTTP method', required: false, type: 'choice', choices: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], default: 'GET' },
    ],
    prompt: `Create a new API endpoint for $resource with $method method.

Requirements:
1. Create controller with proper validation
2. Create service layer with business logic
3. Add route definition
4. Write unit tests
5. Follow project conventions from CLAUDE.md`,
    enabled: true,
  },
  {
    name: 'build-dashboard',
    description: 'Create a dashboard component with data visualization',
    category: 'base',
    arguments: [
      { name: 'name', description: 'Dashboard name', required: true, type: 'string' },
      { name: 'widgets', description: 'Widget types (comma-separated)', required: false, type: 'string', default: 'table,chart' },
    ],
    prompt: `Create a dashboard named $name with the following widgets: $widgets.

Requirements:
1. Create main dashboard component
2. Add widget components for each type
3. Implement data fetching hooks
4. Add loading and error states
5. Make it responsive`,
    enabled: true,
  },
  {
    name: 'full-review',
    description: 'Comprehensive code review using multiple specialized agents',
    category: 'base',
    arguments: [
      { name: 'files', description: 'Files to review (comma-separated or glob)', required: false, type: 'string' },
    ],
    prompt: `Perform a comprehensive code review.

Review Checklist:
1. Code quality and readability
2. Security vulnerabilities
3. Performance issues
4. Test coverage
5. Documentation completeness
6. Adherence to project conventions

Files to review: $files

Provide specific, actionable feedback for each issue found.`,
    enabled: true,
  },
  {
    name: 'risk-check',
    description: 'Check code for potential risks and security issues',
    category: 'base',
    arguments: [],
    prompt: `Analyze the codebase for potential risks:

1. Security vulnerabilities (OWASP Top 10)
2. Data exposure risks
3. Authentication/authorization gaps
4. Input validation issues
5. Dependency vulnerabilities
6. Hardcoded secrets or credentials

Provide severity ratings and remediation steps.`,
    enabled: true,
  },
];

export const ERP_COMMANDS: SlashCommand[] = [
  {
    name: 'add-crud',
    description: 'Generate CRUD operations for a resource with proper ERP patterns',
    category: 'erp',
    arguments: [
      { name: 'model', description: 'Model name', required: true, type: 'string' },
      { name: 'relations', description: 'Related models (comma-separated)', required: false, type: 'string' },
    ],
    prompt: `Generate complete CRUD operations for $model model.

Requirements:
1. Controller with all CRUD methods
2. Form Request validation classes
3. Service layer with business logic
4. Repository pattern implementation
5. Unit and feature tests
6. Relations: $relations

Follow ERP business principles:
- Validate warehouse scope for inventory
- Track audit trail
- Handle soft deletes`,
    stacks: ['Laravel/PHP'],
    enabled: true,
  },
  {
    name: 'add-report',
    description: 'Create a new report with filters and export options',
    category: 'erp',
    arguments: [
      { name: 'name', description: 'Report name', required: true, type: 'string' },
      { name: 'dimensions', description: 'Report dimensions', required: true, type: 'string' },
      { name: 'metrics', description: 'Report metrics', required: true, type: 'string' },
    ],
    prompt: `Create a report named $name.

Dimensions: $dimensions
Metrics: $metrics

Requirements:
1. Report service with query builder
2. Filter components
3. Export to Excel/PDF
4. Date range support
5. Pagination for large datasets`,
    enabled: true,
  },
  {
    name: 'check-stock',
    description: 'Validate stock-related code follows inventory principles',
    category: 'erp',
    arguments: [],
    prompt: `Review all stock/inventory related code:

Verify:
1. Operations are warehouse-scoped
2. No negative stock allowed (unless configured)
3. Stock movements have reason codes
4. Audit trail is maintained
5. Concurrent updates are handled properly`,
    enabled: true,
  },
  {
    name: 'debt-flow',
    description: 'Review customer debt tracking implementation',
    category: 'erp',
    arguments: [],
    prompt: `Review customer debt flow implementation:

Verify:
1. Debt tracked per transaction
2. Sources: orders, manual adjustments
3. Reductions: payments, returns, writeoffs
4. Balance calculations are accurate
5. Credit limits enforced
6. Overdue detection works`,
    enabled: true,
  },
];

export const TRADING_COMMANDS: SlashCommand[] = [
  {
    name: 'backtest',
    description: 'Create or review a backtest implementation',
    category: 'trading',
    arguments: [
      { name: 'strategy', description: 'Strategy name', required: true, type: 'string' },
      { name: 'timeframe', description: 'Timeframe (1m, 5m, 1h, 1d)', required: false, type: 'string', default: '1h' },
    ],
    prompt: `Create/review backtest for $strategy strategy on $timeframe timeframe.

Requirements:
1. Pure function strategy logic
2. No side effects in strategy code
3. Proper position sizing
4. Risk metrics calculation (Sharpe, max DD, winrate)
5. Transaction costs included
6. Slippage simulation
7. Walk-forward validation`,
    stacks: ['Python', 'Node.js'],
    enabled: true,
  },
  {
    name: 'live-trade-check',
    description: 'Safety check before deploying live trading',
    category: 'trading',
    arguments: [],
    prompt: `Perform pre-deployment safety check for live trading:

Critical Checks:
1. Risk limits configured (max leverage, daily loss, drawdown)
2. Stop loss required for all positions
3. Position size limits enforced
4. API rate limits handled
5. Error recovery mechanisms
6. Logging and monitoring in place
7. Kill switch available
8. Paper trading results validated`,
    enabled: true,
  },
  {
    name: 'strategy-review',
    description: 'Review trading strategy code',
    category: 'trading',
    arguments: [
      { name: 'file', description: 'Strategy file path', required: true, type: 'file' },
    ],
    prompt: `Review trading strategy in $file:

Verify:
1. Strategy logic is isolated
2. Pure functions (no side effects)
3. No order execution inside strategy
4. Signals are clearly defined
5. Position sizing is separate
6. Entry/exit rules are explicit
7. Testable with mock data`,
    enabled: true,
  },
];

export const ORCHESTRATION_COMMANDS: SlashCommand[] = [
  {
    name: 'add-worker',
    description: 'Create a new background worker/job',
    category: 'orchestration',
    arguments: [
      { name: 'name', description: 'Worker name', required: true, type: 'string' },
      { name: 'queue', description: 'Queue name', required: false, type: 'string', default: 'default' },
    ],
    prompt: `Create a new worker named $name for queue $queue.

Requirements:
1. Idempotent processing
2. Retry logic with exponential backoff
3. Dead letter queue handling
4. Timeout enforcement
5. Progress tracking
6. Logging with trace ID
7. Metrics collection
8. Graceful shutdown`,
    stacks: ['Node.js', 'Python'],
    enabled: true,
  },
  {
    name: 'orchestration-flow',
    description: 'Design or review an orchestration flow',
    category: 'orchestration',
    arguments: [
      { name: 'flow', description: 'Flow name', required: true, type: 'string' },
    ],
    prompt: `Design/review orchestration flow: $flow

Requirements:
1. Each step is idempotent
2. All operations are retry-safe
3. Failure handling at each step
4. Rollback/compensation logic
5. Progress checkpoints
6. Observability (logs, metrics, traces)
7. Cost tracking if applicable`,
    enabled: true,
  },
  {
    name: 'cost-analysis',
    description: 'Analyze API/model costs in orchestration',
    category: 'orchestration',
    arguments: [],
    prompt: `Analyze costs in the orchestration system:

Review:
1. LLM/API call frequencies
2. Token usage patterns
3. Caching opportunities
4. Model selection (prefer smaller models)
5. Batch processing opportunities
6. Rate limiting impact
7. Cost per operation estimates`,
    enabled: true,
  },
];

/**
 * Get all built-in commands
 */
export function getAllBuiltinCommands(): SlashCommand[] {
  return [
    ...BASE_COMMANDS,
    ...ERP_COMMANDS,
    ...TRADING_COMMANDS,
    ...ORCHESTRATION_COMMANDS,
  ];
}
