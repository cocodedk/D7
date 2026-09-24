import { createContext, useContext } from 'react'

export interface AuthContextType {
  isAuthenticated: boolean
  login: (password: string) => Promise<void>
  logout: () => void
}

// Split from AuthContext.tsx so that file exports only the AuthProvider
// component: react-refresh/only-export-components warns (and CI fails on
// any warning) when a .tsx file mixes component and non-component exports.
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}
