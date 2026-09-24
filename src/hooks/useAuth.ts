import { useAuthContext } from '../contexts/useAuthContext'

export function useAuth() {
  return useAuthContext()
}
