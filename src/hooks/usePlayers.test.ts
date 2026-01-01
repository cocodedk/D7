import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { usePlayers } from './usePlayers'
import { api } from '../lib/api'
import { createMockPlayer } from '../test-helpers'

vi.mock('../lib/api')

describe('usePlayers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have initial loading state', () => {
    vi.mocked(api.get).mockResolvedValue([])

    const { result } = renderHook(() => usePlayers())

    expect(result.current.loading).toBe(true)
    expect(result.current.players).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('should fetch players successfully', async () => {
    const mockPlayers = [createMockPlayer(), createMockPlayer({ id: 'player-2', name: 'Jane Doe' })]
    vi.mocked(api.get).mockResolvedValue(mockPlayers)

    const { result } = renderHook(() => usePlayers())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.players).toEqual(mockPlayers)
    expect(result.current.error).toBeNull()
  })

  it('should handle fetch error', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => usePlayers())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.players).toEqual([])
    expect(result.current.error).toBe('Network error')
  })

  it('should create player successfully', async () => {
    vi.mocked(api.get).mockResolvedValue([])
    const newPlayer = createMockPlayer({ id: 'player-new', name: 'New Player', nickname: 'Newbie' })
    vi.mocked(api.post).mockResolvedValue(newPlayer)

    const { result } = renderHook(() => usePlayers())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.createPlayer({
        name: 'New Player',
        nickname: 'Newbie',
      })
    })

    await waitFor(() => {
      expect(result.current.players).toContainEqual(newPlayer)
    })

    expect(api.post).toHaveBeenCalledWith('/players', {
      name: 'New Player',
      nickname: 'Newbie',
    })
  })

  it('should handle createPlayer error', async () => {
    vi.mocked(api.get).mockResolvedValue([])
    vi.mocked(api.post).mockRejectedValue(new Error('Create failed'))

    const { result } = renderHook(() => usePlayers())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await expect(
      result.current.createPlayer({
        name: 'New Player',
        nickname: 'Newbie',
      })
    ).rejects.toThrow('Create failed')
  })

  it('should update player successfully', async () => {
    const player = createMockPlayer()
    vi.mocked(api.get).mockResolvedValue([player])
    const updatedPlayer = { ...player, name: 'Updated Name' }
    vi.mocked(api.put).mockResolvedValue(updatedPlayer)

    const { result } = renderHook(() => usePlayers())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.updatePlayer(player.id, { name: 'Updated Name' })
    })

    await waitFor(() => {
      expect(result.current.players[0].name).toBe('Updated Name')
    })

    expect(api.put).toHaveBeenCalledWith(`/players/${player.id}`, { name: 'Updated Name' })
  })

  it('should handle updatePlayer error', async () => {
    const player = createMockPlayer()
    vi.mocked(api.get).mockResolvedValue([player])
    vi.mocked(api.put).mockRejectedValue(new Error('Update failed'))

    const { result } = renderHook(() => usePlayers())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await expect(
      result.current.updatePlayer(player.id, { name: 'Updated Name' })
    ).rejects.toThrow('Update failed')
  })

  it('should delete player successfully', async () => {
    const player = createMockPlayer()
    vi.mocked(api.get).mockResolvedValue([player])
    vi.mocked(api.delete).mockResolvedValue({})

    const { result } = renderHook(() => usePlayers())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.deletePlayer(player.id)
    })

    await waitFor(() => {
      expect(result.current.players).not.toContainEqual(player)
    })

    expect(api.delete).toHaveBeenCalledWith(`/players/${player.id}`)
  })

  it('should handle deletePlayer error', async () => {
    const player = createMockPlayer()
    vi.mocked(api.get).mockResolvedValue([player])
    vi.mocked(api.delete).mockRejectedValue(new Error('Delete failed'))

    const { result } = renderHook(() => usePlayers())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await expect(result.current.deletePlayer(player.id)).rejects.toThrow('Delete failed')
  })

  it('should refresh players', async () => {
    const initialPlayers = [createMockPlayer()]
    const refreshedPlayers = [createMockPlayer(), createMockPlayer({ id: 'player-2' })]

    vi.mocked(api.get)
      .mockResolvedValueOnce(initialPlayers)
      .mockResolvedValueOnce(refreshedPlayers)

    const { result } = renderHook(() => usePlayers())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.players).toEqual(initialPlayers)

    await result.current.refresh()

    await waitFor(() => {
      expect(result.current.players).toEqual(refreshedPlayers)
    })
  })
})
