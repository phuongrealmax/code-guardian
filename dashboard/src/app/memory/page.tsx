'use client';

import { useState } from 'react';
import { Brain, Search, Star, Tag, Clock, Plus, Trash2, X, Loader2 } from 'lucide-react';
import { useMemories, useMemorySummary, useCreateMemory, useDeleteMemory } from '@/hooks/useApi';

const typeColors: Record<string, string> = {
  decision: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  fact: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  code_pattern: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  note: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  convention: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  architecture: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
};

const memoryTypes = ['decision', 'fact', 'code_pattern', 'error', 'note', 'convention', 'architecture'] as const;
type MemoryType = typeof memoryTypes[number];

export default function MemoryPage() {
  const { data: memories = [], isLoading, refetch } = useMemories();
  const { data: summary } = useMemorySummary();
  const createMemory = useCreateMemory();
  const deleteMemory = useDeleteMemory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMemory, setNewMemory] = useState({
    content: '',
    type: 'note' as MemoryType,
    importance: 5,
    tags: '',
  });

  const filteredMemories = memories.filter((memory) => {
    const matchesSearch = searchQuery === '' ||
      memory.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === null || memory.type === selectedType;
    return matchesSearch && matchesType;
  });

  const byType = memories.reduce((acc, m) => {
    acc[m.type] = (acc[m.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleCreate = async () => {
    if (!newMemory.content.trim()) return;

    try {
      await createMemory.mutateAsync({
        content: newMemory.content,
        type: newMemory.type,
        importance: newMemory.importance,
        tags: newMemory.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      setShowCreateModal(false);
      setNewMemory({ content: '', type: 'note', importance: 5, tags: '' });
    } catch (error) {
      console.error('Failed to create memory:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) return;

    try {
      await deleteMemory.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete memory:', error);
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
            <Brain className="w-8 h-8 text-ccg-primary" />
            Memory Store
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Persistent knowledge across sessions</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-2xl font-bold text-ccg-primary">{memories.length}</span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">memories</span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-ccg-primary text-white rounded-lg hover:bg-ccg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Memory
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccg-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedType(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedType === null
              ? 'bg-ccg-primary text-white'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          All ({memories.length})
        </button>
        {Object.entries(byType).map(([type, count]) => (
          <button
            key={type}
            onClick={() => setSelectedType(selectedType === type ? null : type)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedType === type
                ? 'ring-2 ring-ccg-primary ring-offset-2 dark:ring-offset-slate-900'
                : ''
            } ${typeColors[type] || 'bg-gray-100 dark:bg-slate-700'}`}
          >
            {type} ({count})
          </button>
        ))}
      </div>

      {/* Memory List */}
      <div className="space-y-4">
        {filteredMemories.map((memory) => (
          <div key={memory.id} className="card hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[memory.type]}`}>
                  {memory.type}
                </span>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-medium">{memory.importance}/10</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-gray-400 text-xs">
                  <Clock className="w-3 h-3" />
                  {new Date(memory.createdAt).toLocaleDateString()}
                </div>
                <button
                  onClick={() => handleDelete(memory.id)}
                  className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete memory"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-3">{memory.content}</p>

            {memory.tags && memory.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-400" />
                <div className="flex flex-wrap gap-1">
                  {memory.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-xs text-gray-400">
              <span>ID: {memory.id.slice(0, 8)}...</span>
              <span>Accessed {memory.accessCount} times</span>
            </div>
          </div>
        ))}

        {filteredMemories.length === 0 && (
          <div className="card text-center py-12">
            <Brain className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery || selectedType ? 'No memories match your search' : 'No memories stored yet'}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              {searchQuery || selectedType ? 'Try adjusting your filters' : 'Click "Add Memory" to create one'}
            </p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Memory</h2>
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
                  Content *
                </label>
                <textarea
                  value={newMemory.content}
                  onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                  placeholder="What do you want to remember?"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccg-primary focus:border-transparent resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={newMemory.type}
                    onChange={(e) => setNewMemory({ ...newMemory, type: e.target.value as MemoryType })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccg-primary focus:border-transparent"
                  >
                    {memoryTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Importance ({newMemory.importance}/10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={newMemory.importance}
                    onChange={(e) => setNewMemory({ ...newMemory, importance: parseInt(e.target.value) })}
                    className="w-full mt-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={newMemory.tags}
                  onChange={(e) => setNewMemory({ ...newMemory, tags: e.target.value })}
                  placeholder="api, auth, security"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccg-primary focus:border-transparent"
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
                disabled={!newMemory.content.trim() || createMemory.isPending}
                className="px-4 py-2 bg-ccg-primary text-white rounded-lg hover:bg-ccg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createMemory.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Memory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
