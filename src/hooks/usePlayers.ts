import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export interface Player {
  id: string
  name: string
  nickname: string
  avatar: string | null
  created_at: string
}

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlayers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.get<Player[]>('/players')
      setPlayers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch players')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlayers()
  }, [])

  const createPlayer = async (player: {
    name: string
    nickname: string
    avatar?: string
  }) => {
    const newPlayer = await api.post<Player>('/players', player)
    setPlayers((prev) => [newPlayer, ...prev])
    return newPlayer
  }

  const updatePlayer = async (
    id: string,
    updates: { name?: string; nickname?: string; avatar?: string }
  ) => {
    const updated = await api.put<Player>(`/players/${id}`, updates)
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? updated : p))
    )
    return updated
  }

  const deletePlayer = async (id: string) => {
    await api.delete(`/players/${id}`)
    setPlayers((prev) => prev.filter((p) => p.id !== id))
  }

  return {
    players,
    loading,
    error,
    createPlayer,
    updatePlayer,
    deletePlayer,
    refresh: fetchPlayers,
  }
}
