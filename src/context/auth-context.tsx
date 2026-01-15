'use client'

import * as React from 'react'
import { api } from '@/lib/api'

export type UserRole = 'user' | 'super_admin' | string

export interface User {
  id?: number
  username?: string
  email?: string
  role?: UserRole
  email_verified?: 0 | 1
  [key: string]: unknown
}

export interface AuthResult {
  token: string
  user: User
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (identifier: string, password: string) => Promise<AuthResult>
  register: (username: string, email: string, password: string) => Promise<AuthResult>
  logout: () => void
  verifyEmail: (otp: string) => Promise<unknown>
  resendOtp: () => Promise<unknown>
  forgotPassword: (email: string) => Promise<unknown>
  resetPassword: (email: string, code: string, newPassword: string) => Promise<unknown>
  handleOAuthCallback: (token: string) => Promise<{ user: User; hasDetails: boolean }>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const checkAuth = async () => {
      const token = window.localStorage.getItem('token')
      if (token) {
        try {
          const res = await api.get('/auth/me')
          setUser((res.data?.user as User) || (res.data?.token as User) || null)
        } catch {
          window.localStorage.removeItem('token')
          setUser(null)
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (identifier: string, password: string): Promise<AuthResult> => {
    const payload = { username: identifier, email: identifier, password }
    const res = await api.post('/auth/login', payload)
    const data = res.data as AuthResult
    window.localStorage.setItem('token', data.token)
    setUser(data.user)
    return data
  }

  const register = async (username: string, email: string, password: string): Promise<AuthResult> => {
    const res = await api.post('/auth/register', { username, email, password })
    const data = res.data as AuthResult
    window.localStorage.setItem('token', data.token)
    setUser(data.user)
    return data
  }

  const logout = () => {
    window.localStorage.removeItem('token')
    setUser(null)
  }

  const verifyEmail = async (otp: string) => {
    await api.post('/auth/verify-email', { otp })
    const res = await api.get('/auth/me')
    setUser((res.data?.user as User) || (res.data?.token as User) || null)
    return res
  }

  const handleOAuthCallback = async (token: string) => {
    window.localStorage.setItem('token', token)

    const res = await api.get('/auth/me')
    const nextUser = (res.data?.user as User) || (res.data?.token as User)
    setUser(nextUser)

    try {
      const detailsRes = await api.get('/user-details/me')
      const hasDetails = Boolean(detailsRes?.data?.details)
      return { user: nextUser, hasDetails }
    } catch {
      return { user: nextUser, hasDetails: false }
    }
  }

  const resendOtp = async () => api.post('/auth/resend-otp')
  const forgotPassword = async (email: string) => api.post('/auth/forgot-password', { email })
  const resetPassword = async (email: string, code: string, newPassword: string) =>
    api.post('/auth/reset-password', { email, code, newPassword })

  const value: AuthContextValue = {
    user,
    loading,
    login,
    register,
    logout,
    verifyEmail,
    resendOtp,
    forgotPassword,
    resetPassword,
    handleOAuthCallback,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
