'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Github, Linkedin } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FadeIn } from '@/components/motion/fade-in'
import { getApiBaseUrl } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/error'
import { useAuth } from '@/context/auth-context'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [identifier, setIdentifier] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await login(identifier, password)
      const user = res.user
      if (user && user.email_verified === 0) {
        router.push('/verify-email')
      } else {
        router.push('/dashboard')
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || 'Failed to sign in')
    } finally {
      setSubmitting(false)
    }
  }

  const apiBase = getApiBaseUrl()

  return (
    <FadeIn>
      <Card className="rounded-2xl border-white/70 bg-white/60 shadow-xl backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>Welcome back — let’s get you interview-ready.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or username</Label>
              <Input
                id="identifier"
                autoComplete="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>

            <div className="flex items-center justify-between text-sm text-zinc-600">
              <Link href="/forgot-password" className="hover:text-zinc-900">
                Forgot password?
              </Link>
              <Link href="/register" className="text-brand-700 hover:text-brand-900">
                Create account
              </Link>
            </div>
          </form>

          <div className="space-y-2">
            <Button
              variant="outline"
              size="lg"
              className="w-full bg-white/60"
              onClick={() => {
                window.location.href = `${apiBase}/auth/google`
              }}
            >
              Continue with Google
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full bg-white/60"
              onClick={() => {
                window.location.href = `${apiBase}/auth/linkedin`
              }}
            >
              <Linkedin className="h-4 w-4" />
              Continue with LinkedIn
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full bg-white/60"
              onClick={() => {
                window.location.href = `${apiBase}/auth/github`
              }}
            >
              <Github className="h-4 w-4" />
              Continue with GitHub
            </Button>
          </div>
        </CardContent>
      </Card>
    </FadeIn>
  )
}
