import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export interface Tournament {
  id: string
  date: string
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
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:32',message:'fetchActiveTournament entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    try {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:35',message:'fetchActiveTournament API call before',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      const data = await api.get<Tournament | null>('/tournaments/active')
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:38',message:'fetchActiveTournament API response',data:{data,isArray:Array.isArray(data),isNull:data===null,hasId:data&&'id' in data,hasState:data&&'state' in data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion

      // Debug logging to understand the actual response format
      console.log('[fetchActiveTournament] Response:', {
        data,
        type: typeof data,
        isArray: Array.isArray(data),
        isNull: data === null,
        truthy: !!data,
      })

      // Normalize response: if it's an array (empty or not), treat it as null
      // This handles cases where the API incorrectly returns [] instead of null
      const normalizedData = Array.isArray(data) ? null : data

      // Additional type safety: ensure we only set Tournament objects or null
      if (normalizedData !== null && typeof normalizedData === 'object' && 'id' in normalizedData && 'state' in normalizedData) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:52',message:'Before setActiveTournament',data:{tournamentId:normalizedData.id,state:normalizedData.state},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        setActiveTournament(normalizedData as Tournament)
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:54',message:'After setActiveTournament',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:57',message:'setActiveTournament null',data:{normalizedData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        setActiveTournament(null)
      }
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:62',message:'fetchActiveTournament error',data:{error:err instanceof Error?err.message:String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error('[fetchActiveTournament] Error:', err)
      setActiveTournament(null)
    }
  }

  useEffect(() => {
    fetchTournaments()
    fetchActiveTournament()
  }, [])

  const createTournament = async (date: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:66',message:'createTournament entry',data:{date},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:69',message:'API call before',data:{date},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const newTournament = await api.post<Tournament>('/tournaments', { date })
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:72',message:'API call success',data:{tournamentId:newTournament?.id,tournamentDate:newTournament?.date,tournamentState:newTournament?.state},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:74',message:'Before setTournaments',data:{tournamentsCount:0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      setTournaments((prev) => {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:76',message:'setTournaments callback',data:{prevLength:prev?.length,newTournamentId:newTournament?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        return [newTournament, ...prev]
      })
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:80',message:'After setTournaments',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return newTournament
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:84',message:'createTournament error',data:{error:err instanceof Error?err.message:String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      throw err
    }
  }

  const startTournament = async (id: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:92',message:'startTournament entry',data:{id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    try {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:95',message:'startTournament API call before',data:{id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      const updated = await api.put<Tournament>(`/tournaments/${id}/start`, {})
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:98',message:'startTournament API success',data:{tournamentId:updated?.id,state:updated?.state},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      setTournaments((prev) =>
        Array.isArray(prev) ? prev.map((t) => (t.id === id ? updated : t)) : [updated]
      )
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:103',message:'Before fetchActiveTournament',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      await fetchActiveTournament()
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:106',message:'After fetchActiveTournament',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      return updated
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:110',message:'startTournament error',data:{error:err instanceof Error?err.message:String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      throw err
    }
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
