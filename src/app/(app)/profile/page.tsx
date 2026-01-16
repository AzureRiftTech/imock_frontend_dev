'use client'

import * as React from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/error'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sweetConfirm, sweetAlert } from '@/lib/swal' 

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

type CreditPackage = {
  package_id: number
  name: string
  credits: number
  price_cents: number
}

type Subscription = {
  subscription_id: number
  plan_id: number
  plan_name?: string | null
  plan_type?: string | null
  end_date: string
  interval?: string | null
  price_cents?: number | null
  credits_allocated?: number | null
}

type Invoice = {
  invoice_id: number
  invoice_number: string
  issued_at: string
  total: number
  payment_method?: string | null
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

function formatDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

function formatMoneyFromCents(cents: number | null | undefined): string {
  const n = typeof cents === 'number' ? cents : 0
  return (n / 100).toLocaleString(undefined, { style: 'currency', currency: 'INR' })
}

export default function ProfilePage() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const [details, setDetails] = React.useState<UserDetails | null>(null)
  const [totalCredits, setTotalCredits] = React.useState<number>(0)
  const [creditPackages, setCreditPackages] = React.useState<CreditPackage[]>([])
  const [subscription, setSubscription] = React.useState<Subscription | null>(null)
  const [invoices, setInvoices] = React.useState<Invoice[]>([])
  const [connections, setConnections] = React.useState<{ provider: string }[]>([])

  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [deletingResumeUrl, setDeletingResumeUrl] = React.useState<string | null>(null)
  const [purchasingPackageId, setPurchasingPackageId] = React.useState<number | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const [detailsRes, packagesRes, meRes, subRes, invRes, connsRes] = await Promise.all([
        api.get('/user-details/me'),
        api.get('/credits/packages'),
        api.get('/auth/me'),
        api.get('/subscriptions/me'),
        api.get('/subscriptions/invoices/me'),
        api.get('/auth/connections'),
      ])

      setDetails((detailsRes.data?.details as UserDetails) || null)
      setCreditPackages((packagesRes.data?.packages as CreditPackage[]) || [])
      setTotalCredits(Number(meRes.data?.total_credits || 0))
      setSubscription((subRes.data?.subscription as Subscription) || null)
      setInvoices((invRes.data?.invoices as Invoice[]) || [])
      setConnections((connsRes.data?.connections as { provider: string }[]) || [])
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to load profile')
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
      setSuccess('Profile details saved')
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to save profile details')
    } finally {
      setSaving(false)
    }
  }

  const uploadResumes = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    // client-side validation
    if (files.length > 5) {
      setError('You can upload up to 5 files at a time')
      return
    }
    const hasNonPdf = Array.from(files).some((f) => !(f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')))
    if (hasNonPdf) {
      setError('Only PDF files are allowed')
      return
    }

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

  const deleteResume = async (url: string) => {
    const ok = await sweetConfirm('Delete this resume?')
    if (!ok) return
    setDeletingResumeUrl(url)
    setError(null)
    setSuccess(null)
    try {
      await api.delete('/user-details/me/resume', { data: { url } })
      setSuccess('Resume deleted')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to delete resume')
    } finally {
      setDeletingResumeUrl(null)
    }
  }

  const buyPackage = async (pkg: CreditPackage) => {
    setPurchasingPackageId(pkg.package_id)
    setError(null)
    setSuccess(null)
    try {
      const res = await api.post('/credits/purchase', { package_id: pkg.package_id })
      setTotalCredits(Number(res.data?.total_credits || totalCredits))
      setSuccess('Credits purchased')
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to purchase credits')
    } finally {
      setPurchasingPackageId(null)
    }
  }

  const uploadInputRef = React.useRef<HTMLInputElement | null>(null)
  const resumes = normalizeResumes(details)
  const connectedProviders = new Set(connections.map((c) => String(c.provider).toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[var(--font-plus-jakarta)] text-2xl font-bold text-zinc-900">Profile</h1>
          <p className="mt-1 text-sm text-zinc-600">Manage your details, resumes, and credits.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={load} disabled={loading}>
            Refresh
          </Button>
          <Button asChild variant="outline">
            <Link href="/connected-accounts">Connected accounts</Link>
          </Button>
        </div>
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="bg-white/60">
          <CardHeader>
            <CardTitle className="text-base">Credits</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-zinc-600">Loading…</div>
            ) : (
              <div className="text-3xl font-semibold text-zinc-900">{totalCredits}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/60">
          <CardHeader>
            <CardTitle className="text-base">Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-zinc-600">Loading…</div>
            ) : subscription ? (
              <div className="space-y-1">
                <div className="text-sm font-semibold text-zinc-900">
                  {subscription.plan_name || subscription.plan_type || `Plan #${subscription.plan_id}`}
                </div>
                <div className="text-sm text-zinc-600">
                  {formatMoneyFromCents(subscription.price_cents ?? null)} / {subscription.interval || 'monthly'}
                </div>
                <div className="text-xs text-zinc-600">Active until {formatDate(subscription.end_date)}</div>
              </div>
            ) : (
              <div className="text-sm text-zinc-600">No active plan.</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/60">
          <CardHeader>
            <CardTitle className="text-base">Connections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-zinc-700">
              GitHub: <span className="font-medium">{connectedProviders.has('github') ? 'connected' : 'not connected'}</span>
            </div>
            <div className="text-sm text-zinc-700">
              LinkedIn: <span className="font-medium">{connectedProviders.has('linkedin') ? 'connected' : 'not connected'}</span>
            </div>
            <div className="text-sm text-zinc-700">
              Google: <span className="font-medium">{connectedProviders.has('google') ? 'connected' : 'not connected'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/60">
        <CardHeader>
          <CardTitle className="text-base">Profile details</CardTitle>
        </CardHeader>
        <CardContent>
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
                placeholder="e.g., Frontend Engineer · React · Next.js"
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
                placeholder="+91 ..."
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
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                value={String(details?.github || '')}
                onChange={(e) => updateDetailsField('github', e.target.value)}
                placeholder="https://github.com/..."
              />
            </div>
            <div className="md:col-span-2 flex items-center justify-end gap-2">
              <Button onClick={saveDetails} disabled={saving}>
                {saving ? 'Saving…' : 'Save details'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/60">
        <CardHeader>
          <CardTitle className="text-base">Resumes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-zinc-600">Upload up to 5 PDF files per request.</div>

            {/* Hidden file input + Button that opens file chooser via ref (reliable across browsers) */}
            <input
              ref={(el) => (uploadInputRef.current = el)}
              type="file"
              multiple
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                void uploadResumes(e.target.files)
                // reset to allow re-upload same file name
                e.currentTarget.value = ''
              }}
            />

            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => uploadInputRef.current?.click()}
              aria-label="Upload resumes (PDF)"
            >
              {uploading ? 'Uploading…' : 'Upload resumes (PDF)'}
            </Button>
          </div>
          {resumes.length === 0 ? (
            <div className="text-sm text-zinc-600">No resumes uploaded.</div>
          ) : (
            <div className="space-y-2">
              {resumes.map((url) => (
                <div key={url} className="flex flex-col gap-2 rounded-2xl border border-white/70 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <a className="text-sm font-semibold text-brand-700 underline" href={url} target="_blank" rel="noreferrer">
                    {url}
                  </a>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={deletingResumeUrl === url}
                    onClick={() => void deleteResume(url)}
                  >
                    {deletingResumeUrl === url ? 'Deleting…' : 'Delete'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/60">
        <CardHeader>
          <CardTitle className="text-base">Buy credits</CardTitle>
        </CardHeader>
        <CardContent>
          {creditPackages.length === 0 ? (
            <div className="text-sm text-zinc-600">No credit packages available.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {creditPackages.map((pkg) => (
                <div key={pkg.package_id} className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-sm">
                  <div className="text-sm font-semibold text-zinc-900">{pkg.name}</div>
                  <div className="mt-1 text-sm text-zinc-600">Credits: {pkg.credits}</div>
                  <div className="mt-1 text-sm text-zinc-600">{formatMoneyFromCents(pkg.price_cents)}</div>
                  <div className="mt-4">
                    <Button
                      className="w-full"
                      onClick={() => void buyPackage(pkg)}
                      disabled={purchasingPackageId === pkg.package_id}
                    >
                      {purchasingPackageId === pkg.package_id ? 'Purchasing…' : 'Buy'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/60">
        <CardHeader>
          <CardTitle className="text-base">Recent invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-sm text-zinc-600">No invoices yet.</div>
          ) : (
            <div className="space-y-3">
              {invoices.slice(0, 10).map((inv) => (
                <div key={inv.invoice_id} className="rounded-2xl border border-white/70 bg-white/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-zinc-900">{inv.invoice_number}</div>
                      <div className="mt-1 text-xs text-zinc-600">{formatDate(inv.issued_at)}</div>
                      {inv.payment_method ? <div className="mt-1 text-xs text-zinc-600">Method: {inv.payment_method}</div> : null}
                    </div>
                    <div className="text-sm font-semibold text-zinc-900">
                      {typeof inv.total === 'number'
                        ? inv.total.toLocaleString(undefined, { style: 'currency', currency: 'INR' })
                        : String(inv.total)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function detailsResemblesExisting(details: UserDetails | null): boolean {
  if (!details) return false
  if (typeof details.user_details_id === 'number') return true
  if (typeof details.user_id === 'number') return true
  return false
}
