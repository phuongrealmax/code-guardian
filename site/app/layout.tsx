import './globals.css'
import Header from './components/Header'

export const metadata = {
  title: 'Code Guardian Studio — AI-Powered Code Refactor Engine',
  description: 'Turn Claude Code into a refactor engine for large repositories. Scan repos, find hotspots, generate optimization reports. Built on Claude Code + MCP.',
  keywords: 'code refactoring, AI code analysis, Claude Code, MCP, code optimization, technical debt',
  authors: [{ name: 'Code Guardian Studio' }],
  openGraph: {
    title: 'Code Guardian Studio',
    description: 'AI-powered code refactor engine for large repositories',
    url: 'https://codeguardian.studio',
    siteName: 'Code Guardian Studio',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Code Guardian Studio',
    description: 'AI-powered code refactor engine for large repositories',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  )
}
