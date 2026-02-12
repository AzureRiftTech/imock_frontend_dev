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
import Image from 'next/image'
import { MdOutlineKeyboardArrowRight } from 'react-icons/md'
import { FiArrowUpRight } from 'react-icons/fi'
import { FaRegQuestionCircle } from 'react-icons/fa'

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
  const _u = user && typeof user === 'object' ? (user as Record<string, unknown>) : null
  const userId = _u ? (typeof _u.user_id === 'number' ? (_u.user_id as number) : (typeof _u.id === 'number' ? (_u.id as number) : null)) : null

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [categories, setCategories] = React.useState<Array<Record<string, unknown>>>([])
  const [interviews, setInterviews] = React.useState<Array<Record<string, unknown>>>([])

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
      setCategories((catsRes.data as Array<Record<string, unknown>>) || [])
      const loadedInterviews = (interviewsRes.data as Array<Record<string, unknown>>) || []
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
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || (typeof err === 'object' ? String(err) : 'Failed to create interview'))
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
    <>
      {/* <div className="space-y-6 px-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Schedule Interviews</h1>
            <p className="mt-1 text-sm text-zinc-600">Create an interview and view upcoming or past sessions.</p>
          </div>
          <div className="flex gap-2">
            <button className='p-4 rounded-lg border border-purple-500 py-2 text-xs sm:text-sm text-[#9F50E9] ' onClick={() => router.push('/interviews')}>Back</button>
            <button className='p-4 rounded-lg bg-purple-500 py-2 text-xs sm:text-sm text-white ' onClick={() => load()} disabled={loading}>Refresh</button>
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
                <button className='p-4 rounded-lg bg-purple-500 py-3 text-xs sm:text-sm text-white ' type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create interview'}</button>
              </div>
            </form>
          </CardContent>
        </Card>

       
      </div> */}
      <div className="min-h-screen px-5 md:px-10 py-10 md:py-20">
        {/* Header */}

        <div className="absolute inset-0 -z-10">
          <div className="absolute left-0 lg:left-1/2 top-0 h-[200px] w-[720px] -translate-x-1/2 rounded-full bg-[#e6cfff] blur-[140px]" />
        </div>
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-0 lg:left-1/2 bottom-0 h-[200px] w-[720px] -translate-x-1/2 rounded-full bg-[#e6cfff] blur-[140px]" />
        </div>
        <div className="flex items-center mb-6 gap-5">
          <div className='flex items-center w-full'>
            <h1 className=" text-md md:text-xl font-semibold text-zinc-800 w-full md:w-[30%]">Schedule an interview</h1>
            <div className='hidden sm:block border w-[100%] border-[#9F50E9]/20' />
          </div>
          <button
            onClick={() => router.push('/interviews')}
            className="text-sm px-4 py-2 rounded-lg border border-[#9F50E9] text-[#9F50E9] hover:bg-purple-50"
          >
            Back
          </button>
        </div>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        {/* Main Card */}
        <div className="">
          <form onSubmit={createInterview} className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Company */}
            <div>

              <label className="block text-md text-[#4C0E87] mb-2">Company <span className="text-red-500">*</span></label>

              <input
                placeholder="Company Name"
                value={form.company_name}
                onChange={(e) => setForm(p => ({ ...p, company_name: e.target.value }))}
                required
                type="text"
                className="w-full px-4 py-2.5 placeholder-[#9F50E9] border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />

            </div>

            {/* Position */}
            <div>


              <label className="block text-md text-[#4C0E87] mb-2">Position <span className="text-red-500">*</span></label>
              <input
                value={form.position}
                onChange={(e) => setForm(p => ({ ...p, position: e.target.value }))}
                required
                type="text"
                placeholder="Position"
                className="w-full px-4 py-2.5  placeholder-[#9F50E9] border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>

            {/* Experience */}
            <div>

              <label className="block text-md text-[#4C0E87] mb-2">Experience <span className="text-red-500">*</span></label>
              <input
                value={form.experience_required}
                onChange={(e) => setForm(p => ({ ...p, experience_required: e.target.value }))}
                required
                type="text"
                placeholder="experience"
                className="w-full px-4 py-2.5 placeholder-[#9F50E9] border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>

            {/* Schedule At */}
            <div>

              <label className="block text-md text-[#4C0E87] mb-2">Schedule At <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm(p => ({ ...p, scheduled_at: e.target.value }))}
                required
                placeholder="Placeholder"
                className="w-full px-4 py-2.5 placeholder-[#9F50E9] border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-md text-[#4C0E87] mb-2">Category <span className="text-red-500">*</span></label>
              <select
                value={form.category_name}
                onChange={(e) => setForm(p => ({ ...p, category_name: e.target.value }))}
                className="w-full px-4 py-3 placeholder-[#9F50E9] border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              >
                <option value="">None</option>
                {categories.map(c => (
                  <option key={String(c.job_category_id)} value={String(c.category_name)}>
                    {String(c.category_name)}
                  </option>
                ))}
              </select>
            </div>

            {/* Job Description */}
            <div className="md:col-span-2">
              <label className="block text-md text-[#4C0E87] mb-2">Job Description</label>
              <textarea
                placeholder="Placeholder"
                value={form.job_description}
                onChange={(e) => setForm(p => ({ ...p, job_description: e.target.value }))}
                className="mt-1 min-h-[120px] w-full placeholder-[#9F50E9] border border-[#9F50E9] rounded-lg  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Upload CV */}
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 flex flex-col justify-between">
              <div className="rounded-[20px] bg-white border border-purple-200 p-3 flex gap-4 items-center">
                <div className="w-1/3 h-full rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 text-xl">
                  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                    <Image src="/file.svg" alt="" height={30} width={30} className="" />
                  </div>
                </div>

                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">
                    Select CV
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Your CV will be assessed on the basis of parameters.
                  </p>

                  <button className="mt-3 inline-flex items-center gap-2 rounded-lg bg-purple-500 px-2 sm:px-4 py-2 text-white text-xs sm:text-sm hover:bg-purple-600">
                    Upload to assess <MdOutlineKeyboardArrowRight size={22} />
                  </button>
                </div>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="md:col-span-3 flex justify-end gap-4 mt-4">
              <button
                type="button"
                onClick={() => setForm({
                  company_name: '',
                  scheduled_at: '',
                  position: '',
                  category_name: '',
                  experience_required: '',
                  status: 'scheduled',
                  job_description: '',
                })}
                className="px-6 py-2 rounded-xl border border-[#9F50E9] text-[#9F50E9]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-2 sm:px-4 sm:py-2 rounded-xl bg-[#9F50E9] text-white hover:bg-purple-700 text-sm sm:text-lg"
              >
                {saving ? 'Saving…' : 'Create Interview'}
              </button>
            </div>
          </form>

          <div className="flex items-center mb-6 mt-5">
            <div className='flex items-center w-full'>
              <h1 className="text-lg md:text-xl font-semibold text-zinc-800 w-full md:w-[30%]">Progress Status</h1>
              <div className='hidden sm:block border w-[100%] border-[#9F50E9]/20' />
            </div>
          </div>

          <div className="flex  flex-col sm:flex-row gap-3 xl:gap-10 w-full items-center ">
            <div className="flex flex-col  lg:flex-row gap-5 rounded-2xl border border-purple-200 bg-white p-6 w-full sm:w-[60%]">
              <div>
                <p className="text-2xl font-medium mb-4">Interview - Matrix</p>
                <div className="flex h-32 w-32 items-center justify-center rounded-full border-[10px] border-purple-500 font-semibold">
                  73%
                </div>
              </div>
              <FaRegQuestionCircle size={25} color="#A3A3A3" />
              <div className="flex gap-6">
                <div className="text-sm text-gray-500 space-y-2">
                  <p className="text-lg flex flex-col">Total Assertion <strong className="text-black">1,234</strong></p>
                  <div className="flex flex-wrap justify-between py-5">
                    <div className="flex flex-col items-start">
                      <div className="flex gap-2 items-center">
                        <p className="h-3 w-3 rounded-full bg-[#9F50E9]" />
                        <p className="text-gray-500 text-md">Legend 1</p>
                      </div>
                      <p className="font-bold text-black">1,234</p>
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="flex gap-2 items-center">
                        <p className="h-3 w-3 rounded-full bg-[#EB5757]" />
                        <p className="text-gray-500 text-md">Legemd 2</p>
                      </div>
                      <p className="font-bold text-black">123</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-5">
                    <p className="flex  flex-col">Recent Metric <strong className="text-black">123</strong></p>
                    <p className="flex gap-1 text-[#9F50E9] text-lg font-bold"><span> <FiArrowUpRight size={25} /></span>0.05%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-2 row-span-2 rounded-2xl border border-purple-200 bg-white p-6 space-y-2 w-full sm:w-[30%]">
              <div className="flex flex-col">
                <p className="text-gray-400 text-md">Total Interviews</p>
                <p className="text-md font-bold mt-2">1,234</p>
              </div>
              <div className="flex flex-col">
                <p className="text-gray-400 text-sm">Total Aced</p>
                <p className="text-md font-bold mt-2">1,234</p>
              </div>
              <div className="flex flex-col">
                <p className="text-gray-400 text-sm">Recent Metric</p>
                <p className="text-md font-bold mt-2">1,234</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}