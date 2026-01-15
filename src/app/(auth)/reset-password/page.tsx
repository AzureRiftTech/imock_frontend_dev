'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FadeIn } from '@/components/motion/fade-in'
import { useAuth } from '@/context/auth-context'
import { getApiErrorMessage } from '@/lib/error'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { resetPassword } = useAuth()

  const [email, setEmail] = React.useState('')
  const [code, setCode] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    try {
      await resetPassword(email, code, newPassword)
      setSuccess('Password updated. Redirecting to sign in…')
      setTimeout(() => router.push('/login'), 1200)
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || 'Failed to reset password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FadeIn>
      <Card className="rounded-2xl border-white/70 bg-white/60 shadow-xl backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl">Reset password</CardTitle>
          <CardDescription>Enter your email, reset code, and new password.</CardDescription>
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
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Reset code</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? 'Updating…' : 'Update password'}
            </Button>
          </form>

          <div className="text-center text-sm">
            <Link href="/login" className="text-zinc-600 hover:text-zinc-900">
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </FadeIn>
  )
}
