import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { logout } = useAuth()

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/players', label: 'Players', icon: '👥' },
    { path: '/tournaments', label: 'Tournaments', icon: '🏆' },
    { path: '/game', label: 'Game', icon: '🎮' },
    { path: '/results', label: 'Results', icon: '📊' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">D7 Card Game</h1>
          <button
            onClick={logout}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex-1 py-3 text-center ${
                  isActive
                    ? 'text-primary-light dark:text-primary-dark font-semibold'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <div className="text-xl mb-1">{item.icon}</div>
                <div className="text-xs">{item.label}</div>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
