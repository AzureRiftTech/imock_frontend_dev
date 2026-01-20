'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { api } from '@/lib/api'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const [checkingDetails, setCheckingDetails] = React.useState(true)
  const [hasDetails, setHasDetails] = React.useState(false)

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [loading, user, router])

  React.useEffect(() => {
    if (!user || loading) return
    
    // Don't check if already on user-details page to avoid redirect loop
    if (pathname === '/user-details') {
      setCheckingDetails(false)
      setHasDetails(true)
      return
    }

    const checkUserDetails = async () => {
      try {
        const res = await api.get('/user-details/me')
        const details = res.data?.details
        if (!details) {
          router.replace('/user-details')
          setHasDetails(false)
        } else {
          setHasDetails(true)
        }
      } catch {
        router.replace('/user-details')
        setHasDetails(false)
      } finally {
        setCheckingDetails(false)
      }
    }

    checkUserDetails()
  }, [user, loading, router, pathname])

  if (loading || checkingDetails) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-brand-600" />
      </div>
    )
  }

  if (!user || (!hasDetails && pathname !== '/user-details')) return null

  return <>{children}</>
}
