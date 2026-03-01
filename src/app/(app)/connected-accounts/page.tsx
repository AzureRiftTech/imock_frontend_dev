'use client'

import * as React from 'react'
import { api, getApiBaseUrl } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/error'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Connection = {
  provider: string
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

type GithubRepo = {
  id: number
  name: string
  html_url: string
  private?: boolean
  description?: string | null
  [key: string]: unknown
}

export default function ConnectedAccountsPage() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [connections, setConnections] = React.useState<Connection[]>([])

  const [githubProfile, setGithubProfile] = React.useState<Record<string, unknown> | null>(null)
  const [githubRepos, setGithubRepos] = React.useState<GithubRepo[]>([])

  const [linkedInProfile, setLinkedInProfile] = React.useState<Record<string, unknown> | null>(null)
  const [linkedInPicture, setLinkedInPicture] = React.useState<string | null>(null)

  const connect = (provider: 'google' | 'github' | 'linkedin') => {
    const base = getApiBaseUrl().replace(/\/$/, '')
    window.location.href = `${base}/auth/${provider}`
  }

  const isConnected = (provider: string) =>
    connections.some((c) => String(c.provider).toLowerCase() === provider.toLowerCase())

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/auth/connections')
      setConnections((res.data?.connections as Connection[]) || [])
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to load connections')
      setConnections([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  // Re-fetch connections when user returns to this tab (e.g. after OAuth redirect)
  React.useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [load])

  const fetchGithub = async () => {
    setError(null)
    try {
      const [meRes, reposRes] = await Promise.all([
        api.get('/auth/provider/github/me'),
        api.get('/auth/provider/github/repos', { params: { per_page: 20, page: 1, type: 'owner' } }),
      ])
      setGithubProfile((meRes.data?.data as Record<string, unknown>) || null)
      setGithubRepos((reposRes.data?.repos as GithubRepo[]) || [])
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to fetch GitHub data')
    }
  }

  const fetchLinkedIn = async () => {
    setError(null)
    try {
      const [profileRes, picRes] = await Promise.all([
        api.get('/auth/provider/linkedin/profile'),
        api.get('/auth/provider/linkedin/profile-picture'),
      ])
      setLinkedInProfile((profileRes.data?.profile as Record<string, unknown>) || null)
      setLinkedInPicture((picRes.data?.picture as string) || null)
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to fetch LinkedIn data')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[var(--font-plus-jakarta)] text-2xl font-bold text-zinc-900">Connected accounts</h1>
          <p className="mt-1 text-sm text-zinc-600">Connect providers to speed up your profile and workflows.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={load} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-sm text-red-800">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <ProviderCard
          title="Google"
          description="Sign in and connect your Google account"
          connected={isConnected('google')}
          onConnect={() => connect('google')}
        />
        <ProviderCard
          title="GitHub"
          description="Fetch your profile and repositories"
          connected={isConnected('github')}
          onConnect={() => connect('github')}
          onFetch={isConnected('github') ? fetchGithub : undefined}
        />
        <ProviderCard
          title="LinkedIn"
          description="Fetch your profile and picture"
          connected={isConnected('linkedin')}
          onConnect={() => connect('linkedin')}
          onFetch={isConnected('linkedin') ? fetchLinkedIn : undefined}
        />
      </div>

      <Card className="bg-white/60">
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-zinc-600">Loading…</div>
          ) : connections.length === 0 ? (
            <div className="text-sm text-zinc-600">No connected accounts yet.</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {connections.map((c, idx) => (
                <div key={`${c.provider}-${idx}`} className="rounded-2xl border border-white/70 bg-white/70 p-4">
                  <div className="text-sm font-semibold text-zinc-900">{String(c.provider)}</div>
                  {c.updated_at ? <div className="mt-1 text-xs text-zinc-600">Updated: {String(c.updated_at)}</div> : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white/60">
          <CardHeader>
            <CardTitle className="text-base">GitHub</CardTitle>
          </CardHeader>
          <CardContent>
            {!isConnected('github') ? (
              <div className="text-sm text-zinc-600">Connect GitHub to view profile data.</div>
            ) : githubProfile ? (
              <div className="space-y-3">
                <div className="text-sm text-zinc-700">
                  <div className="font-semibold text-zinc-900">{String(githubProfile.login || 'GitHub user')}</div>
                  {githubProfile.html_url ? (
                    <a className="text-brand-700 underline" href={String(githubProfile.html_url)} target="_blank" rel="noreferrer">
                      {String(githubProfile.html_url)}
                    </a>
                  ) : null}
                </div>

                <div>
                  <div className="text-sm font-semibold text-zinc-900">Repos</div>
                  {githubRepos.length === 0 ? (
                    <div className="mt-1 text-sm text-zinc-600">No repos loaded yet.</div>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {githubRepos.map((r) => (
                        <div key={r.id} className="rounded-2xl border border-white/70 bg-white/70 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <a className="text-sm font-semibold text-brand-700 underline" href={r.html_url} target="_blank" rel="noreferrer">
                              {r.name}
                            </a>
                            <div className="text-xs text-zinc-600">{r.private ? 'private' : 'public'}</div>
                          </div>
                          {r.description ? <div className="mt-1 text-xs text-zinc-600">{r.description}</div> : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-zinc-600">Click “Fetch data” on GitHub to load profile.</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/60">
          <CardHeader>
            <CardTitle className="text-base">LinkedIn</CardTitle>
          </CardHeader>
          <CardContent>
            {!isConnected('linkedin') ? (
              <div className="text-sm text-zinc-600">Connect LinkedIn to view profile data.</div>
            ) : linkedInProfile ? (
              <div className="space-y-3">
                {linkedInPicture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={linkedInPicture} alt="LinkedIn profile" className="h-16 w-16 rounded-2xl border border-white/70 object-cover" />
                ) : null}
                <div className="text-sm text-zinc-700">
                  <div className="font-semibold text-zinc-900">
                    {String(
                      linkedInProfile.name ||
                        linkedInProfile.given_name ||
                        linkedInProfile.email ||
                        'LinkedIn user'
                    )}
                  </div>
                  {linkedInProfile.email ? <div className="mt-1 text-xs text-zinc-600">{String(linkedInProfile.email)}</div> : null}
                </div>
                <details className="rounded-2xl border border-white/70 bg-white/70 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Raw profile</summary>
                  <pre className="mt-2 overflow-auto text-xs text-zinc-700">{JSON.stringify(linkedInProfile, null, 2)}</pre>
                </details>
              </div>
            ) : (
              <div className="text-sm text-zinc-600">Click “Fetch data” on LinkedIn to load profile.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ProviderCard({
  title,
  description,
  connected,
  onConnect,
  onFetch,
}: {
  title: string
  description: string
  connected: boolean
  onConnect: () => void
  onFetch?: () => void
}) {
  return (
    <Card className="bg-white/60">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-zinc-600">{description}</div>
        <div className="flex items-center gap-2">
          <Button onClick={onConnect} variant={connected ? 'secondary' : 'default'}>
            {connected ? 'Re-connect' : 'Connect'}
          </Button>
          {onFetch ? (
            <Button onClick={onFetch} variant="outline">
              Fetch data
            </Button>
          ) : null}
        </div>
        <div className="text-xs text-zinc-600">Status: {connected ? 'connected' : 'not connected'}</div>
      </CardContent>
    </Card>
  )
}
