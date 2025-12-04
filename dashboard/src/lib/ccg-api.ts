// CCG API Client - Connects to CCG MCP Server data
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const CCG_DATA_DIR = process.env.CCG_DATA_DIR || join(process.cwd(), '..', '.ccg');

export interface Memory {
  id: string;
  content: string;
  type: 'decision' | 'fact' | 'code_pattern' | 'error' | 'note' | 'convention' | 'architecture';
  importance: number;
  tags: string[];
  createdAt: string;
  lastAccessedAt: string;
  accessCount: number;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'paused' | 'blocked' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  createdAt: string;
  notes: Array<{ content: string; type: string; timestamp: string }>;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  enabled: boolean;
  specializations: string[];
  responsibilities: string[];
  principles?: string[];
}

export interface SessionStatus {
  active: boolean;
  startedAt?: string;
  memoryCount: number;
  taskCount: number;
  agentCount: number;
}

export interface GuardStats {
  validationsRun: number;
  issuesFound: number;
  issuesBlocked: number;
  rulesEnabled: number;
}

// Read JSON data from .ccg directory
function readCCGData<T>(filename: string, defaultValue: T): T {
  try {
    const filepath = join(CCG_DATA_DIR, filename);
    if (existsSync(filepath)) {
      const content = readFileSync(filepath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
  }
  return defaultValue;
}

// API Functions
export function getMemories(): Memory[] {
  const data = readCCGData<{ memories: Memory[] }>('memory.json', { memories: [] });
  return data.memories || [];
}

export function getTasks(): Task[] {
  const data = readCCGData<{ tasks: Task[] }>('tasks.json', { tasks: [] });
  return data.tasks || [];
}

export function getAgents(): Agent[] {
  const data = readCCGData<{ agents: Agent[] }>('agents.json', { agents: [] });
  return data.agents || [];
}

export function getSessionStatus(): SessionStatus {
  const memories = getMemories();
  const tasks = getTasks();
  const agents = getAgents();
  const session = readCCGData<{ active: boolean; startedAt?: string }>('session.json', { active: false });

  return {
    active: session.active,
    startedAt: session.startedAt,
    memoryCount: memories.length,
    taskCount: tasks.length,
    agentCount: agents.length,
  };
}

export function getGuardStats(): GuardStats {
  const data = readCCGData<{ stats: GuardStats }>('guard.json', {
    stats: { validationsRun: 0, issuesFound: 0, issuesBlocked: 0, rulesEnabled: 0 }
  });
  return data.stats;
}

export function getLatentContexts() {
  return readCCGData<{ contexts: any[] }>('latent.json', { contexts: [] }).contexts;
}

export function getDocuments() {
  return readCCGData<{ documents: any[] }>('documents.json', { documents: [] }).documents;
}
