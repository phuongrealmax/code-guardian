'use client'

import { useEffect, useState } from 'react'

export default function SafetyFlowDiagram() {
  const [stats, setStats] = useState({
    analyzed: 0,
    blocked: 0,
    approved: 0
  })

  // Animated counter effect
  useEffect(() => {
    const targets = { analyzed: 1247, blocked: 23, approved: 1224 }
    const duration = 2000
    const steps = 60
    const interval = duration / steps

    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = step / steps
      setStats({
        analyzed: Math.floor(targets.analyzed * progress),
        blocked: Math.floor(targets.blocked * progress),
        approved: Math.floor(targets.approved * progress)
      })
      if (step >= steps) clearInterval(timer)
    }, interval)

    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px'
    }}>
      {/* Stats Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '40px',
        marginBottom: '40px',
        flexWrap: 'wrap'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {stats.analyzed.toLocaleString()}
          </div>
          <div style={{ opacity: 0.6, fontSize: '0.85rem' }}>Actions Analyzed</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#ff6b6b'
          }}>
            {stats.blocked}
          </div>
          <div style={{ opacity: 0.6, fontSize: '0.85rem' }}>Dangerous Blocked</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#51cf66'
          }}>
            {stats.approved.toLocaleString()}
          </div>
          <div style={{ opacity: 0.6, fontSize: '0.85rem' }}>Safe Approved</div>
        </div>
      </div>

      {/* Flow Diagram */}
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        gap: '0',
        flexWrap: 'wrap'
      }}>
        {/* AI Request */}
        <div style={{
          flex: '1',
          minWidth: '150px',
          maxWidth: '200px',
          padding: '20px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '12px 0 0 12px',
          textAlign: 'center'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.8, marginBottom: '8px' }}>
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>AI Request</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Edit, Delete, Refactor</div>
        </div>

        {/* Arrow */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          background: 'rgba(255,255,255,0.03)'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.4 }}>
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>

        {/* CCG Safety Gate */}
        <div style={{
          flex: '1.5',
          minWidth: '200px',
          maxWidth: '280px',
          padding: '20px',
          background: 'rgba(255,255,255,0.08)',
          border: '2px solid rgba(255,255,255,0.3)',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--background, #0a0a0a)',
            padding: '2px 12px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.2)',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.5px',
            opacity: 0.8
          }}>
            SAFETY GATE
          </div>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '8px' }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px' }}>Code Guardian</div>

          {/* Checks */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '0.8rem',
            textAlign: 'left',
            padding: '12px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#51cf66' }}>✓</span>
              <span style={{ opacity: 0.8 }}>Policy Check</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#51cf66' }}>✓</span>
              <span style={{ opacity: 0.8 }}>Risk Analysis</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#51cf66' }}>✓</span>
              <span style={{ opacity: 0.8 }}>Guard Rails</span>
            </div>
          </div>
        </div>

        {/* Split Arrow */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 8px',
          background: 'rgba(255,255,255,0.03)',
          gap: '20px'
        }}>
          {/* Blocked path */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </div>
          {/* Approved path */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#51cf66" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </div>

        {/* Results Column */}
        <div style={{
          flex: '1',
          minWidth: '150px',
          maxWidth: '200px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Blocked */}
          <div style={{
            padding: '16px',
            background: 'rgba(255,107,107,0.1)',
            border: '1px solid rgba(255,107,107,0.3)',
            borderRadius: '0 12px 0 0',
            textAlign: 'center'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2" style={{ marginBottom: '4px' }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
            <div style={{ fontWeight: 600, color: '#ff6b6b', fontSize: '0.9rem' }}>BLOCKED</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '4px' }}>
              Mass deletes<br/>Breaking changes
            </div>
          </div>

          {/* Approved */}
          <div style={{
            padding: '16px',
            background: 'rgba(81,207,102,0.1)',
            border: '1px solid rgba(81,207,102,0.3)',
            borderRadius: '0 0 12px 0',
            textAlign: 'center'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#51cf66" strokeWidth="2" style={{ marginBottom: '4px' }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <div style={{ fontWeight: 600, color: '#51cf66', fontSize: '0.9rem' }}>APPROVED</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '4px' }}>
              Safe edits<br/>Verified changes
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Message */}
      <div style={{
        textAlign: 'center',
        marginTop: '32px',
        padding: '16px 24px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <span style={{ opacity: 0.7 }}>Every AI action passes through CCG before reaching your code.</span>
        <br/>
        <span style={{ fontWeight: 600 }}>You stay in control.</span>
      </div>
    </div>
  )
}
