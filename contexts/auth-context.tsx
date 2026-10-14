"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { authService } from "@/services/auth"

interface AuthContextType {
  isAuthenticated: boolean
  userLogin: string | null
  accessToken: string | null
  login: (accessToken: string, refreshToken: string, login: string) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [userLogin, setUserLogin] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = authService.getAccessToken()
    const login = authService.getUserLogin()
    if (token && login) {
      setIsAuthenticated(true)
      setUserLogin(login)
      setAccessToken(token)
    }
    setIsLoading(false)
  }, [])

  const login = (accessToken: string, refreshToken: string, login: string) => {
    authService.saveAuth(accessToken, refreshToken, login)
    setIsAuthenticated(true)
    setUserLogin(login)
    setAccessToken(accessToken)
  }

  const logout = () => {
    authService.logout()
    setIsAuthenticated(false)
    setUserLogin(null)
    setAccessToken(null)
    // Опционально: можно добавить window.location.href = "/login" прямо здесь
  }

  return (
      <AuthContext.Provider value={{
        isAuthenticated,
        userLogin,
        accessToken,
        login,
        logout,
        isLoading }}>
        {children}
      </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
