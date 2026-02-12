'use client'

import Image from "next/image";
import { FaRegQuestionCircle } from "react-icons/fa";
import { FiArrowUpRight } from "react-icons/fi";

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/error'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sweetConfirm, sweetAlert } from '@/lib/swal'

type JobCategory = {
  job_category_id: number
  category_name: string
  description?: string | null
}

type CvRow = {
  index: number
  url: string
  filename: string
  is_pdf: boolean
}

type Interview = {
  interview_id: number
  user_id: number
  company_name: string
  scheduled_at: string
  position: string
  experience_required?: string | null
  job_description?: string | null
  status?: string | null
  job_category_id?: number | null
  job_position_id?: number | null
  category_name?: string | null
  position_name?: string | null
}

type InterviewResult = {
  result_id?: number
  id?: number  // Backend returns 'id' field
  interview_id: number
  session_token: string
  completed_at: string
  overall_score?: number | null
  detailed_feedback?: string | null
  strengths?: string | null
  improvements?: string | null
  [key: string]: unknown
}

type InterviewFormState = {
  company_name: string
  scheduled_at: string
  position: string
  category_name: string
  experience_required: string
  status: string
  job_description: string
}

function getUserId(user: unknown): number | null {
  if (!user || typeof user !== 'object') return null
  const u = user as Record<string, unknown>
  const raw = (u.user_id ?? u.id) as unknown
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

function toDateTimeLocalValue(value: string | null | undefined): string {
  if (!value) return ''
  // MySQL datetime: YYYY-MM-DD HH:mm:ss -> datetime-local expects YYYY-MM-DDTHH:mm
  if (value.includes(' ')) return value.replace(' ', 'T').slice(0, 16)
  // ISO -> slice
  if (value.includes('T')) return value.slice(0, 16)
  return value
}

function formatDisplayDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
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
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/60 bg-white/90 shadow-xl backdrop-blur">
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

// New Start Flow Modal (step 1: choose existing interview or enter job details, step 2: choose/upload resume)
function StartFlowModal({ open, mode, interviews, initialInterviewId, onClose }: { open: boolean, mode: 'avatar' | 'ai_voice' | 'no_ai', interviews: Interview[], initialInterviewId?: number | null, onClose: () => void }) {
  const router = useRouter()
  const [step, setStep] = React.useState<1 | 2>(1)
  const [useExisting, setUseExisting] = React.useState(true)
  const [selectedInterviewId, setSelectedInterviewId] = React.useState<number | null>(initialInterviewId ?? (interviews.length > 0 ? interviews[0].interview_id : null))
  const [jobDetails, setJobDetails] = React.useState<{ position: string; job_description: string; experience_required: string; category_name?: string }>({
    position: '',
    job_description: '',
    experience_required: '',
    category_name: '',
  })

  const [cvs, setCvs] = React.useState<CvRow[]>([])
  const [loadingCvs, setLoadingCvs] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [selectedCvIndex, setSelectedCvIndex] = React.useState<number | null>(null)
  const [questionCount, setQuestionCount] = React.useState(5)
  const [error, setError] = React.useState<string | null>(null)
  const [tab, setTab] = React.useState<'select' | 'upload'>('select')
  // Job categories for dropdown
  const [categories, setCategories] = React.useState<Array<Record<string, unknown>>>([])
  const loadCategories = async () => {
    try {
      const res = await api.get('/interviews/categories')
      setCategories((res.data as Array<Record<string, unknown>>) || [])
    } catch (err) {
      // ignore load errors here; schedule page shows categories already
      console.warn('[StartFlowModal] Failed to load categories', err)
    }
  }

  React.useEffect(() => {
    if (open) {
      setStep(1)
      setUseExisting(true)
      setSelectedInterviewId(initialInterviewId ?? (interviews.length > 0 ? interviews[0].interview_id : null))
      setJobDetails({ position: '', job_description: '', experience_required: '', category_name: '' })
      setSelectedCvIndex(null)
      // ensure categories are loaded for the dropdown
      loadCategories()
    }
  }, [open, interviews, initialInterviewId])

  const loadCvs = async (): Promise<CvRow[]> => {
    setLoadingCvs(true)
    try {
      const res = await api.get('/mock-interview/resumes')
      const list = (res.data?.resumes as CvRow[]) || []
      setCvs(list)
      // default selection: first if none selected
      if (list.length > 0 && selectedCvIndex === null) setSelectedCvIndex(list[0].index)
      return list
    } catch (err) {
      console.error(err)
      return []
    } finally {
      setLoadingCvs(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    const formData = new FormData()
    formData.append('cv', file)
    try {
      await api.post('/cv/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      const list = await loadCvs()
      // select newly uploaded resume (last item) if available
      if (list.length > 0) {
        const last = list[list.length - 1]
        setSelectedCvIndex(last.index)
      }
      // switch to select tab so user can confirm
      setTab('select')
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleNext = async () => {
    if (step === 1) {
      if (useExisting && !selectedInterviewId) {
        setError('Please select an interview')
        return
      }
      if (!useExisting) {
        if (!jobDetails.position.trim()) { setError('Position is required'); return }
      }
      // go to resumes step
      await loadCvs()
      setStep(2)
    }
  }

  const handleStart = async () => {
    setError(null)
    try {
      let interviewId = selectedInterviewId
      if (!useExisting) {
        // create interview ad-hoc
        const payload = {
          company_name: jobDetails.position || 'Ad-hoc',
          scheduled_at: new Date().toISOString(),
          position: jobDetails.position,
          category_name: jobDetails.category_name || undefined,
          experience_required: jobDetails.experience_required || undefined,
          job_description: jobDetails.job_description || undefined,
        }
        const res = await api.post('/interviews', payload)
        const created = res.data as Interview
        interviewId = created.interview_id
      }

      if (!interviewId) throw new Error('No interview id')

      // Consume credits before starting the interview
      try {
        await api.post('/credits/consume-interview', {
          service_type: mode, // 'avatar', 'ai_voice', or 'no_ai'
          duration: questionCount
        })
      } catch (creditErr: unknown) {
        // Show specific error message for insufficient credits
        const errResp = ((creditErr as Record<string, unknown>)?.response) as Record<string, unknown> | undefined
        const errData = errResp?.data as Record<string, unknown> | undefined
        if (errData && errData.error === 'Insufficient credits') {
          const available = errData.available as number | undefined
          const required = errData.required as number | undefined
          throw new Error(`Insufficient credits. You need ${required ?? 'N/A'} credits but only have ${available ?? '0'}. Please purchase more credits.`)
        }
        throw creditErr
      }

      // build path based on mode
      const base = `/mock-interview/${interviewId}`
      let path = `${base}?index=${selectedCvIndex || 0}&duration=${questionCount}`
      if (mode === 'ai_voice') path = `${base}/without_avatar_with_ai_speech?index=${selectedCvIndex || 0}&duration=${questionCount}`
      else if (mode === 'no_ai') path = `${base}/without_avatar?index=${selectedCvIndex || 0}&duration=${questionCount}`

      onClose()
      router.push(path)
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to start interview')
    }
  }

  return (
    <Modal open={open} title="New Mock Interview" onClose={onClose}>
      <div className="space-y-4">
        {error && <div className="text-sm text-red-600">{error}</div>}

        {step === 1 ? (
          <div className="space-y-4">
            <div className="flex gap-3">
              <button className={`px-3 py-2 rounded-lg ${useExisting ? 'bg-[#8D38DD] text-white' : 'bg-white border'}`} onClick={() => setUseExisting(true)}>Use existing interview</button>
              <button className={`px-3 py-2 rounded-lg ${!useExisting ? 'border border-[#8D38DD] text-white' : 'text-[#8D38DD] bg-white border border-[##8D38DD]'}`} onClick={() => setUseExisting(false)}>Enter job details</button>
            </div>

            {useExisting ? (
              <div>
                <Label>Choose interview</Label>
                <select className="w-full rounded-lg border p-2" value={selectedInterviewId ?? ''} onChange={(e) => setSelectedInterviewId(Number(e.target.value))}>
                  <option value="">Select...</option>
                  {interviews.map((iv) => (
                    <option key={iv.interview_id} value={iv.interview_id}>{iv.company_name} — {iv.position}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label>Position</Label>
                <Input value={jobDetails.position} onChange={(e) => setJobDetails((p) => ({...p, position: e.target.value}))} placeholder="e.g., Software Developer" />
                <Label>Category</Label>
                <select className="h-10 w-full rounded-2xl border" value={jobDetails.category_name} onChange={(e) => setJobDetails((p) => ({...p, category_name: e.target.value }))}>
                  <option value="">Select a category</option>
                  {categories.map((c: Record<string, unknown>) => <option key={String(c.job_category_id)} value={String(c.category_name)}>{String(c.category_name)}</option>)}
                </select>
                <Label>Experience</Label>
                <Input value={jobDetails.experience_required} onChange={(e) => setJobDetails((p) => ({...p, experience_required: e.target.value}))} placeholder="e.g., 2+ years" />
                <Label>Job description</Label>
                <textarea className="rounded-lg border p-2" value={jobDetails.job_description} onChange={(e) => setJobDetails((p) => ({...p, job_description: e.target.value}))} />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button className="p-4 rounded-lg border border-purple-500 py-2 text-xs sm:text-sm text-purple-600 " onClick={onClose}>Cancel</button>
              <button className="p-4 rounded-lg bg-purple-500 py-2 text-xs sm:text-sm text-white " onClick={handleNext}>Next</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 border-b border-zinc-200 pb-2">
              <button className={`px-3 py-1 text-sm font-medium ${tab === 'select' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-zinc-500'}`} onClick={() => setTab('select')}>Choose Resume</button>
              <button className={`px-3 py-1 text-sm font-medium ${tab === 'upload' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-zinc-500'}`} onClick={() => setTab('upload')}>Upload New</button>
            </div>

            {tab === 'select' ? (
              loadingCvs ? (
                <div className="text-sm text-zinc-500">Loading resumes...</div>
              ) : cvs.length === 0 ? (
                <div className="text-sm text-zinc-500">No resumes found. Please upload one.</div>
              ) : (
                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  {cvs.map((cv) => (
                    <div key={cv.index} onClick={() => setSelectedCvIndex(cv.index)} className={`cursor-pointer rounded-xl border p-3 ${selectedCvIndex === cv.index ? 'border-brand-500 bg-brand-50' : 'border-zinc-200'}`}>
                      <div className="font-medium text-zinc-900 truncate">{cv.filename}</div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="startflow_cv_upload">Upload resume (PDF)</Label>
                <Input id="startflow_cv_upload" type="file" accept=".pdf,.doc,.docx" onChange={handleUpload} disabled={uploading} />
                {uploading && <div className="text-sm text-zinc-500">Uploading and processing...</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}
              </div>
            )}

            <div>
              <Label>Interview Duration</Label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((mins) => (
                  <button
                    key={mins}
                    className={`py-2 px-3 rounded-lg border font-medium transition-colors ${
                      questionCount === mins
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'bg-white text-zinc-900 border-zinc-200 hover:border-brand-500'
                    }`}
                    onClick={() => setQuestionCount(mins)}
                  >
                    {mins} mins
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-500 mt-2">Interview will auto-end when timer expires</p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={handleStart} disabled={selectedCvIndex === null || uploading}>{
                mode === 'avatar' ? 'Start (Avatar)' : mode === 'ai_voice' ? 'Start (AI Voice)' : 'Start (No AI)'
              }</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default function InterviewsPage() {
  const { user } = useAuth()
  const userId = getUserId(user)
  const router = useRouter()

  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [interviews, setInterviews] = React.useState<Interview[]>([])

  // Start flow (three-card quick start)
  const [startFlowOpen, setStartFlowOpen] = React.useState(false)
  const [startMode, setStartMode] = React.useState<'avatar' | 'ai_voice' | 'no_ai'>('avatar')
  const [startInitialInterviewId, setStartInitialInterviewId] = React.useState<number | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const interviewsRes = await api.get('/interviews', { params: userId ? { user_id: userId } : undefined })
      const loadedInterviews = (interviewsRes.data as Interview[]) || []
      setInterviews(loadedInterviews)
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to load interviews')
    } finally {
      setLoading(false)
    }
  }, [userId])

  React.useEffect(() => {
    load()
  }, [load])

  return (
    <main className="min-h-screen md:px-16 py-10">
      {/* Top Section */}
      <div className="flex justify-center sm:justify-between pb-5">
        <div></div>
        <p className=" text-purple">Select Interview Module</p>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-5 items-center">
        <InterviewCard 
          title="Individual Assistance" 
          image="/interview1.svg"
          onStartInterview={() => { setStartMode('avatar'); setStartFlowOpen(true); }}
          onScheduleInterview={() => router.push('/interviews/schedule')}
        />
        <InterviewCard 
          title="AI Based Assessment" 
          image="/interview2.svg"
          onStartInterview={() => { setStartMode('ai_voice'); setStartFlowOpen(true); }}
          onScheduleInterview={() => router.push('/interviews/schedule')}
        />
        <InterviewCard 
          title="AI Based Assessment" 
          image="/interview1.svg"
          onStartInterview={() => { setStartMode('no_ai'); setStartFlowOpen(true); }}
          onScheduleInterview={() => router.push('/interviews/schedule')}
        />
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-20 mb-16 w-full pt-20">
        <div className="w-full md:w-[60%]">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Ready for <br />
            <span className="text-purple-600">Your Interview</span>
          </h1>

          <p className="mt-4 max-w-md text-gray-600">
            Interview questions are thoughtfully crafted using your resume,
            ensuring they are tailored to your individual experience.
          </p>

          <div className="flex justify-between items-center pt-10">
            <div className="w-[40%] flex flex-col bg-white shadow-xl rounded-full px-5 pt-1 items-center justify-center">
              <p className="text-[11px] md:text-xs font-medium  text-[#4C0E87]">Assessment by</p>
              <p className="text-[#8D38DD]  text-xl md:text-3xl font-bold">Ai</p>
            </div>

            <div className="w-[140px] rounded-2xl bg-[#8D38DD] flex flex-col py-4 px-2 items-center ">
              <p className="text-[40px] font-extrabold leading-none text-white">
                52+
              </p>
              <p className="text-[10px] font-medium text-white text-center">
                Rational interview Questions
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-center items-center">
            <Image
              src="/robot7.svg"
              alt="robot"
              width={50}
              height={50}
              className=" w-[240px] sm:w-[260px] lg:w-[50%] object-contain animate-bounce-pause flex items-center justify-center"
            />
          </div>
        </div>

        <div className="flex  flex-col sm:flex-row gap-3 xl:gap-10 w-full items-center">
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

      <StartFlowModal
        open={startFlowOpen}
        mode={startMode}
        interviews={interviews}
        initialInterviewId={startInitialInterviewId}
        onClose={() => { setStartFlowOpen(false); setStartInitialInterviewId(null); }}
      />
    </main>
  );
}

function InterviewCard({ title, image, onStartInterview, onScheduleInterview }: { 
  title: string; 
  image: string;
  onStartInterview: () => void;
  onScheduleInterview: () => void;
}) {
  return (
    <div
      className={`relative w-full sm:w-[360px] rounded-2xl border p-6 border-purple-200
        bg-gradient-to-b from-white to-purple-50`}
    >
      {/* Image Placeholder */}
      <div className="mb-6 h-40 rounded-xl flex items-center justify-center">
        <Image
          src={image}
          alt={title}
          width={200}
          height={200}
          className="object-contain"
        />
      </div>

      <h3 className="text-xl font-semibold text-purple-700 mb-4">
        {title}
      </h3>

      <ul className="space-y-3 text-sm text-gray-700">
        {[
          "Basic Self Introduction assessment",
          "Suggestions to improve",
          "Schedule as per your request",
          "CV based assessment",
        ].map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-white text-[10px]">
              ✓
            </span>
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex gap-3">
        <button 
          onClick={onScheduleInterview}
          className="w-1/2 rounded-lg border border-purple-500 py-2 text-xs sm:text-sm text-purple-600 hover:bg-purple-50 transition-colors"
        >
          Schedule interview
        </button>
        <button 
          onClick={onStartInterview}
          className="w-1/2 rounded-lg bg-purple-600 py-2 text-xs sm:text-sm text-white hover:bg-purple-700 transition-colors"
        >
          Start Interview
        </button>
      </div>
    </div>
  );
}
