import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import ResultsTable from '../components/ResultsTable'

interface TournamentResults {
  [playerId: string]: {
    plusRemainder: number
    minusRemainder: number
    plusClusters: number
    minusClusters: number
    netScore: number
    player: {
      id: string
      name: string
      nickname: string
      avatar: string | null
    } | null
  }
}

export default function PublicResultsPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const [results, setResults] = useState<TournamentResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (tournamentId) {
      loadResults(tournamentId)
    }
  }, [tournamentId])

  const loadResults = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.public.get<TournamentResults>(`/tournaments/${id}/results`)
      setResults(data)
    } catch (err) {
      console.error('Failed to load results:', err)
      setError(err instanceof Error ? err.message : 'Failed to load results')
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Loading results...</div>
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

  if (!results || !tournamentId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">No results found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-8">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h1 className="text-xl font-bold">Tournament Results</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4">
        <ResultsTable results={results} tournamentId={tournamentId} />
      </main>
    </div>
  )
}
