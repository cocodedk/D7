import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTheme } from './useTheme'
import { ThemeProvider } from '../contexts/ThemeContext'

describe('useTheme', () => {
  it('should return ThemeContext values when used inside provider', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })

    expect(result.current).toHaveProperty('theme')
    expect(result.current).toHaveProperty('toggleTheme')
    expect(result.current).toHaveProperty('setTheme')
  })

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useTheme())
    }).toThrow('useThemeContext must be used within ThemeProvider')

    consoleSpy.mockRestore()
  })
})
