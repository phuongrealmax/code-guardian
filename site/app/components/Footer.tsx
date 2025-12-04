import Link from 'next/link'

export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '48px',
          marginBottom: '48px'
        }}>
          {/* Brand Column */}
          <div>
            <div className="footer-brand" style={{marginBottom: '16px'}}>
              <span className="logo-icon">🛡️</span>
              <strong>Code Guardian Studio</strong>
            </div>
            <p className="footer-tagline" style={{fontSize: '0.875rem', lineHeight: 1.6}}>
              AI-powered code refactor engine for large repositories, built on Claude Code + MCP.
            </p>
            {/* Social Links */}
            <div style={{display: 'flex', gap: '16px', marginTop: '16px', fontSize: '1.25rem'}}>
              <a href="https://github.com/phuongrealmax/claude-code-guardian" target="_blank" rel="noopener noreferrer" title="GitHub" style={{opacity: 0.7, transition: 'opacity 0.2s'}}>
                <span>⚙️</span>
              </a>
              <a href="https://npmjs.com/package/codeguardian-studio" target="_blank" rel="noopener noreferrer" title="npm" style={{opacity: 0.7, transition: 'opacity 0.2s'}}>
                <span>📦</span>
              </a>
              <a href="https://twitter.com/codeguardianstudio" target="_blank" rel="noopener noreferrer" title="Twitter" style={{opacity: 0.7, transition: 'opacity 0.2s'}}>
                <span>🐦</span>
              </a>
              <a href="mailto:hello@codeguardian.studio" title="Email" style={{opacity: 0.7, transition: 'opacity 0.2s'}}>
                <span>✉️</span>
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h4 style={{marginBottom: '16px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)'}}>Product</h4>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem'}}>
              <Link href="/#features">Features</Link>
              <Link href="/#pricing">Pricing</Link>
              <Link href="/case-study">Case Study</Link>
              <a href="https://github.com/phuongrealmax/claude-code-guardian" target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href="https://npmjs.com/package/codeguardian-studio" target="_blank" rel="noopener noreferrer">npm Package</a>
            </div>
          </div>

          {/* Resources Column */}
          <div>
            <h4 style={{marginBottom: '16px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)'}}>Resources</h4>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem'}}>
              <a href="https://github.com/phuongrealmax/claude-code-guardian#readme" target="_blank" rel="noopener noreferrer">Documentation</a>
              <a href="https://github.com/phuongrealmax/claude-code-guardian/issues" target="_blank" rel="noopener noreferrer">Support</a>
              <Link href="/partners">Partner Program</Link>
              <a href="https://github.com/phuongrealmax/claude-code-guardian/blob/master/CHANGELOG.md" target="_blank" rel="noopener noreferrer">Changelog</a>
            </div>
          </div>

          {/* Legal Column */}
          <div>
            <h4 style={{marginBottom: '16px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)'}}>Legal</h4>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem'}}>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/refund">Refund Policy</Link>
              <a href="mailto:hello@codeguardian.studio">Contact Support</a>
            </div>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '0.875rem',
          opacity: 0.7
        }}>
          <p className="footer-copy" style={{margin: 0}}>
            © 2025 Code Guardian Studio. Built with Claude. Protected by Guardian.
          </p>
          <div style={{display: 'flex', gap: '16px'}}>
            <span>🛡️ Built on Claude</span>
            <span>📦 Open Source</span>
            <span>🔒 GDPR Ready</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
