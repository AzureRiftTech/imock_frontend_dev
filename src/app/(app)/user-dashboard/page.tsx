'use client'

import * as React from 'react'
import Link from 'next/link'
import { FadeIn } from '@/components/motion/fade-in'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/auth-context'
import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/error'
import { sweetAlert, sweetConfirm } from '@/lib/swal' 

type UserDashboardResp = {
  subscription: {
    subscription_id: number
    plan_id: number
    plan_name?: string
    start_date?: string
    end_date?: string
    is_active?: boolean
    price_cents?: number
    credits_allocated?: number
  } | null
  upcomingInterviews: Array<Record<string, unknown>>
  credits: { credit_id: number; current_credits: number } | null
  recent_invoices: Array<Record<string, unknown>>
  total_credits?: number
}

function formatMoney(n?: number | null) {
  const v = typeof n === 'number' ? n : 0
  return v.toLocaleString(undefined, { style: 'currency', currency: 'INR' })
}

export default function UserDashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<UserDashboardResp | null>(null)

  React.useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get('/users/me/dashboard')
        setData(res.data)
      } catch (err) {
        setError(getApiErrorMessage(err) || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (!user) return null

  return (
    <FadeIn>
      <div className="space-y-6">
        <div>
          <h1 className="font-[var(--font-plus-jakarta)] text-3xl font-bold tracking-tight text-zinc-900">My Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">Overview of your current plan, upcoming interviews, credits, and invoices.</p>
        </div>

        {error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-4 text-sm text-red-800">{error}</CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-white/60">
            <CardHeader>
              <CardTitle className="text-sm">Current plan</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm text-zinc-600">Loading…</div>
              ) : data?.subscription ? (
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-zinc-900">{data.subscription.plan_name}</div>
                  <div className="text-sm text-zinc-600">Credits: {data.subscription.credits_allocated ?? '-'}</div>
                  <div className="text-sm text-zinc-600">Start: {data.subscription.start_date ? new Date(data.subscription.start_date).toLocaleString() : '-'}</div>
                  <div className="text-sm text-zinc-600">End: {data.subscription.end_date ? new Date(data.subscription.end_date).toLocaleString() : '-'}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <Link href="/subscriptions">
                      <Button>Manage subscription</Button>
                    </Link>
                    <Button variant="ghost" onClick={() => window.location.reload()}>Refresh</Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-zinc-600">No active subscription. <Link href="/subscriptions" className="text-brand-600 underline">Subscribe</Link></div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/60">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-sm">Credits</CardTitle>
              <div className="ml-2">
                {!loading && (
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                    {data?.total_credits ?? data?.credits?.current_credits ?? 0} total
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm text-zinc-600">Loading…</div>
              ) : (
                <div className="space-y-3">
                  <div className="text-2xl font-semibold text-zinc-900">{data?.credits?.current_credits ?? '—'}</div>
                  <div className="text-sm text-zinc-600">Current available credits</div>
                  <div className="text-xs text-zinc-500">Total credits: {data?.total_credits ?? data?.credits?.current_credits ?? 0}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <Link href="/subscriptions">
                      <Button>Buy credits</Button>
                    </Link>
                    <Button variant="ghost" onClick={() => { void sweetAlert('Request credits', 'To request free credits, contact support or upgrade your plan.', 'info') }}>Request credits</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/60">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-sm">Upcoming interviews</CardTitle>
              <div className="ml-2">
                {!loading && (
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                    {data?.upcomingInterviews ? data.upcomingInterviews.length : 0} upcoming
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm text-zinc-600">Loading…</div>
              ) : data?.upcomingInterviews && data.upcomingInterviews.length > 0 ? (
                <div className="space-y-2">
                  {data.upcomingInterviews.map((i: Record<string, unknown>) => (
                    <motion.div key={String(i.interview_id)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }} className="rounded-xl border border-white/70 bg-white/70 p-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">{String(i.company_name)} — {String(i.position_name ?? i.position ?? '')}</div>
                        <div className="text-xs text-zinc-600">{i.scheduled_at ? new Date(String(i.scheduled_at)).toLocaleString() : ''}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/mock-interview/${String(i.interview_id)}`}>
                          <Button>Open</Button>
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                  <div>
                    <Link href="/user/interviews"><Button variant="ghost">View all</Button></Link>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center p-4">
                  <div className="text-center">
                    <div className="text-sm text-zinc-500">Upcoming</div>
                    <div className="text-3xl font-semibold text-zinc-900">{data?.upcomingInterviews ? data.upcomingInterviews.length : 0}</div>
                    <div className="text-sm text-zinc-500">scheduled</div>
                    <div className="mt-2"><Link href="/interviews" className="text-brand-600 underline">Schedule one</Link></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/60">
          <CardHeader>
            <CardTitle className="text-sm">Recent invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-zinc-600">Loading…</div>
            ) : data?.recent_invoices && data.recent_invoices.length > 0 ? (
              <div className="space-y-2">
                {data.recent_invoices.map((inv: Record<string, unknown>) => (
                  <motion.div key={String(inv.invoice_id)} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{String(inv.invoice_number ?? '')}</div>
                      <div className="text-xs text-zinc-500">{inv.issued_at ? new Date(String(inv.issued_at)).toLocaleString() : ''}</div>
                    </div>
                    <div className="text-sm font-semibold">{formatMoney(Number(inv.total as unknown as number))}</div>
                  </motion.div>
                ))}
                <div className="mt-2">
                  <Link href="/subscriptions"><Button variant="ghost">View all invoices</Button></Link>
                </div>
              </div>
            ) : (
              <div className="text-sm text-zinc-600">No invoices yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </FadeIn>
  )
}