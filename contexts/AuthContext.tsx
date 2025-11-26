'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { api, User } from '@/lib/api-client'

interface AuthContextType {
  isAuthenticated: boolean
  isAdmin: boolean
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<User>
  logout: () => void
  refreshAuth: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshAuth = useCallback(() => {
    const authenticated = api.isAuthenticated()
    setIsAuthenticated(authenticated)
    setIsAdmin(api.isAdmin())
    setUser(api.getCurrentUser())
    setLoading(false)
  }, [])

  useEffect(() => {
    refreshAuth()
  }, [refreshAuth])

  const login = useCallback(async (username: string, password: string): Promise<User> => {
    const result = await api.login(username, password)
    setIsAuthenticated(true)
    setIsAdmin(result.data.user.role === 'admin')
    setUser(result.data.user)
    return result.data.user
  }, [])

  const logout = useCallback(() => {
    api.logout()
    setIsAuthenticated(false)
    setIsAdmin(false)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isAdmin,
      user,
      loading,
      login,
      logout,
      refreshAuth,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

