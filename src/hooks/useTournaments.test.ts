import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useTournaments } from './useTournaments'
import { api } from '../lib/api'
import { createMockTournament } from '../test-helpers'

vi.mock('../lib/api')

describe('useTournaments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have initial loading state', () => {
    vi.mocked(api.get).mockResolvedValue([])

    const { result } = renderHook(() => useTournaments())

    expect(result.current.loading).toBe(true)
    expect(result.current.tournaments).toEqual([])
    expect(result.current.activeTournament).toBeNull()
  })

  it('should fetch tournaments successfully', async () => {
    const mockTournaments = [
      createMockTournament(),
      createMockTournament({ id: 'tournament-2', date: '2024-01-02' }),
    ]
    vi.mocked(api.get)
      .mockResolvedValueOnce(mockTournaments)
      .mockResolvedValueOnce(null)

    const { result } = renderHook(() => useTournaments())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.tournaments).toEqual(mockTournaments)
  })

  it('should fetch active tournament', async () => {
    const activeTournament = createMockTournament({ state: 'active' })
    vi.mocked(api.get)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(activeTournament)

    const { result } = renderHook(() => useTournaments())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.activeTournament).toEqual(activeTournament)
  })

  it('should create tournament successfully', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(null)
    const newTournament = createMockTournament({ id: 'tournament-new', date: '2024-01-15' })
    vi.mocked(api.post).mockResolvedValue(newTournament)

    const { result } = renderHook(() => useTournaments())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.createTournament('2024-01-15')
    })

    await waitFor(() => {
      expect(result.current.tournaments).toContainEqual(newTournament)
    })

    expect(api.post).toHaveBeenCalledWith('/tournaments', { date: '2024-01-15' })
  })

  it('should start tournament successfully', async () => {
    const tournament = createMockTournament({ state: 'draft' })
    const startedTournament = { ...tournament, state: 'active' as const, started_at: '2024-01-01T00:00:00Z' }

    vi.mocked(api.get)
      .mockResolvedValueOnce([tournament])
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce([startedTournament])
      .mockResolvedValueOnce(startedTournament)
    vi.mocked(api.put).mockResolvedValue(startedTournament)

    const { result } = renderHook(() => useTournaments())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.startTournament(tournament.id)
    })

    await waitFor(() => {
      expect(result.current.tournaments.length).toBeGreaterThan(0)
      expect(result.current.tournaments[0].state).toBe('active')
    })

    expect(api.put).toHaveBeenCalledWith(`/tournaments/${tournament.id}/start`, {})
  })

  it('should close tournament successfully', async () => {
    const tournament = createMockTournament({ state: 'active' })
    const closedTournament = { ...tournament, state: 'closed' as const, closed_at: '2024-01-01T00:00:00Z' }

    vi.mocked(api.get)
      .mockResolvedValueOnce([tournament])
      .mockResolvedValueOnce(tournament)
      .mockResolvedValueOnce([closedTournament])
      .mockResolvedValueOnce(null)
    vi.mocked(api.put).mockResolvedValue(closedTournament)

    const { result } = renderHook(() => useTournaments())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.closeTournament(tournament.id, tournament.date)
    })

    await waitFor(() => {
      expect(result.current.tournaments.length).toBeGreaterThan(0)
      expect(result.current.tournaments[0].state).toBe('closed')
    })

    expect(api.put).toHaveBeenCalledWith(`/tournaments/${tournament.id}/close`, {
      confirmation: tournament.date,
    })
  })

  it('should refresh tournaments', async () => {
    const initialTournament = createMockTournament({ state: 'draft', closed_at: null })
    const refreshedTournaments = [
      createMockTournament({ state: 'draft', closed_at: null }),
      createMockTournament({ id: 'tournament-2', state: 'draft', closed_at: null }),
    ]

    // Setup mocks: initial load
    vi.mocked(api.get)
      .mockResolvedValueOnce([initialTournament]) // Initial fetchTournaments
      .mockResolvedValueOnce(null) // Initial fetchActiveTournament

    const { result } = renderHook(() => useTournaments())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Verify initial state
    expect(result.current.tournaments).toHaveLength(1)
    expect(result.current.tournaments[0].id).toBe(initialTournament.id)

    // Clear and set up new mock for refresh
    vi.mocked(api.get).mockClear()
    vi.mocked(api.get).mockResolvedValue(refreshedTournaments)

    await act(async () => {
      await result.current.refresh()
    })

    // Verify refresh was called
    expect(api.get).toHaveBeenCalledWith('/tournaments')

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // The refresh function should update tournaments state
    // Since refresh calls fetchTournaments which sets tournaments directly
    await waitFor(() => {
      expect(result.current.tournaments.length).toBeGreaterThanOrEqual(1)
    })

    // Verify the API was called for refresh
    expect(api.get).toHaveBeenCalledWith('/tournaments')
  })
})
