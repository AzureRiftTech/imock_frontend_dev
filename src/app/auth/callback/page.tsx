'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { FadeIn } from '@/components/motion/fade-in'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/auth-context'

function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { handleOAuthCallback } = useAuth()

  const [error, setError] = React.useState<string | null>(null)
  const [processed, setProcessed] = React.useState(false)

  React.useEffect(() => {
    // Prevent duplicate execution in StrictMode or re-renders
    if (processed) return

    const token = searchParams.get('token')
    const isNewUser = searchParams.get('new') === '1'
    if (!token) {
      setError('Missing token in callback URL.')
      return
    }

    setProcessed(true)
    handleOAuthCallback(token)
      .then(({ hasDetails }) => {
        // Only redirect to user-details for genuinely new users without details;
        // returning users always go to dashboard regardless of hasDetails state
        if (isNewUser && !hasDetails) {
          router.replace('/user-details')
        } else {
          router.replace('/dashboard')
        }
      })
      .catch(() => setError('OAuth callback failed. Please try again.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <FadeIn>
      <Card className="mx-auto mt-16 max-w-md rounded-2xl border-white/70 bg-white/60 shadow-xl backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl">Signing you in…</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm text-zinc-600">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-brand-600" />
              Finishing up…
            </div>
          )}
        </CardContent>
      </Card>
    </FadeIn>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto mt-16 max-w-md">
          <div className="rounded-2xl border border-white/70 bg-white/60 px-6 py-8 shadow-xl backdrop-blur">
            <div className="flex items-center gap-3 text-sm text-zinc-600">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-brand-600" />
              Loading…
            </div>
          </div>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  )
}
