'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/error'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function toDateTimeLocalValue(value: string | null | undefined): string {
  if (!value) return ''
  if (value.includes(' ')) return value.replace(' ', 'T').slice(0, 16)
  if (value.includes('T')) return value.slice(0, 16)
  return value
}

function formatDisplayDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

export default function SchedulePage() {
  const router = useRouter()
  const { user } = useAuth()
  const userId = (user && typeof user === 'object') ? (user.user_id ?? (user as any).id) : null

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [categories, setCategories] = React.useState<any[]>([])
  const [interviews, setInterviews] = React.useState<any[]>([])

  const [form, setForm] = React.useState({
    company_name: '',
    scheduled_at: '',
    position: '',
    category_name: '',
    experience_required: '',
    status: 'scheduled',
    job_description: '',
  })

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [catsRes, interviewsRes] = await Promise.all([
        api.get('/interviews/categories'),
        api.get('/interviews', { params: userId ? { user_id: userId } : undefined }),
      ])
      setCategories((catsRes.data as any[]) || [])
      const loadedInterviews = (interviewsRes.data as any[]) || []
      setInterviews(loadedInterviews)
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [userId])

  React.useEffect(() => { load() }, [load])

  const createInterview = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        user_id: userId ?? undefined,
        company_name: form.company_name,
        scheduled_at: form.scheduled_at,
        position: form.position,
        category_name: form.category_name || undefined,
        experience_required: form.experience_required || undefined,
        status: form.status || undefined,
        job_description: form.job_description || undefined,
      }
      await api.post('/interviews', payload)
      setForm({ company_name: '', scheduled_at: '', position: '', category_name: '', experience_required: '', status: 'scheduled', job_description: '' })
      await load()
    } catch (err: any) {
      setError(getApiErrorMessage(err) || (err?.response?.data ? String(err.response.data) : 'Failed to create interview'))
    } finally {
      setSaving(false)
    }
  }

  const deleteInterview = async (id: number) => {
    try {
      await api.delete(`/interviews/${id}`)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to delete interview')
    }
  }

  return (
    <div className="space-y-6 px-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schedule Interviews</h1>
          <p className="mt-1 text-sm text-zinc-600">Create an interview and view upcoming or past sessions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.push('/interviews')}>Back</Button>
          <Button onClick={() => load()} disabled={loading}>Refresh</Button>
        </div>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <Card className="bg-white/60">
        <CardHeader>
          <CardTitle className="text-base">Schedule an interview</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createInterview} className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Company</Label>
              <Input value={form.company_name} onChange={(e) => setForm((p) => ({ ...p, company_name: e.target.value }))} required />
            </div>
            <div className="grid gap-2">
              <Label>Scheduled at</Label>
              <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm((p) => ({ ...p, scheduled_at: e.target.value }))} required />
            </div>
            <div className="grid gap-2">
              <Label>Position</Label>
              <Input value={form.position} onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))} required />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <select className="h-10 w-full rounded-2xl border" value={form.category_name} onChange={(e) => setForm((p) => ({ ...p, category_name: e.target.value }))}>
                <option value="">None</option>
                {categories.map((c) => <option key={c.job_category_id} value={c.category_name}>{c.category_name}</option>)}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Experience</Label>
              <Input value={form.experience_required} onChange={(e) => setForm((p) => ({ ...p, experience_required: e.target.value }))} />
            </div>
            <div className="md:col-span-2 grid gap-2">
              <Label>Job description (optional)</Label>
              <textarea className="min-h-24 w-full rounded-2xl border px-3 py-2" value={form.job_description} onChange={(e) => setForm((p) => ({ ...p, job_description: e.target.value }))} />
            </div>
            <div className="md:col-span-2 flex items-center justify-end gap-2">
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create interview'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white/60">
          <CardHeader>
            <CardTitle className="text-base">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-zinc-600">Loading…</div>
            ) : interviews.filter(i => new Date(i.scheduled_at).getTime() >= Date.now()).length === 0 ? (
              <div className="text-sm text-zinc-600">No upcoming interviews.</div>
            ) : (
              <div className="space-y-3">
                {interviews.filter(i => new Date(i.scheduled_at).getTime() >= Date.now()).map((row) => (
                  <div key={row.interview_id} className="rounded-2xl border p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{row.company_name}</div>
                        <div className="text-xs text-zinc-600">{row.position}</div>
                        <div className="text-xs text-zinc-600 mt-1">{formatDisplayDate(row.scheduled_at)}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => router.push(`/mock-interview/${row.interview_id}`)}>Mock Interview</Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteInterview(row.interview_id)}>Delete</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/60">
          <CardHeader>
            <CardTitle className="text-base">Past</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-zinc-600">Loading…</div>
            ) : interviews.filter(i => new Date(i.scheduled_at).getTime() < Date.now()).length === 0 ? (
              <div className="text-sm text-zinc-600">No past interviews.</div>
            ) : (
              <div className="space-y-3">
                {interviews.filter(i => new Date(i.scheduled_at).getTime() < Date.now()).map((row) => (
                  <div key={row.interview_id} className="rounded-2xl border p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{row.company_name}</div>
                        <div className="text-xs text-zinc-600">{row.position}</div>
                        <div className="text-xs text-zinc-600 mt-1">{formatDisplayDate(row.scheduled_at)}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => router.push(`/mock-interview/${row.interview_id}`)}>Mock Interview</Button>
                        <Button variant="secondary" size="sm" onClick={() => router.push(`/mock-interview/${row.interview_id}/result`)}>Results</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}