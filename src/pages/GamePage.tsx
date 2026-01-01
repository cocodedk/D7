import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTournaments } from '../hooks/useTournaments'
import { useGames } from '../hooks/useGames'
import { usePlayers } from '../hooks/usePlayers'
import type { ScoreEvent } from '../lib/scoring'
import { calculatePlayerScore } from '../lib/scoring'
import ConfirmationScreen from '../components/ConfirmationScreen'

export default function GamePage() {
  const { activeTournament } = useTournaments()
  const { players } = usePlayers()
  const { createGame } = useGames()
  const navigate = useNavigate()

  const [events, setEvents] = useState<ScoreEvent[]>([])
  const [showConfirmation, setShowConfirmation] = useState(false)

  if (!activeTournament) {
    return (
      <div className="p-4">
        <div className="card">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No active tournament. Please start a tournament first.
          </p>
        </div>
      </div>
    )
  }

  const tournamentPlayers = players.filter((p) => true) // All players for now

  const handleTap = (playerId: string, type: 'I' | 'X') => {
    setEvents((prev) => [...prev, { playerId, type }])
  }

  const handleClear = () => {
    if (confirm('Clear all events?')) {
      setEvents([])
    }
  }

  const handleSave = () => {
    if (events.length === 0) {
      alert('No events to save')
      return
    }
    setShowConfirmation(true)
  }

  const handleConfirm = async (comment?: string, photo?: string) => {
    try {
      const game = await createGame({
        tournamentId: activeTournament.id,
        events,
        comment,
        photo,
      })
      setEvents([])
      setShowConfirmation(false)
      // Store game ID in sessionStorage for undo notification on dashboard
      sessionStorage.setItem('lastSavedGameId', game.id)
      sessionStorage.setItem('lastSavedGameTime', Date.now().toString())
      navigate('/')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save game')
    }
  }

  if (showConfirmation) {
    return (
      <ConfirmationScreen
        tournament={activeTournament}
        events={events}
        players={players}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirmation(false)}
      />
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Record Game</h1>
        <button onClick={handleClear} className="btn btn-secondary">
          Clear
        </button>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2">{activeTournament.name}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Tap I or X for each player
        </p>
      </div>

      <div className="space-y-4">
        {tournamentPlayers.map((player) => {
          const playerEvents = events.filter((e) => e.playerId === player.id)
          const score = calculatePlayerScore(playerEvents)

          return (
            <div key={player.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {player.avatar && (
                    <img
                      src={`data:image/jpeg;base64,${player.avatar}`}
                      alt={player.nickname}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <div className="font-semibold">{player.nickname}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {player.name}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Net: {score.netScore}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    +{score.plusRemainder} / -{score.minusRemainder}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleTap(player.id, 'I')}
                  className="flex-1 btn bg-accent-plus text-white hover:opacity-90 active:opacity-80 text-lg font-bold"
                >
                  I ({playerEvents.filter((e) => e.type === 'I').length})
                </button>
                <button
                  onClick={() => handleTap(player.id, 'X')}
                  className="flex-1 btn bg-accent-minus text-white hover:opacity-90 active:opacity-80 text-lg font-bold"
                >
                  X ({playerEvents.filter((e) => e.type === 'X').length})
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={events.length === 0}
        className="btn btn-primary w-full text-lg"
      >
        Save Game ({events.length} events)
      </button>
    </div>
  )
}
