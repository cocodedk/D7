import { useState } from 'react'
import { api } from '../lib/api'
import type { ScoreEvent } from '../lib/scoring'

export interface Game {
  id: string
  tournament_id: string
  comment: string | null
  photo: string | null
  created_at: string
  events?: Array<{
    id: string
    playerId: string
    type: 'I' | 'X'
    created_at: string
  }>
}

export function useGames() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createGame = async (data: {
    tournamentId: string
    events: ScoreEvent[]
    comment?: string
    photo?: string
  }) => {
    try {
      setLoading(true)
      setError(null)
      const game = await api.post<Game>('/games', data)
      return game
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create game'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const getGame = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      const game = await api.get<Game>(`/games/${id}`)
      return game
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch game'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const deleteGame = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      await api.delete(`/games/${id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete game'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    createGame,
    getGame,
    deleteGame,
  }
}
