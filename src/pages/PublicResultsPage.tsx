import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import PublicLayout from '../components/public/PublicLayout'
import PublicHero from '../components/public/PublicHero'
import PlayerLeaderboardCard from '../components/public/PlayerLeaderboardCard'
import '../styles/public.css'

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
  const [tournamentDate, setTournamentDate] = useState<string | null>(null)

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

      // Try to get tournament date for display
      try {
        const tournaments = await api.public.get<Array<{ id: string; date: string }>>('/public-tournaments')
        const tournament = tournaments.find((t) => t.id === id)
        if (tournament) {
          setTournamentDate(tournament.date)
        }
      } catch {
        // Ignore if we can't get the date
      }
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

  if (!results || !tournamentId) {
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

  // Convert results to sorted array
  const sortedResults = Object.entries(results)
    .map(([playerId, score]) => ({
      playerId,
      player: score.player,
      score: {
        plusRemainder: score.plusRemainder,
        minusRemainder: score.minusRemainder,
        plusClusters: score.plusClusters,
        minusClusters: score.minusClusters,
        netScore: score.netScore,
      },
    }))
    .sort((a, b) => b.score.netScore - a.score.netScore)

  const formattedDate = tournamentDate
    ? new Date(tournamentDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Tournament'

  return (
    <PublicLayout showBackButton backTo="/public" backLabel="← Back to Results">
      <PublicHero title={formattedDate} subtitle="Tournament Results" />
      <section className="public-section" style={{ background: 'var(--white)' }}>
        <div className="public-container">
          {sortedResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
              No results available for this tournament
            </div>
          ) : (
            <div className="leaderboard-grid">
              {sortedResults.map((result, index) => (
                <PlayerLeaderboardCard
                  key={result.playerId}
                  player={result.player}
                  score={result.score}
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
