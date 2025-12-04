'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          <span className="logo-icon">🛡️</span>
          <span className="logo-text">Code Guardian Studio</span>
        </Link>

        <nav className="nav">
          <Link
            href="/case-study"
            className={`nav-link ${pathname === '/case-study' ? 'active' : ''}`}
          >
            Case Study
          </Link>
          <Link
            href="/partners"
            className={`nav-link ${pathname === '/partners' ? 'active' : ''}`}
          >
            Partners
          </Link>
          <a
            href="https://github.com/phuongrealmax/claude-code-guardian"
            className="nav-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <Link href="/#pricing" className="btn btn-primary btn-sm">
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  )
}
