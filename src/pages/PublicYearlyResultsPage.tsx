import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import PublicLayout from '../components/public/PublicLayout'
import PublicHero from '../components/public/PublicHero'
import PlayerLeaderboardCard from '../components/public/PlayerLeaderboardCard'
import '../styles/public.css'

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
      <PublicLayout showBackButton backTo="/public">
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Loading results...</div>
          </div>
        </div>
      </PublicLayout>
    )
  }

  if (error) {
    return (
      <PublicLayout showBackButton backTo="/public">
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--card-red)' }}>
              Error
            </div>
            <div style={{ color: 'var(--text-light)' }}>{error}</div>
          </div>
        </div>
      </PublicLayout>
    )
  }

  if (!results) {
    return (
      <PublicLayout showBackButton backTo="/public">
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>No results found</div>
          </div>
        </div>
      </PublicLayout>
    )
  }

  const sortedScores = [...results.scores].sort((a, b) => b.netScore - a.netScore)

  return (
    <PublicLayout showBackButton backTo="/public" backLabel="← Back to Results">
      <PublicHero title={results.year.toString()} subtitle="Yearly Results" tagline="Season aggregate scores" />
      <section className="public-section" style={{ background: 'var(--white)' }}>
        <div className="public-container">
          {sortedScores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
              No results available for {results.year}
            </div>
          ) : (
            <div className="leaderboard-grid">
              {sortedScores.map((score, index) => (
                <PlayerLeaderboardCard
                  key={score.playerId}
                  player={score.player}
                  score={{
                    plusRemainder: score.plusRemainder,
                    minusRemainder: score.minusRemainder,
                    plusClusters: score.plusClusters,
                    minusClusters: score.minusClusters,
                    netScore: score.netScore,
                  }}
                  rank={index + 1}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  )
}
