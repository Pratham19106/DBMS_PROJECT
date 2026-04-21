import { createContext, useContext, useEffect, useMemo, useState } from "react"
import {
  clearAuthSession,
  getStoredUser,
  loginUser,
  persistAuthSession,
  registerUser,
  type AuthenticatedUser,
} from "@/lib/api"

type AuthContextType = {
  user: AuthenticatedUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setUser(getStoredUser())
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string, rememberMe = true) => {
    setIsLoading(true)
    try {
      const { token, user: authenticatedUser } = await loginUser({
        email: email.trim().toLowerCase(),
        password,
      })

      persistAuthSession(authenticatedUser, token, rememberMe)
      setUser(authenticatedUser)
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      await registerUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      })

      const { token, user: authenticatedUser } = await loginUser({
        email: email.trim().toLowerCase(),
        password,
      })

      persistAuthSession(authenticatedUser, token, true)
      setUser(authenticatedUser)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    clearAuthSession()
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      signup,
      logout,
    }),
    [user, isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
