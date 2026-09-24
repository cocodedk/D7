import { useState, ReactNode } from 'react'
import { api } from '../lib/api'
import { AuthContext } from './useAuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage synchronously to avoid race condition on page reload
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('auth_token')
    return !!token
  })

  const login = async (password: string) => {
    const response = await api.post<{ token?: string }>('/auth-login', { password })
    if (response.token) {
      localStorage.setItem('auth_token', response.token)
      setIsAuthenticated(true)
    } else {
      throw new Error('Invalid password')
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setIsAuthenticated(false)
    api.post('/auth-logout').catch(() => {})
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
