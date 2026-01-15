'use client'

import * as React from 'react'
import { FadeIn } from '@/components/motion/fade-in'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/auth-context'
import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/error' 

// Color palette for plans (keeps visuals consistent)
const PALETTE = ['#0ea5e9','#6366f1','#06b6d4','#f97316','#ef4444','#10b981','#a78bfa','#f59e0b']

export default function DashboardPage() {
  const { user } = useAuth()
  const isSuperAdmin = (user as any)?.role === 'super_admin'

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [stats, setStats] = React.useState<any | null>(null)

  // filters / controls
  const [topN, setTopN] = React.useState<number | 'all'>(5)
  const [fromDateFilter, setFromDateFilter] = React.useState<string>('')
  const [toDateFilter, setToDateFilter] = React.useState<string>('')

  const fetchStats = React.useCallback(async () => {
    if (!isSuperAdmin) return
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string> = {}
      if (fromDateFilter) params.from = fromDateFilter
      if (toDateFilter) params.to = toDateFilter
      const res = await api.get('/super-admin/dashboard', { params })
      let s = res.data
      if (topN !== 'all') s = { ...s, plans: (s.plans || []).slice(0, Number(topN)) }
      setStats(s)
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to load admin dashboard')
    } finally {
      setLoading(false)
    }
  }, [isSuperAdmin, topN, fromDateFilter, toDateFilter])

  React.useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // User-specific dashboard data (current plan, upcoming interviews, credits, invoices)
  const [userDash, setUserDash] = React.useState<any | null>(null)
  const [userDashLoading, setUserDashLoading] = React.useState(false)
  const [userDashError, setUserDashError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!user) return
    const loadUserDash = async () => {
      setUserDashLoading(true)
      setUserDashError(null)
      try {
        const res = await api.get('/users/me/dashboard')
        setUserDash(res.data)
      } catch (err) {
        setUserDashError(getApiErrorMessage(err) || 'Failed to load your data')
      } finally {
        setUserDashLoading(false)
      }
    }
    loadUserDash()
  }, [user])

  const exportCSV = () => {
    if (!stats?.plans && !stats?.last_invoices) return

    const rows: any[] = []

    // Plans section
    rows.push(['Plans', 'Members'])
    if (stats?.plans) {
      for (const p of stats.plans) rows.push([p.plan_name, p.members])
    }

    // blank line separator
    rows.push([])

    // Invoices section
    rows.push(['Recent invoices'])
    rows.push(['Invoice Number', 'User', 'Date', 'Total'])
    if (stats?.last_invoices) {
      for (const inv of stats.last_invoices) {
        const date = inv.issued_at ? new Date(inv.issued_at).toISOString() : ''
        rows.push([inv.invoice_number, inv.username || `user #${inv.user_id}`, date, inv.total])
      }
    }

    const csv = rows.map((r: any) => r.map((v: any) => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard_export_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function formatMoney(n?: number | null) {
    const v = typeof n === 'number' ? n : 0
    return v.toLocaleString(undefined, { style: 'currency', currency: 'INR' })
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        <div>
          <h1 className="font-[var(--font-plus-jakarta)] text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">A quick snapshot of your progress.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard title="Recent activity" value="0" hint="interviews completed" />
          <MetricCard title="Upcoming" value={userDash?.upcomingInterviews.length ?? 0} hint="scheduled" />
          <MetricCard title="Performance" value="N/A" hint="average score" />
        </div>

        {/* User summary (visible to all logged-in users) */}
        {!isSuperAdmin && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">My account</h2>
              <div className="text-sm text-zinc-600">{userDashLoading ? 'Loading…' : userDashError ? <span className="text-red-600">{userDashError}</span> : null}</div>
            </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-white/60">
              <CardHeader>
                <CardTitle className="text-sm">Current plan</CardTitle>
              </CardHeader>
              <CardContent>
                {userDashLoading ? (
                  <div className="text-sm text-zinc-600">Loading…</div>
                ) : userDash?.subscription ? (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-zinc-900">{userDash.subscription.plan_name}</div>
                    <div className="text-sm text-zinc-600">Credits: {userDash.subscription.credits_allocated ?? '-'}</div>
                    <div className="text-sm text-zinc-600">Start: {userDash.subscription.start_date ? new Date(userDash.subscription.start_date).toLocaleString() : '-'}</div>
                    <div className="text-sm text-zinc-600">End: {userDash.subscription.end_date ? new Date(userDash.subscription.end_date).toLocaleString() : '-'}</div>
                    <div className="mt-3 flex items-center gap-2">
                      <a href="/subscriptions"><Button>Manage subscription</Button></a>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-zinc-600">No active subscription. <a href="/subscriptions" className="text-brand-600 underline">Subscribe</a></div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/60">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-sm">Credits</CardTitle>
              <div className="ml-2">
                {!userDashLoading && (
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                    {userDash?.total_credits ?? userDash?.credits?.current_credits ?? 0} total
                  </span>
                )}
              </div>
              </CardHeader>
              <CardContent>
                {userDashLoading ? (
                  <div className="text-sm text-zinc-600">Loading…</div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-2xl font-semibold text-zinc-900">{userDash?.credits?.current_credits ?? '—'}</div>
                    <div className="text-sm text-zinc-600">Current available credits</div>
                    <div className="text-xs text-zinc-500">Total credits: {userDash?.total_credits ?? userDash?.credits?.current_credits ?? 0}</div>
                    <div className="mt-3 flex items-center gap-2">
                      <a href="/subscriptions"><Button>Buy credits</Button></a>
                      <Button variant="ghost" onClick={() => alert('To request free credits, contact support or upgrade your plan.')}>Request credits</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/60">
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="text-sm">Upcoming interviews</CardTitle>
                <div className="ml-2">
                  {!userDashLoading && (
                    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                      {userDash?.upcomingInterviews ? userDash.upcomingInterviews.length : 0} upcoming
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {userDashLoading ? (
                  <div className="text-sm text-zinc-600">Loading…</div>
                ) : userDash?.upcomingInterviews && userDash.upcomingInterviews.length > 0 ? (
                  <div className="space-y-2">
                    {userDash.upcomingInterviews.map((i: any, idx: number) => (
                      <motion.div key={i.interview_id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }} className="rounded-xl border border-white/70 bg-white/70 p-3 flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold text-zinc-900">{i.company_name} — {i.position_name || i.position}</div>
                          <div className="text-xs text-zinc-600">{i.scheduled_at ? new Date(i.scheduled_at).toLocaleString() : ''}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/mock-interview/${i.interview_id}`}>
                            <Button>Open</Button>
                          </Link>
                        </div>
                      </motion.div>
                    ))} 
                    <div>
                      <a href="/user/interviews"><Button variant="ghost">View all</Button></a>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-4">
                    <div className="text-center">
                      <div className="text-sm text-zinc-500">Upcoming</div>
                      <div className="text-3xl font-semibold text-zinc-900">{userDash?.upcomingInterviews ? userDash.upcomingInterviews.length : 0}</div>
                      <div className="text-sm text-zinc-500">scheduled</div>
                      <div className="mt-2"><a href="/interviews" className="text-brand-600 underline">Schedule one</a></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        )}

        {/* Super admin stats */}
        {isSuperAdmin ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">Admin overview</h2>
              <div className="flex items-center gap-2">
                <select
                  value={topN}
                  onChange={(e) => setTopN(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="h-8 rounded-2xl border border-zinc-200 bg-white/80 px-2 text-sm"
                >
                  <option value={5}>Top 5</option>
                  <option value={10}>Top 10</option>
                  <option value={25}>Top 25</option>
                  <option value="all">All</option>
                </select>

                <input type="date" value={fromDateFilter} onChange={(e) => setFromDateFilter(e.target.value)} className="h-8 rounded-2xl border border-zinc-200 bg-white/80 px-2 text-sm" />
                <input type="date" value={toDateFilter} onChange={(e) => setToDateFilter(e.target.value)} className="h-8 rounded-2xl border border-zinc-200 bg-white/80 px-2 text-sm" />

                <Button onClick={() => fetchStats()} disabled={loading}>
                  Apply
                </Button>
                <Button variant="ghost" onClick={() => { setTopN(5); setFromDateFilter(''); setToDateFilter(''); fetchStats(); }}>
                  Reset
                </Button>
                <Button variant="secondary" onClick={() => exportCSV()} disabled={!stats?.plans && !stats?.last_invoices}>
                  Export Plans & Invoices (CSV)
                </Button>

                <div className="text-sm text-zinc-600">{loading ? 'Loading…' : error ? <span className="text-red-600">{error}</span> : null}</div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-white/60">
                <CardHeader>
                  <CardTitle className="text-sm">Total active subscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-zinc-900">{stats ? stats.total_subscriptions : '—'}</div>
                </CardContent>
              </Card>

              <Card className="bg-white/60">
                <CardHeader>
                  <CardTitle className="text-sm">Plans (members)</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats && stats.plans && stats.plans.length === 0 ? (
                    <div className="text-sm text-zinc-600">No plans found.</div>
                  ) : stats && stats.plans ? (
                    <div className="flex items-center gap-4">
                      <div className="w-40">
                        <DonutChart
                          data={stats.plans.map((p: any, i: number) => ({ label: p.plan_name, value: Number(p.members || 0), color: PALETTE[i % PALETTE.length] }))}
                        />
                        <div className="mt-2 text-xs text-zinc-500">Plan distribution</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {stats.plans.map((p:any, i:number) => (<div key={p.plan_id} className="flex items-center gap-2 text-xs"><span className="inline-block h-3 w-3 rounded-sm" style={{background: PALETTE[i % PALETTE.length]}} /> {p.plan_name}</div>))}
                        </div>
                      </div>
                      <div className="flex-1">
                        <PlanBarChart plans={stats.plans.map((p: any, i: number) => ({ ...p, color: PALETTE[i % PALETTE.length] }))} />
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-zinc-600">—</div>
                  )}
                </CardContent>
              </Card>

              {/* Inline bar chart component */}
              {/* Rendered below to keep file small and self-contained */}
              

              <Card className="bg-white/60">
                <CardHeader>
                  <CardTitle className="text-sm">Recent invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats && stats.last_invoices && stats.last_invoices.length === 0 ? (
                    <div className="text-sm text-zinc-600">No invoices yet.</div>
                  ) : stats && stats.last_invoices ? (
                    <div className="space-y-2 text-sm text-zinc-700">
                      {stats.last_invoices.map((inv: any, i: number) => (
                        <motion.div key={inv.invoice_id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{inv.invoice_number}</div>
                            <div className="text-xs text-zinc-500">{inv.username || `user #${inv.user_id}`} · {inv.issued_at ? new Date(inv.issued_at).toLocaleString() : ''}</div>
                          </div>
                          <div className="text-sm font-semibold">{formatMoney(inv.total)}</div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-zinc-600">—</div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/60">
                <CardHeader>
                  <CardTitle className="text-sm">Recent activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats && stats.recent_activity && stats.recent_activity.length === 0 ? (
                    <div className="text-sm text-zinc-600">No recent activity.</div>
                  ) : stats && stats.recent_activity ? (
                    <div className="space-y-2 text-sm text-zinc-700">
                      {stats.recent_activity.map((a: any, i: number) => (
                        <motion.div key={`${a.invoice_id}-${i}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{a.payment_type === 'initial' ? (a.plan_name ? `Subscription: ${a.plan_name}` : 'Subscription') : a.payment_type === 'grant' ? 'Credits granted' : a.payment_type}</div>
                            <div className="text-xs text-zinc-500">{a.username || `user #${a.user_id}`} · {a.payment_method || ''}</div>
                          </div>
                          <div className="text-xs text-zinc-500">{a.issued_at ? new Date(a.issued_at).toLocaleString() : ''}</div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-zinc-600">—</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/60">
              <CardHeader>
                <CardTitle className="text-sm">Recent users</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && stats.last_users && stats.last_users.length === 0 ? (
                  <div className="text-sm text-zinc-600">No users yet.</div>
                ) : stats && stats.last_users ? (
                  <div className="space-y-2 text-sm text-zinc-700">
                    {stats.last_users.map((u: any) => (
                      <div key={u.user_id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{u.username}</div>
                          <div className="text-xs text-zinc-500">{u.email}</div>
                        </div>
                        <div className="text-xs text-zinc-500">{u.created_at ? new Date(u.created_at).toLocaleString() : `#${u.user_id}`}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-zinc-600">—</div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </FadeIn>
  )
}

function MetricCard({
  title,
  value,
  hint,
}: {
  title: string
  value: string
  hint: string
}) {
  return (
    <Card className="bg-white/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-brand-800">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold text-zinc-900">{value}</div>
        <div className="mt-1 text-sm text-zinc-600">{hint}</div>
      </CardContent>
    </Card>
  )
}

function PlanBarChart({ plans }: { plans: Array<{ plan_id: number; plan_name: string; members: number; color?: string }> }) {
  const max = Math.max(...plans.map((p) => Number(p.members || 0)), 1)
  return (
    <div className="space-y-2">
      {plans.map((p, i) => {
        const count = Number(p.members || 0)
        const pct = Math.round((count / max) * 100)
        const color = p.color || PALETTE[i % PALETTE.length]
        return (
          <motion.div
            key={p.plan_id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            className="flex items-center gap-3"
          >
            <div className="w-48 text-sm text-zinc-700 flex items-center gap-2 truncate">
              <span className="inline-block h-3 w-3 rounded-sm shrink-0" style={{ background: color }} />
              <div className="truncate">{p.plan_name}</div>
            </div>
            <div className="flex-1">
              <div className="h-6 w-full rounded-full bg-zinc-100 overflow-hidden relative">
                <motion.div
                  className="h-6 rounded-full absolute left-0 top-0"
                  style={{ background: color, minWidth: '2%' }}
                  initial={{ width: 0 }}
                  animate={{ width: pct === 0 ? '2%' : `${pct}%`, scale: [0.98, 1, 0.995] }}
                  transition={{ type: 'spring', stiffness: 120, damping: 16 }}
                  title={`${p.plan_name}: ${count} members`}
                />
                <div className="absolute right-0 top-0 h-6 flex items-center pr-2 text-xs text-zinc-600">{pct}%</div>
              </div>
            </div>
            <div className="w-14 text-right text-sm font-semibold text-zinc-900">{count}</div>
          </motion.div>
        )
      })}
    </div>
  )
}

function DonutChart({ data, size = 120, inner = 0.6 }: { data: Array<{ label: string; value: number; color?: string }>; size?: number; inner?: number }) {
  const total = data.reduce((s, d) => s + Math.max(0, d.value), 0) || 1
  const radius = size / 2
  const innerR = radius * inner
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [tooltip, setTooltip] = React.useState<{ visible: boolean; x: number; y: number; label?: string; value?: number; pct?: number }>(
    { visible: false, x: 0, y: 0 }
  )

  const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
    return { x: cx + r * Math.cos(angleInRadians), y: cy + r * Math.sin(angleInRadians) }
  }

  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle)
    const end = polarToCartesian(cx, cy, r, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
  }

  const handleSliceMove = (e: React.MouseEvent, label: string, value: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setTooltip({ visible: true, x, y, label, value, pct: Math.round((value / total) * 100) })
  }
  const handleSliceLeave = () => setTooltip({ visible: false, x: 0, y: 0 })

  let start = 0
  return (
    <div ref={containerRef} className="relative inline-block" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${radius},${radius})`}>
          {data.map((d, i) => {
            const value = Math.max(0, d.value)
            const angle = (value / total) * 360
            const end = start + angle
            const outerPath = describeArc(0, 0, radius, start, end)
            const innerPath = describeArc(0, 0, innerR, end, start)
            const path = `${outerPath} L ${innerPath.slice(1)} Z`
            const color = d.color || PALETTE[i % PALETTE.length]
            start = end
            return (
              <motion.path
                key={i}
                d={path}
                fill={color}
                stroke="white"
                strokeWidth={1}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                onMouseMove={(e) => handleSliceMove(e, d.label, d.value)}
                onMouseEnter={(e) => handleSliceMove(e, d.label, d.value)}
                onMouseLeave={handleSliceLeave}
              >
                <title>{`${d.label}: ${d.value}`}</title>
              </motion.path>
            )
          })}
          <text x="0" y="0" textAnchor="middle" alignmentBaseline="middle" className="text-sm font-semibold text-zinc-900">
            {total}
          </text>
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip.visible ? (
        <div
          className="pointer-events-none absolute z-50 rounded-md border border-zinc-200 bg-white/95 px-3 py-2 text-sm shadow-md"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -120%)' }}
        >
          <div className="font-medium">{tooltip.label}</div>
          <div className="text-xs text-zinc-600">{tooltip.value} ({tooltip.pct}% )</div>
        </div>
      ) : null}
    </div>
  )
}
