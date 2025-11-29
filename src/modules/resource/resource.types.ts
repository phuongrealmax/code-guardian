// src/modules/resource/resource.types.ts

export interface ResourceStatus {
  tokens: {
    used: number;
    estimated: number;
    percentage: number;
    remaining: number;
  };
  checkpoints: {
    count: number;
    lastCheckpoint?: CheckpointInfo;
    autoEnabled: boolean;
  };
  warnings: ResourceWarning[];
}

export interface CheckpointInfo {
  id: string;
  name: string;
  createdAt: Date;
  tokenUsage: number;
  reason: string;
  size: number;
}

export interface ResourceWarning {
  level: 'info' | 'warning' | 'critical';
  message: string;
  action?: string;
}

export interface TaskEstimate {
  complexity: 'low' | 'medium' | 'high' | 'very_high';
  estimatedTokens: number;
  estimatedTime: string;
  suggestBreakdown: boolean;
  breakdownSuggestions?: string[];
  canComplete: boolean;
  warningMessage?: string;
}

export interface CheckpointData {
  id: string;
  name: string;
  createdAt: Date;
  reason: CheckpointReason;
  tokenUsage: number;
  session: {
    id: string;
    startedAt: Date;
  };
  memory: unknown[];
  tasks: unknown[];
  filesChanged: string[];
  metadata: Record<string, unknown>;
}

export type CheckpointReason =
  | 'auto_threshold'
  | 'manual'
  | 'task_complete'
  | 'session_end'
  | 'error_recovery'
  | 'before_risky_operation';

export interface TokenUsage {
  used: number;
  estimated: number;
  percentage: number;
  lastUpdated: Date;
}
