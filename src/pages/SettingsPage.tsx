import { useTheme } from '../hooks/useTheme'

export default function SettingsPage() {
  const { theme, toggleTheme, setTheme } = useTheme()

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Theme</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="theme"
              value="light"
              checked={theme === 'light'}
              onChange={() => setTheme('light')}
              className="w-5 h-5"
            />
            <span>Light</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={theme === 'dark'}
              onChange={() => setTheme('dark')}
              className="w-5 h-5"
            />
            <span>Dark</span>
          </label>
          <button onClick={toggleTheme} className="btn btn-secondary mt-2">
            Toggle Theme
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-2">About</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          D7 Card Game Scoring System v1.0
        </p>
      </div>
    </div>
  )
}
