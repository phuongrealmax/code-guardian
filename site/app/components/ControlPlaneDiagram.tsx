'use client'

export default function ControlPlaneDiagram() {
  return (
    <div style={{
      maxWidth: '500px',
      margin: '0 auto',
      padding: '40px 20px'
    }}>
      {/* AI Agent Box */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.4)',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center',
        marginBottom: '0'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '8px'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          <span style={{fontWeight: 600, fontSize: '1.1rem'}}>AI Coding Agent</span>
        </div>
        <span style={{opacity: 0.7, fontSize: '0.85rem'}}>Claude / Cursor / Copilot / MCP Agent</span>
      </div>

      {/* Arrow Down */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 0'
      }}>
        <div style={{
          width: '2px',
          height: '20px',
          background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.6) 0%, rgba(16, 185, 129, 0.6) 100%)'
        }}/>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{opacity: 0.6}}>
          <path d="M12 5v14M5 12l7 7 7-7"/>
        </svg>
      </div>

      {/* CCG Box - The Main Focus */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%)',
        border: '2px solid rgba(16, 185, 129, 0.6)',
        borderRadius: '16px',
        padding: '24px',
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 0 40px rgba(16, 185, 129, 0.15)'
      }}>
        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          top: '-1px',
          left: '-1px',
          right: '-1px',
          bottom: '-1px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, transparent 50%)',
          pointerEvents: 'none'
        }}/>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '16px',
          position: 'relative'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span style={{fontWeight: 700, fontSize: '1.3rem', color: '#10b981'}}>Code Guardian</span>
        </div>

        {/* Features list */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          textAlign: 'left',
          paddingLeft: '20px',
          position: 'relative'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span style={{fontSize: '0.9rem'}}>Policy Engine</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span style={{fontSize: '0.9rem'}}>Guard Rails</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span style={{fontSize: '0.9rem'}}>Risk Analysis</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span style={{fontSize: '0.9rem'}}>Human Approval Gates</span>
          </div>
        </div>
      </div>

      {/* Arrow Down */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 0'
      }}>
        <div style={{
          width: '2px',
          height: '20px',
          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.6) 0%, rgba(59, 130, 246, 0.6) 100%)'
        }}/>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{opacity: 0.6}}>
          <path d="M12 5v14M5 12l7 7 7-7"/>
        </svg>
      </div>

      {/* Repository Box */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.4)',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '8px'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <span style={{fontWeight: 600, fontSize: '1.1rem'}}>Your Repository</span>
        </div>
        <span style={{opacity: 0.7, fontSize: '0.85rem'}}>Protected & Controlled</span>
      </div>

      {/* Caption */}
      <p style={{
        textAlign: 'center',
        marginTop: '24px',
        fontSize: '0.85rem',
        opacity: 0.6,
        fontStyle: 'italic'
      }}>
        CCG acts as a control plane between AI agents and your code
      </p>
    </div>
  )
}
