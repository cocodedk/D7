import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTournaments } from '../hooks/useTournaments'
import UndoNotification from '../components/UndoNotification'

export default function DashboardPage() {
  const { activeTournament, loading } = useTournaments()
  const [lastSavedGameId, setLastSavedGameId] = useState<string | null>(null)

  useEffect(() => {
    // Check for recently saved game
    const gameId = sessionStorage.getItem('lastSavedGameId')
    const savedTime = sessionStorage.getItem('lastSavedGameTime')

    if (gameId && savedTime) {
      const age = (Date.now() - parseInt(savedTime)) / 1000
      if (age < 60) {
        setLastSavedGameId(gameId)
        // Clear after remaining time
        setTimeout(() => {
          setLastSavedGameId(null)
          sessionStorage.removeItem('lastSavedGameId')
          sessionStorage.removeItem('lastSavedGameTime')
        }, (60 - age) * 1000)
      } else {
        // Already expired
        sessionStorage.removeItem('lastSavedGameId')
        sessionStorage.removeItem('lastSavedGameTime')
      }
    }
  }, [])

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : activeTournament ? (
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">Active Tournament</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{activeTournament.name}</p>
          <Link
            to="/game"
            className="btn btn-primary inline-block"
          >
            Record Game
          </Link>
        </div>
      ) : (
        <div className="card">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No active tournament. Create one to start recording games.
          </p>
          <Link
            to="/tournaments"
            className="btn btn-primary inline-block"
          >
            Manage Tournaments
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Link
          to="/players"
          className="card hover:shadow-lg transition-shadow"
        >
          <h2 className="font-semibold mb-2">Players</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage players
          </p>
        </Link>
        <Link
          to="/tournaments"
          className="card hover:shadow-lg transition-shadow"
        >
          <h2 className="font-semibold mb-2">Tournaments</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage tournaments
          </p>
        </Link>
        <Link
          to="/results"
          className="card hover:shadow-lg transition-shadow"
        >
          <h2 className="font-semibold mb-2">Results</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            View scores
          </p>
        </Link>
        <Link
          to="/settings"
          className="card hover:shadow-lg transition-shadow"
        >
          <h2 className="font-semibold mb-2">Settings</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            App settings
          </p>
        </Link>
      </div>

      {lastSavedGameId && (
        <UndoNotification
          gameId={lastSavedGameId}
          onUndo={() => {
            setLastSavedGameId(null)
            sessionStorage.removeItem('lastSavedGameId')
            sessionStorage.removeItem('lastSavedGameTime')
            // Refresh to update data
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
