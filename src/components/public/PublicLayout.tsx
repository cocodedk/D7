import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import '../../styles/public.css'

interface PublicLayoutProps {
  children: ReactNode
  showBackButton?: boolean
  backTo?: string
  backLabel?: string
}

export default function PublicLayout({
  children,
  showBackButton = false,
  backTo = '/public',
  backLabel = '← Back to Results',
}: PublicLayoutProps) {
  return (
    <div className="public-page">
      {showBackButton && (
        <nav className="public-nav">
          <Link to={backTo}>{backLabel}</Link>
          <div style={{ color: 'var(--gold)' }}>D7 Tournament Results</div>
        </nav>
      )}
      {children}
      <footer className="public-footer">
        <div className="footer-content">
          <p className="footer-text">
            Built with <span style={{ display: 'inline-block', animation: 'rotate 3s infinite linear' }}>☕</span> and competitive spirit in Denmark
          </p>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
            <strong>Babak Bandpey</strong> — <a href="https://cocode.dk" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', textDecoration: 'none' }}>cocode.dk</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
