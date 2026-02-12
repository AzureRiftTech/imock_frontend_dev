'use client'

import * as React from 'react'
import { useAuth } from '@/context/auth-context'
import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/error'
import { sweetConfirm, sweetAlert } from '@/lib/swal' 
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type User = {
  user_id: number
  username: string
  email: string
  role: string
  email_verified?: number
  created_at?: string
  is_active?: number
}

type Plan = {
  plan_id: number
  name: string
  price_cents: number
  interval: string
  credits_allocated: number
  trial_period_days?: number
  description?: string
}

type CreditPackage = {
  package_id: number
  name: string
  credits: number
  price_cents: number
}

type JobCategory = {
  job_category_id: number
  category_name: string
  description?: string | null
}

type AiModel = {
  ai_model_id: number
  model_name: string
  api_key?: string | null
  description?: string | null
}

type CreditsRow = {
  credit_id: number
  user_id: number
  subscription_id?: number | null
  current_credits: number
  updated_at?: string | null
  created_at?: string | null
}

type ServiceRate = {
  id: number
  service_name: string
  credits_per_unit: number
  unit_type: string
  description?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

type UserSubscriptionRow = Record<string, unknown>

function formatMoneyFromCents(cents: number | null | undefined): string {
  const n = typeof cents === 'number' ? cents : 0
  return (n / 100).toLocaleString(undefined, { style: 'currency', currency: 'INR' })
}

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-3xl rounded-3xl border border-white/60 bg-white/90 shadow-xl backdrop-blur">
        <div className="flex items-center justify-between border-b border-white/60 px-6 py-4">
          <div className="font-[var(--font-plus-jakarta)] text-lg font-semibold text-zinc-900">{title}</div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export default function SuperAdminPage() {
  const { user } = useAuth()
  const role = (user as User | undefined)?.role

  const [tab, setTab] = React.useState<'users' | 'plans' | 'creditPackages' | 'categories' | 'aiModels' | 'credits' | 'serviceRates'>(
    'users'
  )

  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const [users, setUsers] = React.useState<User[]>([])
  const [plans, setPlans] = React.useState<Plan[]>([])
  const [creditPackages, setCreditPackages] = React.useState<CreditPackage[]>([])
  const [categories, setCategories] = React.useState<JobCategory[]>([])
  const [aiModels, setAiModels] = React.useState<AiModel[]>([])
  const [credits, setCredits] = React.useState<CreditsRow[]>([])
  const [serviceRates, setServiceRates] = React.useState<ServiceRate[]>([])

  const [userModal, setUserModal] = React.useState<{ mode: 'create' | 'edit'; user?: User } | null>(null)
  const [planModal, setPlanModal] = React.useState<{ mode: 'create' | 'edit'; plan?: Plan } | null>(null)
  const [pkgModal, setPkgModal] = React.useState<{ mode: 'create' | 'edit'; pkg?: CreditPackage } | null>(null)
  const [catModal, setCatModal] = React.useState<{ mode: 'create' | 'edit'; cat?: JobCategory } | null>(null)
  const [modelModal, setModelModal] = React.useState<{ mode: 'create' | 'edit'; model?: AiModel } | null>(null)
  const [rateModal, setRateModal] = React.useState<{ mode: 'create' | 'edit'; rate?: ServiceRate } | null>(null)

  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)
  const [selectedUserSubs, setSelectedUserSubs] = React.useState<UserSubscriptionRow[]>([])
  const [selectedUserCredits, setSelectedUserCredits] = React.useState<CreditsRow[]>([])
  const [grantAmount, setGrantAmount] = React.useState<string>('')

  const isSuperAdmin = role === 'super_admin'

  const loadAll = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const [usersRes, plansRes, pkgsRes, catsRes, modelsRes, creditsRes, ratesRes] = await Promise.all([
        api.get('/super-admin/users'),
        api.get('/super-admin/plans'),
        api.get('/super-admin/credit-packages'),
        api.get('/super-admin/job-categories'),
        api.get('/super-admin/ai-models'),
        api.get('/super-admin/credits'),
        api.get('/super-admin/service-rates'),
      ])
      setUsers((usersRes.data as User[]) || [])
      setPlans((plansRes.data as Plan[]) || [])
      setCreditPackages((pkgsRes.data as CreditPackage[]) || [])
      setCategories((catsRes.data as JobCategory[]) || [])
      setAiModels((modelsRes.data as AiModel[]) || [])
      setCredits((creditsRes.data as CreditsRow[]) || [])
      setServiceRates((ratesRes.data as ServiceRate[]) || [])
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to load super admin data')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (!isSuperAdmin) {
      setLoading(false)
      return
    }
    loadAll()
  }, [isSuperAdmin, loadAll])

  const loadUserDetails = async (u: User) => {
    setSelectedUser(u)
    setGrantAmount('')
    setError(null)
    setSuccess(null)
    try {
      const [subsRes, creditsRes] = await Promise.all([
        api.get(`/super-admin/users/${u.user_id}/subscriptions`),
        api.get(`/super-admin/users/${u.user_id}/credits`),
      ])
      setSelectedUserSubs((subsRes.data as UserSubscriptionRow[]) || [])
      setSelectedUserCredits((creditsRes.data as CreditsRow[]) || [])
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to load user details')
    }
  }

  const grantCredits = async () => {
    if (!selectedUser) return
    const amount = Number(grantAmount)
    if (!amount || amount <= 0) {
      setError('Enter a valid amount')
      return
    }
    setError(null)
    setSuccess(null)
    try {
      await api.post(`/super-admin/users/${selectedUser.user_id}/credits/grant`, { amount })
      setSuccess('Credits granted')
      await loadUserDetails(selectedUser)
      await loadAll()
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to grant credits')
    }
  }

  if (!isSuperAdmin) {
    return (
      <Card className="bg-white/60">
        <CardHeader>
          <CardTitle className="text-base">Forbidden</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-600">You must be a super admin to access this page.</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[var(--font-plus-jakarta)] text-2xl font-bold text-zinc-900">Super Admin</h1>
          <p className="mt-1 text-sm text-zinc-600">Manage users, plans, packages, and credits.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={loadAll} disabled={loading}>
            Refresh
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

      <div className="flex flex-wrap gap-2">
        <TabButton active={tab === 'users'} onClick={() => setTab('users')}>
          Users
        </TabButton>
        <TabButton active={tab === 'plans'} onClick={() => setTab('plans')}>
          Plans
        </TabButton>
        <TabButton active={tab === 'creditPackages'} onClick={() => setTab('creditPackages')}>
          Credit Packages
        </TabButton>
        <TabButton active={tab === 'categories'} onClick={() => setTab('categories')}>
          Job Categories
        </TabButton>
        <TabButton active={tab === 'aiModels'} onClick={() => setTab('aiModels')}>
          AI Models
        </TabButton>
        <TabButton active={tab === 'credits'} onClick={() => setTab('credits')}>
          Credits
        </TabButton>
        <TabButton active={tab === 'serviceRates'} onClick={() => setTab('serviceRates')}>
          Service Rates
        </TabButton>
      </div>

      {tab === 'users' ? (
        <Card className="bg-white/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Users</CardTitle>
            <Button onClick={() => setUserModal({ mode: 'create' })}>Create user</Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-zinc-600">Loading…</div>
            ) : users.length === 0 ? (
              <div className="text-sm text-zinc-600">No users found.</div>
            ) : (
              <div className="space-y-2">
                {users.map((u) => (
                  <div key={u.user_id} className="rounded-2xl border border-white/70 bg-white/70 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">
                          {u.username} <span className="text-zinc-500">#{u.user_id}</span>
                        </div>
                        <div className="mt-1 text-sm text-zinc-600">{u.email}</div>
                        <div className="mt-1 text-xs text-zinc-600">Role: {u.role} · Active: {u.is_active ? 'yes' : 'no'}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => void loadUserDetails(u)}>
                          Details
                        </Button>
                        <Button variant="secondary" onClick={() => setUserModal({ mode: 'edit', user: u })}>
                          Edit
                        </Button>
                        <Button variant="destructive" onClick={() => void deleteUser(u, setError, setSuccess, loadAll)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedUser ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <Card className="bg-white/60">
                  <CardHeader>
                    <CardTitle className="text-sm">User subscriptions ({selectedUser.username})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedUserSubs.length === 0 ? (
                      <div className="text-sm text-zinc-600">No subscriptions.</div>
                    ) : (
                      <details className="rounded-2xl border border-white/70 bg-white/70 p-3">
                        <summary className="cursor-pointer text-sm font-semibold text-zinc-900">View raw</summary>
                        <pre className="mt-2 overflow-auto text-xs text-zinc-700">{JSON.stringify(selectedUserSubs, null, 2)}</pre>
                      </details>
                    )}
                  </CardContent>
                </Card>
                <Card className="bg-white/60">
                  <CardHeader>
                    <CardTitle className="text-sm">User credits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedUserCredits.length === 0 ? (
                      <div className="text-sm text-zinc-600">No credit rows.</div>
                    ) : (
                      <div className="space-y-2">
                        {selectedUserCredits.slice(0, 5).map((c) => (
                          <div key={c.credit_id} className="rounded-2xl border border-white/70 bg-white/70 p-3 text-sm text-zinc-700">
                            #{c.credit_id} · {c.current_credits} credits
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-end gap-2">
                      <div className="grid gap-2">
                        <Label htmlFor="grant_amount">Grant credits</Label>
                        <Input
                          id="grant_amount"
                          value={grantAmount}
                          onChange={(e) => setGrantAmount(e.target.value)}
                          placeholder="10"
                        />
                      </div>
                      <Button onClick={() => void grantCredits()}>Grant</Button>
                      <Button variant="ghost" onClick={() => setSelectedUser(null)}>
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {tab === 'plans' ? (
        <CrudListCard
          title="Plans"
          createLabel="Create plan"
          onCreate={() => setPlanModal({ mode: 'create' })}
          loading={loading}
        >
          {plans.map((p) => (
            <div key={p.plan_id} className="rounded-2xl border border-white/70 bg-white/70 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">
                    {p.name} <span className="text-zinc-500">#{p.plan_id}</span>
                  </div>
                  <div className="mt-1 text-sm text-zinc-600">
                    {formatMoneyFromCents(p.price_cents)} / {p.interval} · credits: {p.credits_allocated}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => setPlanModal({ mode: 'edit', plan: p })}>
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={() => void deletePlan(p, setError, setSuccess, loadAll)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CrudListCard>
      ) : null}

      {tab === 'creditPackages' ? (
        <CrudListCard
          title="Credit packages"
          createLabel="Create package"
          onCreate={() => setPkgModal({ mode: 'create' })}
          loading={loading}
        >
          {creditPackages.map((pkg) => (
            <div key={pkg.package_id} className="rounded-2xl border border-white/70 bg-white/70 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">
                    {pkg.name} <span className="text-zinc-500">#{pkg.package_id}</span>
                  </div>
                  <div className="mt-1 text-sm text-zinc-600">
                    {formatMoneyFromCents(pkg.price_cents)} · credits: {pkg.credits}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => setPkgModal({ mode: 'edit', pkg })}>
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={() => void deleteCreditPackage(pkg, setError, setSuccess, loadAll)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CrudListCard>
      ) : null}

      {tab === 'categories' ? (
        <CrudListCard
          title="Job categories"
          createLabel="Create category"
          onCreate={() => setCatModal({ mode: 'create' })}
          loading={loading}
        >
          {categories.map((c) => (
            <div key={c.job_category_id} className="rounded-2xl border border-white/70 bg-white/70 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">
                    {c.category_name} <span className="text-zinc-500">#{c.job_category_id}</span>
                  </div>
                  {c.description ? <div className="mt-1 text-sm text-zinc-600">{c.description}</div> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => setCatModal({ mode: 'edit', cat: c })}>
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={() => void deleteCategory(c, setError, setSuccess, loadAll)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CrudListCard>
      ) : null}

      {tab === 'aiModels' ? (
        <CrudListCard
          title="AI models"
          createLabel="Create model"
          onCreate={() => setModelModal({ mode: 'create' })}
          loading={loading}
        >
          {aiModels.map((m) => (
            <div key={m.ai_model_id} className="rounded-2xl border border-white/70 bg-white/70 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">
                    {m.model_name} <span className="text-zinc-500">#{m.ai_model_id}</span>
                  </div>
                  {m.description ? <div className="mt-1 text-sm text-zinc-600">{m.description}</div> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => setModelModal({ mode: 'edit', model: m })}>
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={() => void deleteAiModel(m, setError, setSuccess, loadAll)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CrudListCard>
      ) : null}

      {tab === 'credits' ? (
        <Card className="bg-white/60">
          <CardHeader>
            <CardTitle className="text-base">Credits</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-zinc-600">Loading…</div>
            ) : credits.length === 0 ? (
              <div className="text-sm text-zinc-600">No credits found.</div>
            ) : (
              <div className="space-y-2">
                {credits.slice(0, 50).map((c) => (
                  <CreditsRowEditor key={c.credit_id} row={c} onUpdated={loadAll} setError={setError} setSuccess={setSuccess} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === 'serviceRates' ? (
        <CrudListCard
          title="Service Rates"
          createLabel="Create rate"
          onCreate={() => setRateModal({ mode: 'create' })}
          loading={loading}
        >
          {serviceRates.map((r) => (
            <div key={r.id} className="rounded-2xl border border-white/70 bg-white/70 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">
                    {r.service_name} <span className="text-zinc-500">#{r.id}</span>
                    {!r.is_active ? <span className="ml-2 text-xs text-red-600">(Inactive)</span> : null}
                  </div>
                  <div className="mt-1 text-sm text-zinc-600">
                    {r.credits_per_unit} credits {r.unit_type}
                  </div>
                  {r.description ? <div className="mt-1 text-xs text-zinc-500">{r.description}</div> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => setRateModal({ mode: 'edit', rate: r })}>
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={() => void deleteServiceRate(r, setError, setSuccess, loadAll)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CrudListCard>
      ) : null}

      <Modal
        open={Boolean(userModal)}
        title={userModal?.mode === 'create' ? 'Create user' : 'Edit user'}
        onClose={() => setUserModal(null)}
      >
        {userModal ? (
          <UserForm
            mode={userModal.mode}
            user={userModal.user}
            onCancel={() => setUserModal(null)}
            onSaved={async () => {
              setUserModal(null)
              await loadAll()
              setSuccess('User saved')
            }}
            setError={setError}
          />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(planModal)}
        title={planModal?.mode === 'create' ? 'Create plan' : 'Edit plan'}
        onClose={() => setPlanModal(null)}
      >
        {planModal ? (
          <PlanForm
            mode={planModal.mode}
            plan={planModal.plan}
            onCancel={() => setPlanModal(null)}
            onSaved={async () => {
              setPlanModal(null)
              await loadAll()
              setSuccess('Plan saved')
            }}
            setError={setError}
          />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(pkgModal)}
        title={pkgModal?.mode === 'create' ? 'Create credit package' : 'Edit credit package'}
        onClose={() => setPkgModal(null)}
      >
        {pkgModal ? (
          <CreditPackageForm
            mode={pkgModal.mode}
            pkg={pkgModal.pkg}
            onCancel={() => setPkgModal(null)}
            onSaved={async () => {
              setPkgModal(null)
              await loadAll()
              setSuccess('Credit package saved')
            }}
            setError={setError}
          />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(catModal)}
        title={catModal?.mode === 'create' ? 'Create job category' : 'Edit job category'}
        onClose={() => setCatModal(null)}
      >
        {catModal ? (
          <CategoryForm
            mode={catModal.mode}
            cat={catModal.cat}
            onCancel={() => setCatModal(null)}
            onSaved={async () => {
              setCatModal(null)
              await loadAll()
              setSuccess('Category saved')
            }}
            setError={setError}
          />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(modelModal)}
        title={modelModal?.mode === 'create' ? 'Create AI model' : 'Edit AI model'}
        onClose={() => setModelModal(null)}
      >
        {modelModal ? (
          <AiModelForm
            mode={modelModal.mode}
            model={modelModal.model}
            onCancel={() => setModelModal(null)}
            onSaved={async () => {
              setModelModal(null)
              await loadAll()
              setSuccess('AI model saved')
            }}
            setError={setError}
          />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(rateModal)}
        title={rateModal?.mode === 'create' ? 'Create service rate' : 'Edit service rate'}
        onClose={() => setRateModal(null)}
      >
        {rateModal ? (
          <ServiceRateForm
            mode={rateModal.mode}
            rate={rateModal.rate}
            onCancel={() => setRateModal(null)}
            onSaved={async () => {
              setRateModal(null)
              await loadAll()
              setSuccess('Service rate saved')
            }}
            setError={setError}
          />
        ) : null}
      </Modal>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded-2xl bg-white/70 px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm'
          : 'rounded-2xl px-3 py-2 text-sm text-zinc-700 hover:bg-white/60'
      }
    >
      {children}
    </button>
  )
}

function CrudListCard({
  title,
  createLabel,
  onCreate,
  loading,
  children,
}: {
  title: string
  createLabel: string
  onCreate: () => void
  loading: boolean
  children: React.ReactNode
}) {
  return (
    <Card className="bg-white/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button onClick={onCreate} disabled={loading}>
          {createLabel}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? <div className="text-sm text-zinc-600">Loading…</div> : <div className="space-y-2">{children}</div>}
      </CardContent>
    </Card>
  )
}

function UserForm({
  mode,
  user,
  onCancel,
  onSaved,
  setError,
}: {
  mode: 'create' | 'edit'
  user?: User
  onCancel: () => void
  onSaved: () => void | Promise<void>
  setError: (v: string | null) => void
}) {
  const [saving, setSaving] = React.useState(false)
  const [username, setUsername] = React.useState(user?.username || '')
  const [email, setEmail] = React.useState(user?.email || '')
  const [role, setRole] = React.useState(user?.role || 'user')
  const [isActive, setIsActive] = React.useState(Boolean(user?.is_active ?? 1))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (mode === 'create') {
        await api.post('/super-admin/users', { username, email, role })
      } else if (user) {
        await api.put(`/super-admin/users/${user.user_id}`, { username, email, role, is_active: isActive ? 1 : 0 })
      }
      await onSaved()
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor="u_username">Username</Label>
        <Input id="u_username" value={username} onChange={(e) => setUsername(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="u_email">Email</Label>
        <Input id="u_email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="u_role">Role</Label>
        <select
          id="u_role"
          className="h-10 w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 text-sm outline-none focus:border-brand-500"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="user">user</option>
          <option value="super_admin">super_admin</option>
        </select>
      </div>
      {mode === 'edit' ? (
        <div className="grid gap-2">
          <Label htmlFor="u_active">Active</Label>
          <select
            id="u_active"
            className="h-10 w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 text-sm outline-none focus:border-brand-500"
            value={isActive ? '1' : '0'}
            onChange={(e) => setIsActive(e.target.value === '1')}
          >
            <option value="1">active</option>
            <option value="0">inactive</option>
          </select>
        </div>
      ) : null}

      <div className="md:col-span-2 flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  )
}

function PlanForm({
  mode,
  plan,
  onCancel,
  onSaved,
  setError,
}: {
  mode: 'create' | 'edit'
  plan?: Plan
  onCancel: () => void
  onSaved: () => void | Promise<void>
  setError: (v: string | null) => void
}) {
  const [saving, setSaving] = React.useState(false)
  const [name, setName] = React.useState(plan?.name || '')
  // Price is displayed/edited in INR (decimal). We convert to cents when submitting.
  const [priceINR, setPriceINR] = React.useState(() => {
    if (plan && typeof plan.price_cents === 'number') return (plan.price_cents / 100).toFixed(2);
    return '0.00';
  })
  const [interval, setInterval] = React.useState(plan?.interval || 'monthly')
  const [creditsAllocated, setCreditsAllocated] = React.useState(String(plan?.credits_allocated ?? 0))
  const [trialDays, setTrialDays] = React.useState(String(plan?.trial_period_days ?? 0))
  const [description, setDescription] = React.useState(plan?.description || '')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name,
        price_cents: Math.round((Number(priceINR) || 0) * 100),
        interval,
        credits_allocated: Number(creditsAllocated) || 0,
        trial_period_days: Number(trialDays) || 0,
        description: description || null,
      }
      if (mode === 'create') {
        await api.post('/super-admin/plans', payload)
      } else if (plan) {
        await api.put(`/super-admin/plans/${plan.plan_id}`, payload)
      }
      await onSaved()
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to save plan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor="p_name">Name</Label>
        <Input id="p_name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="p_price">Price (INR)</Label>
        <Input id="p_price" value={priceINR} onChange={(e) => setPriceINR(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="p_interval">Interval</Label>
        <select
          id="p_interval"
          className="h-10 w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 text-sm outline-none focus:border-brand-500"
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
        >
          <option value="monthly">monthly</option>
          <option value="quarterly">quarterly</option>
          <option value="yearly">yearly</option>
        </select>
      </div>
      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor="p_credits">Credits allocated</Label>
        <Input id="p_credits" value={creditsAllocated} onChange={(e) => setCreditsAllocated(e.target.value)} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="p_trial_days">Trial period (days)</Label>
        <Input id="p_trial_days" value={trialDays} onChange={(e) => setTrialDays(e.target.value)} />
      </div>

      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor="p_description">Description</Label>
        <textarea
          id="p_description"
          className="min-h-24 w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-brand-500"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="md:col-span-2 flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  )
}

function CreditPackageForm({
  mode,
  pkg,
  onCancel,
  onSaved,
  setError,
}: {
  mode: 'create' | 'edit'
  pkg?: CreditPackage
  onCancel: () => void
  onSaved: () => void | Promise<void>
  setError: (v: string | null) => void
}) {
  const [saving, setSaving] = React.useState(false)
  const [name, setName] = React.useState(pkg?.name || '')
  const [credits, setCredits] = React.useState(String(pkg?.credits ?? 0))
  const [priceCents, setPriceCents] = React.useState(String(pkg?.price_cents ?? 0))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = { name, credits: Number(credits) || 0, price_cents: Number(priceCents) || 0 }
      if (mode === 'create') {
        await api.post('/super-admin/credit-packages', payload)
      } else if (pkg) {
        await api.put(`/super-admin/credit-packages/${pkg.package_id}`, payload)
      }
      await onSaved()
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to save credit package')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor="cp_name">Name</Label>
        <Input id="cp_name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="cp_credits">Credits</Label>
        <Input id="cp_credits" value={credits} onChange={(e) => setCredits(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="cp_price">Price (cents)</Label>
        <Input id="cp_price" value={priceCents} onChange={(e) => setPriceCents(e.target.value)} />
      </div>
      <div className="md:col-span-2 flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  )
}

function CategoryForm({
  mode,
  cat,
  onCancel,
  onSaved,
  setError,
}: {
  mode: 'create' | 'edit'
  cat?: JobCategory
  onCancel: () => void
  onSaved: () => void | Promise<void>
  setError: (v: string | null) => void
}) {
  const [saving, setSaving] = React.useState(false)
  const [name, setName] = React.useState(cat?.category_name || '')
  const [description, setDescription] = React.useState(cat?.description || '')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = { category_name: name, description: description || null }
      if (mode === 'create') {
        await api.post('/super-admin/job-categories', payload)
      } else if (cat) {
        await api.put(`/super-admin/job-categories/${cat.job_category_id}`, payload)
      }
      await onSaved()
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="cat_name">Category name</Label>
        <Input id="cat_name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="cat_desc">Description</Label>
        <textarea
          id="cat_desc"
          className="min-h-24 w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-brand-500"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  )
}

function AiModelForm({
  mode,
  model,
  onCancel,
  onSaved,
  setError,
}: {
  mode: 'create' | 'edit'
  model?: AiModel
  onCancel: () => void
  onSaved: () => void | Promise<void>
  setError: (v: string | null) => void
}) {
  const [saving, setSaving] = React.useState(false)
  const [name, setName] = React.useState(model?.model_name || '')
  const [apiKey, setApiKey] = React.useState(model?.api_key || '')
  const [description, setDescription] = React.useState(model?.description || '')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = { model_name: name, api_key: apiKey || null, description: description || null }
      if (mode === 'create') {
        await api.post('/super-admin/ai-models', payload)
      } else if (model) {
        await api.put(`/super-admin/ai-models/${model.ai_model_id}`, payload)
      }
      await onSaved()
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to save AI model')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="m_name">Model name</Label>
        <Input id="m_name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="m_key">API key (optional)</Label>
        <Input id="m_key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="m_desc">Description</Label>
        <textarea
          id="m_desc"
          className="min-h-24 w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-brand-500"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  )
}

function ServiceRateForm({
  mode,
  rate,
  onCancel,
  onSaved,
  setError,
}: {
  mode: 'create' | 'edit'
  rate?: ServiceRate
  onCancel: () => void
  onSaved: () => void | Promise<void>
  setError: (v: string | null) => void
}) {
  const [saving, setSaving] = React.useState(false)
  const [serviceName, setServiceName] = React.useState(rate?.service_name || '')
  const [creditsPerUnit, setCreditsPerUnit] = React.useState(String(rate?.credits_per_unit ?? 1))
  const [unitType, setUnitType] = React.useState(rate?.unit_type || 'per_use')
  const [description, setDescription] = React.useState(rate?.description || '')
  const [isActive, setIsActive] = React.useState(rate?.is_active ?? true)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        service_name: serviceName,
        credits_per_unit: Number(creditsPerUnit) || 1,
        unit_type: unitType,
        description,
        is_active: isActive,
      }
      if (mode === 'create') {
        await api.post('/super-admin/service-rates', payload)
      } else if (rate) {
        await api.put(`/super-admin/service-rates/${rate.id}`, payload)
      }
      await onSaved()
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to save service rate')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor="sr_name">Service name</Label>
        <Input
          id="sr_name"
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          placeholder="ai_interview"
          required
          disabled={mode === 'edit'}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="sr_credits">Credits per unit</Label>
        <Input id="sr_credits" value={creditsPerUnit} onChange={(e) => setCreditsPerUnit(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="sr_unit">Unit type</Label>
        <select
          id="sr_unit"
          className="h-10 w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 text-sm outline-none focus:border-brand-500"
          value={unitType}
          onChange={(e) => setUnitType(e.target.value)}
        >
          <option value="per_use">per use</option>
          <option value="per_minute">per minute</option>
          <option value="per_session">per session</option>
        </select>
      </div>
      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor="sr_desc">Description</Label>
        <Input id="sr_desc" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="sr_active">Active</Label>
        <select
          id="sr_active"
          className="h-10 w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 text-sm outline-none focus:border-brand-500"
          value={isActive ? '1' : '0'}
          onChange={(e) => setIsActive(e.target.value === '1')}
        >
          <option value="1">active</option>
          <option value="0">inactive</option>
        </select>
      </div>
      <div className="md:col-span-2 flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  )
}

function CreditsRowEditor({
  row,
  onUpdated,
  setError,
  setSuccess,
}: {
  row: CreditsRow
  onUpdated: () => void | Promise<void>
  setError: (v: string | null) => void
  setSuccess: (v: string | null) => void
}) {
  const [value, setValue] = React.useState(String(row.current_credits ?? 0))
  const [saving, setSaving] = React.useState(false)

  const save = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await api.put(`/super-admin/credits/${row.credit_id}`, { current_credits: Number(value) || 0 })
      setSuccess('Credits updated')
      await onUpdated()
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to update credits')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/70 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-zinc-700">Credit #{row.credit_id} · user #{row.user_id}</div>
      <div className="flex items-center gap-2">
        <Input className="w-32" value={value} onChange={(e) => setValue(e.target.value)} />
        <Button variant="outline" onClick={() => void save()} disabled={saving}>
          {saving ? 'Saving…' : 'Update'}
        </Button>
      </div>
    </div>
  )
}

async function deleteUser(
  u: User,
  setError: (v: string | null) => void,
  setSuccess: (v: string | null) => void,
  reload: () => Promise<void>
) {
  const ok = await sweetConfirm(`Delete user ${u.username}? This cannot be undone.`)
  if (!ok) return
  setError(null)
  setSuccess(null)
  try {
    await api.delete(`/super-admin/users/${u.user_id}`)
    await reload()
    setSuccess('User deleted')
  } catch (err) {
    setError(getApiErrorMessage(err) || 'Failed to delete user')
  }
}

async function deletePlan(
  p: Plan,
  setError: (v: string | null) => void,
  setSuccess: (v: string | null) => void,
  reload: () => Promise<void>
) {
  const ok = await sweetConfirm(`Delete plan ${p.name}?`)
  if (!ok) return
  setError(null)
  setSuccess(null)
  try {
    await api.delete(`/super-admin/plans/${p.plan_id}`)
    await reload()
    setSuccess('Plan deleted')
  } catch (err) {
    setError(getApiErrorMessage(err) || 'Failed to delete plan')
  }
}

async function deleteCreditPackage(
  pkg: CreditPackage,
  setError: (v: string | null) => void,
  setSuccess: (v: string | null) => void,
  reload: () => Promise<void>
) {
  const ok = await sweetConfirm(`Delete credit package ${pkg.name}?`)
  if (!ok) return
  setError(null)
  setSuccess(null)
  try {
    await api.delete(`/super-admin/credit-packages/${pkg.package_id}`)
    await reload()
    setSuccess('Credit package deleted')
  } catch (err) {
    setError(getApiErrorMessage(err) || 'Failed to delete credit package')
  }
}

async function deleteCategory(
  cat: JobCategory,
  setError: (v: string | null) => void,
  setSuccess: (v: string | null) => void,
  reload: () => Promise<void>
) {
  const ok = await sweetConfirm(`Delete category ${cat.category_name}?`)
  if (!ok) return
  setError(null)
  setSuccess(null)
  try {
    await api.delete(`/super-admin/job-categories/${cat.job_category_id}`)
    await reload()
    setSuccess('Category deleted')
  } catch (err) {
    setError(getApiErrorMessage(err) || 'Failed to delete category')
  }
}

async function deleteAiModel(
  model: AiModel,
  setError: (v: string | null) => void,
  setSuccess: (v: string | null) => void,
  reload: () => Promise<void>
) {
  const ok = await sweetConfirm(`Delete AI model ${model.model_name}?`)
  if (!ok) return
  setError(null)
  setSuccess(null)
  try {
    await api.delete(`/super-admin/ai-models/${model.ai_model_id}`)
    await reload()
    setSuccess('AI model deleted')
  } catch (err) {
    setError(getApiErrorMessage(err) || 'Failed to delete AI model')
  }
}

async function deleteServiceRate(
  rate: ServiceRate,
  setError: (v: string | null) => void,
  setSuccess: (v: string | null) => void,
  reload: () => Promise<void>
) {
  const ok = await sweetConfirm(`Delete service rate ${rate.service_name}?`)
  if (!ok) return
  setError(null)
  setSuccess(null)
  try {
    await api.delete(`/super-admin/service-rates/${rate.id}`)
    await reload()
    setSuccess('Service rate deleted')
  } catch (err) {
    setError(getApiErrorMessage(err) || 'Failed to delete service rate')
  }
}

