import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import PublicLayout from '../components/public/PublicLayout'
import PublicHero from '../components/public/PublicHero'
import TournamentCard from '../components/public/TournamentCard'
import '../styles/public.css'

interface Tournament {
  id: string
  date: string
  state: 'closed'
}

export default function PublicLandingPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTournaments()
  }, [])

  const loadTournaments = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.public.get<Tournament[]>('/public-tournaments')
      setTournaments(data)
    } catch (err) {
      console.error('Failed to load tournaments:', err)
      setError(err instanceof Error ? err.message : 'Failed to load tournaments')
    } finally {
      setLoading(false)
    }
  }

  // Get unique years from tournaments
  const years = [...new Set(tournaments.map((t) => new Date(t.date).getFullYear()))].sort(
    (a, b) => b - a
  )

  return (
    <PublicLayout>
      <PublicHero
        title="D7"
        subtitle="Tournament Results"
        tagline="View the legends in action"
      />

      <section className="public-section" style={{ background: 'var(--white)' }}>
        <div className="public-container">
          <h2 className="section-title">📅 Tournaments</h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>Loading tournaments...</div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--card-red)' }}>
              Error: {error}
            </div>
          ) : tournaments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
              No tournaments available yet
            </div>
          ) : (
            <div className="tournaments-grid">
              {tournaments.map((tournament) => (
                <TournamentCard key={tournament.id} id={tournament.id} date={tournament.date} />
              ))}
            </div>
          )}
        </div>
      </section>

      {years.length > 0 && (
        <section className="public-section" style={{ background: 'var(--cream)' }}>
          <div className="public-container">
            <h2 className="section-title">📊 Yearly Results</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: '2rem' }}>
              View aggregated results for each year
            </p>
            <div className="year-selector">
              {years.map((year) => (
                <Link key={year} to={`/public/results/yearly/${year}`} className="year-button">
                  {year}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  )
}
