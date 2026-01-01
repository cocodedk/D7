import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuthContext } from './AuthContext'
import { api } from '../lib/api'

vi.mock('../lib/api')

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should have initial state (not authenticated)', () => {
    const { result } = renderHook(() => useAuthContext(), {
      wrapper: AuthProvider,
    })

    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should login successfully and set token', async () => {
    vi.mocked(api.post).mockResolvedValue({ token: 'test-token' })

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: AuthProvider,
    })

    await act(async () => {
      await result.current.login('password123')
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(localStorage.getItem('auth_token')).toBe('test-token')
    expect(api.post).toHaveBeenCalledWith('/auth-login', { password: 'password123' })
  })

  it('should handle login error', async () => {
    vi.mocked(api.post).mockResolvedValue({})

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: AuthProvider,
    })

    await act(async () => {
      await expect(result.current.login('wrong-password')).rejects.toThrow('Invalid password')
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('auth_token')).toBeNull()
  })

  it('should logout and remove token', async () => {
    localStorage.setItem('auth_token', 'test-token')
    vi.mocked(api.post).mockResolvedValue({})

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: AuthProvider,
    })

    // First login to set authenticated state
    vi.mocked(api.post).mockResolvedValueOnce({ token: 'test-token' })
    await act(async () => {
      await result.current.login('password123')
    })

    expect(result.current.isAuthenticated).toBe(true)

    // Then logout
    await act(async () => {
      result.current.logout()
    })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false)
    })

    expect(localStorage.getItem('auth_token')).toBeNull()
  })

  it('should persist token from localStorage on mount', () => {
    localStorage.setItem('auth_token', 'existing-token')

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: AuthProvider,
    })

    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should throw error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useAuthContext())
    }).toThrow('useAuthContext must be used within AuthProvider')

    consoleSpy.mockRestore()
  })
})
