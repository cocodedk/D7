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
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'usePlayers.ts:updatePlayer',message:'updatePlayer entry',data:{id,updates},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
      const updated = await api.put<Player>(`/players/${id}`, updates)
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'usePlayers.ts:updatePlayer',message:'updatePlayer success',data:{id,updatedNickname:updated.nickname},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setPlayers((prev) =>
        prev.map((p) => (p.id === id ? updated : p))
      )
      return updated
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'usePlayers.ts:updatePlayer',message:'updatePlayer error',data:{id,error:err instanceof Error ? err.message : String(err)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      throw err
    }
  }

  const deletePlayer = async (id: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'usePlayers.ts:deletePlayer',message:'deletePlayer entry',data:{id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    try {
      await api.delete(`/players/${id}`)
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'usePlayers.ts:deletePlayer',message:'deletePlayer success',data:{id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      setPlayers((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'usePlayers.ts:deletePlayer',message:'deletePlayer error',data:{id,error:err instanceof Error ? err.message : String(err)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      throw err
    }
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
