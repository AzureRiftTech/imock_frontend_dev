'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FadeIn } from '@/components/motion/fade-in'
import { useAuth } from '@/context/auth-context'
import { getApiErrorMessage } from '@/lib/error'

export default function VerifyEmailPage() {
  const router = useRouter()
  const { user, verifyEmail, resendOtp } = useAuth()

  const [otp, setOtp] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (user && user.email_verified === 1) router.replace('/dashboard')
  }, [user, router])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    try {
      await verifyEmail(otp)
      setSuccess('Email verified. Redirecting…')
      setTimeout(() => router.push('/user-details'), 800)
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || 'Verification failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FadeIn>
      <Card className="rounded-2xl border-white/70 bg-white/60 shadow-xl backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>Enter the 6-digit code we sent to your inbox.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {success}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="otp">Verification code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? 'Verifying…' : 'Verify email'}
            </Button>
          </form>

          <Button
            variant="outline"
            className="w-full bg-white/60"
            onClick={() => resendOtp()}
          >
            Resend code
          </Button>
        </CardContent>
      </Card>
    </FadeIn>
  )
}
