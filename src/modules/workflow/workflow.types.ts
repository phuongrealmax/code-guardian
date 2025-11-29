// src/modules/workflow/workflow.types.ts

export interface Task {
  id: string;
  name: string;
  description?: string;
  status: TaskStatus;
  progress: number;
  priority: TaskPriority;
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  parentId?: string;
  subtasks: string[];
  estimatedTokens?: number;
  actualTokens?: number;
  checkpoints: string[];
  notes: TaskNote[];
  filesAffected: string[];
  blockedBy?: string[];
  tags: string[];
}

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'paused'
  | 'blocked'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskNote {
  id: string;
  content: string;
  type: 'note' | 'decision' | 'blocker' | 'idea';
  createdAt: Date;
}

export interface TaskCreateParams {
  name: string;
  description?: string;
  priority?: TaskPriority;
  parentId?: string;
  estimatedTokens?: number;
  tags?: string[];
}

export interface TaskUpdateParams {
  status?: TaskStatus;
  progress?: number;
  description?: string;
  priority?: TaskPriority;
}

export interface TaskFilter {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  tags?: string[];
  parentId?: string | null;
}

export interface WorkflowStatus {
  currentTask?: Task;
  pendingCount: number;
  inProgressCount: number;
  completedToday: number;
  totalTasks: number;
}

export interface TaskSummary {
  id: string;
  name: string;
  status: TaskStatus;
  progress: number;
  priority: TaskPriority;
}
