'use client'

import * as React from 'react'
import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/error'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Plan = {
  plan_id: number
  name: string
  price_cents: number
  interval: string
  credits_allocated: number
}

type Subscription = {
  subscription_id: number
  user_id: number
  plan_id: number
  plan_type?: string | null
  start_date: string
  end_date: string
  is_active: number | boolean
  plan_name?: string | null
  price_cents?: number | null
  interval?: string | null
  credits_allocated?: number | null
}

type Invoice = {
  invoice_id: number
  invoice_number: string
  issued_at: string
  total: number
  payment_type?: string | null
  payment_method?: string | null
  amount?: number | null
}

function getUserId(user: unknown): number | null {
  if (!user || typeof user !== 'object') return null
  const u = user as Record<string, unknown>
  const raw = (u.user_id ?? u.id) as unknown
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

function formatMoneyFromCents(cents: number | null | undefined): string {
  const n = typeof cents === 'number' ? cents : 0
  const amount = n / 100
  return amount.toLocaleString(undefined, { style: 'currency', currency: 'INR' })
}

function formatDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

export default function SubscriptionsPage() {
  const { user } = useAuth()
  const userId = getUserId(user)

  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [actionMessage, setActionMessage] = React.useState<string | null>(null)
  const [subscribingPlanId, setSubscribingPlanId] = React.useState<number | null>(null)

  const [plans, setPlans] = React.useState<Plan[]>([])
  const [activeSubscription, setActiveSubscription] = React.useState<Subscription | null>(null)
  const [invoices, setInvoices] = React.useState<Invoice[]>([])
  const [history, setHistory] = React.useState<Subscription[]>([])

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    setActionMessage(null)
    try {
      const plansRes = await api.get('/subscriptions/plans')
      const nextPlans = (plansRes.data?.plans as Plan[]) || []
      setPlans(nextPlans)

      // Authenticated endpoints: best-effort.
      try {
        const [meRes, invoicesRes, allSubsRes] = await Promise.all([
          api.get('/subscriptions/me'),
          api.get('/subscriptions/invoices/me'),
          api.get('/subscriptions'),
        ])
        setActiveSubscription((meRes.data?.subscription as Subscription) || null)
        setInvoices((invoicesRes.data?.invoices as Invoice[]) || [])
        const allSubs = (allSubsRes.data as Subscription[]) || []
        const filtered = userId ? allSubs.filter((s) => Number(s.user_id) === userId) : allSubs
        setHistory(filtered.sort((a, b) => Number(b.subscription_id) - Number(a.subscription_id)))
      } catch {
        setActiveSubscription(null)
        setInvoices([])
        setHistory([])
      }
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to load subscriptions')
    } finally {
      setLoading(false)
    }
  }, [userId])

  React.useEffect(() => {
    load()
  }, [load])

  const subscribe = async (plan: Plan) => {
    const ok = window.confirm(`Subscribe to ${plan.name}?`)
    if (!ok) return
    setSubscribingPlanId(plan.plan_id)
    setError(null)
    setActionMessage(null)
    try {
      await api.post('/subscriptions/subscribe', { plan_id: plan.plan_id })
      setActionMessage('Subscription created. If you already have a paid plan, this may be scheduled to start after it ends.')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to subscribe')
    } finally {
      setSubscribingPlanId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[var(--font-plus-jakarta)] text-2xl font-bold text-zinc-900">Subscriptions</h1>
          <p className="mt-1 text-sm text-zinc-600">Manage your plan and billing history.</p>
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

      {actionMessage ? (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="py-4 text-sm text-emerald-900">{actionMessage}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white/60">
          <CardHeader>
            <CardTitle className="text-base">Current plan</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-zinc-600">Loading…</div>
            ) : activeSubscription ? (
              <div className="space-y-2">
                <div className="text-lg font-semibold text-zinc-900">
                  {activeSubscription.plan_name || activeSubscription.plan_type || `Plan #${activeSubscription.plan_id}`}
                </div>
                <div className="text-sm text-zinc-600">
                  {formatMoneyFromCents(activeSubscription.price_cents ?? null)} / {activeSubscription.interval || 'monthly'}
                </div>
                <div className="text-sm text-zinc-600">
                  Active until <span className="font-medium">{formatDate(activeSubscription.end_date)}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-zinc-600">No active subscription found.</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/60">
          <CardHeader>
            <CardTitle className="text-base">Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-zinc-600">Loading…</div>
            ) : invoices.length === 0 ? (
              <div className="text-sm text-zinc-600">No invoices yet.</div>
            ) : (
              <div className="space-y-3">
                {invoices.map((inv) => (
                  <div key={inv.invoice_id} className="rounded-2xl border border-white/70 bg-white/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">{inv.invoice_number}</div>
                        <div className="mt-1 text-xs text-zinc-600">{formatDate(inv.issued_at)}</div>
                        {inv.payment_method ? (
                          <div className="mt-1 text-xs text-zinc-600">Method: {inv.payment_method}</div>
                        ) : null}
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

      <Card className="bg-white/60">
        <CardHeader>
          <CardTitle className="text-base">Available plans</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-zinc-600">Loading…</div>
          ) : plans.length === 0 ? (
            <div className="text-sm text-zinc-600">No plans found.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const isActive = activeSubscription?.plan_id === plan.plan_id
                return (
                  <div key={plan.plan_id} className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-sm">
                    <div className="text-sm font-semibold text-zinc-900">{plan.name}</div>
                    <div className="mt-1 text-sm text-zinc-600">
                      {formatMoneyFromCents(plan.price_cents)} / {plan.interval}
                    </div>
                    <div className="mt-2 text-sm text-zinc-600">Credits: {plan.credits_allocated}</div>
                    <div className="mt-4">
                      <Button
                        className="w-full"
                        variant={isActive ? 'secondary' : 'default'}
                        disabled={subscribingPlanId === plan.plan_id || isActive}
                        onClick={() => subscribe(plan)}
                      >
                        {isActive ? 'Current plan' : subscribingPlanId === plan.plan_id ? 'Subscribing…' : 'Subscribe'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/60">
        <CardHeader>
          <CardTitle className="text-base">Subscription history</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-zinc-600">Loading…</div>
          ) : history.length === 0 ? (
            <div className="text-sm text-zinc-600">No subscription history found.</div>
          ) : (
            <div className="space-y-3">
              {history.slice(0, 10).map((s) => (
                <div key={s.subscription_id} className="rounded-2xl border border-white/70 bg-white/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-zinc-900">{s.plan_type || `Plan #${s.plan_id}`}</div>
                      <div className="mt-1 text-xs text-zinc-600">
                        {formatDate(s.start_date)} → {formatDate(s.end_date)}
                      </div>
                    </div>
                    <div className="text-xs text-zinc-600">{s.is_active ? 'active' : 'inactive'}</div>
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
