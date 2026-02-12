'use client';

import Image from "next/image";
import * as React from 'react'
import { useState, useEffect } from "react";
import { FaRegQuestionCircle } from "react-icons/fa";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FiArrowUpRight } from "react-icons/fi";
import { FaRegCircleCheck } from "react-icons/fa6";
import { RiEqualizerLine, RiImageEditLine } from "react-icons/ri";
import { BiMessageSquareDots } from "react-icons/bi";
import { CiUser } from "react-icons/ci";
import { useAuth } from '@/context/auth-context'
import { api } from '@/lib/api'
import { getApiErrorMessage, getErrorMessage } from '@/lib/error'
import { useNotifications } from '@/context/notification-context'
import axios from 'axios'

// import * as React from 'react'
// import { FadeIn } from '@/components/motion/fade-in'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
// import Link from 'next/link'
// import { motion } from 'framer-motion'
// import { useAuth } from '@/context/auth-context'
// import { api } from '@/lib/api'
// import { getApiErrorMessage } from '@/lib/error'
// import { sweetAlert, sweetConfirm } from '@/lib/swal' 

// // Color palette for plans (keeps visuals consistent)
// const PALETTE = ['#0ea5e9','#6366f1','#06b6d4','#f97316','#ef4444','#10b981','#a78bfa','#f59e0b']

// export default function DashboardPage() {
//   const { user } = useAuth()
//   const isSuperAdmin = (user as any)?.role === 'super_admin'

//   const [loading, setLoading] = React.useState(false)
//   const [error, setError] = React.useState<string | null>(null)
//   const [stats, setStats] = React.useState<any | null>(null)

//   // filters / controls
//   const [topN, setTopN] = React.useState<number | 'all'>(5)
//   const [fromDateFilter, setFromDateFilter] = React.useState<string>('')
//   const [toDateFilter, setToDateFilter] = React.useState<string>('')

//   const fetchStats = React.useCallback(async () => {
//     if (!isSuperAdmin) return
//     setLoading(true)
//     setError(null)
//     try {
//       const params: Record<string, string> = {}
//       if (fromDateFilter) params.from = fromDateFilter
//       if (toDateFilter) params.to = toDateFilter
//       const res = await api.get('/super-admin/dashboard', { params })
//       let s = res.data
//       if (topN !== 'all') s = { ...s, plans: (s.plans || []).slice(0, Number(topN)) }
//       setStats(s)
//     } catch (err) {
//       setError(getApiErrorMessage(err) || 'Failed to load admin dashboard')
//     } finally {
//       setLoading(false)
//     }
//   }, [isSuperAdmin, topN, fromDateFilter, toDateFilter])

//   React.useEffect(() => {
//     fetchStats()
//   }, [fetchStats])

//   // User-specific dashboard data (current plan, upcoming interviews, credits, invoices)
//   const [userDash, setUserDash] = React.useState<any | null>(null)
//   const [userDashLoading, setUserDashLoading] = React.useState(false)
//   const [userDashError, setUserDashError] = React.useState<string | null>(null)

//   React.useEffect(() => {
//     if (!user) return
//     const loadUserDash = async () => {
//       setUserDashLoading(true)
//       setUserDashError(null)
//       try {
//         const res = await api.get('/users/me/dashboard')
//         setUserDash(res.data)
//       } catch (err) {
//         setUserDashError(getApiErrorMessage(err) || 'Failed to load your data')
//       } finally {
//         setUserDashLoading(false)
//       }
//     }
//     loadUserDash()
//   }, [user])

//   const exportCSV = () => {
//     if (!stats?.plans && !stats?.last_invoices) return

//     const rows: any[] = []

//     // Plans section
//     rows.push(['Plans', 'Members'])
//     if (stats?.plans) {
//       for (const p of stats.plans) rows.push([p.plan_name, p.members])
//     }

//     // blank line separator
//     rows.push([])

//     // Invoices section
//     rows.push(['Recent invoices'])
//     rows.push(['Invoice Number', 'User', 'Date', 'Total'])
//     if (stats?.last_invoices) {
//       for (const inv of stats.last_invoices) {
//         const date = inv.issued_at ? new Date(inv.issued_at).toISOString() : ''
//         rows.push([inv.invoice_number, inv.username || `user #${inv.user_id}`, date, inv.total])
//       }
//     }

//     const csv = rows.map((r: any) => r.map((v: any) => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
//     const blob = new Blob([csv], { type: 'text/csv' })
//     const url = URL.createObjectURL(blob)
//     const a = document.createElement('a')
//     a.href = url
//     a.download = `dashboard_export_${Date.now()}.csv`
//     a.click()
//     URL.revokeObjectURL(url)
//   }

//   function formatMoney(n?: number | null) {
//     const v = typeof n === 'number' ? n : 0
//     return v.toLocaleString(undefined, { style: 'currency', currency: 'INR' })
//   }

//   return (
//     <FadeIn>
//       <div className="space-y-6 p-2">
//         <div>
//           <h1 className="font-[var(--font-plus-jakarta)] text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
//           <p className="mt-1 text-sm text-zinc-600">A quick snapshot of your progress.</p>
//         </div>

//         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
//           <MetricCard title="Recent activity" value="0" hint="interviews completed" />
//           <MetricCard title="Upcoming" value={userDash?.upcomingInterviews.length ?? 0} hint="scheduled" />
//           <MetricCard title="Performance" value="N/A" hint="average score" />
//         </div>

//         {/* User summary (visible to all logged-in users) */}
//         {!isSuperAdmin && (
//           <div className="space-y-4">
//             <div className="flex items-center justify-between">
//               <h2 className="text-lg font-semibold text-zinc-900">My account</h2>
//               <div className="text-sm text-zinc-600">{userDashLoading ? 'Loading…' : userDashError ? <span className="text-red-600">{userDashError}</span> : null}</div>
//             </div>

//           <div className="grid gap-4 md:grid-cols-3">
//             <Card className="bg-white/60">
//               <CardHeader>
//                 <CardTitle className="text-sm">Current plan</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {userDashLoading ? (
//                   <div className="text-sm text-zinc-600">Loading…</div>
//                 ) : userDash?.subscription ? (
//                   <div className="space-y-2">
//                     <div className="text-sm font-semibold text-zinc-900">{userDash.subscription.plan_name}</div>
//                     <div className="text-sm text-zinc-600">Credits: {userDash.subscription.credits_allocated ?? '-'}</div>
//                     <div className="text-sm text-zinc-600">Start: {userDash.subscription.start_date ? new Date(userDash.subscription.start_date).toLocaleString() : '-'}</div>
//                     <div className="text-sm text-zinc-600">End: {userDash.subscription.end_date ? new Date(userDash.subscription.end_date).toLocaleString() : '-'}</div>
//                     <div className="mt-3 flex items-center gap-2">
//                       <a href="/subscriptions"><Button>Manage subscription</Button></a>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="text-sm text-zinc-600">No active subscription. <a href="/subscriptions" className="text-brand-600 underline">Subscribe</a></div>
//                 )}
//               </CardContent>
//             </Card>

//             <Card className="bg-white/60">
//             <CardHeader className="flex items-center justify-between">
//               <CardTitle className="text-sm">Credits</CardTitle>
//               <div className="ml-2">
//                 {!userDashLoading && (
//                   <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
//                     {userDash?.total_credits ?? userDash?.credits?.current_credits ?? 0} total
//                   </span>
//                 )}
//               </div>
//               </CardHeader>
//               <CardContent>
//                 {userDashLoading ? (
//                   <div className="text-sm text-zinc-600">Loading…</div>
//                 ) : (
//                   <div className="space-y-3">
//                     <div className="text-2xl font-semibold text-zinc-900">{userDash?.credits?.current_credits ?? '—'}</div>
//                     <div className="text-sm text-zinc-600">Current available credits</div>
//                     <div className="text-xs text-zinc-500">Total credits: {userDash?.total_credits ?? userDash?.credits?.current_credits ?? 0}</div>
//                     <div className="mt-3 flex items-center gap-2">
//                       <a href="/subscriptions"><Button>Buy credits</Button></a>
//                       <Button variant="ghost" onClick={() => { void sweetAlert('Request credits', 'To request free credits, contact support or upgrade your plan.', 'info') }}>Request credits</Button>
//                     </div>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>

//             <Card className="bg-white/60">
//               <CardHeader className="flex items-center justify-between">
//                 <CardTitle className="text-sm">Upcoming interviews</CardTitle>
//                 <div className="ml-2">
//                   {!userDashLoading && (
//                     <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
//                       {userDash?.upcomingInterviews ? userDash.upcomingInterviews.length : 0} upcoming
//                     </span>
//                   )}
//                 </div>
//               </CardHeader>
//               <CardContent>
//                 {userDashLoading ? (
//                   <div className="text-sm text-zinc-600">Loading…</div>
//                 ) : userDash?.upcomingInterviews && userDash.upcomingInterviews.length > 0 ? (
//                   <div className="space-y-2">
//                     {userDash.upcomingInterviews.map((i: Record<string, unknown>, idx: number) => (
//                       <motion.div key={i.interview_id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }} className="rounded-xl border border-white/70 bg-white/70 p-3 flex items-start justify-between gap-4">
//                         <div>
//                           <div className="text-sm font-semibold text-zinc-900">{i.company_name} — {i.position_name || i.position}</div>
//                           <div className="text-xs text-zinc-600">{i.scheduled_at ? new Date(i.scheduled_at).toLocaleString() : ''}</div>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <Link href={`/mock-interview/${i.interview_id}`}>
//                             <Button>Open</Button>
//                           </Link>
//                         </div>
//                       </motion.div>
//                     ))} 
//                     <div>
//                       <a href="/user/interviews"><Button variant="ghost">View all</Button></a>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="flex items-center justify-center p-4">
//                     <div className="text-center">
//                       <div className="text-sm text-zinc-500">Upcoming</div>
//                       <div className="text-3xl font-semibold text-zinc-900">{userDash?.upcomingInterviews ? userDash.upcomingInterviews.length : 0}</div>
//                       <div className="text-sm text-zinc-500">scheduled</div>
//                       <div className="mt-2"><a href="/interviews" className="text-brand-600 underline">Schedule one</a></div>
//                     </div>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//         )}

//         {/* Super admin stats */}
//         {isSuperAdmin ? (
//           <div className="space-y-4">
//             <div className="flex items-center justify-between">
//               <h2 className="text-lg font-semibold text-zinc-900">Admin overview</h2>
//               <div className="flex items-center gap-2">
//                 <select
//                   value={topN}
//                   onChange={(e) => setTopN(e.target.value === 'all' ? 'all' : Number(e.target.value))}
//                   className="h-8 rounded-2xl border border-zinc-200 bg-white/80 px-2 text-sm"
//                 >
//                   <option value={5}>Top 5</option>
//                   <option value={10}>Top 10</option>
//                   <option value={25}>Top 25</option>
//                   <option value="all">All</option>
//                 </select>

//                 <input type="date" value={fromDateFilter} onChange={(e) => setFromDateFilter(e.target.value)} className="h-8 rounded-2xl border border-zinc-200 bg-white/80 px-2 text-sm" />
//                 <input type="date" value={toDateFilter} onChange={(e) => setToDateFilter(e.target.value)} className="h-8 rounded-2xl border border-zinc-200 bg-white/80 px-2 text-sm" />

//                 <Button onClick={() => fetchStats()} disabled={loading}>
//                   Apply
//                 </Button>
//                 <Button variant="ghost" onClick={() => { setTopN(5); setFromDateFilter(''); setToDateFilter(''); fetchStats(); }}>
//                   Reset
//                 </Button>
//                 <Button variant="secondary" onClick={() => exportCSV()} disabled={!stats?.plans && !stats?.last_invoices}>
//                   Export Plans & Invoices (CSV)
//                 </Button>

//                 <div className="text-sm text-zinc-600">{loading ? 'Loading…' : error ? <span className="text-red-600">{error}</span> : null}</div>
//               </div>
//             </div>

//             <div className="grid gap-4 md:grid-cols-3">
//               <Card className="bg-white/60">
//                 <CardHeader>
//                   <CardTitle className="text-sm">Total active subscriptions</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-2xl font-semibold text-zinc-900">{stats ? stats.total_subscriptions : '—'}</div>
//                 </CardContent>
//               </Card>

//               <Card className="bg-white/60">
//                 <CardHeader>
//                   <CardTitle className="text-sm">Plans (members)</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   {stats && stats.plans && stats.plans.length === 0 ? (
//                     <div className="text-sm text-zinc-600">No plans found.</div>
//                   ) : stats && stats.plans ? (
//                     <div className="flex items-center gap-4">
//                       <div className="w-40">
//                         <DonutChart
//                           data={stats.plans.map((p: Record<string, unknown>, i: number) => ({ label: p.plan_name, value: Number(p.members || 0), color: PALETTE[i % PALETTE.length] }))}
//                         />
//                         <div className="mt-2 text-xs text-zinc-500">Plan distribution</div>
//                         <div className="mt-2 flex flex-wrap gap-2">
//                           {stats.plans.map((p:any, i:number) => (<div key={p.plan_id} className="flex items-center gap-2 text-xs"><span className="inline-block h-3 w-3 rounded-sm" style={{background: PALETTE[i % PALETTE.length]}} /> {p.plan_name}</div>))}
//                         </div>
//                       </div>
//                       <div className="flex-1">
//                         <PlanBarChart plans={stats.plans.map((p: Record<string, unknown>, i: number) => ({ ...p, color: PALETTE[i % PALETTE.length] }))} />
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="text-sm text-zinc-600">—</div>
//                   )}
//                 </CardContent>
//               </Card>

//               {/* Inline bar chart component */}
//               {/* Rendered below to keep file small and self-contained */}


//               <Card className="bg-white/60">
//                 <CardHeader>
//                   <CardTitle className="text-sm">Recent invoices</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   {stats && stats.last_invoices && stats.last_invoices.length === 0 ? (
//                     <div className="text-sm text-zinc-600">No invoices yet.</div>
//                   ) : stats && stats.last_invoices ? (
//                     <div className="space-y-2 text-sm text-zinc-700">
//                       {stats.last_invoices.map((inv: Record<string, unknown>, i: number) => (
//                         <motion.div key={inv.invoice_id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center justify-between">
//                           <div>
//                             <div className="font-medium">{inv.invoice_number}</div>
//                             <div className="text-xs text-zinc-500">{inv.username || `user #${inv.user_id}`} · {inv.issued_at ? new Date(inv.issued_at).toLocaleString() : ''}</div>
//                           </div>
//                           <div className="text-sm font-semibold">{formatMoney(inv.total)}</div>
//                         </motion.div>
//                       ))}
//                     </div>
//                   ) : (
//                     <div className="text-sm text-zinc-600">—</div>
//                   )}
//                 </CardContent>
//               </Card>

//               <Card className="bg-white/60">
//                 <CardHeader>
//                   <CardTitle className="text-sm">Recent activity</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   {stats && stats.recent_activity && stats.recent_activity.length === 0 ? (
//                     <div className="text-sm text-zinc-600">No recent activity.</div>
//                   ) : stats && stats.recent_activity ? (
//                     <div className="space-y-2 text-sm text-zinc-700">
//                       {stats.recent_activity.map((a: Record<string, unknown>, i: number) => (
//                         <motion.div key={`${a.invoice_id}-${i}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center justify-between">
//                           <div>
//                             <div className="font-medium">{a.payment_type === 'initial' ? (a.plan_name ? `Subscription: ${a.plan_name}` : 'Subscription') : a.payment_type === 'grant' ? 'Credits granted' : a.payment_type}</div>
//                             <div className="text-xs text-zinc-500">{a.username || `user #${a.user_id}`} · {a.payment_method || ''}</div>
//                           </div>
//                           <div className="text-xs text-zinc-500">{a.issued_at ? new Date(a.issued_at).toLocaleString() : ''}</div>
//                         </motion.div>
//                       ))}
//                     </div>
//                   ) : (
//                     <div className="text-sm text-zinc-600">—</div>
//                   )}
//                 </CardContent>
//               </Card>
//             </div>

//             <Card className="bg-white/60">
//               <CardHeader>
//                 <CardTitle className="text-sm">Recent users</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {stats && stats.last_users && stats.last_users.length === 0 ? (
//                   <div className="text-sm text-zinc-600">No users yet.</div>
//                 ) : stats && stats.last_users ? (
//                   <div className="space-y-2 text-sm text-zinc-700">
//                     {stats.last_users.map((u: Record<string, unknown>) => (
//                       <div key={u.user_id} className="flex items-center justify-between">
//                         <div>
//                           <div className="font-medium">{u.username}</div>
//                           <div className="text-xs text-zinc-500">{u.email}</div>
//                         </div>
//                         <div className="text-xs text-zinc-500">{u.created_at ? new Date(u.created_at).toLocaleString() : `#${u.user_id}`}</div>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="text-sm text-zinc-600">—</div>
//                 )}
//               </CardContent>
//             </Card>
//           </div>
//         ) : null}
//       </div>
//     </FadeIn>
//   )
// }

// function MetricCard({
//   title,
//   value,
//   hint,
// }: {
//   title: string
//   value: string
//   hint: string
// }) {
//   return (
//     <Card className="bg-white/60">
//       <CardHeader className="pb-3">
//         <CardTitle className="text-sm font-semibold text-brand-800">{title}</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div className="text-3xl font-semibold text-zinc-900">{value}</div>
//         <div className="mt-1 text-sm text-zinc-600">{hint}</div>
//       </CardContent>
//     </Card>
//   )
// }

// function PlanBarChart({ plans }: { plans: Array<{ plan_id: number; plan_name: string; members: number; color?: string }> }) {
//   const max = Math.max(...plans.map((p) => Number(p.members || 0)), 1)
//   return (
//     <div className="space-y-2">
//       {plans.map((p, i) => {
//         const count = Number(p.members || 0)
//         const pct = Math.round((count / max) * 100)
//         const color = p.color || PALETTE[i % PALETTE.length]
//         return (
//           <motion.div
//             key={p.plan_id}
//             initial={{ opacity: 0, x: -6 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.35, delay: i * 0.06 }}
//             className="flex items-center gap-3"
//           >
//             <div className="w-48 text-sm text-zinc-700 flex items-center gap-2 truncate">
//               <span className="inline-block h-3 w-3 rounded-sm shrink-0" style={{ background: color }} />
//               <div className="truncate">{p.plan_name}</div>
//             </div>
//             <div className="flex-1">
//               <div className="h-6 w-full rounded-full bg-zinc-100 overflow-hidden relative">
//                 <motion.div
//                   className="h-6 rounded-full absolute left-0 top-0"
//                   style={{ background: color, minWidth: '2%' }}
//                   initial={{ width: 0 }}
//                   animate={{ width: pct === 0 ? '2%' : `${pct}%`, scale: [0.98, 1, 0.995] }}
//                   transition={{ type: 'spring', stiffness: 120, damping: 16 }}
//                   title={`${p.plan_name}: ${count} members`}
//                 />
//                 <div className="absolute right-0 top-0 h-6 flex items-center pr-2 text-xs text-zinc-600">{pct}%</div>
//               </div>
//             </div>
//             <div className="w-14 text-right text-sm font-semibold text-zinc-900">{count}</div>
//           </motion.div>
//         )
//       })}
//     </div>
//   )
// }

// function DonutChart({ data, size = 120, inner = 0.6 }: { data: Array<{ label: string; value: number; color?: string }>; size?: number; inner?: number }) {
//   const total = data.reduce((s, d) => s + Math.max(0, d.value), 0) || 1
//   const radius = size / 2
//   const innerR = radius * inner
//   const containerRef = React.useRef<HTMLDivElement | null>(null)
//   const [tooltip, setTooltip] = React.useState<{ visible: boolean; x: number; y: number; label?: string; value?: number; pct?: number }>(
//     { visible: false, x: 0, y: 0 }
//   )

//   const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
//     const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
//     return { x: cx + r * Math.cos(angleInRadians), y: cy + r * Math.sin(angleInRadians) }
//   }

//   const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
//     const start = polarToCartesian(cx, cy, r, endAngle)
//     const end = polarToCartesian(cx, cy, r, startAngle)
//     const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
//     return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
//   }

//   const handleSliceMove = (e: React.MouseEvent, label: string, value: number) => {
//     const rect = containerRef.current?.getBoundingClientRect()
//     if (!rect) return
//     const x = e.clientX - rect.left
//     const y = e.clientY - rect.top
//     setTooltip({ visible: true, x, y, label, value, pct: Math.round((value / total) * 100) })
//   }
//   const handleSliceLeave = () => setTooltip({ visible: false, x: 0, y: 0 })

//   let start = 0
//   return (
//     <div ref={containerRef} className="relative inline-block" style={{ width: size, height: size }}>
//       <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
//         <g transform={`translate(${radius},${radius})`}>
//           {data.map((d, i) => {
//             const value = Math.max(0, d.value)
//             const angle = (value / total) * 360
//             const end = start + angle
//             const outerPath = describeArc(0, 0, radius, start, end)
//             const innerPath = describeArc(0, 0, innerR, end, start)
//             const path = `${outerPath} L ${innerPath.slice(1)} Z`
//             const color = d.color || PALETTE[i % PALETTE.length]
//             start = end
//             return (
//               <motion.path
//                 key={i}
//                 d={path}
//                 fill={color}
//                 stroke="white"
//                 strokeWidth={1}
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 transition={{ delay: i * 0.05 }}
//                 onMouseMove={(e) => handleSliceMove(e, d.label, d.value)}
//                 onMouseEnter={(e) => handleSliceMove(e, d.label, d.value)}
//                 onMouseLeave={handleSliceLeave}
//               >
//                 <title>{`${d.label}: ${d.value}`}</title>
//               </motion.path>
//             )
//           })}
//           <text x="0" y="0" textAnchor="middle" alignmentBaseline="middle" className="text-sm font-semibold text-zinc-900">
//             {total}
//           </text>
//         </g>
//       </svg>

//       {/* Tooltip */}
//       {tooltip.visible ? (
//         <div
//           className="pointer-events-none absolute z-50 rounded-md border border-zinc-200 bg-white/95 px-3 py-2 text-sm shadow-md"
//           style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -120%)' }}
//         >
//           <div className="font-medium">{tooltip.label}</div>
//           <div className="text-xs text-zinc-600">{tooltip.value} ({tooltip.pct}% )</div>
//         </div>
//       ) : null}
//     </div>
//   )
// }


export default function DashboardPage() {


  const [current, setCurrent] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date()); // Current date

  // Job listings state
  const [jobs, setJobs] = useState<Array<Record<string, unknown>>>([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [jobsError, setJobsError] = useState<string | null>(null)
  const [currentJobIndex, setCurrentJobIndex] = useState(0)

  // Calendar interaction state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [dateInterviews, setDateInterviews] = useState<Array<Record<string, unknown>>>([])

  // Notification context
  const { notifications, unreadCount, markAsRead } = useNotifications()

  const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // --- User dashboard data (dynamic) ---
  type UserDashboardResp = {
    subscription: Record<string, unknown> | null
    upcomingInterviews: Array<Record<string, unknown>>
    upcoming_count?: number
    pastInterviews?: Array<Record<string, unknown>>
    past_interviews_count?: number
    schedule_count?: number
    total_interviews?: number
    credits: { credit_id: number; current_credits: number } | null
    recent_invoices: Array<Record<string, unknown>>
    total_credits?: number
    avg_overall_score?: number
    completed_count?: number
  }

  const { user } = useAuth()
  const [dashLoading, setDashLoading] = useState(false)
  const [dashError, setDashError] = useState<string | null>(null)
  const [dashData, setDashData] = useState<UserDashboardResp | null>(null)

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [userDetails, setUserDetails] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setDashLoading(true)
      setDashError(null)
      try {
        const res = await api.get('/users/me/dashboard')
        // API returns { ok: true, subscription, upcomingInterviews, credits, total_credits, recent_invoices }
        setDashData(res.data)
        setLastUpdated(new Date())
      } catch (err: unknown) {
        setDashError(getApiErrorMessage(err) || 'Failed to load dashboard')
      } finally {
        setDashLoading(false)
      }
    }
    load()
  }, [user])

  // Fetch user details for job personalization
  useEffect(() => {
    if (!user) return
    const loadUserDetails = async () => {
      try {
        const res = await api.get('/user-details/me')
        setUserDetails(res.data?.details)
      } catch (err) {
        console.log('User details not available yet')
      }
    }
    loadUserDetails()
  }, [user])

  const refreshDash = async () => {
    setDashLoading(true)
    setDashError(null)
    try {
      const res = await api.get('/users/me/dashboard')
      setDashData(res.data)
      setLastUpdated(new Date())
    } catch (err: unknown) {
      setDashError(getApiErrorMessage(err) || 'Failed to refresh dashboard')
    } finally {
      setDashLoading(false)
    }
  }

  // Fetch job listings from RapidAPI
  useEffect(() => {
    const fetchJobs = async () => {
      setJobsLoading(true)
      setJobsError(null)
      try {
        // Build personalized query based on user details
        let jobQuery = 'developer jobs in india'
        
        if (userDetails) {
          // Parse skills if it's a JSON string
          let skills: string[] = []
          if (userDetails.skills) {
            try {
              skills = typeof userDetails.skills === 'string' 
                ? JSON.parse(userDetails.skills) 
                : userDetails.skills
            } catch {
              skills = []
            }
          }

          // Build query based on role and skills
          if (userDetails.current_role === 'Student') {
            // For students, use their branch/skills
            if (skills.length > 0) {
              jobQuery = `${skills.slice(0, 2).join(' ')} fresher jobs in india`
            } else if (userDetails.branch) {
              jobQuery = `${userDetails.branch} fresher jobs in india`
            }
          } else if (userDetails.current_role === 'Fresher') {
            // For freshers, use their aspiring role and skills
            if (userDetails.headline) {
              jobQuery = `${userDetails.headline} fresher jobs in india`
            } else if (skills.length > 0) {
              jobQuery = `${skills.slice(0, 2).join(' ')} fresher jobs in india`
            }
          } else if (userDetails.current_role === 'Professional') {
            // For professionals, use their current role and experience
            if (userDetails.headline && userDetails.experience) {
              jobQuery = `${userDetails.headline} jobs in india`
            } else if (skills.length > 0) {
              jobQuery = `${skills.slice(0, 2).join(' ')} jobs in india`
            }
          } else if (skills.length > 0) {
            // Fallback to skills-based search
            jobQuery = `${skills.slice(0, 2).join(' ')} jobs in india`
          }

          // Add location if available
          if (userDetails.location) {
            jobQuery = jobQuery.replace('india', `${userDetails.location}, india`)
          }
        }

        const options = {
          method: 'GET',
          url: 'https://jsearch.p.rapidapi.com/search',
          params: {
            query: jobQuery,
            page: '1',
            num_pages: '1',
            country: 'in', // India
            date_posted: 'week'
          },
          headers: {
            'x-rapidapi-key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || 'ff814a8f8cmsh0aa30af17e3e1cdp1ed0f2jsnbd8e56c092ca',
            'x-rapidapi-host': process.env.NEXT_PUBLIC_RAPIDAPI_HOST || 'jsearch.p.rapidapi.com'
          }
        }
        const response = await axios.request(options)
        if (response.data && response.data.data) {
          // Take first 5 jobs
          setJobs(response.data.data.slice(0, 5))
        }
      } catch (error: unknown) {
        console.error('Error fetching jobs:', getErrorMessage(error))
        setJobsError('Failed to load job listings')
      } finally {
        setJobsLoading(false)
      }
    }
    
    // Only fetch jobs after user details are loaded or after a short delay
    const timer = setTimeout(() => {
      fetchJobs()
    }, 500)
    
    return () => clearTimeout(timer)
  }, [userDetails])



  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(
      new Date(year, month + (direction === 'next' ? 1 : -1), 1)
    );
  };

  const artifactImages = [
    "/artifact.svg",
    "/badge.svg",
    "/artifact.svg",
  ];

  const prevSlide = () => {
    setCurrent((prev) =>
      prev === 0 ? artifactImages.length - 1 : prev - 1
    );
  };

  const nextSlide = () => {
    setCurrent((prev) =>
      prev === artifactImages.length - 1 ? 0 : prev + 1
    );
  };

  const nextJob = () => {
    setCurrentJobIndex((prev) =>
      prev === jobs.length - 1 ? 0 : prev + 1
    );
  };

  const prevJob = () => {
    setCurrentJobIndex((prev) =>
      prev === 0 ? jobs.length - 1 : prev - 1
    );
  };

  const currentJob = jobs[currentJobIndex]

  // Helper functions for calendar
  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
  }

  const getInterviewsForDate = (day: number) => {
    if (!dashData) return { upcoming: [], past: [] }
    
    const checkDate = new Date(year, month, day)
    const upcoming = (dashData.upcomingInterviews || []).filter((interview: Record<string, unknown>) => {
      const sched = (interview as Record<string, unknown>)?.scheduled_at
      if (!sched || typeof sched !== 'string') return false
      const interviewDate = new Date(sched)
      return isSameDay(interviewDate, checkDate)
    })
    
    const past = (dashData.pastInterviews || []).filter((interview: Record<string, unknown>) => {
      const sched = (interview as Record<string, unknown>)?.scheduled_at
      if (!sched || typeof sched !== 'string') return false
      const interviewDate = new Date(sched)
      return isSameDay(interviewDate, checkDate)
    })
    
    return { upcoming, past }
  }

  const hasInterviews = (day: number) => {
    const { upcoming, past } = getInterviewsForDate(day)
    return upcoming.length > 0 || past.length > 0
  }

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(year, month, day)
    const { upcoming, past } = getInterviewsForDate(day)
    
    if (upcoming.length > 0 || past.length > 0) {
      setSelectedDate(clickedDate)
      setDateInterviews([...upcoming, ...past])
    } else {
      setSelectedDate(null)
      setDateInterviews([])
    }
  }
  
  return (
    <div className="min-h-screen p-4 lg:p-6">

      <div
        className="hidden lg:block absolute bottom-0 left-40 w-[800px] h-[300px] pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(circle at bottom left, rgb(239,225,255) 0%, rgb(239,225,255) 30%, transparent 50%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="hidden lg:block absolute bottom-0 right-0 w-[400px] h-[500px] pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(circle at bottom right, rgb(235,217,255) 0%, rgb(235,217,255) 30%, transparent 50%)",
          filter: "blur(40px)",
        }}
      />
      {dashError ? (
        <div className="mb-4">
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{dashError}</div>
        </div>
      ) : null}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 xl:gap-6">

        {/* LEFT COLUMN */}
        <div className="col-span-1 lg:col-span-3 space-y-6 ">
          <Card className="bg-[#F7F4FF]">
            <h4 className="font-semibold">Matrix - Interview</h4>
            <div className="flex justify-center py-6">
              <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-full border-[10px] border-[#e2c5fd] flex items-center justify-center text-lg font-bold">
                {dashLoading ? '…' : (dashData?.avg_overall_score !== null && dashData?.avg_overall_score !== undefined ? `${dashData.avg_overall_score}%` : '—')}
              </div>
            </div>
            <p className="text-md text-gray-500">Total Interviews</p>
            <p className="font-bold text-black">{dashLoading ? 'Loading…' : String(dashData?.total_interviews ?? 0)}</p>
            {!dashLoading ? (
              <div className="text-sm text-zinc-600">Completed: {dashData?.completed_count ?? 0} · Upcoming: {dashData?.upcoming_count ?? 0}</div>
            ) : null}


            <div className="flex justify-between">
              <div className="flex flex-col">
                <p>Last result</p>
                <p className="font-bold text-black">{dashData?.pastInterviews && dashData.pastInterviews[0] ? `${dashData.pastInterviews[0].overall_score ?? '—'}%` : '—'}</p>
              </div>
              <div className="text-[#9F50E9] flex items-center" >
                <FiArrowUpRight size={25} />
                <p className="font-bold text-md">{dashData?.pastInterviews && dashData.pastInterviews[0] ? `${dashData.pastInterviews[0].merit_pts ?? 0} pts` : '—'}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-[#9F50E9] py-5">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-white">
                  <p className="text-md">Total Count</p>
                  <p className="font-bold text-xl">123,456,789</p>
                </div>
                <div>
                  <FaRegCircleCheck size={40} color="#fff" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center bg-[#af71ed] px-2 rounded-lg">
                  <FiArrowUpRight size={20} color="#fff" />
                  <p className="text-white">+2%</p>
                </div>
                <p className="text-white text-sm">Over the last 24hours</p>
              </div>
            </div>
          </Card>

          <Card className="bg-[#F7F4FF]">
            <div className="flex justify-between items-center ">
              <p className="font-semibold">Past Interview Score</p>
              <FaRegQuestionCircle size={25} color="#4C0E87" />
            </div>

            {/* Last result */}
            {(() => {
              const last = dashData?.pastInterviews && dashData.pastInterviews.length > 0 ? dashData.pastInterviews[0] : null
              return (
                <>
                  <div className="flex justify-center py-6">
                    <div className="relative w-32 h-16">
                      <svg viewBox="0 0 200 100" className="w-full h-full">
                        {/* Background arc */}
                        <path d="M10 100 A90 90 0 0 1 190 100" fill="none" stroke="#E9D8FD" strokeWidth="16" strokeLinecap="round" />

                        {/* Progress arc */}
                        <path
                          d="M10 100 A90 90 0 0 1 190 100"
                          fill="none"
                          stroke="#9F50E9"
                          strokeWidth="16"
                          strokeLinecap="round"
                          strokeDasharray="282"
                          strokeDashoffset={last && typeof last.overall_score === 'number' ? String(282 - (last.overall_score / 100) * 282) : '77'}
                        />
                      </svg>

                      {/* Center text */}
                      <div className="absolute inset-0 flex items-end justify-center pb-1 font-bold text-lg text-black">
                        {last && last.overall_score !== undefined && last.overall_score !== null ? `${last.overall_score}%` : '—'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex gap-2 items-center">
                      <p className="h-4 w-4 rounded-full bg-[#9F50E9]" />
                      <p className="text-[#4C0E87] text-md">{last ? String(last.badge ?? 'Score') : 'No recent result'}</p>
                    </div>
                    <p className="font-bold text-black">{last ? `${last.merit_pts ?? 0} pts` : '—'}</p>
                    {last && last.result_created_at ? <div className="text-xs text-zinc-500">{new Date(String(last.result_created_at)).toLocaleString()}</div> : null}
                  </div>
                </>
              )
            })()}
          </Card>
        </div>

        {/* CENTER COLUMN */}
        <div className="col-span-1 lg:col-span-6 space-y-6">

          {/* STATS ROW */}
          <div className="flex  flex-col md:flex-row w-full justify-between gap-2 xl:gap-10">
            
            {/* <div className="grid grid-cols-3 gap-6"> */}
            <div className="flex flex-col w-full gap-5">
              <SmallCard
                title="Total Interviews"
                value={dashLoading ? 'Loading…' : String(dashData?.total_interviews ?? 0)}
                meta={!dashLoading ? `Upcoming: ${dashData?.upcoming_count ?? 0} · Past: ${dashData?.past_interviews_count ?? 0}` : undefined}
              />

              {/* Matrix - Interview summary small version for quick glance on mobile */}
              <div className="block md:hidden">
                <Card>
                  <p className="text-sm text-gray-500">Avg Score</p>
                  <h3 className="text-2xl font-bold">{dashLoading ? 'Loading…' : (dashData?.avg_overall_score !== null && dashData?.avg_overall_score !== undefined ? `${dashData.avg_overall_score}%` : '—')}</h3>
                  <div className="text-xs text-zinc-600 mt-1">Completed: {dashData?.completed_count ?? 0} · Upcoming: {dashData?.upcoming_count ?? 0}</div>
                </Card>
              </div>
              <SmallCard title="Community Activity" value={dashLoading ? 'Loading…' : (dashData?.total_credits !== undefined ? `${dashData.total_credits} Points` : '120 Points')} />
              <SmallCard title="Messages" value={dashLoading ? 'Loading…' : (dashData?.recent_invoices ? String(dashData.recent_invoices.length) : '50')} />
            </div>
            {/* </div> */}

            {/* BIG CARDS */}
            {/* <div className="grid grid-cols-2 gap-6"> */}
            <div className="w-full flex flex-col gap-5 ">
              <div className="relative flex flex-col items-center justify-center border border-[#AE73F3]/60 rounded-2xl bg-[#F7F4FF]">

                {/* Image Carousel */}
                <div className="relative w-[140px] h-[140px] flex items-center justify-center mb-3">

                  {/* Left Arrow */}
                  <button
                    onClick={prevSlide}
                    className="absolute -left-5 z-10 w-7 h-7 rounded-full bg-[#9F50E9] text-white flex items-center justify-center shadow hover:scale-105 transition"
                  >
                    ‹
                  </button>

                  {/* Image */}
                  <Image
                    src={artifactImages[current]}
                    alt="Artifact"
                    width={110}
                    height={110}
                    className="transition-all duration-300 ease-in-out"
                  />

                  {/* Right Arrow */}
                  <button
                    onClick={nextSlide}
                    className="absolute -right-5 z-10 w-7 h-7 rounded-full bg-[#9F50E9] text-white flex items-center justify-center shadow hover:scale-105 transition"
                  >
                    ›
                  </button>
                </div>

                {/* Text */}
                <p className="text-lg lg:text-xl  font-semibold text-[#6C1BB8]">
                  Total Artifact
                </p>
                <h3 className="text-3xl lg:text-4xl font-bold text-[#9F50E9] mt-1">
                  45
                </h3>
              </div>
              <div className="flex flex-col items-center justify-center border border-[#AE73F3]/60 rounded-2xl py-3 bg-[#F7F4FF]">
                <div className="flex flex-col items-center">
                  <p className="text-lg lg:text-xl  font-semibold text-[#6C1BB8]">Total Badges</p>
                  <h3 className="text-3xl lg:text-4xl font-bold text-[#9F50E9]">45</h3>

                  <Image src="/badge.svg" alt="" height={100} width={100} />
                </div>
              </div>
            </div>
          </div>
          {/* </div> */}

          {/* JOB CARD */}
          <Card className="p-0 overflow-hidden bg-[#F7F4FF] relative">
            <div className="py-3 px-5">
              <p className="text-[#4C0E87] font-semibold text-xl lg:text-2xl text-center">New Job Vacancy</p>
              {userDetails && (
                <p className="text-xs text-center text-[#9F50E9] mt-1">
                  ✨ Personalized for {String(userDetails.current_role ?? 'you')}
                  {userDetails.headline ? ` - ${String(userDetails.headline)}` : ''}
                </p>
              )}
            </div>
            
            {jobsLoading ? (
              <div className="p-10 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#9F50E9] border-r-transparent"></div>
                <p className="text-gray-500 mt-3">Finding perfect jobs for you...</p>
              </div>
            ) : jobsError ? (
              <div className="p-10 text-center">
                <p className="text-red-500">{jobsError}</p>
                <p className="text-xs text-gray-500 mt-2">Showing general job listings</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-gray-500">No jobs available</p>
                <p className="text-xs text-gray-400 mt-2">Try updating your skills in profile</p>
              </div>
            ) : currentJob ? (
              <>
                {/* Navigation Arrows */}
                {jobs.length > 1 && (
                  <>
                    <button
                      onClick={prevJob}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[#9F50E9] text-white flex items-center justify-center shadow hover:scale-105 transition"
                    >
                      ‹
                    </button>
                    <button
                      onClick={nextJob}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[#9F50E9] text-white flex items-center justify-center shadow hover:scale-105 transition"
                    >
                      ›
                    </button>
                  </>
                )}

                {/* Company Logo */}
                {currentJob.employer_logo ? (
                  <div className="w-full h-32 lg:h-40 bg-white flex items-center justify-center p-4">
                    <img
                      src={String(currentJob.employer_logo ?? '')}
                      alt={String(currentJob.employer_name ?? '')}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="text-2xl font-bold text-[#9F50E9]">${String(currentJob.employer_name ?? '')}</div>`;
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 lg:h-40 bg-white flex items-center justify-center">
                    <div className="text-2xl font-bold text-[#9F50E9]">{String(currentJob.employer_name ?? '')}</div>
                  </div>
                )}

                <div className="p-5">
                  <h3 className="font-bold text-xl lg:text-2xl text-[#4C0E87] text-center line-clamp-2">
                    {String(currentJob.job_title ?? '')}
                  </h3>
                  <p className="text-sm text-center text-[#6C1BB8] mt-1">
                    {String(currentJob.employer_name ?? '')}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 justify-center mt-3">
                    {typeof currentJob.job_city === 'string' && (
                      <span className="px-3 py-1 bg-[#E6D7FF] rounded-full text-xs text-[#6C1BB8]">
                        📍 {String(currentJob.job_city)}, {String(currentJob.job_state ?? '')}
                      </span>
                    )}
                    {typeof currentJob.job_employment_type === 'string' && (
                      <span className="px-3 py-1 bg-[#E6D7FF] rounded-full text-xs text-[#6C1BB8]">
                        💼 {String(currentJob.job_employment_type)}
                      </span>
                    )}
                    {currentJob.job_is_remote === true && (
                      <span className="px-3 py-1 bg-[#E6D7FF] rounded-full text-xs text-[#6C1BB8]">
                        🏠 Remote
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {String(currentJob.job_description ?? '').substring(0, 120) || 'Click to view full job description...'}
                      </p>
                      {typeof currentJob.job_posted_human_readable === 'string' && (
                        <p className="text-xs text-gray-400 mt-1">Posted {String(currentJob.job_posted_human_readable)}</p>
                      )}
                    </div>
                    <a
                      href={String(currentJob.job_apply_link ?? '')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-3 h-10 w-10 rounded-full bg-[#9F50E9] flex items-center justify-center hover:bg-[#8b44d9] transition flex-shrink-0"
                    >
                      <FiArrowUpRight size={25} color="#fff" />
                    </a>
                  </div>

                  {/* Job count indicator */}
                  {jobs.length > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      {jobs.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentJobIndex(idx)}
                          className={`h-2 rounded-full transition-all ${
                            idx === currentJobIndex 
                              ? 'w-6 bg-[#9F50E9]' 
                              : 'w-2 bg-[#E6D7FF]'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-span-1 lg:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row lg:flex-col gap-5 ">

            <div className="border border-[#AE73F3]/60 rounded-2xl rounded-3xl p-6 w-full max-w-sm mx-auto bg-[#F7F4FF]">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => changeMonth('prev')}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#E6D7FF] border border-[#6C1BB8]/40 text-[#6C1BB8]"
                >
                  <ChevronLeft size={18} />
                </button>

                <h2 className="text-lg font-semibold text-[#6C1BB8]">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>

                <button
                  onClick={() => changeMonth('next')}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#E6D7FF] border border-[#6C1BB8]/40 text-[#6C1BB8]"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Week Days */}
              <div className="grid grid-cols-7 text-sm text-[#9F50E9] mb-2">
                {WEEK_DAYS.map(day => (
                  <div key={day} className="text-center">
                    {day}
                  </div>
                ))}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-7 gap-y-2 text-sm text-[#6C1BB8]">
                {/* Empty slots */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {/* Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const { upcoming, past } = getInterviewsForDate(day)
                  const hasUpcoming = upcoming.length > 0
                  const hasPast = past.length > 0
                  const isToday = isSameDay(new Date(year, month, day), new Date())
                  const isSelected = selectedDate && isSameDay(new Date(year, month, day), selectedDate)

                  return (
                    <div
                      key={i}
                      onClick={() => handleDateClick(day)}
                      className={`
                        relative text-center cursor-pointer min-h-[32px] flex items-center justify-center rounded-lg transition-all
                        ${isToday ? 'font-bold ring-2 ring-[#9F50E9]' : ''}
                        ${isSelected ? 'bg-[#9F50E9] text-white' : ''}
                        ${!isSelected && hasUpcoming ? 'bg-[#E6D7FF] hover:bg-[#d4bfff]' : ''}
                        ${!isSelected && !hasUpcoming && hasPast ? 'bg-[#F0F0F0] hover:bg-[#E5E5E5]' : ''}
                        ${!isSelected && !hasUpcoming && !hasPast ? 'hover:bg-[#F7F4FF]' : ''}
                      `}
                      title={
                        hasUpcoming || hasPast
                          ? `${hasUpcoming ? `${upcoming.length} upcoming` : ''} ${hasUpcoming && hasPast ? ', ' : ''} ${hasPast ? `${past.length} past` : ''}`
                          : ''
                      }
                    >
                      <span>{day}</span>
                      {(hasUpcoming || hasPast) && !isSelected && (
                        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {hasUpcoming && <div className="h-1 w-1 rounded-full bg-[#9F50E9]" />}
                          {hasPast && <div className="h-1 w-1 rounded-full bg-[#6C1BB8]" />}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Calendar Legend */}
            <div className="flex items-center justify-center gap-4 text-xs mt-3">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-[#9F50E9]"></div>
                <span className="text-[#6C1BB8]">Upcoming</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-[#6C1BB8]"></div>
                <span className="text-[#6C1BB8]">Past</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded border-2 border-[#9F50E9]"></div>
                <span className="text-[#6C1BB8]">Today</span>
              </div>
            </div>

            {/* Selected Date Interviews */}
            {selectedDate && dateInterviews.length > 0 && (
              <div className="mt-4 p-4 bg-white rounded-xl border border-[#E6D7FF]">
                <h3 className="text-sm font-semibold text-[#6C1BB8] mb-2">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {dateInterviews.map((interview: Record<string, unknown>, idx: number) => {
                    const sched = (interview as Record<string, unknown>)?.scheduled_at
                    const isPast = typeof sched === 'string' && new Date(sched) < new Date()
                    const company = typeof (interview as Record<string, unknown>)?.company_name === 'string' ? (interview as Record<string, unknown>)?.company_name as string : 'Company'
                    const position = typeof (interview as Record<string, unknown>)?.position_name === 'string' ? (interview as Record<string, unknown>)?.position_name as string : (typeof (interview as Record<string, unknown>)?.position === 'string' ? (interview as Record<string, unknown>)?.position as string : 'Position')
                    const timeStr = typeof sched === 'string' ? new Date(sched).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg text-xs ${
                          isPast ? 'bg-gray-50' : 'bg-[#F7F4FF]'
                        }`}
                      >
                        <div className="font-medium text-[#6C1BB8]">
                          {company}
                        </div>
                        <div className="text-gray-600">
                          {position}
                        </div>
                        <div className="text-gray-500 text-[10px] mt-1">
                          {timeStr}
                          {isPast && ' (Completed)'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <Card className="w-full max-w-sm rounded-2xl bg-[#FBF7FF] p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-black">
                  Notifications <span className="text-gray-500 font-normal">({unreadCount} unread)</span>
                </p>

                <RiEqualizerLine size={30} color="#9F50E9" />
              </div>

              {/* Notification items */}
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No notifications yet</p>
                    <p className="text-xs mt-1">Check back later!</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notif, idx) => (
                    <div 
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`flex items-start gap-3 pb-4 border-b border-[#E9E0F5] cursor-pointer transition-all ${
                        !notif.read ? 'bg-white/50 p-2 rounded-lg' : ''
                      }`}
                    >
                      <div className="text-2xl flex-shrink-0">{notif.icon || '📢'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-black truncate">{notif.title}</p>
                          {!notif.read && (
                            <div className="h-2 w-2 rounded-full bg-[#9F50E9] flex-shrink-0"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Button */}
              {unreadCount > 0 && (
                <button 
                  onClick={() => notifications.forEach(n => markAsRead(n.id))}
                  className="mt-5 w-full rounded-xl bg-[#F1E6FF] py-2 text-sm font-semibold text-[#9F50E9] hover:bg-[#E6D7FF] transition"
                >
                  Mark all as read
                </button>
              )}
            </Card>

          </div>
          <div className="flex flex-col items-end justify-end h-1/5">
            <Image src="/footer.svg" alt="" height={400} width={400} />
          </div>

        </div>


      </div>
    </div >
  );
}

/* COMPONENTS */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-card border border-[#AE73F3]/60  rounded-2xl p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function SmallCard({ title, value, meta }: { title: string; value: React.ReactNode; meta?: React.ReactNode }) {
  return (
    <Card className="bg-[#F7F4FF]">
      <div className="flex justify-between">
        <div>
          <p className="text-lg text-[#6C1BB8]">{title}</p>
          <h3 className="text-xl font-bold mt-2">{value}</h3>
          {meta ? <div className="text-xs text-zinc-500 mt-1">{meta}</div> : null}
        </div>
        <p className="text-sm text-[#6C1BB8]">
          <FaRegQuestionCircle size={25} />
        </p>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-[#9F50E9] text-md">+124 New</p>
        <p className="text-md text-[#6C1BB8] mt-1">Over last 24 hours</p>
      </div>
    </Card>
  );
}


