import { useState } from 'react'
import { usePlayers } from '../hooks/usePlayers'
import PlayerCard from '../components/PlayerCard'
import PlayerForm from '../components/PlayerForm'

export default function PlayersPage() {
  const { players, loading, error, createPlayer, updatePlayer, deletePlayer } = usePlayers()
  const [showForm, setShowForm] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null)

  if (loading) {
    return <div className="p-4 text-center">Loading players...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Players</h1>
        <button
          onClick={() => {
            setEditingPlayer(null)
            setShowForm(true)
          }}
          className="btn btn-primary"
        >
          Add Player
        </button>
      </div>

      {players.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No players yet. Add your first player to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onEdit={() => {
                setEditingPlayer(player.id)
                setShowForm(true)
              }}
              onDelete={() => {
                if (confirm(`Delete ${player.name}?`)) {
                  deletePlayer(player.id)
                }
              }}
            />
          ))}
        </div>
      )}

      {showForm && (
        <PlayerForm
          player={editingPlayer ? players.find((p) => p.id === editingPlayer) : undefined}
          onSave={async (data) => {
            if (editingPlayer) {
              await updatePlayer(editingPlayer, data)
            } else {
              await createPlayer(data)
            }
            setShowForm(false)
            setEditingPlayer(null)
          }}
          onCancel={() => {
            setShowForm(false)
            setEditingPlayer(null)
          }}
        />
      )}
    </div>
  )
}
