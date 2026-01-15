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

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()

  const [username, setUsername] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await register(username, email, password)
      router.push('/verify-email')
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || 'Failed to create account')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FadeIn>
      <Card className="rounded-2xl border-white/70 bg-white/60 shadow-xl backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Start practicing in minutes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create account'}
            </Button>
          </form>

          <div className="text-center text-sm text-zinc-600">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-700 hover:text-brand-900">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </FadeIn>
  )
}
