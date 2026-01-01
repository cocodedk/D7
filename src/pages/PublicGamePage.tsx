import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import PublicLayout from '../components/public/PublicLayout'
import PublicHero from '../components/public/PublicHero'
import '../styles/public.css'

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
  const [tournamentDate, setTournamentDate] = useState<string | null>(null)

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

      // Try to get tournament date for back navigation
      try {
        const tournaments = await api.public.get<Array<{ id: string; date: string }>>('/public-tournaments')
        const tournament = tournaments.find((t) => t.id === data.tournament_id)
        if (tournament) {
          setTournamentDate(tournament.date)
        }
      } catch {
        // Ignore if we can't get the date
      }
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
      <PublicLayout showBackButton backTo="/public">
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Loading game...</div>
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

  if (!game) {
    return (
      <PublicLayout showBackButton backTo="/public">
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Game not found</div>
          </div>
        </div>
      </PublicLayout>
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

  const gameDate = new Date(game.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const backTo = tournamentDate ? `/public/results/${game.tournament_id}` : '/public'

  return (
    <PublicLayout showBackButton backTo={backTo} backLabel="← Back to Tournament">
      <PublicHero title="Game Details" subtitle={gameDate} />
      <section className="public-section" style={{ background: 'var(--white)' }}>
        <div className="public-container">
          <div className="game-details-card">
            {game.comment && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--felt-green)' }}>
                  Comment:
                </div>
                <div style={{ color: 'var(--text-dark)', lineHeight: '1.6' }}>{game.comment}</div>
              </div>
            )}
            {game.photo && (
              <div style={{ marginTop: '1rem' }}>
                <img
                  src={`data:image/jpeg;base64,${game.photo}`}
                  alt="Game photo"
                  className="game-photo"
                />
              </div>
            )}
          </div>

          <div className="game-details-card">
            <h2 style={{ fontFamily: "'Bangers', cursive", fontSize: '1.75rem', color: 'var(--felt-green)', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>
              Score Events
            </h2>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {Object.entries(eventCounts).map(([playerId, counts]) => (
                <div
                  key={playerId}
                  style={{
                    padding: '1.5rem',
                    background: 'var(--cream)',
                    borderRadius: '10px',
                    border: '2px solid var(--felt-green)',
                  }}
                >
                  {counts.player ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      {counts.player.avatar && (
                        <img
                          src={`data:image/jpeg;base64,${counts.player.avatar}`}
                          alt={counts.player.nickname}
                          style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--felt-green)' }}
                        />
                      )}
                      <div>
                        <div style={{ fontFamily: "'Bangers', cursive", fontSize: '1.5rem', color: 'var(--felt-green)', letterSpacing: '0.05em' }}>
                          {counts.player.nickname}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                          {counts.player.name}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontFamily: "'Bangers', cursive", fontSize: '1.5rem', color: 'var(--felt-green)', marginBottom: '1rem', letterSpacing: '0.05em' }}>
                      Unknown Player
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '2rem', fontSize: '1.25rem', fontWeight: 700 }}>
                    <div style={{ color: 'var(--card-red)' }}>
                      I: {counts.I}
                    </div>
                    <div style={{ color: 'var(--card-black)' }}>
                      X: {counts.X}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="event-timeline">
            <h2 style={{ fontFamily: "'Bangers', cursive", fontSize: '1.75rem', color: 'var(--felt-green)', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>
              Event Timeline
            </h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {game.events.map((event) => (
                <div
                  key={event.id}
                  className="event-item"
                >
                  <span style={{ color: 'var(--text-light)', fontSize: '0.875rem', minWidth: '100px' }}>
                    {new Date(event.created_at).toLocaleTimeString()}
                  </span>
                  {event.player ? (
                    <span style={{ fontWeight: 600, color: 'var(--felt-green)', minWidth: '150px' }}>
                      {event.player.nickname}
                    </span>
                  ) : (
                    <span style={{ fontWeight: 600, color: 'var(--text-light)', minWidth: '150px' }}>
                      Unknown Player
                    </span>
                  )}
                  <span className={`event-type ${event.type}`}>
                    {event.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
