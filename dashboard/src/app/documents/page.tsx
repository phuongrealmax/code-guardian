'use client';

import { useState } from 'react';
import { FileText, Search, Folder, Clock, Tag, Plus, X, Loader2, RefreshCw, Eye } from 'lucide-react';
import { useDocuments, useDocumentsStatus, useScanDocuments, useSearchDocuments } from '@/hooks/useApi';

const typeColors: Record<string, string> = {
  readme: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  spec: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  api: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  guide: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  changelog: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  architecture: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  config: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  other: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

export default function DocumentsPage() {
  const { data: documents = [], isLoading, refetch } = useDocuments();
  const { data: docsStatus } = useDocumentsStatus();
  const scanDocs = useScanDocuments();
  const searchDocs = useSearchDocuments();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const byType = documents.reduce((acc: any, d: any) => {
    acc[d.type] = (acc[d.type] || 0) + 1;
    return acc;
  }, {});

  const filteredDocuments = documents.filter((doc: any) => {
    const matchesType = selectedType === null || doc.type === selectedType;
    const matchesSearch = searchQuery === '' ||
      doc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.path?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleScan = async () => {
    try {
      await scanDocs.mutateAsync();
    } catch (error) {
      console.error('Failed to scan documents:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchDocs.mutateAsync(searchQuery);
      setSearchResults(results as any[]);
    } catch (error) {
      console.error('Failed to search documents:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchResults(null);
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-ccg-primary" />
      </div>
    );
  }

  const displayDocs = searchResults || filteredDocuments;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-ccg-primary" />
            Documents
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Project documentation registry</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-ccg-primary">{documents.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Documents</p>
          </div>
          <button
            onClick={handleScan}
            disabled={scanDocs.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-ccg-primary text-white rounded-lg hover:bg-ccg-primary/90 transition-colors disabled:opacity-50"
          >
            {scanDocs.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Scan Project
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccg-primary focus:border-transparent"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={!searchQuery.trim() || isSearching}
          className="px-4 py-2 bg-ccg-secondary text-white rounded-lg hover:bg-ccg-secondary/90 transition-colors disabled:opacity-50"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </button>
        {searchResults && (
          <button
            onClick={clearSearch}
            className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
          >
            Clear
          </button>
        )}
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
          All ({documents.length})
        </button>
        {Object.entries(byType).map(([type, count]) => (
          <button
            key={type}
            onClick={() => setSelectedType(selectedType === type ? null : type)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedType === type
                ? 'ring-2 ring-ccg-primary ring-offset-2 dark:ring-offset-slate-900'
                : ''
            } ${typeColors[type] || typeColors.other}`}
          >
            {type} ({count as number})
          </button>
        ))}
      </div>

      {/* Search Results Notice */}
      {searchResults && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Found {searchResults.length} result(s) for "{searchQuery}"
          </p>
        </div>
      )}

      {/* Document List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayDocs.map((doc: any) => (
          <div key={doc.id || doc.path} className="card hover:shadow-md transition-shadow group">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${typeColors[doc.type] || typeColors.other}`}>
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-white truncate">{doc.name || doc.path?.split('/').pop()}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{doc.path}</p>
              </div>
            </div>

            {doc.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 line-clamp-2">{doc.description}</p>
            )}

            {doc.tags && doc.tags.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <Tag className="w-3 h-3 text-gray-400" />
                <div className="flex flex-wrap gap-1">
                  {doc.tags.slice(0, 4).map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                  {doc.tags.length > 4 && (
                    <span className="text-xs text-gray-400">+{doc.tags.length - 4}</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 text-xs text-gray-400">
              <span className={`px-2 py-0.5 rounded ${typeColors[doc.type] || typeColors.other}`}>
                {doc.type}
              </span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {displayDocs.length === 0 && (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery || selectedType ? 'No documents match your filters' : 'No documents registered'}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            {searchQuery || selectedType ? 'Try adjusting your filters' : 'Click "Scan Project" to discover documents'}
          </p>
        </div>
      )}
    </div>
  );
}
