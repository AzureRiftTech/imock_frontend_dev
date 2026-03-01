'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/error'
import {
  Trophy, Package, Zap, Flame, Star, Target, Users, Crown,
  ChevronUp, ChevronDown, Minus, Medal, Clock, Lock,
  CheckCircle2, ChevronLeft, ChevronRight, CalendarDays,
  Rocket, Code2, MonitorPlay, GraduationCap, Layers, ExternalLink,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type League = {
  league_id: number; name: string; color: string
  min_points: number; max_points: number | null; member_count?: number
}

type LeaderboardEntry = {
  user_id: number; username: string; total_points: number
  mock_tests_count: number; referrals_count: number; streak_days: number
  rank: number; league: League | null
}

type TopPerformer = {
  rank: number; user_id: number; username: string
  total_points: number; mock_tests_count: number; streak_days: number
  league: League | null
  top_artifacts: { name: string; icon_url: string | null; rarity: string }[]
}

type MyRank = {
  rank: number; total: number
  points: {
    total_points: number; mock_tests_count: number; referrals_count: number
    resume_updates_count: number; participation_count: number; streak_days: number
  }
  league: League | null; next_league: League | null
  points_to_next_league: number; artifact_count: number
  nearby: {
    above: { user_id: number; username: string; total_points: number }[]
    below: { user_id: number; username: string; total_points: number }[]
  }
}

type ArtifactDef = {
  artifact_id: number; name: string; description: string | null
  icon_url: string | null; rarity: string; trigger_event: string
  trigger_threshold: number; points_reward: number; is_repeatable: boolean
}

type UserArtifact = ArtifactDef & {
  id: number; artifact_id: number; count: number
  first_earned_at: string; last_earned_at: string
}

type ActivityEntry = {
  log_id: number; event_type: string; points_delta: number
  note: string | null; created_at: string
  artifact_name: string | null; artifact_rarity: string | null
}

type PlatformEvent = {
  event_id: number; title: string; description: string | null
  type: string; banner_image_url: string | null
  start_date: string | null; end_date: string | null
  registration_url: string | null; prize_pool: string | null
  difficulty: string; organizer: string | null
  participants_count: number; max_participants: number | null
  tags: string[]; is_featured: boolean
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const RARITY_ORDER = ['legendary', 'epic', 'rare', 'uncommon', 'common']

const RARITY_STYLE: Record<string, { card: string; badge: string; border: string; glow: string; emoji: string }> = {
  legendary: { card: 'bg-gradient-to-br from-yellow-50 to-amber-50', badge: 'bg-yellow-100 text-yellow-700 border-yellow-300', border: 'border-yellow-300', glow: 'ring-2 ring-yellow-300 ring-offset-1', emoji: '🌟' },
  epic:      { card: 'bg-gradient-to-br from-purple-50 to-fuchsia-50', badge: 'bg-purple-100 text-purple-700 border-purple-300', border: 'border-purple-300', glow: 'ring-2 ring-purple-300 ring-offset-1', emoji: '💜' },
  rare:      { card: 'bg-gradient-to-br from-blue-50 to-sky-50', badge: 'bg-blue-100 text-blue-700 border-blue-300', border: 'border-blue-300', glow: '', emoji: '💎' },
  uncommon:  { card: 'bg-gradient-to-br from-green-50 to-emerald-50', badge: 'bg-green-100 text-green-700 border-green-300', border: 'border-green-300', glow: '', emoji: '🟢' },
  common:    { card: 'bg-white', badge: 'bg-gray-100 text-gray-600 border-gray-200', border: 'border-gray-200', glow: '', emoji: '⚪' },
}

const EVENT_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; gradient: string; border: string }> = {
  hackathon:        { label: 'Hackathon',        icon: <Rocket size={14} />,      gradient: 'from-orange-500 to-red-500',    border: 'border-orange-200' },
  coding_challenge: { label: 'Coding Challenge', icon: <Code2 size={14} />,       gradient: 'from-blue-500 to-cyan-500',     border: 'border-blue-200' },
  webinar:          { label: 'Webinar',          icon: <MonitorPlay size={14} />, gradient: 'from-purple-500 to-violet-500', border: 'border-purple-200' },
  workshop:         { label: 'Workshop',         icon: <Layers size={14} />,      gradient: 'from-teal-500 to-green-500',    border: 'border-teal-200' },
  bootcamp:         { label: 'Bootcamp',         icon: <GraduationCap size={14} />, gradient: 'from-pink-500 to-rose-500',   border: 'border-pink-200' },
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner:     'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced:     'bg-red-100 text-red-700',
  open:         'bg-blue-100 text-blue-700',
}

const TRIGGER_LABELS: Record<string, string> = {
  mock_test: '🎯 Mock Interview', resume_update: '📄 CV Update',
  referral: '🤝 Referral', participation: '🏆 Participation',
  streak: '🔥 Streak', manual: '⚡ Special Award',
}

// ═══════════════════════════════════════════════════════════════════════════════
// SMALL HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function fmtDate(s: string | null | undefined) {
  if (!s) return '–'
  return new Date(s).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateTime(s: string | null | undefined) {
  if (!s) return '–'
  return new Date(s).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function isUpcoming(e: PlatformEvent) {
  if (!e.start_date) return false
  return new Date(e.start_date) > new Date()
}

function isLive(e: PlatformEvent) {
  const now = new Date()
  return e.start_date && e.end_date && new Date(e.start_date) <= now && new Date(e.end_date) >= now
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>
  if (rank === 2) return <span className="text-2xl">🥈</span>
  if (rank === 3) return <span className="text-2xl">🥉</span>
  return <span className="text-sm font-bold text-zinc-400">#{rank}</span>
}

function LeaguePill({ league }: { league: League | null }) {
  if (!league) return <span className="text-xs text-zinc-400">Unranked</span>
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border"
      style={{ borderColor: league.color, color: league.color, backgroundColor: `${league.color}1a` }}>
      <Star size={10} /> {league.name}
    </span>
  )
}

function StatChip({ icon, value, label, sm }: { icon: React.ReactNode; value: number | string; label: string; sm?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-0.5 ${sm ? 'px-2 py-1.5' : 'px-3 py-2'} bg-zinc-50 rounded-lg border border-zinc-100`}>
      <span className="text-[#9f50e9]">{icon}</span>
      <span className={`${sm ? 'text-sm' : 'text-base'} font-bold text-zinc-800`}>{value}</span>
      <span className="text-[10px] text-zinc-400">{label}</span>
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition whitespace-nowrap ${active ? 'bg-[#9f50e9] text-white shadow' : 'bg-white border border-zinc-200 text-zinc-600 hover:border-[#9f50e9] hover:text-[#9f50e9]'}`}>
      {children}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT CARD
// ═══════════════════════════════════════════════════════════════════════════════

function EventCard({ event, onRegister, registered }: {
  event: PlatformEvent
  onRegister: (id: number) => void
  registered: boolean
}) {
  const cfg = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG.hackathon
  const live = isLive(event)
  const upcoming = isUpcoming(event)

  return (
    <div className={`relative flex-none w-72 sm:w-80 rounded-2xl bg-white border ${cfg.border} shadow-sm hover:shadow-md transition-shadow overflow-hidden`}>
      {/* Banner / gradient header */}
      <div className={`h-28 bg-gradient-to-br ${cfg.gradient} flex items-end p-4 relative`}>
        {event.banner_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.banner_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        <div className="relative flex items-center justify-between w-full">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs font-bold text-white/90 bg-white/20 rounded-full px-2.5 py-0.5 w-fit">
              {cfg.icon} {cfg.label}
            </span>
            {live && <span className="flex items-center gap-1 text-[10px] font-bold text-white animate-pulse">● LIVE NOW</span>}
            {upcoming && !live && <span className="text-[10px] text-white/80">{fmtDate(event.start_date)}</span>}
          </div>
          {event.is_featured && <span className="text-yellow-300 text-lg">🌟</span>}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3">
        <div>
          <h3 className="font-bold text-zinc-800 text-sm leading-snug line-clamp-2">{event.title}</h3>
          {event.organizer && <p className="text-xs text-zinc-400 mt-0.5">by {event.organizer}</p>}
        </div>

        {event.description && (
          <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{event.description}</p>
        )}

        {/* Tags */}
        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.tags.slice(0, 3).map((t) => (
              <span key={t} className="text-[10px] bg-zinc-100 text-zinc-500 rounded-full px-2 py-0.5">{t}</span>
            ))}
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
          {event.prize_pool && (
            <span className="flex items-center gap-1 text-[#9f50e9] font-medium">
              <Trophy size={10} /> {event.prize_pool}
            </span>
          )}
          {event.difficulty && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${DIFFICULTY_COLORS[event.difficulty] || 'bg-zinc-100 text-zinc-600'}`}>
              {event.difficulty}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Users size={10} />
            {event.participants_count}{event.max_participants ? `/${event.max_participants}` : ''} joined
          </span>
          {event.start_date && event.end_date && (
            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
              <CalendarDays size={10} />
              {fmtDate(event.end_date)}
            </span>
          )}
        </div>

        {/* Action */}
        {registered ? (
          <span className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-green-50 text-green-600 text-xs font-semibold border border-green-200">
            <CheckCircle2 size={12} /> Registered
          </span>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => onRegister(event.event_id)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition bg-gradient-to-r ${cfg.gradient} text-white hover:opacity-90`}
            >
              Register
            </button>
            {event.registration_url && event.registration_url !== '#' && (
              <a href={event.registration_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-500 hover:border-[#9f50e9] hover:text-[#9f50e9]">
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ARTIFACT DETAIL MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function ArtifactDetailModal({ def, earned, onClose }: {
  def: ArtifactDef
  earned?: UserArtifact
  onClose: () => void
}) {
  const s = RARITY_STYLE[def.rarity] || RARITY_STYLE.common
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className={`relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden ${s.glow}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient */}
        <div className={`bg-gradient-to-br from-[#9f50e9] to-[#c084fc] p-6 flex flex-col items-center gap-3 relative`}>
          {/* Rarity glow ring */}
          <div className={`w-28 h-28 rounded-2xl ${earned ? 'bg-white' : 'bg-white/20'} flex items-center justify-center shadow-lg`}>
            {def.icon_url ? (
              <img
                src={def.icon_url}
                alt={def.name}
                className={`w-24 h-24 object-contain transition-all ${!earned ? 'grayscale opacity-60' : 'drop-shadow-md'}`}
              />
            ) : (
              <span className="text-5xl">{s.emoji}</span>
            )}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-extrabold text-white">{def.name}</h2>
            <span className={`inline-block mt-1 text-xs border rounded-full px-3 py-0.5 font-semibold ${s.badge}`}>
              {s.emoji} {def.rarity}
            </span>
          </div>
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Status banner */}
          {earned ? (
            <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-2">
              <CheckCircle2 size={16} className="text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-700">Earned!</p>
                <p className="text-xs text-green-500">First earned {fmtDate(earned.first_earned_at)}</p>
              </div>
              {earned.count > 1 && (
                <span className="ml-auto text-xs font-bold text-green-600 bg-green-100 rounded-full px-2 py-0.5">×{earned.count}</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-zinc-50 border border-zinc-200 px-4 py-2">
              <Lock size={16} className="text-zinc-400 shrink-0" />
              <p className="text-sm font-medium text-zinc-500">Not yet earned</p>
            </div>
          )}

          {/* Description */}
          {def.description && (
            <p className="text-sm text-zinc-600 leading-relaxed">{def.description}</p>
          )}

          {/* How to earn */}
          <div className="rounded-xl bg-purple-50 border border-purple-100 p-3 space-y-1.5">
            <p className="text-xs font-bold text-[#9f50e9] uppercase tracking-wide">How to Earn</p>
            <p className="text-sm text-zinc-700">
              {TRIGGER_LABELS[def.trigger_event] ?? def.trigger_event}
              {def.trigger_threshold > 1 ? ` × ${def.trigger_threshold}` : ''}
            </p>
            {def.is_repeatable && (
              <p className="text-xs text-zinc-400">Repeatable — can be earned multiple times</p>
            )}
          </div>

          {/* Points reward */}
          <div className="flex items-center justify-between rounded-xl bg-zinc-50 border border-zinc-100 px-4 py-3">
            <span className="text-sm text-zinc-600">Points Reward</span>
            <span className="flex items-center gap-1.5 font-extrabold text-[#9f50e9] text-lg">
              <Zap size={14} /> +{def.points_reward}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ARTIFACT CARDS
// ═══════════════════════════════════════════════════════════════════════════════

function ArtifactCard({ def, earned, onDetails }: { def: ArtifactDef; earned?: UserArtifact; onDetails: (def: ArtifactDef) => void }) {
  const s = RARITY_STYLE[def.rarity] || RARITY_STYLE.common
  if (!earned) {
    return (
      <div
        className={`relative rounded-xl border ${s.border} ${s.card} p-3 opacity-55 saturate-50 cursor-pointer hover:opacity-70 hover:saturate-100 transition-all`}
        onClick={() => onDetails(def)}
        title="Click to learn how to earn this artifact"
      >
        <div className="absolute top-2 right-2"><Lock size={11} className="text-zinc-400" /></div>
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="w-20 h-20 rounded-xl bg-zinc-100 flex items-center justify-center text-3xl shrink-0">
            {def.icon_url ? <img src={def.icon_url} alt={def.name} className="w-16 h-16 object-contain" /> : <span>{s.emoji}</span>}
          </div>
          <div className="text-center">
            <p className="font-semibold text-xs text-zinc-700">{def.name}</p>
            <span className={`text-[9px] border rounded-full px-1.5 py-0.5 ${s.badge}`}>{def.rarity}</span>
          </div>
        </div>
        <p className="text-[10px] text-zinc-400 line-clamp-2 mb-1.5 text-center">{def.description}</p>
        <div className="flex items-center justify-between text-[10px] text-zinc-400">
          <span>{TRIGGER_LABELS[def.trigger_event]?.split(' ').slice(1).join(' ') ?? def.trigger_event}</span>
          <span className="flex items-center gap-0.5"><Zap size={8} />{def.points_reward}</span>
        </div>
      </div>
    )
  }
  return (
    <div
      className={`relative rounded-xl border ${s.border} ${s.card} ${s.glow} p-3 cursor-pointer hover:shadow-md transition-shadow`}
      onClick={() => onDetails(def)}
      title="Click for details"
    >
      {earned.count > 1 && (
        <div className="absolute top-2 left-2 bg-[#9f50e9] text-white text-[9px] rounded-full px-1.5 py-0.5 font-bold">×{earned.count}</div>
      )}
      <div className="absolute top-2 right-2"><CheckCircle2 size={11} className="text-green-500" /></div>
      <div className="flex flex-col items-center gap-2 mb-2">
        <div className="w-20 h-20 rounded-xl bg-white flex items-center justify-center text-3xl shrink-0 shadow-sm ring-1 ring-zinc-100">
          {def.icon_url
            ? <img src={def.icon_url} alt={def.name} className="w-16 h-16 object-contain drop-shadow-sm" />
            : <span>{s.emoji}</span>}
        </div>
        <div className="text-center">
          <p className="font-bold text-xs text-zinc-800">{def.name}</p>
          <span className={`text-[9px] border rounded-full px-1.5 py-0.5 ${s.badge}`}>{def.rarity}</span>
        </div>
      </div>
      <p className="text-[10px] text-zinc-500 line-clamp-2 mb-1.5 text-center">{def.description}</p>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-zinc-400 flex items-center gap-0.5"><Clock size={8} />{fmtDate(earned.first_earned_at)}</span>
        <span className="text-[#9f50e9] font-medium flex items-center gap-0.5"><Zap size={8} />+{def.points_reward}</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function ArenaPage() {
  // ── Main tab ────────────────────────────────────────────────────────────────
  const [mainTab, setMainTab] = useState<'events' | 'leaderboard' | 'artifacts'>('events')

  // ── Sub-tabs ────────────────────────────────────────────────────────────────
  const [lbTab, setLbTab] = useState<'global' | 'leagues' | 'top' | 'mine'>('global')
  const [artTab, setArtTab] = useState<'collection' | 'all' | 'activity'>('collection')
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactDef | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Data ────────────────────────────────────────────────────────────────────
  const [events, setEvents] = useState<PlatformEvent[]>([])
  const [registeredIds, setRegisteredIds] = useState<Set<number>>(new Set())
  const [global, setGlobal] = useState<{ data: LeaderboardEntry[]; total: number }>({ data: [], total: 0 })
  const [leagues, setLeagues] = useState<League[]>([])
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([])
  const [myRank, setMyRank] = useState<MyRank | null>(null)
  const [allDefs, setAllDefs] = useState<ArtifactDef[]>([])
  const [earned, setEarned] = useState<UserArtifact[]>([])
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [myPoints, setMyPoints] = useState<{ total_points: number; league: League | null } | null>(null)

  const [globalPage, setGlobalPage] = useState(0)
  const [actOffset, setActOffset] = useState(0)
  const [rarityFilter, setRarityFilter] = useState('all')
  const [eventTypeFilter, setEventTypeFilter] = useState('all')
  const LIMIT = 20

  // ── Slider ref ──────────────────────────────────────────────────────────────
  const sliderRef = useRef<HTMLDivElement>(null)

  const slide = (dir: 'left' | 'right') => {
    if (sliderRef.current) sliderRef.current.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' })
  }

  // ── Fetch helpers ────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [evRes, lbRes, leagueRes, topRes, myRankRes, defRes, earnedRes, actRes, ptRes] = await Promise.all([
        api.get('/events'),
        api.get('/leaderboard', { params: { limit: LIMIT, offset: globalPage * LIMIT } }),
        api.get('/leaderboard/leagues'),
        api.get('/leaderboard/top-performers', { params: { limit: 10 } }),
        api.get('/leaderboard/my-rank'),
        api.get('/artifacts'),
        api.get('/artifacts/mine'),
        api.get('/artifacts/activity', { params: { limit: 30, offset: actOffset } }),
        api.get('/artifacts/my-points'),
      ])
      setEvents(evRes.data)
      setGlobal(lbRes.data)
      setLeagues(leagueRes.data)
      setTopPerformers(topRes.data)
      setMyRank(myRankRes.data)
      setAllDefs(defRes.data)
      setEarned(earnedRes.data)
      setActivity(actRes.data)
      setMyPoints(ptRes.data)
    } catch (err) { setError(getApiErrorMessage(err) || 'Failed to load Arena') }
    finally { setLoading(false) }
  }, [globalPage, actOffset])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Register for event ───────────────────────────────────────────────────────
  const handleRegister = async (eventId: number) => {
    try {
      await api.post(`/events/${eventId}/register`)
      setRegisteredIds((s) => new Set([...s, eventId]))
      // Refresh my-rank to reflect participation points
      const res = await api.get('/leaderboard/my-rank')
      setMyRank(res.data)
    } catch (err) {
      const msg = getApiErrorMessage(err) || 'Registration failed'
      if (!msg.toLowerCase().includes('already')) alert(msg)
      else setRegisteredIds((s) => new Set([...s, eventId]))
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const earnedMap = new Map(earned.map((e) => [e.artifact_id, e]))
  const earnedIds = new Set(earned.map((e) => e.artifact_id))

  const filteredDefs = allDefs
    .filter((d) => rarityFilter === 'all' || d.rarity === rarityFilter)
    .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity))

  const filteredEarned = earned
    .filter((e) => rarityFilter === 'all' || e.rarity === rarityFilter)
    .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity))

  const filteredEvents = events.filter((e) => eventTypeFilter === 'all' || e.type === eventTypeFilter)

  const completionPct = allDefs.length > 0 ? Math.round((earned.length / allDefs.length) * 100) : 0

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50 p-4 md:p-8">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-zinc-800 flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#9f50e9] to-[#c084fc] flex items-center justify-center text-white shrink-0">
            <Trophy size={18} />
          </span>
          Arena
        </h1>
        <p className="text-zinc-500 mt-1 text-sm">Events · Rankings · Collectables — all in one place</p>
      </div>

      {/* ── Hero rank card ─────────────────────────────────────────────────── */}
      {myRank && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-[#9f50e9] to-[#c084fc] p-5 text-white shadow-lg">
          <div className="flex flex-wrap items-center gap-5">
            <div>
              <p className="text-xs opacity-70 uppercase tracking-widest">Your Rank</p>
              <p className="text-5xl font-black leading-none">#{myRank.rank}</p>
              <p className="text-xs opacity-60 mt-0.5">of {myRank.total} players</p>
            </div>
            <div className="w-px h-10 bg-white/25 hidden sm:block" />
            <div>
              <p className="text-xs opacity-70">Points</p>
              <p className="text-3xl font-bold">{(myRank.points.total_points || 0).toLocaleString()}</p>
              {myRank.next_league && (
                <p className="text-[11px] opacity-60">{myRank.points_to_next_league} to {myRank.next_league.name}</p>
              )}
            </div>
            <div className="w-px h-10 bg-white/25 hidden sm:block" />
            <div>
              <p className="text-xs opacity-70">League</p>
              <p className="text-lg font-bold">{myRank.league?.name ?? 'Unranked'}</p>
            </div>
            <div className="w-px h-10 bg-white/25 hidden sm:block" />
            <div>
              <p className="text-xs opacity-70">Artifacts</p>
              <p className="text-3xl font-bold">{myRank.artifact_count}</p>
            </div>
            <div className="w-px h-10 bg-white/25 hidden sm:block" />
            <div>
              <p className="text-xs opacity-70">Streak</p>
              <p className="text-3xl font-bold flex items-center gap-1">
                <Flame size={20} />{myRank.points.streak_days}d
              </p>
            </div>
          </div>
          {/* Progress to next league */}
          {myRank.league && myRank.next_league && (
            <div className="mt-4">
              <div className="flex justify-between text-[11px] opacity-60 mb-1">
                <span>{myRank.league.name} ({myRank.league.min_points.toLocaleString()} pts)</span>
                <span>{myRank.next_league.name} ({myRank.next_league.min_points.toLocaleString()} pts)</span>
              </div>
              <div className="h-2 w-full bg-white/25 rounded-full">
                <div className="h-2 rounded-full bg-white transition-all" style={{
                  width: `${Math.min(100, Math.round(
                    ((myRank.points.total_points - myRank.league.min_points) /
                      Math.max(1, myRank.next_league.min_points - myRank.league.min_points)) * 100
                  ))}%`
                }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Main tabs ─────────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        <TabBtn active={mainTab === 'events'} onClick={() => setMainTab('events')}>
          <Rocket size={14} /> Events
        </TabBtn>
        <TabBtn active={mainTab === 'leaderboard'} onClick={() => setMainTab('leaderboard')}>
          <Trophy size={14} /> Leaderboard
        </TabBtn>
        <TabBtn active={mainTab === 'artifacts'} onClick={() => setMainTab('artifacts')}>
          <Package size={14} /> Artifacts
        </TabBtn>
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#9f50e9] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          EVENTS TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {!loading && mainTab === 'events' && (
        <div className="space-y-8">

          {/* Type filter chips */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All Events' },
              ...Object.entries(EVENT_TYPE_CONFIG).map(([k, v]) => ({ key: k, label: v.label })),
            ].map((f) => (
              <button key={f.key}
                onClick={() => setEventTypeFilter(f.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${eventTypeFilter === f.key ? 'bg-[#9f50e9] text-white border-[#9f50e9]' : 'bg-white text-zinc-600 border-zinc-200 hover:border-[#9f50e9]'}`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Featured banner (first featured event) */}
          {(() => {
            const featured = filteredEvents.find((e) => e.is_featured)
            if (!featured) return null
            const cfg = EVENT_TYPE_CONFIG[featured.type] || EVENT_TYPE_CONFIG.hackathon
            return (
              <div className={`rounded-2xl overflow-hidden bg-gradient-to-r ${cfg.gradient} p-6 text-white relative shadow-lg`}>
                {featured.banner_image_url && (
                  <img src={featured.banner_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                )}
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold bg-white/20 rounded-full px-3 py-1">
                      {cfg.icon} {cfg.label}
                    </span>
                    <span className="text-xs bg-white/20 rounded-full px-3 py-1">⭐ Featured</span>
                    {isLive(featured) && <span className="text-xs bg-white/20 rounded-full px-3 py-1 animate-pulse">🔴 LIVE</span>}
                  </div>
                  <h2 className="text-2xl font-black leading-snug mt-1 mb-1">{featured.title}</h2>
                  {featured.description && <p className="text-sm opacity-80 mb-3 max-w-xl line-clamp-2">{featured.description}</p>}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {featured.prize_pool && <span className="flex items-center gap-1.5"><Trophy size={14} />{featured.prize_pool}</span>}
                    {featured.start_date && <span className="flex items-center gap-1.5"><CalendarDays size={14} />{fmtDate(featured.start_date)}</span>}
                    <span className="flex items-center gap-1.5"><Users size={14} />{featured.participants_count} joined</span>
                  </div>
                  <button
                    onClick={() => handleRegister(featured.event_id)}
                    disabled={registeredIds.has(featured.event_id)}
                    className="mt-4 px-6 py-2.5 bg-white text-zinc-800 rounded-xl font-bold text-sm hover:bg-white/90 transition disabled:opacity-70"
                  >
                    {registeredIds.has(featured.event_id) ? '✓ Registered' : 'Register Now'}
                  </button>
                </div>
              </div>
            )
          })()}

          {/* Slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-zinc-800">
                {eventTypeFilter === 'all' ? 'All Events' : (EVENT_TYPE_CONFIG[eventTypeFilter]?.label ?? eventTypeFilter)}
                <span className="ml-2 text-sm font-normal text-zinc-400">({filteredEvents.length})</span>
              </h2>
              <div className="flex gap-2">
                <button onClick={() => slide('left')} className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center hover:border-[#9f50e9] hover:text-[#9f50e9] transition">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => slide('right')} className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center hover:border-[#9f50e9] hover:text-[#9f50e9] transition">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div ref={sliderRef} className="flex gap-4 overflow-x-auto pb-3 scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {filteredEvents.map((ev) => (
                <EventCard
                  key={ev.event_id}
                  event={ev}
                  onRegister={handleRegister}
                  registered={registeredIds.has(ev.event_id)}
                />
              ))}
              {filteredEvents.length === 0 && (
                <div className="flex-none w-full py-16 text-center text-zinc-400">
                  <Rocket size={40} className="mx-auto opacity-20 mb-3" />
                  <p>No events in this category yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* How to earn points info */}
          <div className="rounded-2xl bg-white border border-zinc-100 shadow p-5">
            <h3 className="font-bold text-zinc-800 mb-4 flex items-center gap-2"><Zap size={16} className="text-[#9f50e9]" />How to Earn Points & Artifacts</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { icon: '🎯', label: 'Mock Interview', pts: '50–400 pts' },
                { icon: '📄', label: 'CV Update', pts: '30–100 pts' },
                { icon: '🤝', label: 'Referral', pts: '200–500 pts' },
                { icon: '🏆', label: 'Event Join', pts: '75 pts' },
                { icon: '🔥', label: 'Streak', pts: '300 pts / 7d' },
              ].map((a) => (
                <div key={a.label} className="flex flex-col items-center gap-2 rounded-xl bg-purple-50 border border-purple-100 py-3 px-2 text-center">
                  <span className="text-2xl">{a.icon}</span>
                  <span className="text-xs font-medium text-zinc-700">{a.label}</span>
                  <span className="text-[10px] text-[#9f50e9] font-semibold">{a.pts}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          LEADERBOARD TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {!loading && mainTab === 'leaderboard' && (
        <div className="space-y-5">

          {/* Sub-tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <TabBtn active={lbTab === 'global'}  onClick={() => setLbTab('global')}>  <Users size={13} />Global</TabBtn>
            <TabBtn active={lbTab === 'leagues'} onClick={() => setLbTab('leagues')}><Star size={13} />Leagues</TabBtn>
            <TabBtn active={lbTab === 'top'}     onClick={() => setLbTab('top')}>    <Crown size={13} />Top Performers</TabBtn>
            <TabBtn active={lbTab === 'mine'}    onClick={() => setLbTab('mine')}>   <Target size={13} />My Rank</TabBtn>
          </div>

          {/* ── Global ─────────────────────────────────────────────────────── */}
          {lbTab === 'global' && (
            <div className="rounded-2xl bg-white shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-400">
                      <th className="px-4 py-3 text-left">Rank</th>
                      <th className="px-4 py-3 text-left">Player</th>
                      <th className="px-4 py-3 text-left">League</th>
                      <th className="px-4 py-3 text-right">Points</th>
                      <th className="px-4 py-3 text-right">Tests</th>
                      <th className="px-4 py-3 text-right">Streak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {global.data.map((entry) => (
                      <tr key={entry.user_id} className="border-b last:border-0 hover:bg-zinc-50">
                        <td className="px-4 py-3"><RankBadge rank={Number(entry.rank)} /></td>
                        <td className="px-4 py-3 font-medium text-zinc-800">{entry.username}</td>
                        <td className="px-4 py-3"><LeaguePill league={entry.league} /></td>
                        <td className="px-4 py-3 text-right font-bold text-[#9f50e9]">{entry.total_points.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-zinc-500">{entry.mock_tests_count}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="flex items-center justify-end gap-1 text-orange-500">
                            <Flame size={11} />{entry.streak_days}d
                          </span>
                        </td>
                      </tr>
                    ))}
                    {global.data.length === 0 && (
                      <tr><td colSpan={6} className="py-12 text-center text-zinc-400">No rankings yet – start acing those interviews!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-zinc-500">
                <span>Showing {globalPage * LIMIT + 1}–{Math.min((globalPage + 1) * LIMIT, global.total)} of {global.total}</span>
                <div className="flex gap-2">
                  <button disabled={globalPage === 0} onClick={() => setGlobalPage((p) => Math.max(0, p - 1))}
                    className="px-3 py-1.5 border rounded-lg hover:bg-zinc-50 disabled:opacity-40 text-xs">Prev</button>
                  <button disabled={(globalPage + 1) * LIMIT >= global.total} onClick={() => setGlobalPage((p) => p + 1)}
                    className="px-3 py-1.5 border rounded-lg hover:bg-zinc-50 disabled:opacity-40 text-xs">Next</button>
                </div>
              </div>
            </div>
          )}

          {/* ── Leagues ────────────────────────────────────────────────────── */}
          {lbTab === 'leagues' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {leagues.map((l) => (
                <div key={l.league_id} className="rounded-2xl bg-white shadow p-5 border-l-4" style={{ borderLeftColor: l.color }}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-base" style={{ color: l.color }}>{l.name}</h3>
                    <span className="text-xs bg-zinc-100 rounded-full px-2 py-0.5 text-zinc-500">{(l.member_count ?? 0)} members</span>
                  </div>
                  <p className="text-sm text-zinc-500">{l.min_points.toLocaleString()} – {l.max_points !== null ? l.max_points.toLocaleString() : '∞'} pts</p>
                  <div className="mt-3 h-1.5 rounded-full bg-zinc-100">
                    <div className="h-1.5 rounded-full w-full" style={{ backgroundColor: l.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Top Performers ─────────────────────────────────────────────── */}
          {lbTab === 'top' && (
            <div className="space-y-3">
              {topPerformers.map((perf) => (
                <div key={perf.user_id} className="rounded-2xl bg-white shadow p-5 flex flex-wrap items-center gap-4">
                  <div className="w-10 flex items-center justify-center shrink-0"><RankBadge rank={perf.rank} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-zinc-800">{perf.username}</span>
                      <LeaguePill league={perf.league} />
                    </div>
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      {perf.top_artifacts.map((a, i) => {
                        const rs = RARITY_STYLE[a.rarity] || RARITY_STYLE.common
                        return (
                          <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border ${rs.badge}`}>
                            {rs.emoji} {a.name}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <StatChip sm icon={<Zap size={12} />}    value={perf.total_points.toLocaleString()} label="Pts" />
                    <StatChip sm icon={<Target size={12} />}  value={perf.mock_tests_count}               label="Tests" />
                    <StatChip sm icon={<Flame size={12} />}   value={`${perf.streak_days}d`}              label="Streak" />
                  </div>
                </div>
              ))}
              {topPerformers.length === 0 && (
                <p className="text-center py-12 text-zinc-400">No performers yet.</p>
              )}
            </div>
          )}

          {/* ── My Rank ────────────────────────────────────────────────────── */}
          {lbTab === 'mine' && myRank && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatChip icon={<Zap size={15} />}    value={(myRank.points.total_points || 0).toLocaleString()} label="Points" />
                <StatChip icon={<Target size={15} />}  value={myRank.points.mock_tests_count}    label="Mock Tests" />
                <StatChip icon={<Users size={15} />}   value={myRank.points.referrals_count}     label="Referrals" />
                <StatChip icon={<Medal size={15} />}   value={myRank.points.resume_updates_count} label="CV Updates" />
                <StatChip icon={<Star size={15} />}    value={myRank.points.participation_count} label="Events" />
                <StatChip icon={<Flame size={15} />}   value={`${myRank.points.streak_days}d`}   label="Streak" />
              </div>
              <div className="rounded-2xl bg-white shadow overflow-hidden">
                <div className="px-5 py-4 border-b font-semibold text-zinc-800">Nearby Players</div>
                <div className="divide-y">
                  {myRank.nearby.above.map((u) => (
                    <div key={u.user_id} className="flex items-center justify-between px-5 py-3 text-sm text-zinc-500">
                      <div className="flex items-center gap-2"><ChevronUp size={13} className="text-green-500" />{u.username}</div>
                      <span>{u.total_points.toLocaleString()} pts</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-5 py-4 bg-purple-50">
                    <div className="flex items-center gap-2 font-bold text-[#9f50e9]"><Minus size={13} />You</div>
                    <span className="font-bold text-[#9f50e9]">{(myRank.points.total_points || 0).toLocaleString()} pts · #{myRank.rank}</span>
                  </div>
                  {myRank.nearby.below.map((u) => (
                    <div key={u.user_id} className="flex items-center justify-between px-5 py-3 text-sm text-zinc-500">
                      <div className="flex items-center gap-2"><ChevronDown size={13} className="text-red-400" />{u.username}</div>
                      <span>{u.total_points.toLocaleString()} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ARTIFACTS TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {!loading && mainTab === 'artifacts' && (
        <div className="space-y-5">

          {/* Stats bar */}
          <div className="rounded-2xl bg-white shadow p-5 flex flex-wrap gap-5 items-center">
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Collected</p>
              <p className="text-3xl font-extrabold text-[#9f50e9]">{earned.length}
                <span className="text-base font-normal text-zinc-400 ml-1">/ {allDefs.length}</span>
              </p>
            </div>
            <div className="h-10 w-px bg-zinc-100 hidden sm:block" />
            <div className="flex-1 min-w-[160px]">
              <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                <span>Completion</span><span>{completionPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-100">
                <div className="h-2 rounded-full bg-gradient-to-r from-[#9f50e9] to-[#c084fc] transition-all" style={{ width: `${completionPct}%` }} />
              </div>
            </div>
            {myPoints && (
              <>
                <div className="h-10 w-px bg-zinc-100 hidden sm:block" />
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Total Points</p>
                  <p className="text-2xl font-bold text-zinc-800">{myPoints.total_points.toLocaleString()}</p>
                </div>
                {myPoints.league && (
                  <>
                    <div className="h-10 w-px bg-zinc-100 hidden sm:block" />
                    <div>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wide">League</p>
                      <p className="text-lg font-semibold" style={{ color: myPoints.league.color }}>{myPoints.league.name}</p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Sub-tabs + rarity filter */}
          <div className="flex flex-wrap items-center gap-3">
            <TabBtn active={artTab === 'collection'} onClick={() => setArtTab('collection')}>My Collection</TabBtn>
            <TabBtn active={artTab === 'all'}        onClick={() => setArtTab('all')}>All Artifacts</TabBtn>
            <TabBtn active={artTab === 'activity'}   onClick={() => setArtTab('activity')}>Activity Log</TabBtn>
          </div>

          {artTab !== 'activity' && (
            <div className="flex gap-2 flex-wrap">
              {['all', ...RARITY_ORDER].map((r) => (
                <button key={r}
                  onClick={() => setRarityFilter(r)}
                  className={`rounded-full px-3 py-1 text-[11px] capitalize border transition ${rarityFilter === r ? 'bg-[#9f50e9] text-white border-[#9f50e9]' : 'bg-white text-zinc-600 border-zinc-200 hover:border-[#9f50e9]'}`}>
                  {r === 'all' ? 'All' : `${(RARITY_STYLE[r] || RARITY_STYLE.common).emoji} ${r}`}
                </button>
              ))}
            </div>
          )}

          {/* ── My Collection ──────────────────────────────────────────────── */}
          {artTab === 'collection' && (
            filteredEarned.length === 0 ? (
              <div className="text-center py-16 text-zinc-400">
                <Package size={44} className="mx-auto opacity-25 mb-4" />
                <p className="text-base">No artifacts yet!</p>
                <p className="text-sm mt-1 max-w-sm mx-auto">Complete mock interviews, update your CV, or join an event to start collecting.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredEarned.map((art) => <ArtifactCard key={art.id} def={art} earned={art} onDetails={setSelectedArtifact} />)}
              </div>
            )
          )}

          {/* ── All Artifacts ──────────────────────────────────────────────── */}
          {artTab === 'all' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredDefs.map((def) => (
                <ArtifactCard key={def.artifact_id} def={def} earned={earnedIds.has(def.artifact_id) ? earnedMap.get(def.artifact_id) : undefined} onDetails={setSelectedArtifact} />
              ))}
              {filteredDefs.length === 0 && (
                <p className="col-span-5 text-center py-12 text-zinc-400">No artifacts defined.</p>
              )}
            </div>
          )}

          {/* ── Activity Log ───────────────────────────────────────────────── */}
          {artTab === 'activity' && (
            <div className="rounded-2xl bg-white shadow overflow-hidden">
              {activity.length === 0 ? (
                <div className="py-16 text-center text-zinc-400">No activity yet.</div>
              ) : (
                <ul className="divide-y">
                  {activity.map((e) => (
                    <li key={e.log_id} className="flex items-start gap-3 px-5 py-4">
                      <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-base shrink-0">
                        {e.artifact_rarity ? (RARITY_STYLE[e.artifact_rarity] || RARITY_STYLE.common).emoji : '⚡'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-800">
                          {e.artifact_name ? `Earned: ${e.artifact_name}` : e.note || e.event_type}
                        </p>
                        <p className="text-xs text-zinc-400">{fmtDateTime(e.created_at)}</p>
                      </div>
                      {e.points_delta > 0 && (
                        <span className="text-sm font-bold text-[#9f50e9] flex items-center gap-1 shrink-0">
                          <Zap size={11} />+{e.points_delta}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex justify-between items-center px-5 py-3 border-t text-xs text-zinc-500">
                <button disabled={actOffset === 0} onClick={() => setActOffset((o) => Math.max(0, o - 30))}
                  className="px-3 py-1.5 border rounded-lg hover:bg-zinc-50 disabled:opacity-40">Newer</button>
                <button disabled={activity.length < 30} onClick={() => setActOffset((o) => o + 30)}
                  className="px-3 py-1.5 border rounded-lg hover:bg-zinc-50 disabled:opacity-40">Older</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Artifact Detail Modal ─────────────────────────────────────────── */}
      {selectedArtifact && (
        <ArtifactDetailModal
          def={selectedArtifact}
          earned={earnedMap.get(selectedArtifact.artifact_id)}
          onClose={() => setSelectedArtifact(null)}
        />
      )}
    </div>
  )
}
