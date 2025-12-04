'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, Lock, Loader2, ToggleLeft, ToggleRight, Play, FileCode } from 'lucide-react';
import { useGuardStatus, useGuardRules, useToggleGuardRule, useValidateCode } from '@/hooks/useApi';

const categoryIcons: Record<string, any> = {
  'Quality': CheckCircle,
  'Security': Lock,
  'AI/LLM': Shield,
  'testing': CheckCircle,
  'quality': CheckCircle,
  'security': Lock,
  'ai': Shield,
};

const categoryColors: Record<string, string> = {
  'Quality': 'text-blue-500',
  'Security': 'text-red-500',
  'AI/LLM': 'text-purple-500',
  'testing': 'text-blue-500',
  'quality': 'text-blue-500',
  'security': 'text-red-500',
  'ai': 'text-purple-500',
};

export default function GuardPage() {
  const { data: guardStatus, isLoading: statusLoading } = useGuardStatus();
  const { data: rules = [], isLoading: rulesLoading } = useGuardRules();
  const toggleRule = useToggleGuardRule();
  const validateCode = useValidateCode();

  const [showValidateModal, setShowValidateModal] = useState(false);
  const [codeToValidate, setCodeToValidate] = useState('');
  const [filename, setFilename] = useState('example.ts');
  const [validationResult, setValidationResult] = useState<any>(null);

  const isLoading = statusLoading || rulesLoading;

  const stats = guardStatus || {
    validationsRun: 0,
    issuesFound: 0,
    issuesBlocked: 0,
  };

  const categories = [...new Set(rules.map(r => r.category))];

  const handleToggleRule = async (ruleName: string, currentEnabled: boolean) => {
    try {
      await toggleRule.mutateAsync({ rule: ruleName, enabled: !currentEnabled });
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleValidate = async () => {
    if (!codeToValidate.trim()) return;
    try {
      const result = await validateCode.mutateAsync({
        code: codeToValidate,
        filename: filename,
      });
      setValidationResult(result);
    } catch (error) {
      console.error('Failed to validate code:', error);
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
            <Shield className="w-8 h-8 text-ccg-primary" />
            Guard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Code quality and security protection</p>
        </div>
        <button
          onClick={() => setShowValidateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-ccg-primary text-white rounded-lg hover:bg-ccg-primary/90 transition-colors"
        >
          <Play className="w-4 h-4" />
          Validate Code
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <Eye className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.validationsRun || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Validations Run</p>
        </div>
        <div className="card text-center">
          <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.issuesFound || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Issues Found</p>
        </div>
        <div className="card text-center">
          <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.issuesBlocked || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Issues Blocked</p>
        </div>
        <div className="card text-center">
          <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{rules.filter(r => r.enabled).length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Rules Active</p>
        </div>
      </div>

      {/* Rules by Category */}
      {categories.map((category) => {
        const CategoryIcon = categoryIcons[category] || Shield;
        const iconColor = categoryColors[category] || 'text-gray-500';
        return (
          <div key={category} className="card">
            <h2 className="card-header flex items-center gap-2 capitalize">
              <CategoryIcon className={`w-5 h-5 ${iconColor}`} />
              {category} Rules
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rules
                .filter((r) => r.category === category)
                .map((rule) => (
                  <div
                    key={rule.name}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          rule.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{rule.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Issues: {rule.issuesFound || 0}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleRule(rule.name, rule.enabled)}
                      disabled={toggleRule.isPending}
                      className="flex items-center gap-1 hover:opacity-80 transition-opacity disabled:opacity-50"
                    >
                      {rule.enabled ? (
                        <ToggleRight className="w-8 h-8 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      )}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        );
      })}

      {/* OWASP Info */}
      <div className="card bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-100 dark:border-red-800">
        <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">OWASP Top 10 Coverage</h3>
        <p className="text-sm text-red-700 dark:text-red-400">
          Guard includes security rules based on OWASP Top 10 vulnerabilities including
          SQL Injection (CWE-89), XSS (CWE-79), Command Injection (CWE-78),
          Path Traversal (CWE-22), and Hardcoded Secrets (CWE-798).
        </p>
      </div>

      {/* Validate Code Modal */}
      {showValidateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileCode className="w-5 h-5 text-ccg-primary" />
                Validate Code
              </h2>
              <button
                onClick={() => { setShowValidateModal(false); setValidationResult(null); }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filename
                </label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="example.ts"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccg-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Code to validate
                </label>
                <textarea
                  value={codeToValidate}
                  onChange={(e) => setCodeToValidate(e.target.value)}
                  placeholder="Paste your code here..."
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccg-primary focus:border-transparent font-mono text-sm resize-none"
                />
              </div>

              {validationResult && (
                <div className={`p-4 rounded-lg border ${
                  validationResult.blocked
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : validationResult.issues?.length > 0
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                      : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {validationResult.blocked ? (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    ) : validationResult.issues?.length > 0 ? (
                      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    )}
                    <span className={`font-semibold ${
                      validationResult.blocked
                        ? 'text-red-700 dark:text-red-300'
                        : validationResult.issues?.length > 0
                          ? 'text-amber-700 dark:text-amber-300'
                          : 'text-green-700 dark:text-green-300'
                    }`}>
                      {validationResult.blocked
                        ? 'Blocked - Issues Found'
                        : validationResult.issues?.length > 0
                          ? `${validationResult.issues.length} Warning(s)`
                          : 'Code Passed All Checks'}
                    </span>
                  </div>
                  {validationResult.issues && validationResult.issues.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {validationResult.issues.map((issue: any, i: number) => (
                        <div key={i} className="text-sm p-2 bg-white/50 dark:bg-slate-800/50 rounded">
                          <span className={`font-medium ${
                            issue.severity === 'error' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            [{issue.severity}]
                          </span>{' '}
                          <span className="text-gray-700 dark:text-gray-300">{issue.message}</span>
                          {issue.line && (
                            <span className="text-gray-500 dark:text-gray-400"> (line {issue.line})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => { setShowValidateModal(false); setValidationResult(null); }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleValidate}
                disabled={!codeToValidate.trim() || validateCode.isPending}
                className="px-4 py-2 bg-ccg-primary text-white rounded-lg hover:bg-ccg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {validateCode.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Validate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
