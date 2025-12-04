import { Settings, Database, Shield, Bell, Palette, Code } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-ccg-primary" />
          Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Configure CCG preferences</p>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Data Storage */}
        <div className="card">
          <h2 className="card-header flex items-center gap-2">
            <Database className="w-5 h-5 text-ccg-primary" />
            Data Storage
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Data Directory</label>
              <input
                type="text"
                value=".ccg/"
                readOnly
                className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Memory Limit</label>
              <select className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-gray-100">
                <option>100 memories</option>
                <option>500 memories</option>
                <option>1000 memories</option>
                <option>Unlimited</option>
              </select>
            </div>
          </div>
        </div>

        {/* Guard Settings */}
        <div className="card">
          <h2 className="card-header flex items-center gap-2">
            <Shield className="w-5 h-5 text-ccg-primary" />
            Guard Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Strict Mode</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Treat warnings as errors</p>
              </div>
              <button className="w-12 h-6 bg-gray-200 dark:bg-slate-600 rounded-full relative">
                <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Auto Validate</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Check code before commit</p>
              </div>
              <button className="w-12 h-6 bg-ccg-primary rounded-full relative">
                <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow" />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <h2 className="card-header flex items-center gap-2">
            <Bell className="w-5 h-5 text-ccg-primary" />
            Notifications
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Task Complete</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Notify when tasks finish</p>
              </div>
              <button className="w-12 h-6 bg-ccg-primary rounded-full relative">
                <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Guard Alerts</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Alert on security issues</p>
              </div>
              <button className="w-12 h-6 bg-ccg-primary rounded-full relative">
                <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow" />
              </button>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="card">
          <h2 className="card-header flex items-center gap-2">
            <Palette className="w-5 h-5 text-ccg-primary" />
            Appearance
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Theme</label>
              <select className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-gray-100">
                <option>Light</option>
                <option>Dark</option>
                <option>System</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Accent Color</label>
              <div className="flex gap-2 mt-2">
                <button className="w-8 h-8 rounded-full bg-indigo-500 ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-800" />
                <button className="w-8 h-8 rounded-full bg-purple-500" />
                <button className="w-8 h-8 rounded-full bg-cyan-500" />
                <button className="w-8 h-8 rounded-full bg-green-500" />
                <button className="w-8 h-8 rounded-full bg-orange-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Info */}
      <div className="card">
        <h2 className="card-header flex items-center gap-2">
          <Code className="w-5 h-5 text-ccg-primary" />
          API Information
        </h2>
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 font-mono text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 dark:text-gray-400">MCP Server:</span>
            <span className="text-gray-900 dark:text-gray-100">Claude Code Guardian v3.0</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 dark:text-gray-400">Transport:</span>
            <span className="text-gray-900 dark:text-gray-100">stdio</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 dark:text-gray-400">Tools:</span>
            <span className="text-gray-900 dark:text-gray-100">113+</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">Modules:</span>
            <span className="text-gray-900 dark:text-gray-100">12 active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
