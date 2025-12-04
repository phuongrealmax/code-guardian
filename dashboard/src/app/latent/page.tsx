'use client';

import { useState } from 'react';
import { Zap, GitBranch, ArrowRight, Clock, CheckCircle, AlertCircle, Plus, X, Loader2, Trash2, Play } from 'lucide-react';
import { useLatentContexts, useLatentStatus, useCreateLatentContext, useDeleteLatentContext, useTransitionLatentPhase } from '@/hooks/useApi';

const phaseIcons: Record<string, string> = {
  analysis: '🔍',
  plan: '📋',
  impl: '🔧',
  review: '✅',
};

const phaseColors: Record<string, string> = {
  analysis: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  plan: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  impl: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  review: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
};

const phases = ['analysis', 'plan', 'impl', 'review'] as const;
type Phase = typeof phases[number];

export default function LatentPage() {
  const { data: contexts = [], isLoading } = useLatentContexts();
  const { data: latentStatus } = useLatentStatus();
  const createContext = useCreateLatentContext();
  const deleteContext = useDeleteLatentContext();
  const transitionPhase = useTransitionLatentPhase();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContext, setNewContext] = useState({
    taskId: '',
    phase: 'analysis' as Phase,
    constraints: '',
    files: '',
  });

  const handleCreate = async () => {
    if (!newContext.taskId.trim()) return;
    try {
      await createContext.mutateAsync({
        taskId: newContext.taskId,
        phase: newContext.phase,
        constraints: newContext.constraints.split('\n').map(c => c.trim()).filter(Boolean),
        files: newContext.files.split('\n').map(f => f.trim()).filter(Boolean),
      });
      setShowCreateModal(false);
      setNewContext({ taskId: '', phase: 'analysis', constraints: '', files: '' });
    } catch (error) {
      console.error('Failed to create context:', error);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Delete this latent context?')) return;
    try {
      await deleteContext.mutateAsync(taskId);
    } catch (error) {
      console.error('Failed to delete context:', error);
    }
  };

  const handlePhaseTransition = async (taskId: string, toPhase: Phase) => {
    try {
      await transitionPhase.mutateAsync({ taskId, toPhase });
    } catch (error) {
      console.error('Failed to transition phase:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-ccg-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Zap className="w-8 h-8 text-ccg-primary" />
            Latent Chain Mode
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Hidden-state reasoning with 70% token savings</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-ccg-primary">{contexts.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Active Contexts</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-ccg-primary text-white rounded-lg hover:bg-ccg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Context
          </button>
        </div>
      </div>

      {/* Phase Flow */}
      <div className="card">
        <h2 className="card-header">4-Phase Workflow</h2>
        <div className="flex items-center justify-between">
          {phases.map((phase, i) => (
            <div key={phase} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl ${phaseColors[phase]} border-2`}>
                  {phaseIcons[phase]}
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2 capitalize">{phase}</p>
              </div>
              {i < 3 && (
                <ArrowRight className="w-6 h-6 text-gray-300 dark:text-gray-600 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Contexts */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Active Contexts</h2>

        {contexts.map((context: any) => (
          <div key={context.taskId} className="card group">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{context.taskId}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Agent: {context.agentId || 'Not assigned'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${phaseColors[context.phase]}`}>
                  {phaseIcons[context.phase]} {context.phase}
                </span>
                <button
                  onClick={() => handleDelete(context.taskId)}
                  className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete context"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Phase Transition Buttons */}
            <div className="flex items-center gap-2 mb-4">
              {phases.map((phase) => (
                <button
                  key={phase}
                  onClick={() => handlePhaseTransition(context.taskId, phase)}
                  disabled={context.phase === phase || transitionPhase.isPending}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    context.phase === phase
                      ? 'bg-ccg-primary text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  } disabled:opacity-50`}
                >
                  {phaseIcons[phase]} {phase}
                </button>
              ))}
            </div>

            {/* Constraints */}
            {context.constraints && context.constraints.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Constraints</p>
                <div className="flex flex-wrap gap-2">
                  {context.constraints.map((c: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-xs">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Code Map */}
            {context.codeMap && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Code Map</p>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded p-3">
                  {context.codeMap.files && (
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      Files: {context.codeMap.files.join(', ')}
                    </div>
                  )}
                  {context.codeMap.hotSpots && (
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Hot Spots: {context.codeMap.hotSpots.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Decisions */}
            {context.decisions && context.decisions.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Decisions ({context.decisions.length})</p>
                <div className="space-y-2">
                  {context.decisions.slice(0, 3).map((d: any) => (
                    <div key={d.id} className="text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-2 rounded">
                      <span className="font-medium">{d.id}:</span> {d.summary}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risks */}
            {context.risks && context.risks.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Risks</p>
                <div className="flex flex-wrap gap-2">
                  {context.risks.map((r: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {contexts.length === 0 && (
          <div className="card text-center py-12">
            <Zap className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No active latent contexts</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              Click "New Context" to create one
            </p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="card bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-100 dark:border-indigo-800">
        <h3 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-2">Quick Commands</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/50 dark:bg-slate-800/50 rounded p-3">
            <code className="text-indigo-600 dark:text-indigo-400">/latent-fix</code>
            <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">Quick bug fix workflow</p>
          </div>
          <div className="bg-white/50 dark:bg-slate-800/50 rounded p-3">
            <code className="text-indigo-600 dark:text-indigo-400">/latent-feature</code>
            <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">New feature development</p>
          </div>
          <div className="bg-white/50 dark:bg-slate-800/50 rounded p-3">
            <code className="text-indigo-600 dark:text-indigo-400">/latent-review</code>
            <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">Code review workflow</p>
          </div>
        </div>
      </div>

      {/* Create Context Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Latent Context</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Task ID *
                </label>
                <input
                  type="text"
                  value={newContext.taskId}
                  onChange={(e) => setNewContext({ ...newContext, taskId: e.target.value })}
                  placeholder="fix-auth-bug"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccg-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Initial Phase
                </label>
                <select
                  value={newContext.phase}
                  onChange={(e) => setNewContext({ ...newContext, phase: e.target.value as Phase })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccg-primary focus:border-transparent"
                >
                  {phases.map((p) => (
                    <option key={p} value={p}>{phaseIcons[p]} {p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Constraints (one per line)
                </label>
                <textarea
                  value={newContext.constraints}
                  onChange={(e) => setNewContext({ ...newContext, constraints: e.target.value })}
                  placeholder="No breaking changes&#10;Must pass tests"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccg-primary focus:border-transparent resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Files (one per line)
                </label>
                <textarea
                  value={newContext.files}
                  onChange={(e) => setNewContext({ ...newContext, files: e.target.value })}
                  placeholder="src/auth/login.ts&#10;src/utils/token.ts"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccg-primary focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newContext.taskId.trim() || createContext.isPending}
                className="px-4 py-2 bg-ccg-primary text-white rounded-lg hover:bg-ccg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createContext.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Context
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
