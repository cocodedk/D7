import { createContext, useContext } from 'react'

export type Theme = 'light' | 'dark'

export interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

// Split from ThemeContext.tsx so that file exports only the ThemeProvider
// component: react-refresh/only-export-components warns (and CI fails on
// any warning) when a .tsx file mixes component and non-component exports.
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useThemeContext() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useThemeContext must be used within ThemeProvider')
  }
  return context
}
