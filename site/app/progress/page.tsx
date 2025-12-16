'use client'

import { useEffect, useState, useCallback } from 'react'
import Footer from '../components/Footer'

// Types matching the API response
interface ProgressSnapshot {
  workflowId?: string
  activeGraphId?: string
  nodeStates: Record<string, string>
  lastBlocked?: {
    nodeId: string
    reason: string
    missingEvidence?: string[]
    nextToolCalls?: string[]
  }
  summary: {
    total: number
    done: number
    running: number
    blocked: number
    pending: number
    failed: number
    skipped: number
  }
  blockerCount?: number
  nextSteps?: string[]
}

interface Blocker {
  nodeId: string
  reason: string
  priority: number
  missingEvidence?: string[]
  nextToolCalls?: string[]
}

const API_BASE = process.env.NEXT_PUBLIC_CCG_API_URL || 'http://localhost:3334'

export default function ProgressPage() {
  const [status, setStatus] = useState<ProgressSnapshot | null>(null)
  const [blockers, setBlockers] = useState<Blocker[]>([])
  const [mermaid, setMermaid] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/progress/status`)
      const data = await res.json()
      if (data.success) {
        setStatus(data.data)
        setError(null)
        setLastUpdate(new Date())
      }
    } catch (e) {
      setError('Failed to fetch progress status')
    }
  }, [])

  const fetchBlockers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/progress/blockers`)
      const data = await res.json()
      if (data.success) {
        setBlockers(data.data.blockers || [])
      }
    } catch (e) {
      // Silently fail for blockers
    }
  }, [])

  const fetchMermaid = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/progress/mermaid?direction=TD&showGateBadges=true`)
      const data = await res.json()
      if (data.success && data.data.mermaid) {
        setMermaid(data.data.mermaid)
      } else {
        setMermaid(null)
      }
    } catch (e) {
      setMermaid(null)
    }
  }, [])

  // WebSocket for real-time updates
  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimer: NodeJS.Timeout

    const connect = () => {
      const wsUrl = API_BASE.replace('http', 'ws')
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        setConnected(true)
        setError(null)
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.event === 'progress:updated') {
            // Refetch on progress update
            fetchStatus()
            fetchBlockers()
            fetchMermaid()
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      ws.onclose = () => {
        setConnected(false)
        // Reconnect after 3 seconds
        reconnectTimer = setTimeout(connect, 3000)
      }

      ws.onerror = () => {
        setConnected(false)
      }
    }

    connect()

    // Initial fetch
    fetchStatus()
    fetchBlockers()
    fetchMermaid()

    // Poll every 5 seconds as fallback
    const pollInterval = setInterval(() => {
      fetchStatus()
      fetchBlockers()
      fetchMermaid()
    }, 5000)

    return () => {
      if (ws) ws.close()
      clearTimeout(reconnectTimer)
      clearInterval(pollInterval)
    }
  }, [fetchStatus, fetchBlockers, fetchMermaid])

  const clearProgress = async () => {
    try {
      await fetch(`${API_BASE}/api/progress/clear`, { method: 'POST' })
      fetchStatus()
      fetchBlockers()
      fetchMermaid()
    } catch (e) {
      setError('Failed to clear progress')
    }
  }

  return (
    <main>
      {/* Header */}
      <section className="hero" style={{ paddingBottom: '2rem' }}>
        <div className="container">
          <span className="badge">
            Live Progress Dashboard
          </span>
          <h1>Workflow Progress</h1>
          <p>Real-time view of CCG workflow execution</p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '1rem' }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '16px',
              background: connected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: connected ? '#22c55e' : '#ef4444',
              fontSize: '0.875rem'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: connected ? '#22c55e' : '#ef4444'
              }} />
              {connected ? 'Connected' : 'Disconnected'}
            </span>
            {lastUpdate && (
              <span style={{ fontSize: '0.875rem', opacity: 0.6 }}>
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Error Banner */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          padding: '12px 24px',
          textAlign: 'center',
          color: '#ef4444'
        }}>
          {error}
        </div>
      )}

      {/* Summary Stats */}
      {status?.summary && (
        <section style={{ padding: '2rem 0' }}>
          <div className="container">
            <div className="stats" style={{ marginBottom: '2rem' }}>
              <div className="stat">
                <div className="stat-value" style={{ color: '#22c55e' }}>{status.summary.done}</div>
                <div className="stat-label">Done</div>
              </div>
              <div className="stat">
                <div className="stat-value" style={{ color: '#3b82f6' }}>{status.summary.running}</div>
                <div className="stat-label">Running</div>
              </div>
              <div className="stat">
                <div className="stat-value" style={{ color: '#f59e0b' }}>{status.summary.blocked}</div>
                <div className="stat-label">Blocked</div>
              </div>
              <div className="stat">
                <div className="stat-value" style={{ color: '#ef4444' }}>{status.summary.failed}</div>
                <div className="stat-label">Failed</div>
              </div>
              <div className="stat">
                <div className="stat-value">{status.summary.total}</div>
                <div className="stat-label">Total</div>
              </div>
            </div>

            {/* Active Workflow */}
            {status.workflowId && (
              <div style={{
                textAlign: 'center',
                padding: '12px',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <span style={{ opacity: 0.7 }}>Active Workflow: </span>
                <strong>{status.workflowId}</strong>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Blockers Section */}
      {blockers.length > 0 && (
        <section style={{ padding: '2rem 0', background: 'rgba(239, 68, 68, 0.05)' }}>
          <div className="container">
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              Blockers ({blockers.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '800px', margin: '0 auto' }}>
              {blockers.map((blocker) => (
                <div key={blocker.nodeId} style={{
                  padding: '16px',
                  background: 'var(--bg-card)',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ color: '#ef4444' }}>#{blocker.priority} {blocker.nodeId}</strong>
                    {blocker.nextToolCalls && blocker.nextToolCalls.length > 0 && (
                      <span style={{
                        padding: '2px 8px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        Next: {blocker.nextToolCalls.join(', ')}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, opacity: 0.8 }}>{blocker.reason}</p>
                  {blocker.missingEvidence && blocker.missingEvidence.length > 0 && (
                    <p style={{ margin: '8px 0 0', fontSize: '0.875rem', opacity: 0.6 }}>
                      Missing: {blocker.missingEvidence.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mermaid Diagram Section */}
      {mermaid && (
        <section style={{ padding: '2rem 0' }}>
          <div className="container">
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Workflow Graph</h2>
            <div style={{
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '12px',
              overflow: 'auto',
              maxHeight: '500px'
            }}>
              <pre style={{
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                margin: 0,
                whiteSpace: 'pre-wrap'
              }}>
                {mermaid}
              </pre>
            </div>
            <p style={{ textAlign: 'center', marginTop: '12px', opacity: 0.6, fontSize: '0.875rem' }}>
              Copy the diagram above into{' '}
              <a href="https://mermaid.live" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                mermaid.live
              </a>
              {' '}to render
            </p>
          </div>
        </section>
      )}

      {/* Node States */}
      {status && Object.keys(status.nodeStates).length > 0 && (
        <section style={{ padding: '2rem 0' }}>
          <div className="container">
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Node States</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px',
              maxWidth: '1000px',
              margin: '0 auto'
            }}>
              {Object.entries(status.nodeStates).map(([nodeId, state]) => (
                <div key={nodeId} style={{
                  padding: '12px',
                  background: 'var(--bg-card)',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${getStateColor(state)}`
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{nodeId}</div>
                  <div style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    background: `${getStateColor(state)}20`,
                    color: getStateColor(state)
                  }}>
                    {state}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Next Steps */}
      {status?.nextSteps && status.nextSteps.length > 0 && (
        <section style={{ padding: '2rem 0', background: 'rgba(59, 130, 246, 0.05)' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }}>Suggested Next Steps</h3>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {status.nextSteps.map((step) => (
                <span key={step} style={{
                  padding: '8px 16px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  borderRadius: '8px',
                  fontFamily: 'monospace'
                }}>
                  {step}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Actions */}
      <section style={{ padding: '2rem 0', textAlign: 'center' }}>
        <div className="container">
          <button
            onClick={clearProgress}
            style={{
              padding: '12px 24px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Clear Progress
          </button>
        </div>
      </section>

      <Footer />
    </main>
  )
}

function getStateColor(state: string): string {
  switch (state) {
    case 'done': return '#22c55e'
    case 'running': return '#3b82f6'
    case 'blocked': return '#f59e0b'
    case 'failed': return '#ef4444'
    case 'skipped': return '#6b7280'
    case 'pending': return '#94a3b8'
    default: return '#94a3b8'
  }
}
