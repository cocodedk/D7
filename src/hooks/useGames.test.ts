import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useGames } from './useGames'
import { api } from '../lib/api'
import { createMockGame } from '../test-helpers'

vi.mock('../lib/api')

describe('useGames', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have initial state', () => {
    const { result } = renderHook(() => useGames())

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should create game successfully', async () => {
    const mockGame = createMockGame()
    vi.mocked(api.post).mockResolvedValue(mockGame)

    const { result } = renderHook(() => useGames())

    const game = await result.current.createGame({
      tournamentId: 'tournament-1',
      events: [{ playerId: 'player-1', type: 'I' }],
    })

    expect(game).toEqual(mockGame)
    expect(api.post).toHaveBeenCalledWith('/games', {
      tournamentId: 'tournament-1',
      events: [{ playerId: 'player-1', type: 'I' }],
    })
  })

  it('should handle createGame error', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('Create failed'))

    const { result } = renderHook(() => useGames())

    await expect(
      result.current.createGame({
        tournamentId: 'tournament-1',
        events: [{ playerId: 'player-1', type: 'I' }],
      })
    ).rejects.toThrow('Create failed')

    await waitFor(() => {
      expect(result.current.error).toBe('Create failed')
    })
  })

  it('should get game successfully', async () => {
    const mockGame = createMockGame()
    vi.mocked(api.get).mockResolvedValue(mockGame)

    const { result } = renderHook(() => useGames())

    const game = await result.current.getGame('game-1')

    expect(game).toEqual(mockGame)
    expect(api.get).toHaveBeenCalledWith('/games/game-1')
  })

  it('should handle getGame error', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Not found'))

    const { result } = renderHook(() => useGames())

    await expect(result.current.getGame('game-1')).rejects.toThrow('Not found')

    await waitFor(() => {
      expect(result.current.error).toBe('Not found')
    })
  })

  it('should delete game successfully', async () => {
    vi.mocked(api.delete).mockResolvedValue({})

    const { result } = renderHook(() => useGames())

    await result.current.deleteGame('game-1')

    expect(api.delete).toHaveBeenCalledWith('/games/game-1')
  })

  it('should handle deleteGame error', async () => {
    vi.mocked(api.delete).mockRejectedValue(new Error('Delete failed'))

    const { result } = renderHook(() => useGames())

    await expect(result.current.deleteGame('game-1')).rejects.toThrow('Delete failed')

    await waitFor(() => {
      expect(result.current.error).toBe('Delete failed')
    })
  })
})
