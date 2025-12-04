'use client';

import { Brain, ListTodo, Bot, Activity, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { useStatus, useMemories, useTasks, useAgents, useGuardStatus } from '@/hooks/useApi';
import { useWebSocket } from '@/hooks/useWebSocket';

export function DashboardContent() {
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useStatus();
  const { data: memories = [], isLoading: memoriesLoading } = useMemories();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: agents = [], isLoading: agentsLoading } = useAgents();
  const { data: guardStats, isLoading: guardLoading } = useGuardStatus();
  const { isConnected } = useWebSocket();

  const isLoading = statusLoading || memoriesLoading || tasksLoading || agentsLoading || guardLoading;

  const activeTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const importantMemories = memories.filter((m) => m.importance >= 8).length;

  const handleRefresh = () => {
    refetchStatus();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Claude Code Guardian - Overview</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
            isConnected
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          }`}>
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4" />
                <span className="hidden sm:inline">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span className="hidden sm:inline">Disconnected</span>
              </>
            )}
          </div>
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg
                       bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600
                       text-gray-600 dark:text-gray-300 transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-xl flex items-center gap-3 ${
        status?.session?.active
          ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
          : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
      }`}>
        <Activity className={`w-5 h-5 ${status?.session?.active ? 'animate-pulse' : ''}`} />
        <span className="font-medium">
          {status?.session?.active ? 'Session Active' : 'No Active Session'}
        </span>
        {status?.session?.startedAt && (
          <span className="text-sm opacity-75">
            Started: {new Date(status.session.startedAt).toLocaleString()}
          </span>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Memories"
          value={isLoading ? '...' : memories.length}
          iconName="brain"
          color="primary"
          subtitle={`${importantMemories} important`}
        />
        <StatCard
          title="Tasks"
          value={isLoading ? '...' : tasks.length}
          iconName="list"
          color="secondary"
          subtitle={`${activeTasks} active, ${completedTasks} done`}
        />
        <StatCard
          title="Agents"
          value={isLoading ? '...' : agents.length}
          iconName="bot"
          color="accent"
          subtitle="Specialized agents"
        />
        <StatCard
          title="Guard Checks"
          value={isLoading ? '...' : (guardStats?.validationsRun || 0)}
          iconName="shield"
          color="success"
          subtitle={`${guardStats?.issuesBlocked || 0} blocked`}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="card">
          <h2 className="card-header flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-ccg-primary" />
            Recent Tasks
          </h2>
          <div className="space-y-3">
            {tasksLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : tasks.length > 0 ? (
              tasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      task.status === 'completed' ? 'bg-green-500' :
                      task.status === 'in_progress' ? 'bg-blue-500' :
                      task.status === 'failed' ? 'bg-red-500' :
                      'bg-gray-400'
                    }`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{task.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    task.priority === 'critical' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400' :
                    task.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400' :
                    task.priority === 'medium' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400' :
                    'bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-300'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">No tasks yet</p>
            )}
          </div>
        </div>

        {/* Recent Memories */}
        <div className="card">
          <h2 className="card-header flex items-center gap-2">
            <Brain className="w-5 h-5 text-ccg-primary" />
            Recent Memories
          </h2>
          <div className="space-y-3">
            {memoriesLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : memories.length > 0 ? (
              memories.slice(0, 5).map((memory) => (
                <div
                  key={memory.id}
                  className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2">{memory.content}</p>
                    <span className="text-xs font-medium text-ccg-primary ml-2">
                      {memory.importance}/10
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 bg-ccg-primary/10 text-ccg-primary rounded">
                      {memory.type}
                    </span>
                    {memory.tags?.slice(0, 2).map((tag: string) => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">No memories stored</p>
            )}
          </div>
        </div>
      </div>

      {/* Agents Overview */}
      <div className="card">
        <h2 className="card-header flex items-center gap-2">
          <Bot className="w-5 h-5 text-ccg-primary" />
          Available Agents
        </h2>
        {agentsLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${agent.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{agent.name}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{agent.role}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
