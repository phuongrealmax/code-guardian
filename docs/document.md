<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CCG v3.0 - Application Flow & Use Cases</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'system-ui', 'sans-serif'],
          },
          colors: {
            ccg: {
              primary: '#6366f1',
              secondary: '#8b5cf6',
              accent: '#f59e0b',
              dark: '#0f172a',
              light: '#f8fafc'
            }
          }
        }
      }
    }
  </script>
  <style>
    * { scroll-behavior: smooth; }
    .gradient-text {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .card-hover:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(99, 102, 241, 0.15);
    }
    .flow-arrow::after {
      content: '→';
      margin: 0 8px;
      color: #6366f1;
    }
    .flow-arrow:last-child::after {
      content: '';
    }
    .nav-link {
      position: relative;
    }
    .nav-link::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 0;
      height: 2px;
      background: linear-gradient(90deg, #6366f1, #8b5cf6);
      transition: width 0.3s ease;
    }
    .nav-link:hover::after {
      width: 100%;
    }
    .module-card {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
    }
    .agent-card {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(249, 115, 22, 0.05) 100%);
    }
  </style>
</head>
<body class="bg-slate-50 font-sans text-slate-800">
  <!-- Navigation -->
  <nav class="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md shadow-sm z-50">
    <div class="max-w-7xl mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div>
            <h1 class="text-lg font-bold text-slate-800">CCG <span class="text-indigo-600">v3.0</span></h1>
            <p class="text-xs text-slate-500">Claude Code Guardian</p>
          </div>
        </div>
        <div class="hidden md:flex items-center gap-6">
          <a href="#overview" class="nav-link text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Overview</a>
          <a href="#modules" class="nav-link text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Modules</a>
          <a href="#agents" class="nav-link text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Agents</a>
          <a href="#usecases" class="nav-link text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Use Cases</a>
          <a href="#latent" class="nav-link text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Latent Mode</a>
          <a href="#workflows" class="nav-link text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Workflows</a>
        </div>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <header class="pt-28 pb-16 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white relative overflow-hidden">
    <div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%239C92AC\" fill-opacity=\"0.05\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
    <div class="max-w-7xl mx-auto px-6 relative">
      <div class="text-center max-w-3xl mx-auto">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-6">
          <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          MCP Server for Claude Code
        </div>
        <h1 class="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          Claude Code <span class="gradient-text">Guardian</span>
        </h1>
        <p class="text-lg text-slate-300 mb-8">
          Persistent memory, code protection, workflow management, and multi-agent coordination for enhanced Claude Code experience
        </p>
        <div class="flex flex-wrap justify-center gap-4">
          <div class="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
            <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            <span>12 Modules</span>
          </div>
          <div class="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
            <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span>11 Agents</span>
          </div>
          <div class="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
            <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <span>70% Token Saving</span>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Architecture Section -->
  <section id="overview" class="py-16 bg-white">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-slate-800 mb-4">Architecture Flow</h2>
        <p class="text-slate-600 max-w-2xl mx-auto">Kiến trúc hệ thống CCG với EventBus làm trung tâm kết nối các modules</p>
      </div>
      
      <div class="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl p-8 border border-slate-200">
        <div class="flex flex-col items-center gap-6">
          <!-- Claude Code -->
          <div class="w-full max-w-md bg-indigo-600 text-white px-6 py-4 rounded-xl text-center font-semibold shadow-lg">
            Claude Code
          </div>
          
          <div class="flex flex-col items-center gap-2">
            <div class="w-0.5 h-8 bg-indigo-300"></div>
            <div class="px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">MCP Protocol (stdio)</div>
            <div class="w-0.5 h-8 bg-indigo-300"></div>
          </div>
          
          <!-- CCG Server -->
          <div class="w-full bg-white rounded-xl border-2 border-indigo-200 p-6 shadow-lg">
            <h3 class="text-lg font-semibold text-center text-slate-800 mb-6">CCG MCP Server</h3>
            
            <!-- EventBus -->
            <div class="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-lg text-center mb-6 font-medium">
              ⚡ EventBus - Central Communication Hub
            </div>
            
            <!-- Modules Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div class="bg-indigo-50 rounded-lg p-4 text-center border border-indigo-200">
                <span class="text-2xl">🧠</span>
                <p class="text-sm font-medium text-slate-700 mt-2">Memory</p>
              </div>
              <div class="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                <span class="text-2xl">🛡️</span>
                <p class="text-sm font-medium text-slate-700 mt-2">Guard</p>
              </div>
              <div class="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                <span class="text-2xl">📋</span>
                <p class="text-sm font-medium text-slate-700 mt-2">Workflow</p>
              </div>
              <div class="bg-amber-50 rounded-lg p-4 text-center border border-amber-200">
                <span class="text-2xl">💡</span>
                <p class="text-sm font-medium text-slate-700 mt-2">Latent</p>
              </div>
            </div>
            
            <!-- Storage -->
            <div class="bg-slate-100 rounded-lg p-4 text-center border border-slate-200">
              <span class="text-lg">📁</span>
              <span class="text-sm font-medium text-slate-600 ml-2">.ccg/ (Data Storage) - memory.json, tasks.json, agents.json</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Modules Section -->
  <section id="modules" class="py-16 bg-slate-50">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-slate-800 mb-4">12 Modules</h2>
        <p class="text-slate-600 max-w-2xl mx-auto">Các module chức năng chính của CCG, mỗi module đảm nhận một nhiệm vụ cụ thể</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Module 1: Memory -->
        <div class="module-card rounded-xl p-6 border border-indigo-100 card-hover transition-all duration-300">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <span class="text-2xl">🧠</span>
            </div>
            <div>
              <h3 class="font-semibold text-slate-800 mb-1">Memory</h3>
              <p class="text-sm text-slate-600 mb-3">Persistent knowledge storage</p>
              <div class="flex flex-wrap gap-2">
                <code class="text-xs bg-slate-100 text-indigo-600 px-2 py-1 rounded">memory_store</code>
                <code class="text-xs bg-slate-100 text-indigo-600 px-2 py-1 rounded">memory_recall</code>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Module 2: Guard -->
        <div class="module-card rounded-xl p-6 border border-indigo-100 card-hover transition-all duration-300">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <span class="text-2xl">🛡️</span>
            </div>
            <div>
              <h3 class="font-semibold text-slate-800 mb-1">Guard</h3>
              <p class="text-sm text-slate-600 mb-3">Code quality & security checks</p>
              <div class="flex flex-wrap gap-2">
                <code class="text-xs bg-slate-100 text-purple-600 px-2 py-1 rounded">guard_validate</code>
                <code class="text-xs bg-slate-100 text-purple-600 px-2 py-1 rounded">guard_check_test</code>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Module 3: Workflow -->
        <div class="module-card rounded-xl p-6 border border-indigo-100 card-hover transition-all duration-300">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span class="text-2xl">📋</span>
            </div>
            <div>
              <h3 class="font-semibold text-slate-800 mb-1">Workflow</h3>
              <p class="text-sm text-slate-600 mb-3">Task & progress management</p>
              <div class="flex flex-wrap gap-2">
                <code class="text-xs bg-slate-100 text-blue-600 px-2 py-1 rounded">workflow_task_*</code>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Module 4: Resource -->
        <div class="module-card rounded-xl p-6 border border-indigo-100 card-hover transition-all duration-300">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <span class="text-2xl">📊</span>
            </div>
            <div>
              <h3 class="font-semibold text-slate-800 mb-1">Resource</h3>
              <p class="text-sm text-slate-600 mb-3">Token usage & checkpoints</p>
              <div class="flex flex-wrap gap-2">
                <code class="text-xs bg-slate-100 text-green-600 px-2 py-1 rounded">resource_*</code>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Module 5: Process -->
        <div class="module-card rounded-xl p-6 border border-indigo-100 card-hover transition-all duration-300">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <span class="text-2xl">⚙️</span>
            </div>
            <div>
              <h3 class="font-semibold text-slate-800 mb-1">Process</h3>
              <p class="text-sm text-slate-600 mb-3">Port & process management</p>
              <div class="flex flex-wrap gap-2">
                <code class="text-xs bg-slate-100 text-orange-600 px-2 py-1 rounded">process_*</code>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Module 6: Testing -->
        <div class="module-card rounded-xl p-6 border border-indigo-100 card-hover transition-all duration-300">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
              <span class="text-2xl">🧪</span>
            </div>
            <div>
              <h3 class="font-semibold text-slate-800 mb-1">Testing</h3>
              <p class="text-sm text-slate-600 mb-3">Test runner & browser automation</p>
              <div class="flex flex-wrap gap-2">
                <code class="text-xs bg-slate-100 text-teal-600 px-2 py-1 rounded">testing_*</code>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Module 7: Documents -->
        <div class="module-card rounded-xl p-6 border border-indigo-100 card-hover transition-all duration-300">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0">
              <span class="text-2xl">📚</span>
            </div>
            <div>
              <h3 class="font-semibold text-slate-800 mb-1">Documents</h3>
              <p class="text-sm text-slate-600 mb-3">Documentation management</p>
              <div class="flex flex-wrap gap-2">
                <code class="text-xs bg-slate-100 text-cyan-600 px-2 py-1 rounded">documents_*</code>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Module 8: Agents -->
        <div class="module-card rounded-xl p-6 border border-indigo-100 card-hover transition-all duration-300">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
              <span class="text-2xl">🤖</span>
            </div>
            <div>
              <h3 class="font-semibold text-slate-800 mb-1">Agents</h3>
              <p class="text-sm text-slate-600 mb-3">Multi-agent coordination</p>
              <div class="flex flex-wrap gap-2">
                <code class="text-xs bg-slate-100 text-violet-600 px-2 py-1 rounded">agents_*</code>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Module 9: Latent -->
        <div class="module-card rounded-xl p-6 border border-indigo-100 card-hover transition-all duration-300">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <span class="text-2xl">💡</span>
            </div>
            <div>
              <h3 class="font-semibold text-slate-800 mb-1">Latent</h3>
              <p class="text-sm text-slate-600 mb-3">Hidden-state reasoning (70% token saving)</p>
              <div class="flex flex-wrap gap-2">
                <code class="text-xs bg-slate-100 text-amber-600 px-2 py-1 rounded">latent_*</code>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Module 10: AutoAgent -->
        <div class="module-card rounded-xl p-6 border border-indigo-100 card-hover transition-all duration-300">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
              <span class="text-2xl">🔄</span>
            </div>
            <div>
              <h3 class="font-semibold text-slate-800 mb-1">AutoAgent</h3>
              <p class="text-sm text-slate-600 mb-3">Task decomposition & auto-fix</p>
              <div class="flex flex-wrap gap-2">
                <code class="text-xs bg-slate-100 text-rose-600 px-2 py-1 rounded">auto_*</code>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Module 11: Thinking -->
        <div class="module-card rounded-xl p-6 border border-indigo-100 card-hover transition-all duration-300">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-fuchsia-100 flex items-center justify-center flex-shrink-0">
              <span class="text-2xl">💭</span>
            </div>
            <div>
              <h3 class="font-semibold text-slate-800 mb-1">Thinking</h3>
              <p class="text-sm text-slate-600 mb-3">Reasoning models & workflows</p>
              <div class="flex flex-wrap gap-2">
                <code class="text-xs bg-slate-100 text-fuchsia-600 px-2 py-1 rounded">thinking_*</code>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Module 12: RAG -->
        <div class="module-card rounded-xl p-6 border border-indigo-100 card-hover transition-all duration-300">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
              <span class="text-2xl">🔍</span>
            </div>
            <div>
              <h3 class="font-semibold text-slate-800 mb-1">RAG</h3>
              <p class="text-sm text-slate-600 mb-3">Semantic code search</p>
              <div class="flex flex-wrap gap-2">
                <code class="text-xs bg-slate-100 text-sky-600 px-2 py-1 rounded">rag_*</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Agents Section -->
  <section id="agents" class="py-16 bg-white">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-slate-800 mb-4">11 Specialized Agents</h2>
        <p class="text-slate-600 max-w-2xl mx-auto">Hệ sinh thái các agent chuyên biệt, mỗi agent được tối ưu cho một lĩnh vực cụ thể</p>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <!-- Agent Cards -->
        <div class="agent-card rounded-xl p-5 border border-amber-100 text-center card-hover transition-all duration-300">
          <div class="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mx-auto mb-3 flex items-center justify-center">
            <span class="text-2xl">📈</span>
          </div>
          <h4 class="font-semibold text-slate-800">Trading Agent</h4>
          <p class="text-xs text-slate-500 mt-1">Quant / Finance</p>
        </div>
        
        <div class="agent-card rounded-xl p-5 border border-amber-100 text-center card-hover transition-all duration-300">
          <div class="w-14 h-14 rounded-full bg-gradient-to-br from-red-400 to-pink-500 mx-auto mb-3 flex items-center justify-center">
            <span class="text-2xl">🐘</span>
          </div>
          <h4 class="font-semibold text-slate-800">Laravel Agent</h4>
          <p class="text-xs text-slate-500 mt-1">PHP / API</p>
        </div>
        
        <div class="agent-card rounded-xl p-5 border border-amber-100 text-center card-hover transition-all duration-300">
          <div class="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 mx-auto mb-3 flex items-center justify-center">
            <span class="text-2xl">⚛️</span>
          </div>
          <h4 class="font-semibold text-slate-800">React Agent</h4>
          <p class="text-xs text-slate-500 mt-1">Frontend</p>
        </div>
        
        <div class="agent-card rounded-xl p-5 border border-amber-100 text-center card-hover transition-all duration-300">
          <div class="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mx-auto mb-3 flex items-center justify-center">
            <span class="text-2xl">🟢</span>
          </div>
          <h4 class="font-semibold text-slate-800">Node Agent</h4>
          <p class="text-xs text-slate-500 mt-1">Backend</p>
        </div>
        
        <div class="agent-card rounded-xl p-5 border border-amber-100 text-center card-hover transition-all duration-300">
          <div class="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 mx-auto mb-3 flex items-center justify-center">
            <span class="text-2xl">🐍</span>
          </div>
          <h4 class="font-semibold text-slate-800">Python Agent</h4>
          <p class="text-xs text-slate-500 mt-1">AI / ML</p>
        </div>
        
        <div class="agent-card rounded-xl p-5 border border-amber-100 text-center card-hover transition-all duration-300">
          <div class="w-14 h-14 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 mx-auto mb-3 flex items-center justify-center">
            <span class="text-2xl">🚀</span>
          </div>
          <h4 class="font-semibold text-slate-800">DevOps Agent</h4>
          <p class="text-xs text-slate-500 mt-1">CI / CD</p>
        </div>
        
        <div class="agent-card rounded-xl p-5 border border-amber-100 text-center card-hover transition-all duration-300">
          <div class="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 mx-auto mb-3 flex items-center justify-center">
            <span class="text-2xl">🗄️</span>
          </div>
          <h4 class="font-semibold text-slate-800">Database Agent</h4>
          <p class="text-xs text-slate-500 mt-1">DBA</p>
        </div>
        
        <div class="agent-card rounded-xl p-5 border border-amber-100 text-center card-hover transition-all duration-300">
          <div class="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-violet-500 mx-auto mb-3 flex items-center justify-center">
            <span class="text-2xl">🔌</span>
          </div>
          <h4 class="font-semibold text-slate-800">MCP Core Agent</h4>
          <p class="text-xs text-slate-500 mt-1">Protocol</p>
        </div>
        
        <div class="agent-card rounded-xl p-5 border border-amber-100 text-center card-hover transition-all duration-300">
          <div class="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 mx-auto mb-3 flex items-center justify-center">
            <span class="text-2xl">🏗️</span>
          </div>
          <h4 class="font-semibold text-slate-800">Module Architect</h4>
          <p class="text-xs text-slate-500 mt-1">Design</p>
        </div>
        
        <div class="agent-card rounded-xl p-5 border border-amber-100 text-center card-hover transition-all duration-300">
          <div class="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 mx-auto mb-3 flex items-center justify-center">
            <span class="text-2xl">🧪</span>
          </div>
          <h4 class="font-semibold text-slate-800">Tester Agent</h4>
          <p class="text-xs text-slate-500 mt-1">QA</p>
        </div>
        
        <div class="agent-card rounded-xl p-5 border border-amber-100 text-center card-hover transition-all duration-300">
          <div class="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 mx-auto mb-3 flex items-center justify-center">
            <span class="text-2xl">🎨</span>
          </div>
          <h4 class="font-semibold text-slate-800">UI/UX Agent</h4>
          <p class="text-xs text-slate-500 mt-1">Design</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Use Cases Section -->
  <section id="usecases" class="py-16 bg-gradient-to-br from-slate-50 to-indigo-50">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-slate-800 mb-4">Use Cases by Domain</h2>
        <p class="text-slate-600 max-w-2xl mx-auto">9 use cases thực tế cho các dự án khác nhau</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Use Case 1 -->
        <div class="bg-white rounded-xl p-6 border border-slate-200 card-hover transition-all duration-300">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <span class="text-xl">📈</span>
            </div>
            <h3 class="font-semibold text-slate-800">Trading/Finance</h3>
          </div>
          <p class="text-sm text-slate-600 mb-4">Build cryptocurrency trading bot with backtesting</p>
          <div class="flex flex-wrap gap-2">
            <span class="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded">trading-agent</span>
            <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">latent_context</span>
            <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">guard_validate</span>
          </div>
        </div>
        
        <!-- Use Case 2 -->
        <div class="bg-white rounded-xl p-6 border border-slate-200 card-hover transition-all duration-300">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <span class="text-xl">🐘</span>
            </div>
            <h3 class="font-semibold text-slate-800">Laravel/PHP API</h3>
          </div>
          <p class="text-sm text-slate-600 mb-4">Build REST API with authentication</p>
          <div class="flex flex-wrap gap-2">
            <span class="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">laravel-agent</span>
            <span class="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">database-agent</span>
            <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">sequential mode</span>
          </div>
        </div>
        
        <!-- Use Case 3 -->
        <div class="bg-white rounded-xl p-6 border border-slate-200 card-hover transition-all duration-300">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
              <span class="text-xl">⚛️</span>
            </div>
            <h3 class="font-semibold text-slate-800">React Frontend</h3>
          </div>
          <p class="text-sm text-slate-600 mb-4">Build responsive dashboard with state management</p>
          <div class="flex flex-wrap gap-2">
            <span class="text-xs bg-cyan-50 text-cyan-700 px-2 py-1 rounded">react-agent</span>
            <span class="text-xs bg-pink-50 text-pink-700 px-2 py-1 rounded">uiux-agent</span>
            <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">review mode</span>
          </div>
        </div>
        
        <!-- Use Case 4 -->
        <div class="bg-white rounded-xl p-6 border border-slate-200 card-hover transition-all duration-300">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <span class="text-xl">🐍</span>
            </div>
            <h3 class="font-semibold text-slate-800">Python/ML</h3>
          </div>
          <p class="text-sm text-slate-600 mb-4">Build ML prediction API with FastAPI</p>
          <div class="flex flex-wrap gap-2">
            <span class="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded">python-agent</span>
            <span class="text-xs bg-slate-50 text-slate-700 px-2 py-1 rounded">devops-agent</span>
            <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">auto_decompose</span>
          </div>
        </div>
        
        <!-- Use Case 5 -->
        <div class="bg-white rounded-xl p-6 border border-slate-200 card-hover transition-all duration-300">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
              <span class="text-xl">🚀</span>
            </div>
            <h3 class="font-semibold text-slate-800">DevOps/Infrastructure</h3>
          </div>
          <p class="text-sm text-slate-600 mb-4">Setup CI/CD pipeline with Kubernetes</p>
          <div class="flex flex-wrap gap-2">
            <span class="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">devops-agent</span>
            <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">process_check</span>
            <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">memory_store</span>
          </div>
        </div>
        
        <!-- Use Case 6 -->
        <div class="bg-white rounded-xl p-6 border border-slate-200 card-hover transition-all duration-300">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <span class="text-xl">🗄️</span>
            </div>
            <h3 class="font-semibold text-slate-800">Database Design</h3>
          </div>
          <p class="text-sm text-slate-600 mb-4">Design optimized PostgreSQL schema</p>
          <div class="flex flex-wrap gap-2">
            <span class="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">database-agent</span>
            <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">latent 4-phase</span>
            <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">1M+ records</span>
          </div>
        </div>
        
        <!-- Use Case 7 -->
        <div class="bg-white rounded-xl p-6 border border-slate-200 card-hover transition-all duration-300">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <span class="text-xl">🔌</span>
            </div>
            <h3 class="font-semibold text-slate-800">MCP Server Dev</h3>
          </div>
          <p class="text-sm text-slate-600 mb-4">Build custom MCP tools with JSON-RPC</p>
          <div class="flex flex-wrap gap-2">
            <span class="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">mcp-core-agent</span>
            <span class="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">module-architect</span>
          </div>
        </div>
        
        <!-- Use Case 8 -->
        <div class="bg-white rounded-xl p-6 border border-slate-200 card-hover transition-all duration-300">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
              <span class="text-xl">🧪</span>
            </div>
            <h3 class="font-semibold text-slate-800">Testing & QA</h3>
          </div>
          <p class="text-sm text-slate-600 mb-4">Comprehensive test suite implementation</p>
          <div class="flex flex-wrap gap-2">
            <span class="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded">tester-agent</span>
            <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">E2E Playwright</span>
            <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">guard_check_test</span>
          </div>
        </div>
        
        <!-- Use Case 9 -->
        <div class="bg-white rounded-xl p-6 border border-slate-200 card-hover transition-all duration-300">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
              <span class="text-xl">🎨</span>
            </div>
            <h3 class="font-semibold text-slate-800">UI/UX Design</h3>
          </div>
          <p class="text-sm text-slate-600 mb-4">Implement design system with accessibility</p>
          <div class="flex flex-wrap gap-2">
            <span class="text-xs bg-pink-50 text-pink-700 px-2 py-1 rounded">uiux-agent</span>
            <span class="text-xs bg-cyan-50 text-cyan-700 px-2 py-1 rounded">react-agent</span>
            <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">parallel mode</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Latent Chain Mode Section -->
  <section id="latent" class="py-16 bg-white">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-slate-800 mb-4">Latent Chain Mode</h2>
        <p class="text-slate-600 max-w-2xl mx-auto">Workflow 4 phase tiết kiệm 70-80% token so với cách tiếp cận truyền thống</p>
      </div>
      
      <!-- 4-Phase Flow -->
      <div class="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-8 mb-10 border border-indigo-100">
        <div class="flex flex-wrap justify-center items-center gap-4 md:gap-8">
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 rounded-xl bg-indigo-500 text-white flex items-center justify-center text-2xl mb-2">🔍</div>
            <span class="font-semibold text-slate-800">Analysis</span>
            <span class="text-xs text-slate-500 text-center mt-1">Read code<br/>Find issues</span>
          </div>
          
          <svg class="w-8 h-8 text-indigo-300 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
          
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 rounded-xl bg-purple-500 text-white flex items-center justify-center text-2xl mb-2">📋</div>
            <span class="font-semibold text-slate-800">Plan</span>
            <span class="text-xs text-slate-500 text-center mt-1">Design patches<br/>Order changes</span>
          </div>
          
          <svg class="w-8 h-8 text-purple-300 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
          
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 rounded-xl bg-pink-500 text-white flex items-center justify-center text-2xl mb-2">🔧</div>
            <span class="font-semibold text-slate-800">Implement</span>
            <span class="text-xs text-slate-500 text-center mt-1">Apply patches<br/>Track artifacts</span>
          </div>
          
          <svg class="w-8 h-8 text-pink-300 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
          
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 rounded-xl bg-green-500 text-white flex items-center justify-center text-2xl mb-2">✅</div>
            <span class="font-semibold text-slate-800">Review</span>
            <span class="text-xs text-slate-500 text-center mt-1">Run tests<br/>Validate</span>
          </div>
        </div>
        
        <!-- Token Savings Badge -->
        <div class="mt-8 flex justify-center">
          <div class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full font-semibold shadow-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            Token Savings: 70-80%
          </div>
        </div>
      </div>
      
      <!-- Quick Commands -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <code class="text-lg font-mono text-indigo-600 font-semibold">/latent-fix</code>
          <p class="text-sm text-slate-600 mt-2">Quick bug fix</p>
          <div class="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <span class="flow-arrow">analysis</span>
            <span class="flow-arrow">impl</span>
            <span>review</span>
          </div>
        </div>
        
        <div class="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <code class="text-lg font-mono text-purple-600 font-semibold">/latent-feature</code>
          <p class="text-sm text-slate-600 mt-2">New feature</p>
          <div class="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <span>all 4 phases</span>
          </div>
        </div>
        
        <div class="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <code class="text-lg font-mono text-pink-600 font-semibold">/latent-review</code>
          <p class="text-sm text-slate-600 mt-2">Code review</p>
          <div class="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <span class="flow-arrow">analysis</span>
            <span>review</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Multi-Agent Coordination Section -->
  <section class="py-16 bg-slate-50">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-slate-800 mb-4">Multi-Agent Coordination</h2>
        <p class="text-slate-600 max-w-2xl mx-auto">3 chế độ phối hợp giữa các agents</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Sequential Mode -->
        <div class="bg-white rounded-xl p-6 border border-slate-200">
          <h3 class="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">→</span>
            Sequential Mode
          </h3>
          <div class="flex items-center justify-center gap-2 py-6">
            <div class="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700">A</div>
            <svg class="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
            <div class="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700">B</div>
            <svg class="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
            <div class="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700">C</div>
          </div>
          <p class="text-sm text-slate-600 text-center">Output của agent trước là input cho agent sau</p>
        </div>
        
        <!-- Parallel Mode -->
        <div class="bg-white rounded-xl p-6 border border-slate-200">
          <h3 class="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">⇉</span>
            Parallel Mode
          </h3>
          <div class="flex flex-col items-center py-4">
            <div class="flex items-center gap-4 mb-2">
              <div class="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-sm font-medium text-green-700">A</div>
            </div>
            <div class="flex items-center gap-4 mb-2">
              <div class="w-16 h-0.5 bg-green-200 -rotate-45"></div>
              <div class="w-16 h-0.5 bg-green-200"></div>
              <div class="w-16 h-0.5 bg-green-200 rotate-45"></div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-xs font-medium text-green-700">B</div>
              <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-xs font-medium text-green-700">C</div>
              <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-xs font-medium text-green-700">D</div>
            </div>
          </div>
          <p class="text-sm text-slate-600 text-center">Các agents chạy song song, merge kết quả</p>
        </div>
        
        <!-- Review Mode -->
        <div class="bg-white rounded-xl p-6 border border-slate-200">
          <h3 class="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">✓</span>
            Review Mode
          </h3>
          <div class="flex items-center justify-center gap-2 py-6">
            <div class="flex flex-col items-center">
              <div class="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-sm font-medium text-purple-700">A</div>
              <span class="text-xs text-slate-500 mt-1">Implement</span>
            </div>
            <svg class="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
            <div class="flex flex-col items-center">
              <div class="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-sm font-medium text-purple-700">B</div>
              <span class="text-xs text-slate-500 mt-1">Review</span>
            </div>
            <svg class="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
            <div class="flex flex-col items-center">
              <div class="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-sm font-medium text-purple-700">C</div>
              <span class="text-xs text-slate-500 mt-1">Approve</span>
            </div>
          </div>
          <p class="text-sm text-slate-600 text-center">Quy trình review và phê duyệt</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Common Workflows Section -->
  <section id="workflows" class="py-16 bg-white">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-slate-800 mb-4">Common Workflows</h2>
        <p class="text-slate-600 max-w-2xl mx-auto">5 workflow phổ biến trong quá trình phát triển</p>
      </div>
      
      <div class="space-y-4">
        <!-- Workflow 1 -->
        <div class="bg-gradient-to-r from-indigo-50 to-white rounded-xl p-5 border border-indigo-100">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold">1</div>
            <div class="flex-1">
              <h4 class="font-semibold text-slate-800">Session Start</h4>
              <code class="text-sm text-indigo-600 font-mono">session_init → memory_recall → workflow_task_list</code>
            </div>
          </div>
        </div>
        
        <!-- Workflow 2 -->
        <div class="bg-gradient-to-r from-purple-50 to-white rounded-xl p-5 border border-purple-100">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">2</div>
            <div class="flex-1">
              <h4 class="font-semibold text-slate-800">Feature Development</h4>
              <code class="text-sm text-purple-600 font-mono">workflow_task_create → agents_select → latent_context_create → [4 phases] → guard_validate → testing_run → memory_store</code>
            </div>
          </div>
        </div>
        
        <!-- Workflow 3 -->
        <div class="bg-gradient-to-r from-pink-50 to-white rounded-xl p-5 border border-pink-100">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold">3</div>
            <div class="flex-1">
              <h4 class="font-semibold text-slate-800">Bug Fix (Quick)</h4>
              <code class="text-sm text-pink-600 font-mono">/latent-fix → [auto analysis] → [apply patch] → testing_run</code>
            </div>
          </div>
        </div>
        
        <!-- Workflow 4 -->
        <div class="bg-gradient-to-r from-amber-50 to-white rounded-xl p-5 border border-amber-100">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold">4</div>
            <div class="flex-1">
              <h4 class="font-semibold text-slate-800">Code Review</h4>
              <code class="text-sm text-amber-600 font-mono">/latent-review → agents_coordinate(mode: review) → guard_validate</code>
            </div>
          </div>
        </div>
        
        <!-- Workflow 5 -->
        <div class="bg-gradient-to-r from-green-50 to-white rounded-xl p-5 border border-green-100">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">5</div>
            <div class="flex-1">
              <h4 class="font-semibold text-slate-800">Session End</h4>
              <code class="text-sm text-green-600 font-mono">workflow_task_pause → memory_store → session_end</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Best Practices & Troubleshooting -->
  <section class="py-16 bg-slate-50">
    <div class="max-w-7xl mx-auto px-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Best Practices -->
        <div>
          <h2 class="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
            <span class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">✅</span>
            Best Practices
          </h2>
          <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="divide-y divide-slate-100">
              <div class="flex gap-4 p-4">
                <span class="text-green-500 font-bold">DO</span>
                <span class="text-slate-700">Use <code class="text-indigo-600">agents_select</code> for task matching</span>
              </div>
              <div class="flex gap-4 p-4">
                <span class="text-green-500 font-bold">DO</span>
                <span class="text-slate-700">Send delta only in Latent Mode</span>
              </div>
              <div class="flex gap-4 p-4">
                <span class="text-green-500 font-bold">DO</span>
                <span class="text-slate-700">Create checkpoints before risky ops</span>
              </div>
              <div class="flex gap-4 p-4">
                <span class="text-green-500 font-bold">DO</span>
                <span class="text-slate-700">Run <code class="text-indigo-600">guard_validate</code> before commit</span>
              </div>
              <div class="flex gap-4 p-4">
                <span class="text-green-500 font-bold">DO</span>
                <span class="text-slate-700">Store important decisions in memory</span>
              </div>
              <div class="flex gap-4 p-4 bg-red-50">
                <span class="text-red-500 font-bold">DON'T</span>
                <span class="text-slate-700">Hardcode agent selection</span>
              </div>
              <div class="flex gap-4 p-4 bg-red-50">
                <span class="text-red-500 font-bold">DON'T</span>
                <span class="text-slate-700">Send full context every time</span>
              </div>
              <div class="flex gap-4 p-4 bg-red-50">
                <span class="text-red-500 font-bold">DON'T</span>
                <span class="text-slate-700">Skip phases or ignore security warnings</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Troubleshooting -->
        <div>
          <h2 class="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
            <span class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">🔧</span>
            Troubleshooting
          </h2>
          <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="divide-y divide-slate-100">
              <div class="p-4">
                <div class="text-slate-800 font-medium">Agent not found</div>
                <div class="text-sm text-slate-600 mt-1">→ Run <code class="text-indigo-600">agents_reload</code> to refresh</div>
              </div>
              <div class="p-4">
                <div class="text-slate-800 font-medium">Latent context lost</div>
                <div class="text-sm text-slate-600 mt-1">→ Run <code class="text-indigo-600">latent_list_contexts</code> to check</div>
              </div>
              <div class="p-4">
                <div class="text-slate-800 font-medium">Memory not persisting</div>
                <div class="text-sm text-slate-600 mt-1">→ Check <code class="text-indigo-600">.ccg/</code> directory permissions</div>
              </div>
              <div class="p-4">
                <div class="text-slate-800 font-medium">Port conflict</div>
                <div class="text-sm text-slate-600 mt-1">→ Run <code class="text-indigo-600">process_kill_on_port</code></div>
              </div>
              <div class="p-4">
                <div class="text-slate-800 font-medium">Tests failing</div>
                <div class="text-sm text-slate-600 mt-1">→ Check <code class="text-indigo-600">testing_browser_logs</code> for errors</div>
              </div>
              <div class="p-4">
                <div class="text-slate-800 font-medium">Guard blocking</div>
                <div class="text-sm text-slate-600 mt-1">→ Fix issues, don't disable rules</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-10 bg-slate-900 text-white">
    <div class="max-w-7xl mx-auto px-6 text-center">
      <div class="flex items-center justify-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
        </div>
        <span class="text-xl font-bold">CCG v3.0</span>
      </div>
      <p class="text-slate-400 text-sm">Claude Code Guardian - Enhance your Claude Code experience</p>
      <p class="text-slate-500 text-xs mt-4">Generated by CCG v3.0</p>
    </div>
  </footer>
</body>
</html>