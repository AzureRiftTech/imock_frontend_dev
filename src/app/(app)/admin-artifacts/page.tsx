'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/error'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import {
  Plus, Pencil, Trash2, Award, Trophy, Users,
  Gift, Zap, RefreshCw, Star, CalendarDays,
} from 'lucide-react'
import { sweetAlert, sweetConfirm } from '@/lib/swal'

// ── Types ─────────────────────────────────────────────────────────────────────
type ArtifactDef = {
  artifact_id: number
  name: string
  description: string | null
  icon_url: string | null
  rarity: string
  trigger_event: string
  trigger_threshold: number
  points_reward: number
  is_repeatable: boolean
  max_count: number | null
  is_active: boolean
}

type League = {
  league_id: number
  name: string
  color: string
  min_points: number
  max_points: number | null
  sort_order: number
  is_active: boolean
}

type ActivityEntry = {
  log_id: number
  user_id: number
  username: string
  email: string
  event_type: string
  points_delta: number
  note: string | null
  created_at: string
  artifact_name: string | null
}

const RARITY_OPTIONS = ['common', 'uncommon', 'rare', 'epic', 'legendary']
const TRIGGER_OPTIONS = [
  { value: 'mock_test',     label: 'Mock Interview' },
  { value: 'resume_update', label: 'CV / Resume Update' },
  { value: 'referral',      label: 'Referral' },
  { value: 'participation', label: 'Participation' },
  { value: 'streak',        label: 'Activity Streak' },
  { value: 'manual',        label: 'Manual (Admin)' },
]

const EMPTY_DEF: Omit<ArtifactDef, 'artifact_id'> = {
  name: '', description: '', icon_url: '', rarity: 'common',
  trigger_event: 'mock_test', trigger_threshold: 1, points_reward: 50,
  is_repeatable: false, max_count: null, is_active: true,
}

const EMPTY_LEAGUE: Omit<League, 'league_id'> = {
  name: '', color: '#9f50e9', min_points: 0, max_points: null, sort_order: 0, is_active: true,
}

type PlatformEvent = {
  event_id: number; title: string; description: string | null
  type: string; banner_image_url: string | null
  start_date: string | null; end_date: string | null
  registration_url: string | null; prize_pool: string | null
  difficulty: string; organizer: string | null
  max_participants: number | null; sort_order: number; is_active: boolean; is_featured: boolean
  tags: string[] | string
}

const EVENT_TYPE_OPTIONS = [
  { value: 'hackathon',        label: 'Hackathon' },
  { value: 'coding_challenge', label: 'Coding Challenge' },
  { value: 'webinar',          label: 'Webinar' },
  { value: 'workshop',         label: 'Workshop' },
  { value: 'bootcamp',         label: 'Bootcamp' },
]

const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced', 'open']

const EMPTY_EVENT: Omit<PlatformEvent, 'event_id'> = {
  title: '', description: '', type: 'hackathon', banner_image_url: '',
  start_date: '', end_date: '', registration_url: '', prize_pool: '',
  difficulty: 'open', organizer: '', max_participants: null,
  sort_order: 0, is_active: true, is_featured: false, tags: '',
}

function fmtDate(s: string) {
  return new Date(s).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Artifact Form ─────────────────────────────────────────────────────────────
function ArtifactForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Partial<ArtifactDef>
  onSave: (data: Partial<ArtifactDef>) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState({ ...EMPTY_DEF, ...initial })
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Icon URL</label>
          <input
            value={form.icon_url ?? ''}
            onChange={(e) => set('icon_url', e.target.value || null)}
            placeholder="https://..."
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-zinc-600 mb-1">Description</label>
          <textarea
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value || null)}
            rows={2}
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Rarity</label>
          <select
            value={form.rarity}
            onChange={(e) => set('rarity', e.target.value)}
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none"
          >
            {RARITY_OPTIONS.map((r) => (<option key={r} value={r} className="capitalize">{r}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Trigger Event</label>
          <select
            value={form.trigger_event}
            onChange={(e) => set('trigger_event', e.target.value)}
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none"
          >
            {TRIGGER_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Trigger Threshold</label>
          <input
            type="number" min={1}
            value={form.trigger_threshold}
            onChange={(e) => set('trigger_threshold', parseInt(e.target.value) || 1)}
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Points Reward</label>
          <input
            type="number" min={0}
            value={form.points_reward}
            onChange={(e) => set('points_reward', parseInt(e.target.value) || 0)}
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-6 flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={form.is_repeatable}
            onChange={(e) => set('is_repeatable', e.target.checked)}
            className="rounded accent-[#9f50e9]"
          />
          Repeatable
        </label>
        {form.is_repeatable && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-500">Max Count</label>
            <input
              type="number" min={1}
              placeholder="∞"
              value={form.max_count ?? ''}
              onChange={(e) => set('max_count', e.target.value ? parseInt(e.target.value) : null)}
              className="w-20 border border-zinc-200 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none"
            />
          </div>
        )}
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => set('is_active', e.target.checked)}
            className="rounded accent-[#9f50e9]"
          />
          Active
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-[#9f50e9] text-white rounded-lg text-sm font-medium hover:bg-[#8a40d4] disabled:opacity-50 transition"
        >
          {saving ? 'Saving…' : 'Save Artifact'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-600 hover:bg-zinc-50">
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── League Form ───────────────────────────────────────────────────────────────
function LeagueForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Partial<League>
  onSave: (data: Partial<League>) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState({ ...EMPTY_LEAGUE, ...initial })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Name *</label>
          <input required value={form.name} onChange={(e) => set('name', e.target.value)}
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Color</label>
          <div className="flex items-center gap-2">
            <input type="color" value={form.color} onChange={(e) => set('color', e.target.value)} className="w-10 h-9 border border-zinc-200 rounded cursor-pointer" />
            <input value={form.color} onChange={(e) => set('color', e.target.value)} className="flex-1 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Min Points *</label>
          <input type="number" min={0} value={form.min_points} onChange={(e) => set('min_points', parseInt(e.target.value) || 0)}
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Max Points (blank = ∞)</label>
          <input type="number" min={1} placeholder="∞"
            value={form.max_points ?? ''}
            onChange={(e) => set('max_points', e.target.value ? parseInt(e.target.value) : null)}
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Sort Order</label>
          <input type="number" min={0} value={form.sort_order} onChange={(e) => set('sort_order', parseInt(e.target.value) || 0)}
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none" />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="rounded accent-[#9f50e9]" />
            Active
          </label>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="px-4 py-2 bg-[#9f50e9] text-white rounded-lg text-sm font-medium hover:bg-[#8a40d4] disabled:opacity-50 transition">
          {saving ? 'Saving…' : 'Save League'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-600 hover:bg-zinc-50">Cancel</button>
      </div>
    </form>
  )
}

// ── Event Form ────────────────────────────────────────────────────────────────
function EventAdminForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Partial<PlatformEvent>
  onSave: (data: Partial<PlatformEvent>) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState({ ...EMPTY_EVENT, ...initial })
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="block text-xs text-zinc-500 mb-1">Title *</label>
        <input required value={form.title} onChange={(e) => set('title', e.target.value)}
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none" />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs text-zinc-500 mb-1">Description</label>
        <textarea rows={2} value={form.description ?? ''} onChange={(e) => set('description', e.target.value)}
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none resize-none" />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Type</label>
        <select value={form.type} onChange={(e) => set('type', e.target.value)}
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none">
          {EVENT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Difficulty</label>
        <select value={form.difficulty} onChange={(e) => set('difficulty', e.target.value)}
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none">
          {DIFFICULTY_OPTIONS.map((d) => <option key={d} value={d} className="capitalize">{d}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Start Date</label>
        <input type="datetime-local" value={form.start_date ?? ''} onChange={(e) => set('start_date', e.target.value)}
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none" />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">End Date</label>
        <input type="datetime-local" value={form.end_date ?? ''} onChange={(e) => set('end_date', e.target.value)}
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none" />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Prize Pool</label>
        <input value={form.prize_pool ?? ''} onChange={(e) => set('prize_pool', e.target.value)} placeholder="e.g. $5,000"
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none" />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Organizer</label>
        <input value={form.organizer ?? ''} onChange={(e) => set('organizer', e.target.value)}
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none" />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Max Participants</label>
        <input type="number" min={1} value={form.max_participants ?? ''} onChange={(e) => set('max_participants', e.target.value ? Number(e.target.value) : null)}
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none" />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Sort Order</label>
        <input type="number" value={form.sort_order ?? 0} onChange={(e) => set('sort_order', Number(e.target.value))}
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none" />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs text-zinc-500 mb-1">Registration URL</label>
        <input value={form.registration_url ?? ''} onChange={(e) => set('registration_url', e.target.value)}
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none" />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs text-zinc-500 mb-1">Banner Image URL</label>
        <input value={form.banner_image_url ?? ''} onChange={(e) => set('banner_image_url', e.target.value)}
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none" />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs text-zinc-500 mb-1">Tags (comma-separated)</label>
        <input value={Array.isArray(form.tags) ? form.tags.join(', ') : (form.tags ?? '')}
          onChange={(e) => set('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))}
          placeholder="React, Node.js, Open Source"
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none" />
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
          <span className="text-sm text-zinc-700">Active</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} />
          <span className="text-sm text-zinc-700">Featured</span>
        </label>
      </div>
      <div className="sm:col-span-2 flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-600 hover:bg-zinc-50">Cancel</button>
        <button type="submit" disabled={saving} className="px-4 py-2 bg-[#9f50e9] text-white rounded-lg text-sm font-medium hover:bg-[#8a40d4] disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Event'}
        </button>
      </div>
    </form>
  )
}

// ── Grant / Award Panel ───────────────────────────────────────────────────────
function GrantPanel({ artifacts }: { artifacts: ArtifactDef[] }) {
  const [grantUserId, setGrantUserId] = useState('')
  const [grantArtifactId, setGrantArtifactId] = useState('')
  const [grantNote, setGrantNote] = useState('')
  const [pointsUserId, setPointsUserId] = useState('')
  const [points, setPoints] = useState('')
  const [pointsNote, setPointsNote] = useState('')
  const [saving, setSaving] = useState(false)

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/artifacts/admin/grant', { user_id: grantUserId, artifact_id: grantArtifactId, note: grantNote || undefined })
      await sweetAlert('Artifact granted!', '', 'success')
      setGrantUserId(''); setGrantArtifactId(''); setGrantNote('')
    } catch (err) {
      await sweetAlert('Error', getApiErrorMessage(err) || 'Failed', 'error')
    } finally { setSaving(false) }
  }

  const handlePoints = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/artifacts/admin/award-points', { user_id: pointsUserId, points: Number(points), note: pointsNote || undefined })
      await sweetAlert('Points awarded!', '', 'success')
      setPointsUserId(''); setPoints(''); setPointsNote('')
    } catch (err) {
      await sweetAlert('Error', getApiErrorMessage(err) || 'Failed', 'error')
    } finally { setSaving(false) }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl shadow p-5">
        <h3 className="font-semibold text-zinc-800 mb-4 flex items-center gap-2"><Gift size={16} className="text-[#9f50e9]" />Grant Artifact to User</h3>
        <form onSubmit={handleGrant} className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">User ID</label>
            <input required value={grantUserId} onChange={(e) => setGrantUserId(e.target.value)} placeholder="123" className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Artifact</label>
            <select required value={grantArtifactId} onChange={(e) => setGrantArtifactId(e.target.value)} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none">
              <option value="">Select artifact…</option>
              {artifacts.filter(a => a.is_active).map((a) => (<option key={a.artifact_id} value={a.artifact_id}>{a.name} ({a.rarity})</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Note (optional)</label>
            <input value={grantNote} onChange={(e) => setGrantNote(e.target.value)} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none" />
          </div>
          <button type="submit" disabled={saving} className="w-full py-2 bg-[#9f50e9] text-white rounded-lg text-sm font-medium hover:bg-[#8a40d4] disabled:opacity-50">Grant Artifact</button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow p-5">
        <h3 className="font-semibold text-zinc-800 mb-4 flex items-center gap-2"><Zap size={16} className="text-yellow-500" />Award Points to User</h3>
        <form onSubmit={handlePoints} className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">User ID</label>
            <input required value={pointsUserId} onChange={(e) => setPointsUserId(e.target.value)} placeholder="123" className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Points</label>
            <input required type="number" min={1} value={points} onChange={(e) => setPoints(e.target.value)} placeholder="100" className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Note (optional)</label>
            <input value={pointsNote} onChange={(e) => setPointsNote(e.target.value)} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#9f50e9] outline-none" />
          </div>
          <button type="submit" disabled={saving} className="w-full py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50">Award Points</button>
        </form>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ArtifactsAdminPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [tab, setTab] = useState<'artifacts' | 'leagues' | 'grant' | 'activity' | 'events'>('artifacts')
  const [artifacts, setArtifacts] = useState<ArtifactDef[]>([])
  const [leagues, setLeagues] = useState<League[]>([])
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [editingArtifact, setEditingArtifact] = useState<Partial<ArtifactDef> | null>(null)
  const [editingLeague, setEditingLeague] = useState<Partial<League> | null>(null)
  const [events, setEvents] = useState<PlatformEvent[]>([])
  const [editingEvent, setEditingEvent] = useState<Partial<PlatformEvent> | null>(null)
  const [activityOffset, setActivityOffset] = useState(0)
  const ACTIVITY_LIMIT = 50

  // Guard: super_admin only
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (user && (user as any).role !== 'super_admin') router.replace('/dashboard')
  }, [user, router])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [artRes, leagueRes, actRes, evRes] = await Promise.all([
        api.get('/artifacts/admin'),
        api.get('/leaderboard/admin/leagues'),
        api.get('/artifacts/admin/activity', { params: { limit: ACTIVITY_LIMIT, offset: activityOffset } }),
        api.get('/events/admin'),
      ])
      setArtifacts(artRes.data)
      setLeagues(leagueRes.data)
      setActivity(actRes.data)
      setEvents(evRes.data)
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }, [activityOffset])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Artifact CRUD ────────────────────────────────────────────────────────
  const saveArtifact = async (data: Partial<ArtifactDef>) => {
    if (data.artifact_id) {
      await api.put(`/artifacts/admin/${data.artifact_id}`, data)
    } else {
      await api.post('/artifacts/admin', data)
    }
    setEditingArtifact(null)
    await fetchAll()
  }

  const deleteArtifact = async (id: number) => {
    const ok = await sweetConfirm('This will also remove it from user collections.', 'Delete Artifact?')
    if (!ok) return
    await api.delete(`/artifacts/admin/${id}`)
    await fetchAll()
  }

  // ── League CRUD ──────────────────────────────────────────────────────────
  const saveLeague = async (data: Partial<League>) => {
    if (data.league_id) {
      await api.put(`/leaderboard/admin/leagues/${data.league_id}`, data)
    } else {
      await api.post('/leaderboard/admin/leagues', data)
    }
    setEditingLeague(null)
    await fetchAll()
  }

  const deleteLeague = async (id: number) => {
    const ok = await sweetConfirm('This action cannot be undone.', 'Delete League?')
    if (!ok) return
    await api.delete(`/leaderboard/admin/leagues/${id}`)
    await fetchAll()
  }

  const TABS = [
    { key: 'artifacts', label: 'Artifacts',      icon: <Award size={14} /> },
    { key: 'leagues',   label: 'Leagues',         icon: <Trophy size={14} /> },
    { key: 'events',    label: 'Events',          icon: <CalendarDays size={14} /> },
    { key: 'grant',     label: 'Grant / Award',   icon: <Gift size={14} /> },
    { key: 'activity',  label: 'Activity Log',    icon: <Users size={14} /> },
  ] as const

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800 flex items-center gap-2">
              <Star className="text-[#9f50e9]" /> Artifacts Admin
            </h1>
            <p className="text-sm text-zinc-500 mt-1">Manage artifacts, leagues, and award points/artifacts to users</p>
          </div>
          <button onClick={fetchAll} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-[#9f50e9] border border-zinc-200 rounded-lg px-3 py-2 hover:border-[#9f50e9] transition">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${tab === t.key ? 'bg-[#9f50e9] text-white shadow' : 'bg-white border border-zinc-200 text-zinc-600 hover:border-[#9f50e9] hover:text-[#9f50e9]'}`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
        {loading && <div className="text-center py-12 text-zinc-400">Loading…</div>}

        {/* ── Artifacts Tab ──────────────────────────────────────────────── */}
        {!loading && tab === 'artifacts' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setEditingArtifact({ ...EMPTY_DEF })}
                className="flex items-center gap-2 bg-[#9f50e9] text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-[#8a40d4] transition"
              >
                <Plus size={16} /> New Artifact
              </button>
            </div>

            {editingArtifact !== null && (
              <div className="rounded-2xl bg-white shadow p-6">
                <h3 className="font-semibold text-zinc-800 mb-4">
                  {(editingArtifact as ArtifactDef).artifact_id ? 'Edit Artifact' : 'New Artifact'}
                </h3>
                <ArtifactForm initial={editingArtifact} onSave={saveArtifact} onCancel={() => setEditingArtifact(null)} />
              </div>
            )}

            <div className="rounded-2xl bg-white shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-400">
                    <th className="px-4 py-3 text-left">Artifact</th>
                    <th className="px-4 py-3 text-left">Rarity</th>
                    <th className="px-4 py-3 text-left">Trigger</th>
                    <th className="px-4 py-3 text-right">Threshold</th>
                    <th className="px-4 py-3 text-right">Points</th>
                    <th className="px-4 py-3 text-center">Active</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {artifacts.map((a) => (
                    <tr key={a.artifact_id} className="border-b last:border-0 hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-800">{a.name}</p>
                        {a.description && <p className="text-xs text-zinc-400 truncate max-w-[200px]">{a.description}</p>}
                      </td>
                      <td className="px-4 py-3 capitalize text-xs font-medium text-zinc-600">{a.rarity}</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">{a.trigger_event.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-right text-zinc-700">{a.trigger_threshold}×</td>
                      <td className="px-4 py-3 text-right font-bold text-[#9f50e9]">{a.points_reward}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${a.is_active ? 'bg-green-400' : 'bg-red-300'}`} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditingArtifact(a)} className="p-1.5 hover:text-[#9f50e9] text-zinc-400 transition">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => deleteArtifact(a.artifact_id)} className="p-1.5 hover:text-red-500 text-zinc-400 transition">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {artifacts.length === 0 && (
                    <tr><td colSpan={7} className="py-12 text-center text-zinc-400">No artifacts yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Leagues Tab ────────────────────────────────────────────────── */}
        {!loading && tab === 'leagues' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setEditingLeague({ ...EMPTY_LEAGUE })}
                className="flex items-center gap-2 bg-[#9f50e9] text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-[#8a40d4] transition"
              >
                <Plus size={16} /> New League
              </button>
            </div>

            {editingLeague !== null && (
              <div className="rounded-2xl bg-white shadow p-6">
                <h3 className="font-semibold text-zinc-800 mb-4">
                  {(editingLeague as League).league_id ? 'Edit League' : 'New League'}
                </h3>
                <LeagueForm initial={editingLeague} onSave={saveLeague} onCancel={() => setEditingLeague(null)} />
              </div>
            )}

            <div className="rounded-2xl bg-white shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-400">
                    <th className="px-4 py-3 text-left">League</th>
                    <th className="px-4 py-3 text-right">Min Pts</th>
                    <th className="px-4 py-3 text-right">Max Pts</th>
                    <th className="px-4 py-3 text-right">Sort</th>
                    <th className="px-4 py-3 text-center">Active</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leagues.map((l) => (
                    <tr key={l.league_id} className="border-b last:border-0 hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                          <span className="font-medium text-zinc-800">{l.name}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{l.min_points.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{l.max_points !== null ? l.max_points.toLocaleString() : '∞'}</td>
                      <td className="px-4 py-3 text-right text-zinc-500">{l.sort_order}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${l.is_active ? 'bg-green-400' : 'bg-red-300'}`} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditingLeague(l)} className="p-1.5 hover:text-[#9f50e9] text-zinc-400 transition"><Pencil size={14} /></button>
                          <button onClick={() => deleteLeague(l.league_id)} className="p-1.5 hover:text-red-500 text-zinc-400 transition"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {leagues.length === 0 && (
                    <tr><td colSpan={6} className="py-12 text-center text-zinc-400">No leagues defined.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Events Tab ────────────────────────────────────────────────── */}
        {!loading && tab === 'events' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setEditingEvent({ ...EMPTY_EVENT })}
                className="flex items-center gap-2 bg-[#9f50e9] text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-[#8a40d4] transition"
              >
                <Plus size={16} /> New Event
              </button>
            </div>

            {editingEvent !== null && (
              <div className="rounded-2xl bg-white shadow p-6">
                <h3 className="font-semibold text-zinc-800 mb-4">
                  {(editingEvent as PlatformEvent).event_id ? 'Edit Event' : 'New Event'}
                </h3>
                <EventAdminForm
                  initial={editingEvent}
                  onSave={async (data) => {
                    if ((data as PlatformEvent).event_id) {
                      await api.put(`/events/admin/${(data as PlatformEvent).event_id}`, data)
                    } else {
                      await api.post('/events/admin', data)
                    }
                    setEditingEvent(null)
                    await fetchAll()
                  }}
                  onCancel={() => setEditingEvent(null)}
                />
              </div>
            )}

            <div className="rounded-2xl bg-white shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-400">
                    <th className="px-4 py-3 text-left">Event</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Dates</th>
                    <th className="px-4 py-3 text-center">Featured</th>
                    <th className="px-4 py-3 text-center">Active</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev.event_id} className="border-b last:border-0 hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-800">{ev.title}</p>
                        {ev.prize_pool && <p className="text-xs text-[#9f50e9]">{ev.prize_pool}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500 capitalize">{ev.type.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-xs text-zinc-400">
                        {ev.start_date ? fmtDate(ev.start_date) : '–'} → {ev.end_date ? fmtDate(ev.end_date) : '–'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${ev.is_featured ? 'bg-yellow-400' : 'bg-zinc-200'}`} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${ev.is_active ? 'bg-green-400' : 'bg-red-300'}`} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditingEvent(ev)} className="p-1.5 hover:text-[#9f50e9] text-zinc-400 transition"><Pencil size={14} /></button>
                          <button onClick={async () => {
                            const ok = await sweetConfirm('Delete this event?', 'Confirm')
                            if (!ok) return
                            await api.delete(`/events/admin/${ev.event_id}`)
                            await fetchAll()
                          }} className="p-1.5 hover:text-red-500 text-zinc-400 transition"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {events.length === 0 && (
                    <tr><td colSpan={6} className="py-12 text-center text-zinc-400">No events yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Grant / Award Tab ──────────────────────────────────────────── */}
        {!loading && tab === 'grant' && <GrantPanel artifacts={artifacts} />}

        {/* ── Activity Log Tab ───────────────────────────────────────────── */}
        {!loading && tab === 'activity' && (
          <div className="rounded-2xl bg-white shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-400">
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Event</th>
                    <th className="px-4 py-3 text-left">Artifact</th>
                    <th className="px-4 py-3 text-right">Points</th>
                    <th className="px-4 py-3 text-left">Note</th>
                    <th className="px-4 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((entry) => (
                    <tr key={entry.log_id} className="border-b last:border-0 hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-800">{entry.username}</p>
                        <p className="text-xs text-zinc-400">{entry.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600">{entry.event_type.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-xs text-zinc-600">{entry.artifact_name ?? '–'}</td>
                      <td className="px-4 py-3 text-right">
                        {entry.points_delta > 0 ? (
                          <span className="font-bold text-[#9f50e9]">+{entry.points_delta}</span>
                        ) : '–'}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400 max-w-[180px] truncate">{entry.note ?? '–'}</td>
                      <td className="px-4 py-3 text-xs text-zinc-400">{fmtDate(entry.created_at)}</td>
                    </tr>
                  ))}
                  {activity.length === 0 && (
                    <tr><td colSpan={6} className="py-12 text-center text-zinc-400">No activity yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-zinc-500">
              <button disabled={activityOffset === 0} onClick={() => setActivityOffset((o) => Math.max(0, o - ACTIVITY_LIMIT))}
                className="px-3 py-1.5 border rounded-lg hover:bg-zinc-50 disabled:opacity-40">Newer</button>
              <button disabled={activity.length < ACTIVITY_LIMIT} onClick={() => setActivityOffset((o) => o + ACTIVITY_LIMIT)}
                className="px-3 py-1.5 border rounded-lg hover:bg-zinc-50 disabled:opacity-40">Older</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
