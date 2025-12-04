'use client';

import { useState } from 'react';
import { Bot, CheckCircle, Code, Briefcase, Sparkles, Plus, X, Loader2, Search, RefreshCw } from 'lucide-react';
import { useAgents, useAgentsStatus, useRegisterAgent, useSelectAgent } from '@/hooks/useApi';

export default function AgentsPage() {
  const { data: agents = [], isLoading, refetch } = useAgents();
  const { data: agentsStatus } = useAgentsStatus();
  const registerAgent = useRegisterAgent();
  const selectAgent = useSelectAgent();

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedAgentResult, setSelectedAgentResult] = useState<any>(null);
  const [newAgent, setNewAgent] = useState({
    id: '',
    name: '',
    role: '',
    specializations: '',
    responsibilities: '',
    principles: '',
  });

  const enabledCount = agents.filter(a => a.enabled).length;

  const filteredAgents = agents.filter((agent) => {
    if (searchQuery === '') return true;
    const query = searchQuery.toLowerCase();
    return (
      agent.name.toLowerCase().includes(query) ||
      agent.role.toLowerCase().includes(query) ||
      agent.specializations?.some(s => s.toLowerCase().includes(query))
    );
  });

  const handleRegister = async () => {
    if (!newAgent.id.trim() || !newAgent.name.trim() || !newAgent.role.trim()) return;
    try {
      await registerAgent.mutateAsync({
        id: newAgent.id,
        name: newAgent.name,
        role: newAgent.role,
        specializations: newAgent.specializations.split(',').map(s => s.trim()).filter(Boolean),
        responsibilities: newAgent.responsibilities.split('\n').map(s => s.trim()).filter(Boolean),
        principles: newAgent.principles.split('\n').map(s => s.trim()).filter(Boolean),
      });
      setShowRegisterModal(false);
      setNewAgent({ id: '', name: '', role: '', specializations: '', responsibilities: '', principles: '' });
    } catch (error) {
      console.error('Failed to register agent:', error);
    }
  };

  const handleSelectAgent = async () => {
    if (!taskDescription.trim()) return;
    try {
      const result = await selectAgent.mutateAsync({ task: taskDescription });
      setSelectedAgentResult(result);
    } catch (error) {
      console.error('Failed to select agent:', error);
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
            <Bot className="w-8 h-8 text-ccg-primary" />
            Agents
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Specialized AI agents for different domains</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-ccg-primary">{agents.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{enabledCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
          </div>
          <button
            onClick={() => setShowSelectModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-ccg-secondary text-white rounded-lg hover:bg-ccg-secondary/90 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Select Agent
          </button>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-ccg-primary text-white rounded-lg hover:bg-ccg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Register Agent
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search agents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccg-primary focus:border-transparent"
        />
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <div key={agent.id} className="card hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  agent.enabled ? 'bg-gradient-to-br from-ccg-primary to-ccg-secondary' : 'bg-gray-200 dark:bg-slate-700'
                }`}>
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{agent.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{agent.id}</p>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${agent.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
            </div>

            {/* Role */}
            <div className="mb-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <Briefcase className="w-3 h-3" />
                Role
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{agent.role}</p>
            </div>

            {/* Specializations */}
            <div className="mb-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                <Code className="w-3 h-3" />
                Specializations
              </div>
              <div className="flex flex-wrap gap-1">
                {agent.specializations?.slice(0, 5).map((spec) => (
                  <span
                    key={spec}
                    className="px-2 py-0.5 bg-ccg-primary/10 text-ccg-primary rounded text-xs"
                  >
                    {spec}
                  </span>
                ))}
                {agent.specializations?.length > 5 && (
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 rounded text-xs">
                    +{agent.specializations.length - 5}
                  </span>
                )}
              </div>
            </div>

            {/* Responsibilities */}
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                <CheckCircle className="w-3 h-3" />
                Responsibilities ({agent.responsibilities?.length || 0})
              </div>
              <ul className="space-y-1">
                {agent.responsibilities?.slice(0, 3).map((resp, i) => (
                  <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="text-ccg-primary mt-0.5">•</span>
                    <span className="line-clamp-1">{resp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Principles */}
            {agent.principles && agent.principles.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <Sparkles className="w-3 h-3" />
                  Principles
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">
                  {agent.principles[0]}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="card text-center py-12">
          <Bot className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No agents match your search' : 'No agents registered'}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            {searchQuery ? 'Try adjusting your search' : 'Click "Register Agent" to add one'}
          </p>
        </div>
      )}

      {/* Register Agent Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Register New Agent</h2>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ID *
                  </label>
                  <input
                    type="text"
                    value={newAgent.id}
                    onChange={(e) => setNewAgent({ ...newAgent, id: e.target.value })}
                    placeholder="my-agent"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccg-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    placeholder="My Agent"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccg-primary focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role *
                </label>
                <input
                  type="text"
                  value={newAgent.role}
                  onChange={(e) => setNewAgent({ ...newAgent, role: e.target.value })}
                  placeholder="Expert in..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccg-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Specializations (comma-separated)
                </label>
                <input
                  type="text"
                  value={newAgent.specializations}
                  onChange={(e) => setNewAgent({ ...newAgent, specializations: e.target.value })}
                  placeholder="React, TypeScript, Testing"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccg-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Responsibilities (one per line)
                </label>
                <textarea
                  value={newAgent.responsibilities}
                  onChange={(e) => setNewAgent({ ...newAgent, responsibilities: e.target.value })}
                  placeholder="Code review&#10;Testing&#10;Documentation"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccg-primary focus:border-transparent resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Principles (one per line)
                </label>
                <textarea
                  value={newAgent.principles}
                  onChange={(e) => setNewAgent({ ...newAgent, principles: e.target.value })}
                  placeholder="Write clean code&#10;Test everything&#10;Document well"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccg-primary focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setShowRegisterModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRegister}
                disabled={!newAgent.id.trim() || !newAgent.name.trim() || !newAgent.role.trim() || registerAgent.isPending}
                className="px-4 py-2 bg-ccg-primary text-white rounded-lg hover:bg-ccg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {registerAgent.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Register Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select Agent Modal */}
      {showSelectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Select Best Agent for Task</h2>
              <button
                onClick={() => { setShowSelectModal(false); setSelectedAgentResult(null); setTaskDescription(''); }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Describe your task
                </label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="I need to implement a trading algorithm that..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccg-primary focus:border-transparent resize-none"
                />
              </div>

              {selectedAgentResult && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-green-700 dark:text-green-300">
                      Recommended: {selectedAgentResult.agent?.name || 'Unknown'}
                    </span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Confidence: {Math.round((selectedAgentResult.confidence || 0) * 100)}%
                  </p>
                  {selectedAgentResult.reason && (
                    <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                      {selectedAgentResult.reason}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => { setShowSelectModal(false); setSelectedAgentResult(null); setTaskDescription(''); }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleSelectAgent}
                disabled={!taskDescription.trim() || selectAgent.isPending}
                className="px-4 py-2 bg-ccg-primary text-white rounded-lg hover:bg-ccg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {selectAgent.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Find Best Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
