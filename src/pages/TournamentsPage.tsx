import { useState } from 'react'
import { useTournaments } from '../hooks/useTournaments'
import TournamentCard from '../components/TournamentCard'
import TournamentForm from '../components/TournamentForm'

export default function TournamentsPage() {
  const {
    tournaments,
    activeTournament,
    loading,
    error,
    createTournament,
    startTournament,
    closeTournament,
  } = useTournaments()
  const [showForm, setShowForm] = useState(false)

  if (loading) {
    return <div className="p-4 text-center">Loading tournaments...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tournaments</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
          disabled={!!activeTournament}
        >
          New Tournament
        </button>
      </div>

      {activeTournament && (
        <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <p className="font-semibold text-green-800 dark:text-green-200">
            Active: {activeTournament.name}
          </p>
        </div>
      )}

      {tournaments.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No tournaments yet. Create your first tournament.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              isActive={activeTournament?.id === tournament.id}
              onStart={() => startTournament(tournament.id)}
              onClose={(confirmation) => closeTournament(tournament.id, confirmation)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <TournamentForm
          onSave={async (name) => {
            await createTournament(name)
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
