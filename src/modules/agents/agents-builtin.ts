// src/modules/agents/agents-builtin.ts

/**
 * Built-in Agent Definitions
 *
 * Default agents compatible with Enterprise Toolkit patterns.
 */

import { RegisterAgentParams } from './agents.types.js';

/**
 * Built-in agent definitions
 */
export const BUILTIN_AGENTS: RegisterAgentParams[] = [
  // Trading Agent
  {
    id: 'trading-agent',
    name: 'Trading Agent',
    role: 'Senior Quant & Trading Systems Engineer',
    specializations: [
      'Trading logic', 'Risk management', 'Position sizing',
      'Backtesting', 'Exchange APIs', 'Strategy evaluation',
    ],
    responsibilities: [
      'Trading logic (spot, futures, margin)',
      'Position sizing, leverage, liquidation risk',
      'Risk management rules (max loss, max DD, exposure)',
      'Strategy evaluation: winrate, expectancy, Sharpe, max drawdown',
      'Exchange integration: APIs, websockets, rate limits',
    ],
    delegationRules: [
      { id: 'trading-1', pattern: 'trading', matchType: 'keyword', priority: 10 },
      { id: 'trading-2', pattern: 'strategy', matchType: 'keyword', priority: 8 },
      { id: 'trading-3', pattern: 'backtest', matchType: 'keyword', priority: 9 },
      { id: 'trading-4', pattern: 'risk', matchType: 'keyword', priority: 7 },
      { id: 'trading-5', pattern: 'execution', matchType: 'keyword', priority: 8 },
    ],
    principles: [
      'Never suggest unsafe risk: default to conservative leverage',
      'Keep strategy logic isolated and testable',
      'Keep risk rules explicit and centralized',
    ],
  },

  // Laravel Agent
  {
    id: 'laravel-agent',
    name: 'Laravel Agent',
    role: 'Senior Laravel Backend Engineer',
    specializations: [
      'Laravel', 'PHP', 'Eloquent ORM', 'REST APIs',
      'Migrations', 'Validation', 'Policies',
    ],
    responsibilities: [
      'Laravel apps (routes, controllers, services, jobs, events)',
      'Eloquent, relationships, query optimization',
      'Validation, policies, middleware, auth/ACL',
      'Migrations, seeders, factories',
      'REST API best practices in Laravel',
    ],
    delegationRules: [
      { id: 'laravel-1', pattern: '\\.php$', matchType: 'regex', priority: 10 },
      { id: 'laravel-2', pattern: 'laravel', matchType: 'keyword', priority: 10 },
      { id: 'laravel-3', pattern: 'eloquent', matchType: 'keyword', priority: 9 },
      { id: 'laravel-4', pattern: 'migration', matchType: 'keyword', priority: 8 },
      { id: 'laravel-5', pattern: 'artisan', matchType: 'keyword', priority: 8 },
    ],
  },

  // React Agent
  {
    id: 'react-agent',
    name: 'React Agent',
    role: 'Senior React & TypeScript Frontend Engineer',
    specializations: [
      'React', 'TypeScript', 'Components', 'Hooks',
      'State management', 'UI/UX patterns',
    ],
    responsibilities: [
      'React + TypeScript SPA / dashboard',
      'Components, hooks, state management, forms, tables',
      'API integration with backend',
      'UI/UX patterns, error & loading states',
    ],
    delegationRules: [
      { id: 'react-1', pattern: '\\.(tsx|jsx)$', matchType: 'regex', priority: 10 },
      { id: 'react-2', pattern: 'react', matchType: 'keyword', priority: 10 },
      { id: 'react-3', pattern: 'component', matchType: 'keyword', priority: 8 },
      { id: 'react-4', pattern: 'hook', matchType: 'keyword', priority: 8 },
      { id: 'react-5', pattern: 'frontend', matchType: 'keyword', priority: 7 },
    ],
  },

  // Node Agent
  {
    id: 'node-agent',
    name: 'Node Agent',
    role: 'Senior Node.js & TypeScript Orchestration Engineer',
    specializations: [
      'Node.js', 'TypeScript', 'Event-driven architecture',
      'Message queues', 'Workers', 'API gateway',
    ],
    responsibilities: [
      'Node.js + TypeScript backend applications',
      'Event-driven and message-driven architectures',
      'Task queues and workers (BullMQ, Redis, RabbitMQ)',
      'API gateway patterns and service composition',
      'Microservices and modular monolith orchestration',
    ],
    delegationRules: [
      { id: 'node-1', pattern: 'worker', matchType: 'keyword', priority: 9 },
      { id: 'node-2', pattern: 'queue', matchType: 'keyword', priority: 9 },
      { id: 'node-3', pattern: 'orchestration', matchType: 'keyword', priority: 10 },
      { id: 'node-4', pattern: 'service', matchType: 'keyword', priority: 6 },
      { id: 'node-5', pattern: 'bullmq|rabbitmq', matchType: 'regex', priority: 10 },
    ],
  },

  // Security Agent - STRIDE Threat Modeling
  {
    id: 'security-agent',
    name: 'Security Agent',
    role: 'Senior Application Security Engineer',
    specializations: [
      'STRIDE threat modeling', 'OWASP Top 10', 'Secure coding',
      'Authentication', 'Authorization', 'Cryptography',
      'Input validation', 'Security audit', 'Penetration testing',
    ],
    responsibilities: [
      'STRIDE threat analysis: Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege',
      'OWASP Top 10 vulnerability detection and remediation',
      'Authentication/Authorization security (JWT, OAuth, RBAC)',
      'Input validation and sanitization patterns',
      'Secure data handling and cryptography best practices',
      'Security code review and vulnerability assessment',
      'CI/CD security integration (SAST, DAST, dependency scanning)',
    ],
    delegationRules: [
      { id: 'security-1', pattern: 'security', matchType: 'keyword', priority: 10 },
      { id: 'security-2', pattern: 'vulnerability', matchType: 'keyword', priority: 10 },
      { id: 'security-3', pattern: 'auth', matchType: 'keyword', priority: 8 },
      { id: 'security-4', pattern: 'injection', matchType: 'keyword', priority: 10 },
      { id: 'security-5', pattern: 'xss|csrf|sqli', matchType: 'regex', priority: 10 },
      { id: 'security-6', pattern: 'encrypt|decrypt|hash', matchType: 'regex', priority: 9 },
      { id: 'security-7', pattern: 'stride|owasp', matchType: 'regex', priority: 10 },
      { id: 'security-8', pattern: 'threat', matchType: 'keyword', priority: 9 },
      { id: 'security-9', pattern: 'penetration|pentest', matchType: 'regex', priority: 10 },
    ],
    principles: [
      'Always assume input is malicious - validate everything',
      'Apply defense in depth - multiple security layers',
      'Follow principle of least privilege',
      'Never store secrets in code or logs',
      'Use secure defaults and fail securely',
      'Keep security controls centralized and reusable',
    ],
  },
];
