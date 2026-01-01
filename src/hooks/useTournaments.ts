import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export interface Tournament {
  id: string
  name: string
  state: 'draft' | 'active' | 'closed'
  started_at: string | null
  closed_at: string | null
  created_at: string
}

export function useTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTournaments = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.get<Tournament[]>('/tournaments')
      setTournaments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tournaments')
    } finally {
      setLoading(false)
    }
  }

  const fetchActiveTournament = async () => {
    try {
      const data = await api.get<Tournament | null>('/tournaments/active')
      setActiveTournament(data)
    } catch (err) {
      setActiveTournament(null)
    }
  }

  useEffect(() => {
    fetchTournaments()
    fetchActiveTournament()
  }, [])

  const createTournament = async (name: string) => {
    const newTournament = await api.post<Tournament>('/tournaments', { name })
    setTournaments((prev) => [newTournament, ...prev])
    return newTournament
  }

  const startTournament = async (id: string) => {
    const updated = await api.put<Tournament>(`/tournaments/${id}/start`, {})
    setTournaments((prev) =>
      Array.isArray(prev) ? prev.map((t) => (t.id === id ? updated : t)) : [updated]
    )
    await fetchActiveTournament()
    return updated
  }

  const closeTournament = async (id: string, confirmation: string) => {
    const updated = await api.put<Tournament>(`/tournaments/${id}/close`, {
      confirmation,
    })
    setTournaments((prev) =>
      Array.isArray(prev) ? prev.map((t) => (t.id === id ? updated : t)) : [updated]
    )
    await fetchActiveTournament()
    return updated
  }

  return {
    tournaments,
    activeTournament,
    loading,
    error,
    createTournament,
    startTournament,
    closeTournament,
    refresh: fetchTournaments,
    refreshActive: fetchActiveTournament,
  }
}
