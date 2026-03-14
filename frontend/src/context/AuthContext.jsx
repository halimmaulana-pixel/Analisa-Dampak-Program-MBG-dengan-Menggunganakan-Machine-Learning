import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { auth as authApi } from '../api/index.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('mbg_token'))
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('mbg_user')
    const savedToken = localStorage.getItem('mbg_token')
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser))
        setToken(savedToken)
      } catch {
        localStorage.removeItem('mbg_user')
        localStorage.removeItem('mbg_token')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (username, password) => {
    const response = await authApi.login(username, password)
    const { access_token, user: userData } = response.data

    localStorage.setItem('mbg_token', access_token)
    localStorage.setItem('mbg_user', JSON.stringify(userData))

    setToken(access_token)
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore logout errors
    } finally {
      localStorage.removeItem('mbg_token')
      localStorage.removeItem('mbg_user')
      setToken(null)
      setUser(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.me()
      const userData = response.data
      localStorage.setItem('mbg_user', JSON.stringify(userData))
      setUser(userData)
    } catch {
      logout()
    }
  }, [logout])

  const isAuthenticated = !!token && !!user
  const isAdmin = user?.role === 'admin'
  const isPenelitiOrAbove = ['admin', 'peneliti'].includes(user?.role)

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated,
      isAdmin,
      isPenelitiOrAbove,
      login,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
