'use client';

import { useState } from 'react';
import { ListTodo, Clock, CheckCircle, AlertCircle, Pause, Play, XCircle, Plus, Trash2, X, Loader2, MessageSquare, MoreVertical } from 'lucide-react';
import { useTasks, useCurrentTask, useCreateTask, useUpdateTask, useCompleteTask, useDeleteTask, useAddTaskNote } from '@/hooks/useApi';

const statusIcons: Record<string, any> = {
  pending: Clock,
  in_progress: Play,
  paused: Pause,
  blocked: AlertCircle,
  completed: CheckCircle,
  failed: XCircle,
};

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  blocked: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const priorityColors: Record<string, string> = {
  low: 'border-gray-300 dark:border-gray-600',
  medium: 'border-blue-400 dark:border-blue-500',
  high: 'border-orange-400 dark:border-orange-500',
  critical: 'border-red-500 dark:border-red-400',
};

const priorities = ['low', 'medium', 'high', 'critical'] as const;
const statuses = ['pending', 'in_progress', 'paused', 'blocked', 'completed', 'failed'] as const;
type Priority = typeof priorities[number];
type Status = typeof statuses[number];

export default function WorkflowPage() {
  const { data: tasks = [], isLoading } = useTasks();
  const { data: currentTask } = useCurrentTask();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  const addNote = useAddTaskNote();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState<string | null>(null);
  const [selectedTaskMenu, setSelectedTaskMenu] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    priority: 'medium' as Priority,
  });
  const [newNote, setNewNote] = useState({
    content: '',
    type: 'note' as 'note' | 'decision' | 'blocker' | 'idea',
  });

  const byStatus = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleCreate = async () => {
    if (!newTask.name.trim()) return;
    try {
      await createTask.mutateAsync(newTask);
      setShowCreateModal(false);
      setNewTask({ name: '', description: '', priority: 'medium' });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleStatusChange = async (taskId: string, status: Status) => {
    try {
      if (status === 'completed') {
        await completeTask.mutateAsync(taskId);
      } else {
        await updateTask.mutateAsync({ taskId, status });
      }
      setSelectedTaskMenu(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask.mutateAsync(taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleAddNote = async () => {
    if (!showNoteModal || !newNote.content.trim()) return;
    try {
      await addNote.mutateAsync({
        taskId: showNoteModal,
        content: newNote.content,
        type: newNote.type,
      });
      setShowNoteModal(null);
      setNewNote({ content: '', type: 'note' });
    } catch (error) {
      console.error('Failed to add note:', error);
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
            <ListTodo className="w-8 h-8 text-ccg-primary" />
            Workflow
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Task management and tracking</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-ccg-primary text-white rounded-lg hover:bg-ccg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* Current Task Highlight */}
      {currentTask && (
        <div className="card bg-gradient-to-r from-ccg-primary/10 to-ccg-secondary/10 border-2 border-ccg-primary">
          <div className="flex items-center gap-2 mb-2">
            <Play className="w-5 h-5 text-ccg-primary animate-pulse" />
            <span className="text-sm font-medium text-ccg-primary">Currently Working On</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{currentTask.name}</h3>
          {currentTask.description && (
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{currentTask.description}</p>
          )}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Progress</span>
              <span>{currentTask.progress}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-ccg-primary rounded-full transition-all"
                style={{ width: `${currentTask.progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(statusIcons).map(([status, Icon]) => (
          <div key={status} className="card text-center">
            <Icon className={`w-6 h-6 mx-auto mb-2 ${
              status === 'completed' ? 'text-green-500' :
              status === 'in_progress' ? 'text-blue-500' :
              status === 'failed' ? 'text-red-500' :
              'text-gray-400'
            }`} />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{byStatus[status] || 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{status.replace('_', ' ')}</p>
          </div>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {tasks.map((task) => {
          const StatusIcon = statusIcons[task.status] || Clock;
          return (
            <div
              key={task.id}
              className={`card border-l-4 ${priorityColors[task.priority]} group relative`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{task.name}</h3>
                  {task.description && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{task.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${statusColors[task.status]}`}>
                    <StatusIcon className="w-3 h-3" />
                    {task.status.replace('_', ' ')}
                  </span>
                  <div className="relative">
                    <button
                      onClick={() => setSelectedTaskMenu(selectedTaskMenu === task.id ? null : task.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {selectedTaskMenu === task.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-10 min-w-[160px]">
                        <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 font-medium">Status</div>
                        {statuses.map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(task.id, status)}
                            className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 ${
                              task.status === status ? 'text-ccg-primary font-medium' : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {status.replace('_', ' ')}
                          </button>
                        ))}
                        <div className="border-t border-gray-200 dark:border-slate-700 my-1" />
                        <button
                          onClick={() => { setShowNoteModal(task.id); setSelectedTaskMenu(null); }}
                          className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Add Note
                        </button>
                        <button
                          onClick={() => { handleDelete(task.id); setSelectedTaskMenu(null); }}
                          className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{task.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-ccg-primary rounded-full transition-all"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>

              {/* Notes */}
              {task.notes && task.notes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Notes ({task.notes.length})</p>
                  <div className="space-y-2">
                    {task.notes.slice(0, 2).map((note, i) => (
                      <div key={i} className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 p-2 rounded">
                        <span className="text-xs text-ccg-primary font-medium">[{note.type}]</span>{' '}
                        {note.content}
                      </div>
                    ))}
                    {task.notes.length > 2 && (
                      <p className="text-xs text-gray-400">+{task.notes.length - 2} more notes</p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                <span className={`px-2 py-0.5 rounded capitalize ${
                  task.priority === 'critical' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                  task.priority === 'high' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' :
                  'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {task.priority}
                </span>
                <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          );
        })}

        {tasks.length === 0 && (
          <div className="card text-center py-12">
            <ListTodo className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No tasks yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              Click "New Task" to create one
            </p>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Task</h2>
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
                  Task Name *
                </label>
                <input
                  type="text"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  placeholder="What needs to be done?"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccg-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Add more details..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccg-primary focus:border-transparent resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccg-primary focus:border-transparent"
                >
                  {priorities.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
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
                disabled={!newTask.name.trim() || createTask.isPending}
                className="px-4 py-2 bg-ccg-primary text-white rounded-lg hover:bg-ccg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createTask.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Note</h2>
              <button
                onClick={() => setShowNoteModal(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={newNote.type}
                  onChange={(e) => setNewNote({ ...newNote, type: e.target.value as typeof newNote.type })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccg-primary focus:border-transparent"
                >
                  <option value="note">Note</option>
                  <option value="decision">Decision</option>
                  <option value="blocker">Blocker</option>
                  <option value="idea">Idea</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content *
                </label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="Write your note..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccg-primary focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setShowNoteModal(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={!newNote.content.trim() || addNote.isPending}
                className="px-4 py-2 bg-ccg-primary text-white rounded-lg hover:bg-ccg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {addNote.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
