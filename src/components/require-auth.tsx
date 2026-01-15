'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, loading } = useAuth()

  React.useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-brand-600" />
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
