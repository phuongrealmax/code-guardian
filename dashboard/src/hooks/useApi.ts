'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  Memory,
  Task,
  Agent,
  GuardRule,
  LatentContext,
  Document,
  ProcessInfo,
  SessionStatus,
} from '@/lib/api-client';

// ═══════════════════════════════════════════════════════════════
//                      QUERY KEYS
// ═══════════════════════════════════════════════════════════════

export const queryKeys = {
  status: ['status'] as const,
  memories: ['memories'] as const,
  memorySummary: ['memory', 'summary'] as const,
  tasks: ['tasks'] as const,
  currentTask: ['tasks', 'current'] as const,
  agents: ['agents'] as const,
  guardStatus: ['guard', 'status'] as const,
  guardRules: ['guard', 'rules'] as const,
  latentContexts: ['latent'] as const,
  documents: ['documents'] as const,
  processes: ['processes'] as const,
};

// ═══════════════════════════════════════════════════════════════
//                      STATUS HOOKS
// ═══════════════════════════════════════════════════════════════

export function useStatus() {
  return useQuery({
    queryKey: queryKeys.status,
    queryFn: () => api.status.getStatus(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// ═══════════════════════════════════════════════════════════════
//                      MEMORY HOOKS
// ═══════════════════════════════════════════════════════════════

export function useMemories() {
  return useQuery({
    queryKey: queryKeys.memories,
    queryFn: async () => {
      const result = await api.memory.getAll();
      return result.memories || [];
    },
  });
}

export function useMemorySummary() {
  return useQuery({
    queryKey: queryKeys.memorySummary,
    queryFn: () => api.memory.getSummary(),
  });
}

export function useSearchMemories(query: string, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.memories, 'search', query],
    queryFn: () => api.memory.search({ query }),
    enabled: enabled && query.length > 0,
  });
}

export function useCreateMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.memory.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.memories });
      queryClient.invalidateQueries({ queryKey: queryKeys.memorySummary });
      queryClient.invalidateQueries({ queryKey: queryKeys.status });
    },
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.memory.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.memories });
      queryClient.invalidateQueries({ queryKey: queryKeys.memorySummary });
      queryClient.invalidateQueries({ queryKey: queryKeys.status });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
//                      WORKFLOW HOOKS
// ═══════════════════════════════════════════════════════════════

export function useTasks(filters?: { status?: string[]; priority?: string[] }) {
  return useQuery({
    queryKey: [...queryKeys.tasks, filters],
    queryFn: async () => {
      const result = await api.workflow.getTasks(filters);
      return result.tasks || [];
    },
  });
}

export function useCurrentTask() {
  return useQuery({
    queryKey: queryKeys.currentTask,
    queryFn: async () => {
      const result = await api.workflow.getCurrentTask();
      return result.task;
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.workflow.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.status });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, status, progress }: { taskId: string; status?: Task['status']; progress?: number }) =>
      api.workflow.updateTask(taskId, { status, progress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.currentTask });
    },
  });
}

export function useStartTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.workflow.startTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.currentTask });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.workflow.completeTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.currentTask });
      queryClient.invalidateQueries({ queryKey: queryKeys.status });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.workflow.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.status });
    },
  });
}

export function useAddTaskNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, content, type }: { taskId: string; content: string; type?: string }) =>
      api.workflow.addNote(taskId, { content, type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
//                      AGENTS HOOKS
// ═══════════════════════════════════════════════════════════════

export function useAgents() {
  return useQuery({
    queryKey: queryKeys.agents,
    queryFn: async () => {
      const result = await api.agents.getAll();
      return result.agents || [];
    },
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: [...queryKeys.agents, id],
    queryFn: async () => {
      const result = await api.agents.getById(id);
      return result.agent;
    },
    enabled: !!id,
  });
}

export function useSelectAgent() {
  return useMutation({
    mutationFn: api.agents.select,
  });
}

export function useCoordinateAgents() {
  return useMutation({
    mutationFn: api.agents.coordinate,
  });
}

export function useAgentsStatus() {
  return useQuery({
    queryKey: [...queryKeys.agents, 'status'],
    queryFn: () => api.agents.getStatus(),
  });
}

export function useRegisterAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.agents.register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
//                      GUARD HOOKS
// ═══════════════════════════════════════════════════════════════

export function useGuardStatus() {
  return useQuery({
    queryKey: queryKeys.guardStatus,
    queryFn: () => api.guard.getStatus(),
  });
}

export function useGuardRules() {
  return useQuery({
    queryKey: queryKeys.guardRules,
    queryFn: async () => {
      const result = await api.guard.getRules();
      return result.rules || [];
    },
  });
}

export function useValidateCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.guard.validate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guardStatus });
    },
  });
}

export function useToggleGuardRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rule, enabled }: { rule: string; enabled: boolean }) =>
      api.guard.toggleRule(rule, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guardRules });
      queryClient.invalidateQueries({ queryKey: queryKeys.guardStatus });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
//                      LATENT HOOKS
// ═══════════════════════════════════════════════════════════════

export function useLatentContexts() {
  return useQuery({
    queryKey: queryKeys.latentContexts,
    queryFn: async () => {
      const result = await api.latent.getAll();
      return result.contexts || [];
    },
  });
}

export function useLatentContext(taskId: string) {
  return useQuery({
    queryKey: [...queryKeys.latentContexts, taskId],
    queryFn: async () => {
      const result = await api.latent.getContext(taskId);
      return result.context;
    },
    enabled: !!taskId,
  });
}

export function useLatentStatus() {
  return useQuery({
    queryKey: [...queryKeys.latentContexts, 'status'],
    queryFn: () => api.latent.getStatus(),
  });
}

export function useCreateLatentContext() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.latent.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.latentContexts });
    },
  });
}

export function useDeleteLatentContext() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.latent.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.latentContexts });
    },
  });
}

export function useTransitionLatentPhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, toPhase }: { taskId: string; toPhase: string }) =>
      api.latent.transition(taskId, toPhase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.latentContexts });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
//                      DOCUMENTS HOOKS
// ═══════════════════════════════════════════════════════════════

export function useDocuments() {
  return useQuery({
    queryKey: queryKeys.documents,
    queryFn: async () => {
      const result = await api.documents.getAll();
      return result.documents || [];
    },
  });
}

export function useDocumentsStatus() {
  return useQuery({
    queryKey: [...queryKeys.documents, 'status'],
    queryFn: () => api.documents.getStatus(),
  });
}

export function useSearchDocuments() {
  return useMutation({
    mutationFn: async (query: string) => {
      const result = await api.documents.search(query);
      return result.results || [];
    },
  });
}

export function useScanDocuments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.documents.scan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
//                      PROCESSES HOOKS
// ═══════════════════════════════════════════════════════════════

export function useProcesses() {
  return useQuery({
    queryKey: queryKeys.processes,
    queryFn: async () => {
      const result = await api.processes.getAll();
      return result.processes || [];
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

export function useCheckPort(port: number, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.processes, 'port', port],
    queryFn: () => api.processes.checkPort(port),
    enabled,
  });
}

export function useKillOnPort() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ port, force }: { port: number; force?: boolean }) =>
      api.processes.killOnPort(port, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.processes });
    },
  });
}

export function useKillProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pid, force }: { pid: number; force?: boolean }) =>
      api.processes.killByPid(pid, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.processes });
    },
  });
}
