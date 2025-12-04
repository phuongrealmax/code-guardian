'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Brain,
  ListTodo,
  Bot,
  Shield,
  Settings,
  Zap,
  FileText,
  Activity,
  Moon,
  Sun,
  Menu,
  X,
} from 'lucide-react';
import { useTheme } from './ThemeProvider';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Memory', href: '/memory', icon: Brain },
  { name: 'Workflow', href: '/workflow', icon: ListTodo },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Guard', href: '/guard', icon: Shield },
  { name: 'Latent', href: '/latent', icon: Zap },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Processes', href: '/processes', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme, mounted } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // Prevent hydration mismatch by not rendering theme-dependent UI until mounted
  const currentTheme = mounted ? resolvedTheme : 'light';

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-ccg-primary to-ccg-secondary rounded-xl flex items-center justify-center shadow-lg shadow-ccg-primary/25">
            <Shield className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white">CCG</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Code Guardian</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto" role="navigation" aria-label="Main navigation">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="w-5 h-5" aria-hidden="true" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer with Theme Toggle */}
      <div className="p-4 border-t border-gray-100 dark:border-slate-700 space-y-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                     bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600
                     text-gray-700 dark:text-gray-200 transition-all duration-200"
          aria-label={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {currentTheme === 'dark' ? (
            <>
              <Sun className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm">Dark Mode</span>
            </>
          )}
        </button>

        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          CCG v3.0 • MCP Server
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-700"
        aria-label="Toggle menu"
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? (
          <X className="w-6 h-6 text-gray-700 dark:text-gray-200" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
        )}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex-col h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
