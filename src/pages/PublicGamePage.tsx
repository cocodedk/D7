import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'

interface Game {
  id: string
  tournament_id: string
  comment: string | null
  photo: string | null
  created_at: string
  events: Array<{
    id: string
    playerId: string
    type: 'I' | 'X'
    created_at: string
    player: {
      id: string
      name: string
      nickname: string
      avatar: string | null
    } | null
  }>
}

export default function PublicGamePage() {
  const { id } = useParams<{ id: string }>()
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadGame(id)
    }
  }, [id])

  const loadGame = async (gameId: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.public.get<Game>(`/games/${gameId}`)
      setGame(data)
    } catch (err) {
      console.error('Failed to load game:', err)
      setError(err instanceof Error ? err.message : 'Failed to load game')
      setGame(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Loading game...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2 text-red-600 dark:text-red-400">Error</div>
          <div className="text-gray-600 dark:text-gray-400">{error}</div>
        </div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Game not found</div>
        </div>
      </div>
    )
  }

  const eventCounts = game.events.reduce(
    (acc, event) => {
      if (!acc[event.playerId]) {
        acc[event.playerId] = { I: 0, X: 0, player: event.player }
      }
      acc[event.playerId][event.type]++
      return acc
    },
    {} as Record<
      string,
      { I: number; X: number; player: { id: string; name: string; nickname: string; avatar: string | null } | null }
    >
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-8">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h1 className="text-xl font-bold">Game Details</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4 space-y-4">
        <div className="card">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {new Date(game.created_at).toLocaleString()}
          </div>
          {game.comment && (
            <div className="mb-2">
              <div className="text-sm font-semibold mb-1">Comment:</div>
              <div className="text-gray-700 dark:text-gray-300">{game.comment}</div>
            </div>
          )}
          {game.photo && (
            <div className="mt-4">
              <img
                src={`data:image/jpeg;base64,${game.photo}`}
                alt="Game photo"
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Score Events</h2>
          <div className="space-y-3">
            {Object.entries(eventCounts).map(([playerId, counts]) => (
              <div key={playerId} className="border-b border-gray-200 dark:border-gray-700 pb-3">
                {counts.player ? (
                  <div className="flex items-center gap-3 mb-2">
                    {counts.player.avatar && (
                      <img
                        src={`data:image/jpeg;base64,${counts.player.avatar}`}
                        alt={counts.player.nickname}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <div className="font-semibold">{counts.player.nickname}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {counts.player.name}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="font-semibold mb-2">Unknown Player</div>
                )}
                <div className="flex gap-4 text-sm">
                  <div className="text-green-600 dark:text-green-400">
                    I: {counts.I}
                  </div>
                  <div className="text-red-600 dark:text-red-400">
                    X: {counts.X}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Event Timeline</h2>
          <div className="space-y-2">
            {game.events.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 text-sm border-b border-gray-200 dark:border-gray-700 pb-2"
              >
                <span className="text-gray-500 dark:text-gray-400">
                  {new Date(event.created_at).toLocaleTimeString()}
                </span>
                {event.player ? (
                  <span className="font-medium">{event.player.nickname}</span>
                ) : (
                  <span className="font-medium">Unknown Player</span>
                )}
                <span
                  className={`font-bold ${
                    event.type === 'I'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {event.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
