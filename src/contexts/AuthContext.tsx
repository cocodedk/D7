import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../lib/api'

interface AuthContextType {
  isAuthenticated: boolean
  login: (password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('auth_token')
    if (token) {
      setIsAuthenticated(true)
    }
  }, [])

  const login = async (password: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:23',message:'Login called',data:{passwordLength:password.length,passwordType:typeof password},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    try {
      const response = await api.post<{ token?: string }>('/auth-login', { password })
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:26',message:'Login response received',data:{hasToken:!!response.token,tokenLength:response.token?.length,responseKeys:Object.keys(response).join(',')},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      if (response.token) {
        localStorage.setItem('auth_token', response.token)
        setIsAuthenticated(true)
      } else {
        throw new Error('Invalid password')
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:33',message:'Login error',data:{errorMessage:error instanceof Error?error.message:String(error),errorType:error?.constructor?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      throw error;
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

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}
