'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/error'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type UserDetails = {
  user_details_id?: number
  user_id?: number
  current_role?: 'Student' | 'Fresher' | 'Professional' | string
  full_name?: string
  headline?: string
  bio?: string
  location?: string
  phone?: string
  contact_number?: string
  year_of_passout?: string
  linkedin?: string
  github?: string
  resumes?: string[] | string | null
  [key: string]: unknown
}

function normalizeResumes(details: UserDetails | null): string[] {
  if (!details) return []
  const r = details.resumes
  if (!r) return []
  if (Array.isArray(r)) return r.map(String)
  if (typeof r === 'string') {
    try {
      const parsed = JSON.parse(r)
      return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)]
    } catch {
      return [r]
    }
  }
  return []
}

function detailsResemblesExisting(details: UserDetails | null): boolean {
  if (!details) return false
  if (typeof details.user_details_id === 'number') return true
  if (typeof details.user_id === 'number') return true
  return false
}

export default function UserDetailsPage() {
  const router = useRouter()

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const [details, setDetails] = React.useState<UserDetails | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/user-details/me')
      setDetails((res.data?.details as UserDetails) || null)
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to load details')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const updateDetailsField = (key: keyof UserDetails, value: unknown) => {
    setDetails((prev) => ({ ...(prev || {}), [key]: value }))
  }

  const saveDetails = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const payload: Record<string, unknown> = { ...(details || {}) }
      payload.resumes = normalizeResumes(details)
      delete payload.created_at
      delete payload.updated_at

      let res
      if (detailsResemblesExisting(details)) {
        res = await api.put('/user-details/me', payload)
      } else {
        res = await api.post('/user-details', payload)
      }

      setDetails(res.data as UserDetails)
      setSuccess('Saved. Redirecting to dashboard…')
      setTimeout(() => router.push('/dashboard'), 600)
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to save details')
    } finally {
      setSaving(false)
    }
  }

  const uploadResumes = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const formData = new FormData()
    Array.from(files).forEach((f) => formData.append('resumes', f))

    setUploading(true)
    setError(null)
    setSuccess(null)
    try {
      await api.post('/user-details/me/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSuccess('Resume uploaded')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to upload resume')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-plus-jakarta)] text-2xl font-bold text-zinc-900">User details</h1>
        <p className="mt-1 text-sm text-zinc-600">Fill in your details to personalize interviews.</p>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-sm text-red-800">{error}</CardContent>
        </Card>
      ) : null}
      {success ? (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="py-4 text-sm text-emerald-900">{success}</CardContent>
        </Card>
      ) : null}

      <Card className="bg-white/60">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-zinc-600">Loading…</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="current_role">Current role</Label>
                <select
                  id="current_role"
                  className="h-10 w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 text-sm outline-none focus:border-brand-500"
                  value={String(details?.current_role || '')}
                  onChange={(e) => updateDetailsField('current_role', e.target.value)}
                >
                  <option value="">Select…</option>
                  <option value="Student">Student</option>
                  <option value="Fresher">Fresher</option>
                  <option value="Professional">Professional</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  value={String(details?.full_name || '')}
                  onChange={(e) => updateDetailsField('full_name', e.target.value)}
                />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  value={String(details?.headline || '')}
                  onChange={(e) => updateDetailsField('headline', e.target.value)}
                />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  className="min-h-24 w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-brand-500"
                  value={String(details?.bio || '')}
                  onChange={(e) => updateDetailsField('bio', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={String(details?.location || '')}
                  onChange={(e) => updateDetailsField('location', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={String(details?.phone || details?.contact_number || '')}
                  onChange={(e) => updateDetailsField('phone', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="year_of_passout">Year of passout</Label>
                <Input
                  id="year_of_passout"
                  value={String(details?.year_of_passout || '')}
                  onChange={(e) => updateDetailsField('year_of_passout', e.target.value)}
                  placeholder="2025"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={String(details?.linkedin || '')}
                  onChange={(e) => updateDetailsField('linkedin', e.target.value)}
                />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="github">GitHub</Label>
                <Input
                  id="github"
                  value={String(details?.github || '')}
                  onChange={(e) => updateDetailsField('github', e.target.value)}
                />
              </div>

              <div className="md:col-span-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      void uploadResumes(e.target.files)
                      e.currentTarget.value = ''
                    }}
                  />
                  <Button type="button" variant="outline" disabled={uploading}>
                    {uploading ? 'Uploading…' : 'Upload resumes'}
                  </Button>
                </label>
                <Button onClick={saveDetails} disabled={saving}>
                  {saving ? 'Saving…' : 'Save & continue'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
