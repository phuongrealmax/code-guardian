'use client';

import { Brain, ListTodo, Bot, Shield, Zap, FileText, Activity, CheckCircle } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  iconName: 'brain' | 'list' | 'bot' | 'shield' | 'zap' | 'file' | 'activity' | 'check';
  color: 'primary' | 'secondary' | 'accent' | 'success' | 'warning';
  subtitle?: string;
}

const colorMap = {
  primary: 'bg-ccg-primary/10 text-ccg-primary',
  secondary: 'bg-purple-100 text-purple-600',
  accent: 'bg-cyan-100 text-cyan-600',
  success: 'bg-green-100 text-green-600',
  warning: 'bg-amber-100 text-amber-600',
};

const iconMap = {
  brain: Brain,
  list: ListTodo,
  bot: Bot,
  shield: Shield,
  zap: Zap,
  file: FileText,
  activity: Activity,
  check: CheckCircle,
};

export function StatCard({ title, value, iconName, color, subtitle }: StatCardProps) {
  const Icon = iconMap[iconName];

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
