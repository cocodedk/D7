import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useTournaments } from '../hooks/useTournaments'
import ResultsTable from '../components/ResultsTable'

interface TournamentResults {
  [playerId: string]: {
    plusRemainder: number
    minusRemainder: number
    plusClusters: number
    minusClusters: number
    netScore: number
  }
}

export default function ResultsPage() {
  const { tournaments } = useTournaments()
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null)
  const [results, setResults] = useState<TournamentResults | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedTournamentId) {
      loadResults(selectedTournamentId)
    }
  }, [selectedTournamentId])

  const loadResults = async (tournamentId: string) => {
    setLoading(true)
    try {
      const data = await api.get<TournamentResults>(`/tournaments/${tournamentId}/results`)
      setResults(data)
    } catch (error) {
      console.error('Failed to load results:', error)
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Results</h1>

      <div className="card">
        <label htmlFor="tournament-select" className="block text-sm font-medium mb-2">
          Select Tournament
        </label>
        <select
          id="tournament-select"
          value={selectedTournamentId || ''}
          onChange={(e) => setSelectedTournamentId(e.target.value || null)}
          className="input"
        >
          <option value="">-- Select Tournament --</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.state})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading results...</div>
      ) : results && selectedTournamentId ? (
        <ResultsTable
          results={results}
          tournamentId={selectedTournamentId}
        />
      ) : (
        <div className="card text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">
            Select a tournament to view results
          </p>
        </div>
      )}
    </div>
  )
}
