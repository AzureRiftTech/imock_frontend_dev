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

function PastResultsModal({
  open,
  interview,
  onClose,
}: {
  open: boolean
  interview: Interview | null
  onClose: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [pastResults, setPastResults] = React.useState<InterviewResult[]>([])

  const viewResultDetail = (result: InterviewResult) => {
    if (!interview) return
    const resultId = result.result_id || result.id
    // Close modal then navigate: if we don't have a result id, go to the results list
    onClose()
    if (resultId) {
      router.push(`/mock-interview/${interview.interview_id}/result/${resultId}`)
    } else {
      router.push(`/mock-interview/${interview.interview_id}/result`)
    }
  }

  React.useEffect(() => {
    if (!open || !interview) return
    setLoading(true)
    setError(null)
    if (typeof setPastResults === 'function') setPastResults([]);
    (async () => {
      try {
        const res = await api.get(`/answer-analysis/results/${interview.interview_id}`)
        const singleResult = res.data?.data as InterviewResult | null
        if (singleResult) {
          if (typeof setPastResults === 'function') setPastResults([singleResult])
        } else {
          if (typeof setPastResults === 'function') setPastResults([])
        }
      } catch (err: any) {
        // If no results yet, server returns 404; show friendly message instead of console noise
        if (err?.response?.status === 404) {
          if (typeof setPastResults === 'function') setPastResults([])
        } else {
          setError(getApiErrorMessage(err) || 'Failed to load results')
          console.error('Failed to fetch interview results', err)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [open, interview])

  return (
    <Modal open={open} title="Past Interview Results" onClose={onClose}>
      <div className="space-y-4">
        {interview && (
          <div className="pb-3 border-b border-zinc-200">
            <div className="text-sm font-semibold text-zinc-900">{interview.company_name}</div>
            <div className="text-sm text-zinc-600">{interview.position_name || interview.position}</div>
          </div>
        )}

        {loading ? (
          <div className="text-sm text-zinc-600 py-4">Loading results…</div>
        ) : error ? (
          <div className="text-sm text-red-600 py-4">{error}</div>
        ) : (!Array.isArray(pastResults) || pastResults.length === 0) ? (
          <div className="text-sm text-zinc-600 py-4">No past interview results found.</div>
        ) : (
          <div className="space-y-3">
            {(Array.isArray(pastResults) ? pastResults : []).map((result) => (
              <div
                key={result.result_id || result.id}
                className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-zinc-900">
                      Session: {result.session_token.slice(0, 12)}...
                    </div>
                    <div className="mt-1 text-xs text-zinc-600">{formatDisplayDate(result.completed_at)}</div>
                    {result.overall_score !== null && result.overall_score !== undefined && (
                      <div className="mt-2 text-sm text-zinc-700">Score: <span className="font-semibold">{result.overall_score}</span></div>
                    )}
                    {result.strengths && (
                      <div className="mt-2 text-xs text-emerald-700">Strengths: {result.strengths.slice(0, 80)}{result.strengths.length > 80 ? '...' : ''}</div>
                    )}
                    {result.improvements && (
                      <div className="mt-1 text-xs text-amber-700">Improvements: {result.improvements.slice(0, 80)}{result.improvements.length > 80 ? '...' : ''}</div>
                    )}
                  </div>
                  <Button size="sm" onClick={() => viewResultDetail(result)} className="bg-brand-600 hover:bg-brand-700 text-white">View Details</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  )
}

function MockInterviewModal({
  open,
  interview,
  onClose,
}: {
  open: boolean
  interview: Interview | null
  onClose: () => void
}) {
  const router = useRouter()
  const [cvs, setCvs] = React.useState<CvRow[]>([])
  const [loading, setLoading] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null)
  const [questionCount, setQuestionCount] = React.useState<number>(5)
  const [tab, setTab] = React.useState<'select' | 'upload'>('select')
  
  React.useEffect(() => {
    if (open) {
      loadCvs()
      setTab('select')
    }
  }, [open, interview])

  const loadCvs = async () => {
    setLoading(true)
    try {
      // Changed to use the mock-interview resumes endpoint which reads from user_details
      const res = await api.get('/mock-interview/resumes')
      const list = (res.data?.resumes as CvRow[]) || []
      setCvs(list)
      if (list.length > 0) setSelectedIndex(list[0].index)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
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
      // Note: This upload currently goes to the CV processing service. 
      // If this system is separate from user_details.resumes, this might not automatically appear in the list 
      // unless the backend syncs them. For now, we'll existing logic but warn if empty.
      const res = await api.post('/cv/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const data = res.data
      await loadCvs()
      // If we got a cv_id, we can't easily map it to index unless it was added to user_details.
      // We'll rely on reloading to find the new one, or select the last one if added.
      // For this specific 'user_details' request, we might need a different upload endpoint 
      // or assume the backend handles the sync. 
      // If loadCvs returns a new list, we try to select the last one.
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleStart = (withAvatar: boolean = true, useAISpeech: boolean = false) => {
    if (!interview || selectedIndex === null) return
    const base = `/mock-interview/${interview.interview_id}`
    let path = `${base}?index=${selectedIndex}&duration=${questionCount}`
    if (!withAvatar && useAISpeech) {
      path = `${base}/without_avatar_with_ai_speech?index=${selectedIndex}&duration=${questionCount}`
    } else if (!withAvatar) {
      path = `${base}/without_avatar?index=${selectedIndex}&duration=${questionCount}`
    }
    router.push(path)
  }


  return (
    <Modal open={open} title="Start Mock Interview" onClose={onClose}>
      <div className="space-y-4">
        {error && <div className="text-sm text-red-600">{error}</div>}
        
        <div className="flex gap-2 border-b border-zinc-200 pb-2">
           <button 
             className={`px-3 py-1 text-sm font-medium ${tab === 'select' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-zinc-500'}`}
             onClick={() => setTab('select')}
           >
             Select Resume
           </button>
           <button 
             className={`px-3 py-1 text-sm font-medium ${tab === 'upload' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-zinc-500'}`}
             onClick={() => setTab('upload')}
           >
             Upload New
           </button>
        </div>
          
        {tab === 'select' ? (
          <div className="space-y-4 pt-2">
            {loading ? (
              <div className="text-sm text-zinc-500">Loading resumes...</div>
            ) : cvs.length === 0 ? (
              <div className="text-sm text-zinc-500">No resumes found. Please upload one.</div>
            ) : (
              <div className="space-y-2">
                <Label>Choose a resume</Label>
                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  {cvs.map((cv) => (
                    <div
                      key={cv.index}
                      className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                        selectedIndex === cv.index
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-zinc-200 hover:bg-zinc-50'
                      }`}
                      onClick={() => setSelectedIndex(cv.index)}
                    >
                      <div className="font-medium text-zinc-900 truncate">{cv.filename}</div>
                      <div className="text-xs text-zinc-500">{cv.is_pdf ? 'PDF Document' : 'Document'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="cv_upload">Upload Resume (PDF)</Label>
              <Input
                id="cv_upload"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleUpload}
                disabled={uploading}
              />
              {uploading && <div className="text-sm text-zinc-500">Uploading and processing...</div>}
            </div>
          </div>
        )}

        <div className="pt-2">
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

        <div className="flex justify-between gap-2 pt-4">
          <div>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => handleStart(true)} disabled={selectedIndex === null || uploading || (loading && tab === 'select')}>
              Start Interview (With Avatar)
            </Button>
            <Button variant="ghost" onClick={() => handleStart(false)} disabled={selectedIndex === null || uploading || (loading && tab === 'select')}>
              Start Interview (No Avatar)
            </Button>
            <Button variant="outline" onClick={() => handleStart(false, true)} disabled={selectedIndex === null || uploading || (loading && tab === 'select')}>
              Start Interview (No Avatar, AI Speech)
            </Button>
          </div>
        </div>
      </div>
    </Modal>
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
  const [categories, setCategories] = React.useState<any[]>([])
  const loadCategories = async () => {
    try {
      const res = await api.get('/interviews/categories')
      setCategories((res.data as any[]) || [])
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
              <button className={`px-3 py-2 rounded-lg ${useExisting ? 'bg-brand-600 text-white' : 'bg-white border'}`} onClick={() => setUseExisting(true)}>Use existing interview</button>
              <button className={`px-3 py-2 rounded-lg ${!useExisting ? 'bg-brand-600 text-white' : 'bg-white border'}`} onClick={() => setUseExisting(false)}>Enter job details</button>
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
                  {categories.map((c) => <option key={c.job_category_id} value={c.category_name}>{c.category_name}</option>)}
                </select>
                <Label>Experience</Label>
                <Input value={jobDetails.experience_required} onChange={(e) => setJobDetails((p) => ({...p, experience_required: e.target.value}))} placeholder="e.g., 2+ years" />
                <Label>Job description</Label>
                <textarea className="rounded-lg border p-2" value={jobDetails.job_description} onChange={(e) => setJobDetails((p) => ({...p, job_description: e.target.value}))} />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button onClick={handleNext}>Next</Button>
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

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [categories, setCategories] = React.useState<JobCategory[]>([])
  const [interviews, setInterviews] = React.useState<Interview[]>([])
  // Results are fetched on demand when the user opens the Past Results modal
  // (avoids noisy 404s when no results exist)
  const [interviewResults, setInterviewResults] = React.useState<Map<number, InterviewResult[]>>(new Map()) // kept for backward compat but not prefilled

  const [form, setForm] = React.useState<InterviewFormState>({
    company_name: '',
    scheduled_at: '',
    position: '',
    category_name: '',
    experience_required: '',
    status: 'scheduled',
    job_description: '',
  })

  const [editing, setEditing] = React.useState<Interview | null>(null)
  const [mockInterviewTarget, setMockInterviewTarget] = React.useState<Interview | null>(null)
  const [viewingResults, setViewingResults] = React.useState<Interview | null>(null)

  const [categoryModalOpen, setCategoryModalOpen] = React.useState(false)
  const [newCategoryName, setNewCategoryName] = React.useState('')
  const [newCategoryDescription, setNewCategoryDescription] = React.useState('')

  // Start flow (three-card quick start)
  const [startFlowOpen, setStartFlowOpen] = React.useState(false)
  const [startMode, setStartMode] = React.useState<'avatar' | 'ai_voice' | 'no_ai'>('avatar')
  const [startInitialInterviewId, setStartInitialInterviewId] = React.useState<number | null>(null)

  // Smooth-scroll to the schedule form and focus the first input
  const scrollToSchedule = (focus = true) => {
    try {
      const el = document.getElementById('schedule-section')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        if (focus) {
          const input = el.querySelector('input, textarea, select') as HTMLElement | null
          if (input) input.focus()
        }
      }
    } catch (e) {
      // ignore in non-browser environments
      console.warn('scrollToSchedule failed', e)
    }
  }

  const router = useRouter()

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [catsRes, interviewsRes] = await Promise.all([
        api.get('/interviews/categories'),
        api.get('/interviews', { params: userId ? { user_id: userId } : undefined }),
      ])
      setCategories((catsRes.data as JobCategory[]) || [])
      const loadedInterviews = (interviewsRes.data as Interview[]) || []
      setInterviews(loadedInterviews)

      // Do not prefetch interview results to avoid noisy 404s. Results are fetched
      // when the user opens the Past Results modal (see PastResultsModal implementation).
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to load interviews')
    } finally {
      setLoading(false)
    }
  }, [userId])

  React.useEffect(() => {
    load()
  }, [load])

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
      setForm({
        company_name: '',
        scheduled_at: '',
        position: '',
        category_name: '',
        experience_required: '',
        status: 'scheduled',
        job_description: '',
      })
      await load()
    } catch (err: any) {
      console.error('Create interview failed:', err)
      const friendly = getApiErrorMessage(err)
      if (friendly) setError(friendly)
      else if (err?.response?.data) setError(typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data))
      else setError(err?.message || 'Failed to create interview')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (row: Interview) => {
    setEditing(row)
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        company_name: (editing.company_name || '').trim(),
        scheduled_at: toDateTimeLocalValue(editing.scheduled_at),
        position: (editing.position || '').trim(),
        category_name: (editing.category_name || '').trim() || undefined,
        experience_required: editing.experience_required || undefined,
        status: editing.status || undefined,
        job_description: editing.job_description || undefined,
      }
      await api.put(`/interviews/${editing.interview_id}`, payload)
      setEditing(null)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to update interview')
    } finally {
      setSaving(false)
    }
  }

  const deleteInterview = async (row: Interview) => {
    const ok = await sweetConfirm(`Delete interview at ${row.company_name}?`)
    if (!ok) return
    setError(null)
    try {
      await api.delete(`/interviews/${row.interview_id}`)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to delete interview')
    }
  }

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await api.post('/interviews/categories', {
        category_name: newCategoryName,
        description: newCategoryDescription || undefined,
      })
      const created = res.data as JobCategory
      setCategoryModalOpen(false)
      setNewCategoryName('')
      setNewCategoryDescription('')
      await load()
      if (created?.category_name) {
        setForm((prev) => ({ ...prev, category_name: created.category_name }))
      }
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to create category')
    } finally {
      setSaving(false)
    }
  }

  const upcoming = interviews.filter((i) => {
    const d = new Date(i.scheduled_at)
    return !Number.isNaN(d.getTime()) && d.getTime() >= Date.now()
  })
  const past = interviews.filter((i) => {
    const d = new Date(i.scheduled_at)
    return !Number.isNaN(d.getTime()) && d.getTime() < Date.now()
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[var(--font-plus-jakarta)] text-2xl font-bold text-zinc-900">Interviews</h1>
          <p className="mt-1 text-sm text-zinc-600">Schedule, edit, and track upcoming interviews.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={load} disabled={loading}>
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setCategoryModalOpen(true)}>
            Add category
          </Button>
        </div>
      </div>

      {/* Quick start cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="rounded-2xl border p-6 flex flex-col items-start gap-3 hover:shadow-md">
          <div className="text-xl font-semibold text-[#4C0E87]">Interview with AI avatar</div>
          <div className="text-sm text-zinc-600">Visual avatar leading the interview, AI feedback and scoring.</div>
          <div className="mt-4 w-full flex gap-2">
            <Button className="flex-1" onClick={() => { setStartMode('avatar'); setStartFlowOpen(true); }}>Start Interview</Button>
            <Button variant="secondary" onClick={() => router.push('/interviews/schedule')}>Schedule</Button>
          </div>
        </div>

        <div className="rounded-2xl border p-6 flex flex-col items-start gap-3 hover:shadow-md">
          <div className="text-xl font-semibold text-[#4C0E87]">Interview with AI voice</div>
          <div className="text-sm text-zinc-600">No avatar, AI voice asks questions and provides analysis.</div>
          <div className="mt-4 w-full flex gap-2">
            <Button className="flex-1" onClick={() => { setStartMode('ai_voice'); setStartFlowOpen(true); }}>Start Interview</Button>
            <Button variant="secondary" onClick={() => router.push('/interviews/schedule')}>Schedule</Button>
          </div>
        </div>

        <div className="rounded-2xl border p-6 flex flex-col items-start gap-3 hover:shadow-md">
          <div className="text-xl font-semibold text-[#4C0E87]">Interview without AI</div>
          <div className="text-sm text-zinc-600">Practice without AI prompts or voice — manual flow.</div>
          <div className="mt-4 w-full flex gap-2">
            <Button className="flex-1" onClick={() => { setStartMode('no_ai'); setStartFlowOpen(true); }}>Start Interview</Button>
            <Button variant="secondary" onClick={() => router.push('/interviews/schedule')}>Schedule</Button>
          </div>
        </div>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-sm text-red-800">{error}</CardContent>
        </Card>
      ) : null}

      <Card id="schedule-section" className="bg-white/60">
        <CardHeader>
          <CardTitle className="text-base">Schedule an interview</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createInterview} className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="company_name">Company</Label>
              <Input
                id="company_name"
                value={form.company_name}
                onChange={(e) => setForm((p) => ({ ...p, company_name: e.target.value }))}
                placeholder="Acme Inc."
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="scheduled_at">Scheduled at</Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm((p) => ({ ...p, scheduled_at: e.target.value }))}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={form.position}
                onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
                placeholder="Frontend Engineer"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="h-10 w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 text-sm outline-none focus:border-brand-500"
                value={form.category_name}
                onChange={(e) => setForm((p) => ({ ...p, category_name: e.target.value }))}
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.job_category_id} value={c.category_name}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="experience_required">Experience</Label>
              <Input
                id="experience_required"
                value={form.experience_required}
                onChange={(e) => setForm((p) => ({ ...p, experience_required: e.target.value }))}
                placeholder="2+ years"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="h-10 w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 text-sm outline-none focus:border-brand-500"
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="scheduled">scheduled</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>

            <div className="md:col-span-2 grid gap-2">
              <Label htmlFor="job_description">Job description (optional)</Label>
              <textarea
                id="job_description"
                className="min-h-24 w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-brand-500"
                value={form.job_description}
                onChange={(e) => setForm((p) => ({ ...p, job_description: e.target.value }))}
                placeholder="Paste the job description or key requirements"
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Create interview'}
              </Button>
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
            ) : upcoming.length === 0 ? (
              <div className="text-sm text-zinc-600">No upcoming interviews.</div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((row) => (
                  <InterviewRow
                    key={row.interview_id}
                    row={row}
                    onEdit={() => openEdit(row)}
                    onDelete={() => deleteInterview(row)}
                    onStartMock={() => { setStartMode('avatar'); setStartInitialInterviewId(row.interview_id); setStartFlowOpen(true); }}
                    onViewResults={() => setViewingResults(row)}
                  />
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
            ) : past.length === 0 ? (
              <div className="text-sm text-zinc-600">No past interviews.</div>
            ) : (
              <div className="space-y-3">
                {past.map((row) => (
                  <InterviewRow
                    key={row.interview_id}
                    row={row}
                    onEdit={() => openEdit(row)}
                    onDelete={() => deleteInterview(row)}
                    onStartMock={() => { setStartMode('avatar'); setStartInitialInterviewId(row.interview_id); setStartFlowOpen(true); }}
                    onViewResults={() => setViewingResults(row)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        open={Boolean(editing)}
        title="Edit interview"
        onClose={() => setEditing(null)}
      >
        {editing ? (
          <form onSubmit={saveEdit} className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="edit_company_name">Company</Label>
              <Input
                id="edit_company_name"
                value={editing.company_name || ''}
                onChange={(e) => setEditing((p) => (p ? { ...p, company_name: e.target.value } : p))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_scheduled_at">Scheduled at</Label>
              <Input
                id="edit_scheduled_at"
                type="datetime-local"
                value={toDateTimeLocalValue(editing.scheduled_at)}
                onChange={(e) =>
                  setEditing((p) =>
                    p
                      ? {
                          ...p,
                          // store raw input in a way backend parses
                          scheduled_at: e.target.value,
                        }
                      : p
                  )
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_position">Position</Label>
              <Input
                id="edit_position"
                value={editing.position || ''}
                onChange={(e) => setEditing((p) => (p ? { ...p, position: e.target.value } : p))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_category">Category</Label>
              <select
                id="edit_category"
                className="h-10 w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 text-sm outline-none focus:border-brand-500"
                value={editing.category_name || ''}
                onChange={(e) => setEditing((p) => (p ? { ...p, category_name: e.target.value } : p))}
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.job_category_id} value={c.category_name}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_experience_required">Experience</Label>
              <Input
                id="edit_experience_required"
                value={editing.experience_required || ''}
                onChange={(e) => setEditing((p) => (p ? { ...p, experience_required: e.target.value } : p))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_status">Status</Label>
              <select
                id="edit_status"
                className="h-10 w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 text-sm outline-none focus:border-brand-500"
                value={editing.status || 'scheduled'}
                onChange={(e) => setEditing((p) => (p ? { ...p, status: e.target.value } : p))}
              >
                <option value="scheduled">scheduled</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
            <div className="md:col-span-2 grid gap-2">
              <Label htmlFor="edit_job_description">Job description</Label>
              <textarea
                id="edit_job_description"
                className="min-h-24 w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-brand-500"
                value={editing.job_description || ''}
                onChange={(e) => setEditing((p) => (p ? { ...p, job_description: e.target.value } : p))}
              />
            </div>
            <div className="md:col-span-2 flex items-center justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={categoryModalOpen}
        title="Add category"
        onClose={() => setCategoryModalOpen(false)}
      >
        <form onSubmit={createCategory} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new_category_name">Category name</Label>
            <Input
              id="new_category_name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Frontend"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new_category_description">Description (optional)</Label>
            <textarea
              id="new_category_description"
              className="min-h-24 w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-brand-500"
              value={newCategoryDescription}
              onChange={(e) => setNewCategoryDescription(e.target.value)}
              placeholder="Roles focused on UI and web performance"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Create category'}
            </Button>
          </div>
        </form>
      </Modal>

      <PastResultsModal
        open={Boolean(viewingResults)}
        interview={viewingResults}
        onClose={() => setViewingResults(null)}
      />

      <StartFlowModal
        open={startFlowOpen}
        mode={startMode}
        interviews={interviews}
        initialInterviewId={startInitialInterviewId}
        onClose={() => { setStartFlowOpen(false); setStartInitialInterviewId(null); }}
      />

      <MockInterviewModal
        open={Boolean(mockInterviewTarget)}
        interview={mockInterviewTarget}
        onClose={() => setMockInterviewTarget(null)}
      />
    </div>
  )
}

function InterviewRow({
  row,
  onEdit,
  onDelete,
  onStartMock,
  onViewResults,
}: {
  row: Interview
  onEdit: () => void
  onDelete: () => void
  onStartMock: () => void
  onViewResults: () => void
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-zinc-900">{row.company_name}</div>
          <div className="mt-1 text-sm text-zinc-700">
            <span className="font-medium">{row.position_name || row.position}</span>
            {row.category_name ? <span className="text-zinc-500"> · {row.category_name}</span> : null}
          </div>
          <div className="mt-1 text-xs text-zinc-600">{formatDisplayDate(row.scheduled_at)}</div>
          {row.status ? <div className="mt-2 text-xs text-zinc-600">Status: {row.status}</div> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={onViewResults} size="sm" variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50">
            Past Interview Result
          </Button>
          <Button onClick={onStartMock} size="sm" className="bg-brand-600 hover:bg-brand-700 text-white">
            Mock Interview
          </Button>
          <Button variant="secondary" onClick={onEdit}>
            Edit
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
