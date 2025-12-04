// Type-safe API Client for CCG Dashboard
// Connects to CCG HTTP API Server on port 3334

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3334';

// ═══════════════════════════════════════════════════════════════
//                      TYPES
// ═══════════════════════════════════════════════════════════════

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

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
  startedAt?: string;
  completedAt?: string;
  notes: Array<{ content: string; type: string; timestamp: string }>;
  tags?: string[];
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

export interface AgentSelection {
  agentId: string;
  agentName: string;
  role: string;
  confidence: number;
  reason: string;
  matchedRules: string[];
}

export interface GuardRule {
  name: string;
  enabled: boolean;
  description: string;
  severity: 'error' | 'warning' | 'info';
}

export interface GuardValidationResult {
  valid: boolean;
  errors: Array<{ rule: string; message: string; line?: number }>;
  warnings: Array<{ rule: string; message: string; line?: number }>;
}

export interface LatentContext {
  taskId: string;
  phase: 'analysis' | 'plan' | 'impl' | 'review';
  codeMap: {
    files: string[];
    hotSpots: string[];
    components: string[];
  };
  constraints: string[];
  decisions: Array<{ id: string; summary: string; rationale: string }>;
  risks: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  path: string;
  type: string;
  title?: string;
  description?: string;
  tags?: string[];
  lastModified: string;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  port?: number;
  status: string;
  startedAt?: string;
}

export interface SessionStatus {
  session: {
    id?: string;
    status?: string;
    startedAt?: string;
    active: boolean;
  };
  modules: {
    memory: { count: number; enabled: boolean };
    guard: { rulesEnabled: number; validationsRun: number; issuesBlocked: number };
    workflow: { totalTasks: number; activeTasks: number };
  };
}

// ═══════════════════════════════════════════════════════════════
//                      API CLIENT
// ═══════════════════════════════════════════════════════════════

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    return data.data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to CCG API Server. Make sure it is running on port 3334.');
    }
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
//                      STATUS API
// ═══════════════════════════════════════════════════════════════

export const statusApi = {
  getStatus: (): Promise<SessionStatus> => fetchApi('/api/status'),
};

// ═══════════════════════════════════════════════════════════════
//                      MEMORY API
// ═══════════════════════════════════════════════════════════════

export const memoryApi = {
  getAll: (): Promise<{ memories: Memory[] }> => fetchApi('/api/memory'),

  search: (params: {
    query: string;
    type?: string;
    tags?: string[];
    minImportance?: number;
  }): Promise<{ results: Memory[] }> => {
    const searchParams = new URLSearchParams();
    searchParams.set('query', params.query);
    if (params.type) searchParams.set('type', params.type);
    if (params.tags) searchParams.set('tags', params.tags.join(','));
    if (params.minImportance) searchParams.set('minImportance', params.minImportance.toString());
    return fetchApi(`/api/memory/search?${searchParams}`);
  },

  create: (memory: {
    content: string;
    type: Memory['type'];
    importance: number;
    tags?: string[];
  }): Promise<{ memory: Memory }> =>
    fetchApi('/api/memory', {
      method: 'POST',
      body: JSON.stringify(memory),
    }),

  delete: (id: string): Promise<{ success: boolean }> =>
    fetchApi(`/api/memory/${id}`, { method: 'DELETE' }),

  getSummary: (): Promise<{
    total: number;
    byType: Record<string, number>;
    mostImportant: Memory[];
    recentlyAccessed: Memory[];
  }> => fetchApi('/api/memory/summary'),
};

// ═══════════════════════════════════════════════════════════════
//                      WORKFLOW API
// ═══════════════════════════════════════════════════════════════

export const workflowApi = {
  getTasks: (params?: {
    status?: string[];
    priority?: string[];
  }): Promise<{ tasks: Task[] }> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status.join(','));
    if (params?.priority) searchParams.set('priority', params.priority.join(','));
    const query = searchParams.toString();
    return fetchApi(`/api/tasks${query ? `?${query}` : ''}`);
  },

  getCurrentTask: (): Promise<{ task: Task | null }> => fetchApi('/api/tasks/current'),

  createTask: (task: {
    name: string;
    description?: string;
    priority?: Task['priority'];
    tags?: string[];
    parentId?: string;
  }): Promise<{ task: Task }> =>
    fetchApi('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    }),

  updateTask: (
    id: string,
    updates: { status?: Task['status']; progress?: number }
  ): Promise<{ task: Task }> =>
    fetchApi(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  startTask: (id: string): Promise<{ task: Task }> =>
    fetchApi(`/api/tasks/${id}/start`, { method: 'POST' }),

  completeTask: (id: string): Promise<{ task: Task }> =>
    fetchApi(`/api/tasks/${id}/complete`, { method: 'POST' }),

  deleteTask: (id: string): Promise<{ success: boolean }> =>
    fetchApi(`/api/tasks/${id}`, { method: 'DELETE' }),

  addNote: (
    id: string,
    note: { content: string; type?: string }
  ): Promise<{ task: Task }> =>
    fetchApi(`/api/tasks/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify(note),
    }),
};

// ═══════════════════════════════════════════════════════════════
//                      AGENTS API
// ═══════════════════════════════════════════════════════════════

export const agentsApi = {
  getAll: (): Promise<{ agents: Agent[] }> => fetchApi('/api/agents'),

  getById: (id: string): Promise<{ agent: Agent }> => fetchApi(`/api/agents/${id}`),

  getStatus: (): Promise<{
    totalAgents: number;
    enabledAgents: number;
  }> => fetchApi('/api/agents/status'),

  select: (params: {
    task: string;
    files?: string[];
    domain?: string;
    keywords?: string[];
  }): Promise<{ selection: AgentSelection }> =>
    fetchApi('/api/agents/select', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  coordinate: (params: {
    task: string;
    agentIds: string[];
    mode: 'sequential' | 'parallel' | 'review';
  }): Promise<{ coordination: unknown }> =>
    fetchApi('/api/agents/coordinate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  register: (agent: {
    id: string;
    name: string;
    role: string;
    specializations: string[];
    responsibilities: string[];
    principles?: string[];
  }): Promise<{ agent: Agent }> =>
    fetchApi('/api/agents/register', {
      method: 'POST',
      body: JSON.stringify(agent),
    }),
};

// ═══════════════════════════════════════════════════════════════
//                      GUARD API
// ═══════════════════════════════════════════════════════════════

export const guardApi = {
  getStatus: (): Promise<{
    rulesEnabled: number;
    validationsRun: number;
    issuesBlocked: number;
  }> => fetchApi('/api/guard/status'),

  getRules: (): Promise<{ rules: GuardRule[] }> => fetchApi('/api/guard/rules'),

  validate: (params: {
    code: string;
    filename: string;
    strict?: boolean;
  }): Promise<GuardValidationResult> =>
    fetchApi('/api/guard/validate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  toggleRule: (
    rule: string,
    enabled: boolean
  ): Promise<{ success: boolean }> =>
    fetchApi(`/api/guard/rules/${rule}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),
};

// ═══════════════════════════════════════════════════════════════
//                      LATENT API
// ═══════════════════════════════════════════════════════════════

export const latentApi = {
  getAll: (): Promise<{ contexts: LatentContext[] }> => fetchApi('/api/latent'),

  getContext: (taskId: string): Promise<{ context: LatentContext }> =>
    fetchApi(`/api/latent/${taskId}`),

  getStatus: (): Promise<{
    activeContexts: number;
    totalOperations: number;
  }> => fetchApi('/api/latent/status'),

  create: (params: {
    taskId: string;
    phase?: 'analysis' | 'plan' | 'impl' | 'review';
    constraints?: string[];
    files?: string[];
  }): Promise<{ context: LatentContext }> =>
    fetchApi('/api/latent', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  delete: (taskId: string): Promise<{ success: boolean }> =>
    fetchApi(`/api/latent/${taskId}`, { method: 'DELETE' }),

  transition: (taskId: string, toPhase: string): Promise<{ context: LatentContext }> =>
    fetchApi(`/api/latent/${taskId}/transition`, {
      method: 'POST',
      body: JSON.stringify({ toPhase }),
    }),
};

// ═══════════════════════════════════════════════════════════════
//                      DOCUMENTS API
// ═══════════════════════════════════════════════════════════════

export const documentsApi = {
  getAll: (): Promise<{ documents: Document[] }> => fetchApi('/api/documents'),

  search: (query: string): Promise<{ results: Document[] }> =>
    fetchApi(`/api/documents/search?query=${encodeURIComponent(query)}`),

  getByType: (type: string): Promise<{ documents: Document[] }> =>
    fetchApi(`/api/documents/type/${type}`),

  scan: (): Promise<{ scanned: number; registered: number }> =>
    fetchApi('/api/documents/scan', { method: 'POST' }),

  getStatus: (): Promise<{
    totalDocuments: number;
    byType: Record<string, number>;
  }> => fetchApi('/api/documents/status'),
};

// ═══════════════════════════════════════════════════════════════
//                      PROCESSES API
// ═══════════════════════════════════════════════════════════════

export const processesApi = {
  getAll: (): Promise<{ processes: ProcessInfo[] }> => fetchApi('/api/processes'),

  checkPort: (port: number): Promise<{
    port: number;
    available: boolean;
    pid?: number;
    process?: string;
  }> => fetchApi(`/api/processes/port/${port}`),

  checkAllPorts: (): Promise<{
    ports: Array<{ port: number; available: boolean; pid?: number }>
  }> => fetchApi('/api/processes/ports'),

  killOnPort: (port: number, force?: boolean): Promise<{ success: boolean; killed: boolean }> =>
    fetchApi(`/api/processes/port/${port}/kill`, {
      method: 'POST',
      body: JSON.stringify({ force }),
    }),

  killByPid: (pid: number, force?: boolean): Promise<{ success: boolean }> =>
    fetchApi(`/api/processes/${pid}/kill`, {
      method: 'POST',
      body: JSON.stringify({ force }),
    }),

  getStatus: (): Promise<{
    trackedProcesses: number;
    configuredPorts: number[];
  }> => fetchApi('/api/processes/status'),
};

// ═══════════════════════════════════════════════════════════════
//                      UNIFIED API EXPORT
// ═══════════════════════════════════════════════════════════════

export const api = {
  status: statusApi,
  memory: memoryApi,
  workflow: workflowApi,
  agents: agentsApi,
  guard: guardApi,
  latent: latentApi,
  documents: documentsApi,
  processes: processesApi,
};

export default api;
