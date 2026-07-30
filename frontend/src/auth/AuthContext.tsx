import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchMe, login as loginRequest, logout as logoutRequest } from '../api/auth'
import { tokenStorage } from '../api/client'
import type { User } from '../api/types'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function restoreSession() {
      if (!tokenStorage.getAccess()) {
        setIsLoading(false)
        return
      }
      try {
        setUser(await fetchMe())
      } catch {
        tokenStorage.clear()
      } finally {
        setIsLoading(false)
      }
    }
    restoreSession()
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const isAdmin = Boolean(
      user && (user.is_superuser || user.role === 'administrativo' || user.role === 'super_administrativo'),
    )
    return {
      user,
      isLoading,
      isAdmin,
      login: async (username: string, password: string) => {
        setUser(await loginRequest(username, password))
      },
      logout: () => {
        logoutRequest()
        setUser(null)
      },
    }
  }, [user, isLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  return context
}
