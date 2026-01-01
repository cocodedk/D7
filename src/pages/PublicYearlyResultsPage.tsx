import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'

interface YearlyResults {
  year: number
  scores: Array<{
    playerId: string
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
  }>
}

export default function PublicYearlyResultsPage() {
  const { year } = useParams<{ year: string }>()
  const [results, setResults] = useState<YearlyResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (year) {
      loadResults(year)
    }
  }, [year])

  const loadResults = async (yearStr: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.public.get<YearlyResults>(`/results/yearly/${yearStr}`)
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

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">No results found</div>
        </div>
      </div>
    )
  }

  const sortedScores = [...results.scores].sort((a, b) => b.netScore - a.netScore)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-8">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h1 className="text-xl font-bold">Yearly Results - {results.year}</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4">
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-4">Player</th>
                <th className="text-right py-2 px-4">+ Clusters</th>
                <th className="text-right py-2 px-4">- Clusters</th>
                <th className="text-right py-2 px-4">+ Remainder</th>
                <th className="text-right py-2 px-4">- Remainder</th>
                <th className="text-right py-2 px-4 font-bold">Net Score</th>
              </tr>
            </thead>
            <tbody>
              {sortedScores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-600 dark:text-gray-400">
                    No results yet
                  </td>
                </tr>
              ) : (
                sortedScores.map((score) => (
                  <tr
                    key={score.playerId}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="py-3 px-4">
                      {score.player ? (
                        <div className="flex items-center gap-2">
                          {score.player.avatar && (
                            <img
                              src={`data:image/jpeg;base64,${score.player.avatar}`}
                              alt={score.player.nickname}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium">{score.player.nickname}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {score.player.name}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-600 dark:text-gray-400">Unknown Player</div>
                      )}
                    </td>
                    <td className="text-right py-3 px-4 text-green-600 dark:text-green-400">
                      {score.plusClusters}
                    </td>
                    <td className="text-right py-3 px-4 text-red-600 dark:text-red-400">
                      {score.minusClusters}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">
                      {score.plusRemainder}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">
                      {score.minusRemainder}
                    </td>
                    <td className="text-right py-3 px-4 font-bold">
                      {score.netScore > 0 ? (
                        <span className="text-green-600 dark:text-green-400">
                          +{score.netScore}
                        </span>
                      ) : score.netScore < 0 ? (
                        <span className="text-red-600 dark:text-red-400">{score.netScore}</span>
                      ) : (
                        <span className="text-gray-600 dark:text-gray-400">0</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
