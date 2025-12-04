import Link from 'next/link'

export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-brand">
          <span className="logo-icon">🛡️</span>
          <strong>Code Guardian Studio</strong>
        </div>
        <p className="footer-tagline">
          AI-powered code refactor engine for large repositories, built on Claude Code + MCP.
        </p>
        <div className="footer-links">
          <Link href="/">Home</Link>
          <Link href="/case-study">Case Study</Link>
          <Link href="/partners">Partners</Link>
          <Link href="/#pricing">Pricing</Link>
          <a href="https://github.com/phuongrealmax/claude-code-guardian" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://npmjs.com/package/codeguardian-studio" target="_blank" rel="noopener noreferrer">npm</a>
        </div>
        <div className="footer-links" style={{ marginTop: '8px', opacity: 0.8 }}>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/refund">Refund Policy</Link>
          <a href="mailto:hello@codeguardian.studio">Contact</a>
        </div>
        <p className="footer-copy">
          © 2025 Code Guardian Studio. Built with Claude. Protected by Guardian.
        </p>
      </div>
    </footer>
  )
}
