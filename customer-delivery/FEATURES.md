# CCG Features & Modules

## 1. Session Module

Manage CCG sessions with persistence and state tracking.

### Tools
| Tool | Description |
|------|-------------|
| `session_init` | Initialize session, load memory |
| `session_end` | End session, save all data |
| `session_status` | Get current session status |

---

## 2. Memory Module

Persistent memory storage with SQLite backend.

### Statistics
- **Total Memories**: 34
- **Database**: `.ccg/memory.db`
- **Max Capacity**: 100 memories

### Memory Types
| Type | Description |
|------|-------------|
| `decision` | Choices made during development |
| `fact` | Learned information |
| `code_pattern` | Reusable code patterns |
| `error` | Mistakes to avoid |
| `note` | General notes |
| `convention` | Project rules |
| `architecture` | System design decisions |

### Tools
| Tool | Description |
|------|-------------|
| `memory_store` | Store new memory |
| `memory_recall` | Search memories |
| `memory_forget` | Delete a memory |
| `memory_summary` | Get memory statistics |
| `memory_list` | List all memories |

---

## 3. Guard Module

Code quality and security validation.

### Statistics
- **Rules Enabled**: 10/10
- **Strict Mode**: ON
- **Categories**: Security, Quality, Testing, Convention

### Rules by Category

#### Security (6 rules)
| Rule | Description |
|------|-------------|
| `sql-injection` | Detect SQL injection vulnerabilities |
| `xss-vulnerability` | Detect XSS vulnerabilities |
| `command-injection` | Detect command injection |
| `path-traversal` | Detect path traversal attacks |
| `prompt-injection` | Detect prompt injection |
| `hardcoded-secrets` | Detect hardcoded secrets |

#### Quality (2 rules)
| Rule | Description |
|------|-------------|
| `empty-catch` | Detect empty catch blocks |
| `disabled-feature` | Detect disabled features |

#### Testing (1 rule)
| Rule | Description |
|------|-------------|
| `fake-test` | Detect tests without assertions |

#### Convention (1 rule)
| Rule | Description |
|------|-------------|
| `emoji-code` | Detect emojis in code |

### Tools
| Tool | Description |
|------|-------------|
| `guard_validate` | Validate code |
| `guard_check_test` | Check test file quality |
| `guard_rules` | List all rules |
| `guard_toggle_rule` | Enable/disable rule |
| `guard_status` | Get guard status |

---

## 4. Workflow Module

Task and project management.

### Statistics
- **Pending**: 0
- **In Progress**: 0
- **Completed Today**: 1

### Task Priorities
- `low` | `medium` | `high` | `critical`

### Task Statuses
- `pending` | `in_progress` | `paused` | `blocked` | `completed` | `failed`

### Tools
| Tool | Description |
|------|-------------|
| `workflow_task_create` | Create task |
| `workflow_task_start` | Start task |
| `workflow_task_update` | Update progress |
| `workflow_task_complete` | Mark complete |
| `workflow_task_pause` | Pause task |
| `workflow_task_fail` | Mark failed |
| `workflow_task_note` | Add note |
| `workflow_task_list` | List tasks |
| `workflow_task_delete` | Delete task |
| `workflow_current` | Get current task |
| `workflow_status` | Get workflow status |
| `workflow_cleanup` | Clean old tasks |

---

## 5. Agents Module

Specialized AI agents for different domains.

### Statistics
- **Active Agents**: 11
- **Agent Selection**: Automatic based on task

### Tools
| Tool | Description |
|------|-------------|
| `agents_list` | List all agents |
| `agents_get` | Get agent details |
| `agents_select` | Select best agent for task |
| `agents_register` | Register new agent |
| `agents_coordinate` | Coordinate multiple agents |
| `agents_reload` | Reload from AGENTS.md |
| `agents_status` | Get agents status |

---

## 6. Latent Chain Module

Efficient context management with delta updates.

### Statistics
- **Active Contexts**: 3
- **Total Created**: 3
- **Deltas Merged**: 4
- **Avg Tokens Saved**: 667

### Phases
1. **Analysis** - Understand the problem
2. **Plan** - Design solution
3. **Impl** - Implement changes
4. **Review** - Verify results

### Tools
| Tool | Description |
|------|-------------|
| `latent_context_create` | Create context |
| `latent_context_get` | Get context |
| `latent_context_update` | Update with delta |
| `latent_phase_transition` | Change phase |
| `latent_apply_patch` | Apply code patch |
| `latent_validate_response` | Validate response |
| `latent_complete_task` | Complete task |
| `latent_list_contexts` | List contexts |
| `latent_delete_context` | Delete context |
| `latent_step_log` | Log reasoning step |
| `latent_status` | Get module status |

---

## 7. Thinking Module

Structured reasoning models and workflows.

### Statistics
- **Models**: 6
- **Workflows**: 8

### Thinking Models
| Model | Use Case |
|-------|----------|
| Chain-of-Thought | Step-by-step debugging |
| Tree of Thoughts | Comparing approaches |
| ReAct | Exploration & experimentation |
| Self-Consistency | Verification |
| Decomposition | Breaking down complex tasks |
| First Principles | Novel problems |

### Standard Workflows
| Workflow | Trigger Keywords |
|----------|-----------------|
| Pre-Commit | commit, push, git add |
| Code Review | review, PR review |
| Refactoring | refactor, clean up |
| Deploy | deploy, release, production |
| Bug Fix | fix bug, debug |
| Feature Dev | new feature, implement |
| Security Audit | security, audit, vulnerability |
| Code Optimization | optimize, hotspots, technical debt |

### Tools
| Tool | Description |
|------|-------------|
| `thinking_get_model` | Get thinking model |
| `thinking_suggest_model` | Suggest best model |
| `thinking_list_models` | List all models |
| `thinking_get_workflow` | Get workflow/SOP |
| `thinking_suggest_workflow` | Suggest workflow |
| `thinking_list_workflows` | List workflows |
| `thinking_save_snippet` | Save code snippet |
| `thinking_get_style` | Get style references |
| `thinking_list_snippets` | List saved snippets |

---

## 8. AutoAgent Module

Automatic task management and error recovery.

### Components
| Component | Status | Description |
|-----------|--------|-------------|
| Decomposer | Enabled | Break complex tasks into subtasks |
| Router | Enabled | 13 routing rules for tool selection |
| FixLoop | Enabled | Automatic error recovery |
| ErrorMemory | Enabled | Learn from past fixes |

### Tools
| Tool | Description |
|------|-------------|
| `auto_decompose_task` | Decompose complex task |
| `auto_analyze_complexity` | Analyze task complexity |
| `auto_route_tools` | Suggest tools for action |
| `auto_fix_loop` | Start auto-fix loop |
| `auto_fix_status` | Get fix loop status |
| `auto_store_error` | Store error fix |
| `auto_recall_errors` | Recall similar errors |
| `auto_agent_status` | Get module status |

---

## 9. Documents Module

Document registry and management.

### Statistics
- **Registered Documents**: 45
- **Types**: readme, spec, api, guide, changelog, architecture, config

### Tools
| Tool | Description |
|------|-------------|
| `documents_search` | Search documents |
| `documents_find_by_type` | Find by type |
| `documents_should_update` | Check if update needed |
| `documents_update` | Update document |
| `documents_create` | Create document |
| `documents_register` | Register existing |
| `documents_scan` | Scan project |
| `documents_list` | List all |
| `documents_status` | Get status |

---

## 10. RAG Module

Semantic code search with embeddings.

### Tools
| Tool | Description |
|------|-------------|
| `rag_build_index` | Build/rebuild index |
| `rag_query` | Semantic search |
| `rag_related_code` | Find similar code |
| `rag_status` | Get index status |
| `rag_clear_index` | Clear index |
| `rag_get_chunk` | Get code chunk |

---

## 11. Resource Module

Token tracking and checkpoints.

### Statistics
- **Checkpoints**: 7

### Tools
| Tool | Description |
|------|-------------|
| `resource_status` | Get token usage |
| `resource_update_tokens` | Update tracking |
| `resource_estimate_task` | Estimate tokens |
| `resource_checkpoint_create` | Create checkpoint |
| `resource_checkpoint_list` | List checkpoints |
| `resource_checkpoint_restore` | Restore checkpoint |
| `resource_checkpoint_delete` | Delete checkpoint |

---

## 12. Process Module

Process and port management.

### Tools
| Tool | Description |
|------|-------------|
| `process_check_port` | Check port status |
| `process_check_all_ports` | Check all ports |
| `process_kill_on_port` | Kill process on port |
| `process_kill` | Kill by PID |
| `process_spawn` | Spawn process |
| `process_list` | List processes |
| `process_cleanup` | Cleanup all |
| `process_status` | Get status |

---

## 13. Testing Module

Browser automation and test running.

### Tools
| Tool | Description |
|------|-------------|
| `testing_run` | Run tests |
| `testing_run_affected` | Run affected tests |
| `testing_browser_open` | Open browser session |
| `testing_browser_screenshot` | Take screenshot |
| `testing_browser_logs` | Get console logs |
| `testing_browser_network` | Get network requests |
| `testing_browser_errors` | Get errors |
| `testing_browser_close` | Close session |
| `testing_cleanup` | Cleanup test data |
| `testing_status` | Get status |

---

## 14. Code Optimizer Module

> NEW in v3.1 - Analyze and optimize large codebases

### Overview
The Code Optimizer module provides comprehensive tools for repository analysis, code metrics calculation, hotspot detection, and refactoring plan generation.

### Statistics
- **Scoring Strategies**: size, complexity, mixed (recommended)
- **Phases**: analysis → plan → impl → review
- **Integration**: Latent Chain, Guard, Memory

### Tools
| Tool | Description |
|------|-------------|
| `code_scan_repository` | Scan repository structure and statistics |
| `code_metrics` | Calculate code metrics (LOC, complexity, nesting) |
| `code_hotspots` | Detect code hotspots for prioritization |
| `code_refactor_plan` | Generate Latent-compatible refactor plans |
| `code_record_optimization` | Record completed optimization sessions |
| `code_quick_analysis` | Quick scan + metrics + hotspots in one call |
| `code_optimizer_status` | Get module status |

### Metrics Calculated
| Metric | Description |
|--------|-------------|
| Lines | Total, code, comments, blank |
| Nesting Depth | Maximum nesting level |
| Branch Keywords | if, switch, for, while, catch, ternary |
| TODO/FIXME | Technical debt indicators |
| Complexity Score | Weighted composite score |

### Hotspot Scoring Strategies
| Strategy | Weight Distribution |
|----------|---------------------|
| `size` | Prioritize large files by line count |
| `complexity` | Prioritize high nesting, branching |
| `mixed` | 25% size, 30% complexity, 20% nesting, 15% branching, 10% debt |

### Refactoring Goals
| Goal | Focus Area |
|------|------------|
| `readability` | Improve code clarity and maintainability |
| `performance` | Optimize for speed |
| `architecture` | Restructure modules and dependencies |
| `testing` | Improve test coverage |
| `mixed` | General improvement |
