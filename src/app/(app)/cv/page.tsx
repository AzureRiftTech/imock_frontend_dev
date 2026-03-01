'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FaArrowLeft, FaArrowRight, FaRegFilePdf, FaRegFileWord, FaRegFileAlt, FaTrashAlt, FaEdit, FaExpand, FaTimes, FaMagic } from 'react-icons/fa'
import { MdOutlineKeyboardArrowRight } from 'react-icons/md'
import { TEMPLATES } from '@/lib/resume-templates'
import type { TemplateMeta } from '@/lib/resume-templates'
import { api, getApiBaseUrl } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/error'
import { sweetConfirm } from '@/lib/swal'

// ─── Types ────────────────────────────────────────────────────────────────────

type CvRow = {
  cv_id: number
  original_filename: string | null
  resume_name: string | null
  description: string | null
  job_type: string | null
  local_path: string | null
  file_url: string | null
  s3_url: string | null
  created_at: string | null
  updated_at: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_EXTS = ['.pdf', '.docx', '.doc', '.txt']
const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getExt(cv: CvRow) {
  return (cv.original_filename || '').split('.').pop()?.toLowerCase() || ''
}

function formatDate(v: string | null | undefined) {
  if (!v) return ''
  const d = new Date(v)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function validateFile(file: File): string | null {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_EXTS.includes(ext) && !ALLOWED_MIMES.includes(file.type)) {
    return `"${file.name}" is not supported. Please upload PDF, DOCX, DOC or TXT.`
  }
  if (file.size > 50 * 1024 * 1024) {
    return `"${file.name}" exceeds 50 MB limit.`
  }
  return null
}

function getPreviewUrl(cvId: number) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
  return `${getApiBaseUrl()}/cv/${cvId}/preview?token=${token || ''}`
}

// ─── Template mini-preview (schematic) ──────────────────────────────────────

function TemplateMiniPreview({ tpl }: { tpl: TemplateMeta }) {
  const isLight = (hex: string) => {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
    return (r*299+g*587+b*114)/1000 > 140
  }
  const bodyDark = !isLight(tpl.bodyBg)
  const lineColor = (opacity = 0.18) => bodyDark ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity})`
  const TL = ({ w, thick = 3 }: { w: string; thick?: number }) => (
    <div style={{ height: thick, borderRadius: 2, background: lineColor(0.15), width: w, marginBottom: thick + 1 }} />
  )
  if (tpl.hasSidebar) {
    const sidebarDark = tpl.sidebarBg && !isLight(tpl.sidebarBg)
    const sSl = (op = 0.25) => `rgba(255,255,255,${op})`
    return (
      <div style={{ display: 'flex', height: '100%', background: tpl.bodyBg, borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ width: '36%', background: tpl.sidebarBg, padding: '10px 8px', boxSizing: 'border-box' as const }}>
          <div style={{ height: 5, borderRadius: 3, background: tpl.accent, marginBottom: 6, width: '75%' }} />
          {['90%','70%','80%','65%'].map((w,i) => <div key={i} style={{ height: 3, borderRadius: 2, background: sSl(0.2), width: w, marginBottom: 4 }} />)}
          <div style={{ height: 1, background: sSl(0.1), margin: '6px 0' }} />
          {['60%','75%','55%'].map((w,i) => <div key={i} style={{ height: 3, borderRadius: 2, background: sSl(0.2), width: w, marginBottom: 4 }} />)}
          <div style={{ height: 1, background: sSl(0.1), margin: '6px 0' }} />
          {['80%','65%'].map((w,i) => <div key={i} style={{ height: 3, borderRadius: 2, background: sSl(0.2), width: w, marginBottom: 4 }} />)}
        </div>
        <div style={{ flex: 1, padding: '10px', boxSizing: 'border-box' as const, background: tpl.bodyBg }}>
          <div style={{ height: 4, borderRadius: 2, background: tpl.accent, opacity: 0.45, marginBottom: 6, width: '65%' }} />
          <TL w="100%" /><TL w="90%" /><TL w="85%" /><TL w="95%" />
          <div style={{ height: 1, background: lineColor(0.1), margin: '5px 0' }} />
          <TL w="80%" /><TL w="70%" /><TL w="90%" />
        </div>
      </div>
    )
  }
  if (tpl.id === 'nexus') return (
    <div style={{ height: '100%', background: '#FAFAFA', borderRadius: 6, overflow: 'hidden', padding: 8, boxSizing: 'border-box' as const }}>
      <div style={{ borderLeft: '3px solid #7C3AED', paddingLeft: 8, marginBottom: 8 }}>
        <div style={{ height: 6, borderRadius: 3, background: '#1F2937', width: '50%', marginBottom: 4 }} />
        <div style={{ display: 'flex', gap: 5 }}>
          {['28%','22%','20%'].map((w,i) => <div key={i} style={{ height: 3, borderRadius: 2, background: '#7C3AED', opacity: 0.5, width: w }} />)}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ background: '#fff', borderRadius: 4, padding: '5px 6px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
            <div style={{ height: 3.5, borderRadius: 2, background: '#7C3AED', opacity: 0.3, marginBottom: 3, width: '70%' }} />
            <div style={{ height: 2.5, borderRadius: 1, background: '#E5E7EB', marginBottom: 2 }} />
            <div style={{ height: 2.5, borderRadius: 1, background: '#E5E7EB', width: '80%' }} />
          </div>
        ))}
      </div>
    </div>
  )
  const headerIsLight = isLight(tpl.headerBg)
  const hLineC = (op = 0.7) => headerIsLight ? `rgba(0,0,0,${op})` : `rgba(255,255,255,${op})`
  return (
    <div style={{ height: '100%', background: tpl.bodyBg, borderRadius: 6, overflow: 'hidden', display: 'flex', flexDirection: 'column' as const }}>
      <div style={{
        background: tpl.id === 'classic' ? 'transparent' :
          tpl.id === 'spectrum' ? 'transparent' : tpl.headerBg,
        padding: '10px 12px',
        borderBottom: (tpl.headerBg === '#fff' || tpl.id === 'classic' || tpl.id === 'spectrum')
          ? `3px solid ${tpl.accent}` : 'none',
      }}>
        {tpl.id === 'spectrum' ? (
          <>
            <div style={{ height: 7, borderRadius: 3, width: '55%', marginBottom: 5,
              background: 'linear-gradient(90deg,#EC4899,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              // fallback solid for rendering engines that don't support bg-clip on divs
              boxShadow: 'none', backgroundImage: 'linear-gradient(90deg,#EC4899,#8B5CF6)',
            }} />
            <div style={{ height: 2.5, borderRadius: 2, background: 'linear-gradient(90deg,#EC4899,#8B5CF6,#06B6D4)', marginBottom: 0 }} />
          </>
        ) : (
          <>
            <div style={{ height: 7, borderRadius: 3, background: hLineC(0.85), width: '50%', marginBottom: 5 }} />
            <div style={{ display: 'flex', gap: 4 }}>
              {['30%','22%','20%'].map((w,i) => <div key={i} style={{ height: 2.5, borderRadius: 2, background: hLineC(0.45), width: w }} />)}
            </div>
          </>
        )}
      </div>
      <div style={{ flex: 1, padding: '8px 12px' }}>
        {tpl.id === 'spectrum' ? (
          <>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' as const, marginBottom: 6 }}>
              {['#FDF2F8','#EFF6FF','#F5F3FF','#ECFDF5','#FEF9C3'].map((bg,i) => (
                <div key={i} style={{ height: 8, borderRadius: 9, background: bg, width: [24,18,28,16,22][i], border: '1px solid rgba(0,0,0,0.04)' }} />
              ))}
            </div>
            <TL w="100%" /><TL w="88%" /><TL w="93%" />
          </>
        ) : (
          <>
            <div style={{ height: 1.5, background: tpl.accent, opacity: 0.25, marginBottom: 6, borderRadius: 1 }} />
            <TL w="100%" /><TL w="90%" /><TL w="85%" /><TL w="93%" />
            <div style={{ height: 1, background: lineColor(0.08), margin: '5px 0' }} />
            <TL w="78%" /><TL w="70%" />
          </>
        )}
      </div>
    </div>
  )
}

// ─── Type Card ────────────────────────────────────────────────────────────────

type TypeCardProps = {
  ext: string
  name: string | null
  jobType: string | null
}

const TYPE_STYLES: Record<string, { bg: string; icon: React.ReactNode; label: string }> = {
  pdf:     { bg: 'bg-gradient-to-br from-red-50 to-red-100',     icon: <FaRegFilePdf  size={40} className="text-red-400"     />, label: 'PDF'  },
  docx:    { bg: 'bg-gradient-to-br from-blue-50 to-blue-100',   icon: <FaRegFileWord size={40} className="text-blue-400"    />, label: 'DOCX' },
  doc:     { bg: 'bg-gradient-to-br from-blue-50 to-blue-100',   icon: <FaRegFileWord size={40} className="text-blue-400"    />, label: 'DOC'  },
  txt:     { bg: 'bg-gradient-to-br from-gray-50 to-gray-100',   icon: <FaRegFileAlt  size={40} className="text-gray-400"    />, label: 'TXT'  },
  builder: { bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100', icon: <FaMagic size={40} className="text-emerald-400" />, label: 'Resume Builder' },
}

function TypeCard({ ext, name, jobType }: TypeCardProps) {
  // Resume Builder entries always use the builder style regardless of stored file extension
  const resolvedKey = jobType === 'Resume Builder' ? 'builder' : ext
  const style = TYPE_STYLES[resolvedKey] || { bg: 'bg-gradient-to-br from-purple-50 to-purple-100', icon: <FaRegFileAlt size={40} className="text-purple-400" />, label: ext?.toUpperCase() || 'FILE' }
  return (
    <div className={`h-44 flex flex-col items-center justify-center gap-3 relative ${style.bg}`}>
      {style.icon}
      <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">{style.label}</span>
      {jobType && jobType !== 'Resume Builder' && (
        <span
          className="absolute top-2 right-2 text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 bg-purple-500"
        >
          {jobType}
        </span>
      )}
    </div>
  )
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({ cv, onClose }: { cv: CvRow; onClose: () => void }) {
  const previewUrl = getPreviewUrl(cv.cv_id)
  const ext = getExt(cv)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-white/10 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p className="text-white font-semibold text-sm">{cv.resume_name || cv.original_filename}</p>
          {cv.job_type && <p className="text-white/60 text-xs">{cv.job_type}</p>}
        </div>
        <div className="flex items-center gap-2">
          {cv.file_url && (
            <a
              href={cv.file_url}
              download
              className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition"
            >
              Download
            </a>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition"
          >
            <FaTimes size={14} />
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {ext === 'pdf' || ext === 'docx' || ext === 'doc' || ext === 'txt' ? (
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title={cv.resume_name || 'Resume Preview'}
            sandbox="allow-same-origin allow-scripts allow-popups"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white/60">
            Preview not available for this file type.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Upload Walkthrough Modal ───────────────────────────────────────────────────

function UploadWalkthroughModal({
  file,
  onClose,
  onDirectUpload,
  onUseBuilder,
}: {
  file: File | null
  onClose: () => void
  onDirectUpload: (file: File, meta: { name: string; description: string; jobType: string }) => void
  onUseBuilder: (file: File) => void
}) {
  const [step, setStep] = useState<'choose' | 'meta'>('choose')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [jobType, setJobType] = useState('')

  useEffect(() => {
    if (file) {
      const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ')
      setName(baseName)
      setStep('choose')
      setDescription('')
      setJobType('')
    }
  }, [file])

  if (!file) return null

  const steps = ['choose', 'meta']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{step === 'choose' ? '📂' : '📝'}</span>
              <h3 className="text-lg font-semibold text-gray-800">
                {step === 'choose' ? 'Upload Your Resume' : 'Resume Details'}
              </h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-3">
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${
                  step === s ? 'text-purple-600' :
                  i < steps.indexOf(step) ? 'text-green-500' : 'text-gray-300'
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    step === s ? 'bg-purple-500 text-white' :
                    i < steps.indexOf(step) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>{i + 1}</div>
                  {i === 0 ? 'Choose Action' : 'Details'}
                </div>
                {i === 0 && <div className="flex-1 h-px bg-gray-200" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {step === 'choose' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">
              What would you like to do with <span className="font-medium text-gray-700 truncate inline-block max-w-[260px] align-bottom">&ldquo;{file.name}&rdquo;</span>?
            </p>
            {/* Option A: Upload directly */}
            <button
              onClick={() => setStep('meta')}
              className="w-full rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 p-4 text-left transition group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0 group-hover:bg-purple-200">
                  <span className="text-lg">📤</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Upload Directly</p>
                  <p className="text-xs text-gray-500 mt-0.5">Store your resume as-is and add a name, job type, and short description.</p>
                </div>
              </div>
            </button>
            {/* Option B: Resume Builder */}
            <button
              onClick={() => onUseBuilder(file)}
              className="w-full rounded-xl border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 p-4 text-left transition group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-200">
                  <span className="text-lg">✨</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Improve with Resume Builder</p>
                  <p className="text-xs text-gray-500 mt-0.5">Auto-import your resume into the AI-powered builder to enhance formatting, fix gaps, and choose from 10 templates.</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {step === 'meta' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Add some details to help you find this resume later.</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Resume Name <span className="text-red-400">*</span></label>
              <input
                autoFocus
                className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Frontend Developer CV"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Job Type / Role</label>
              <input
                className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                placeholder="e.g. Software Engineer, Data Scientist"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea
                className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short note about this resume version…"
              />
            </div>
            <div className="flex justify-between items-center pt-1">
              <button onClick={() => setStep('choose')} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
              <button
                onClick={() => onDirectUpload(file, { name: name.trim() || file.name, description: description.trim(), jobType: jobType.trim() })}
                disabled={!name.trim()}
                className="rounded-lg bg-purple-500 px-5 py-2 text-sm text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload Resume
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({ cv, onClose, onSaved }: { cv: CvRow; onClose: () => void; onSaved: (c: CvRow) => void }) {
  const [name, setName] = useState(cv.resume_name || cv.original_filename || '')
  const [description, setDescription] = useState(cv.description || '')
  const [jobType, setJobType] = useState(cv.job_type || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await api.patch(`/cv/${cv.cv_id}`, {
        resume_name: name.trim() || cv.original_filename || 'Untitled',
        description: description.trim(),
        job_type: jobType.trim(),
      })
      onSaved(res.data.cv as CvRow)
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Resume Details</h3>
        {error && <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</p>}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Resume Name</label>
            <input className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Frontend Developer CV" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Job Type / Role</label>
            <input className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              value={jobType} onChange={(e) => setJobType(e.target.value)} placeholder="e.g. Software Engineer, Data Scientist" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
              rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short note about this resume version…" />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving} className="rounded-lg bg-purple-500 px-4 py-2 text-sm text-white hover:bg-purple-600 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CvPage() {
  const router = useRouter()
  const [cvs, setCvs] = useState<CvRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<'latest' | 'oldest'>('latest')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [editTarget, setEditTarget] = useState<CvRow | null>(null)
  const [previewTarget, setPreviewTarget] = useState<CvRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [templateIdx, setTemplateIdx] = useState(0)
  const [walkthroughFile, setWalkthroughFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadCvs = useCallback(async (sortOrder: 'latest' | 'oldest' = sort) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/cv/list?sort=${sortOrder}`)
      setCvs((res.data?.cvs as CvRow[]) || [])
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to load resumes')
    } finally {
      setLoading(false)
    }
  }, [sort])

  useEffect(() => { loadCvs(sort) }, [sort])

  const doUpload = async (file: File, meta?: { name: string; description: string; jobType: string }) => {
    setWalkthroughFile(null)
    const validationError = validateFile(file)
    if (validationError) { setError(validationError); return }

    setUploading(true)
    setUploadProgress(0)
    setError(null)
    const form = new FormData()
    form.append('cv', file)
    if (meta?.name)        form.append('resume_name', meta.name)
    if (meta?.description) form.append('description', meta.description)
    if (meta?.jobType)     form.append('job_type', meta.jobType)
    try {
      const res = await api.post('/cv/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          const total = evt.total || 0
          if (total) setUploadProgress(Math.round((evt.loaded / total) * 100))
        },
      })
      const newCv = res.data.cv as CvRow
      setCvs((prev) => sort === 'latest' ? [newCv, ...prev] : [...prev, newCv])
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const sendToBuilder = (file: File) => {
    setWalkthroughFile(null)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        sessionStorage.setItem('rb_auto_import_file', reader.result as string)
        sessionStorage.setItem('rb_auto_import_name', file.name)
        sessionStorage.setItem('rb_auto_import_type', file.type)
      } catch { /* ignore quota errors */ }
      router.push('/resume-builder?autoImport=1')
    }
    reader.readAsDataURL(file)
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    const validationError = validateFile(file)
    if (validationError) { setError(validationError); return }
    setWalkthroughFile(file)
  }

  const handleDelete = async (cv: CvRow) => {
    const ok = await sweetConfirm(`Delete "${cv.resume_name || cv.original_filename || 'this resume'}"?`, 'This cannot be undone.')
    if (!ok) return
    try {
      await api.delete(`/cv/${cv.cv_id}`)
      setCvs((prev) => prev.filter((c) => c.cv_id !== cv.cv_id))
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Delete failed')
    }
  }

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <main className="min-h-screen p-3 sm:p-8">
      {/* Modals */}
      <UploadWalkthroughModal
        file={walkthroughFile}
        onClose={() => setWalkthroughFile(null)}
        onDirectUpload={(file, meta) => doUpload(file, meta)}
        onUseBuilder={sendToBuilder}
      />
      {previewTarget && <PreviewModal cv={previewTarget} onClose={() => setPreviewTarget(null)} />}
      {editTarget && (
        <EditModal
          cv={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => { setCvs((prev) => prev.map((c) => c.cv_id === updated.cv_id ? updated : c)); setEditTarget(null) }}
        />
      )}

      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-0 lg:left-1/2 top-0 h-[200px] w-[720px] -translate-x-1/2 rounded-full bg-[#e6cfff] blur-[140px]" />
      </div>
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-0 lg:left-1/2 bottom-0 h-[200px] w-[720px] -translate-x-1/2 rounded-full bg-[#e6cfff] blur-[140px]" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
        {/* ═══════════════════ LEFT ═══════════════════ */}
        <div className="space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-lg font-semibold text-gray-800">
              Uploaded Resume
              {!loading && <span className="ml-2 text-xs font-normal text-gray-400">({cvs.length})</span>}
            </h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Sort by:</span>
              <select className="rounded-lg border px-3 py-1 text-sm focus:outline-none" value={sort}
                onChange={(e) => setSort(e.target.value as 'latest' | 'oldest')}>
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex justify-between">
              {error}
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4">✕</button>
            </div>
          )}

          {/* Resume Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-[20px] bg-white border border-purple-100 overflow-hidden animate-pulse">
                  <div className="h-44 bg-purple-50" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-purple-100 rounded w-3/4" />
                    <div className="h-3 bg-purple-50 rounded w-1/2" />
                    <div className="flex gap-2 pt-1">
                      <div className="h-8 bg-purple-50 rounded flex-1" />
                      <div className="h-8 bg-purple-100 rounded flex-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : cvs.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-purple-200 bg-white/60 p-10 text-center text-gray-400">
              <FaRegFileAlt size={40} className="mx-auto mb-3 text-purple-200" />
              <p className="text-sm font-medium mb-1">No resumes yet</p>
              <p className="text-xs">Upload a PDF, DOCX or TXT below to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cvs.map((cv) => {
                const ext = getExt(cv)
                const isBuilder = cv.job_type === 'Resume Builder'

                const openBuilder = () => {
                  router.push(`/resume-builder?cv=${cv.cv_id}`)
                }

                return (
                  <div key={cv.cv_id} className="group rounded-[20px] bg-white border border-purple-200 shadow-[0_8px_24px_rgba(139,92,246,0.10)] overflow-hidden hover:shadow-[0_12px_32px_rgba(139,92,246,0.18)] transition-shadow">
                    {/* Type Card Thumbnail */}
                    <div
                      className="relative overflow-hidden cursor-pointer"
                      onClick={() => isBuilder ? openBuilder() : setPreviewTarget(cv)}
                      title={isBuilder ? 'Open in Resume Builder' : 'Click to preview'}
                    >
                      <TypeCard ext={ext} name={cv.resume_name} jobType={cv.job_type} />
                      {/* Preview hint overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 rounded-t-[20px]">
                        <div className="bg-white/90 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-700 shadow">
                          {isBuilder ? <><FaMagic size={11} /> Open Builder</> : <><FaExpand size={11} /> Preview</>}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {cv.resume_name || cv.original_filename || `Resume #${cv.cv_id}`}
                      </p>
                      {cv.description && <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{cv.description}</p>}
                      {cv.created_at && <p className="text-[11px] text-gray-400">{formatDate(cv.created_at)}</p>}

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => isBuilder ? openBuilder() : setPreviewTarget(cv)}
                          className={`flex-1 flex items-center justify-center gap-1 rounded-lg border text-xs py-1.5 transition-colors ${
                            isBuilder
                              ? 'border-emerald-400 text-emerald-600 hover:bg-emerald-50'
                              : 'border-[#AE73F3] text-[#AE73F3] hover:bg-purple-50'
                          }`}
                        >
                          {isBuilder ? <><FaMagic size={10} /> Open Builder</> : <><FaExpand size={10} /> View</>}
                        </button>
                        <button
                          onClick={() => setEditTarget(cv)}
                          className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[#AE73F3] text-white text-xs py-1.5 hover:bg-purple-500 transition-colors"
                        >
                          <FaEdit size={10} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cv)}
                          className="w-8 flex items-center justify-center rounded-lg border border-red-200 text-red-400 text-xs py-1.5 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <FaTrashAlt size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Upload + CTA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Drop Zone */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`relative rounded-[20px] bg-white border-2 border-dashed p-8 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition-colors
                ${dragging ? 'border-purple-500 bg-purple-50' : 'border-purple-200 hover:border-purple-400 hover:bg-purple-50/40'}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => { handleFiles(e.target.files); e.currentTarget.value = '' }}
              />
              {uploading ? (
                <>
                  <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-500 animate-spin" />
                  <p className="text-sm text-purple-600 font-medium">Uploading… {uploadProgress}%</p>
                  <div className="w-full max-w-[160px] h-1.5 bg-purple-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </>
              ) : (
                <>
                  <Image src="/file.svg" alt="" height={36} width={36} />
                  <p className="text-sm text-gray-600">
                    Drop your resume here or{' '}
                    <span className="text-purple-600 font-medium">Click to upload</span>
                  </p>
                  <p className="text-xs text-gray-400">Supported: PDF, DOCX, DOC, TXT (max 10 MB)</p>
                </>
              )}
            </div>

            {/* Resume Builder CTA */}
            <div className="rounded-[20px] bg-white border border-purple-200 p-4 flex gap-4 items-center">
              <div className="w-1/3 h-full rounded-lg bg-purple-100 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                  <Image src="/file.svg" alt="" height={30} width={30} />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">Try Our Resume Builder!</h4>
                <p className="text-sm text-gray-500 mt-1">Your CV will be assessed on the basis of parameters.</p>
                <Link href="/resume-builder" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-white text-xs sm:text-sm hover:bg-purple-600">
                  Generate Resume <MdOutlineKeyboardArrowRight size={22} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════ RIGHT SIDEBAR ═══════════════════ */}
        <aside className="rounded-[20px] bg-white border border-purple-200 p-4 shadow-[0_10px_30px_rgba(139,92,246,0.15)] h-fit">
          <h3 className="font-semibold text-gray-800 mb-4">CV Templates</h3>

          {/* Template preview carousel */}
          <div className="rounded-xl overflow-hidden border border-purple-100 bg-gray-50" style={{ height: 200 }}>
            <TemplateMiniPreview tpl={TEMPLATES[templateIdx]} />
          </div>

          {/* Navigation + tier badge */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">{TEMPLATES[templateIdx].icon} {TEMPLATES[templateIdx].name}</span>
              <span className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full ${
                TEMPLATES[templateIdx].tier === 'basic'      ? 'bg-slate-100 text-slate-500' :
                TEMPLATES[templateIdx].tier === 'pro'        ? 'bg-amber-100 text-amber-600' :
                                                                'bg-purple-100 text-purple-600'
              }`}>
                {TEMPLATES[templateIdx].tier === 'basic' ? 'Free' : TEMPLATES[templateIdx].tier === 'pro' ? '⭐ Pro' : '💎 Enterprise'}
              </span>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setTemplateIdx(i => (i - 1 + TEMPLATES.length) % TEMPLATES.length)}
                className="w-8 h-8 border border-[#AE73F3] rounded-lg flex items-center justify-center cursor-pointer hover:bg-purple-100 transition"
              ><FaArrowLeft className="text-[#AE73F3]" /></button>
              <button
                onClick={() => setTemplateIdx(i => (i + 1) % TEMPLATES.length)}
                className="w-8 h-8 border border-[#AE73F3] rounded-lg flex items-center justify-center cursor-pointer hover:bg-purple-100 transition"
              ><FaArrowRight className="text-[#AE73F3]" /></button>
            </div>
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-1 mt-2">
            {TEMPLATES.map((_, i) => (
              <button
                key={i}
                onClick={() => setTemplateIdx(i)}
                className={`rounded-full transition-all ${
                  i === templateIdx ? 'w-4 h-2 bg-purple-500' : 'w-2 h-2 bg-purple-200 hover:bg-purple-300'
                }`}
              />
            ))}
          </div>

          <h4 className="mt-4 font-semibold text-gray-800">Top Tier CV Templates</h4>
          <p className="text-sm text-gray-500 mt-2">{TEMPLATES[templateIdx].desc} — ATS-ready and professionally designed for every industry.</p>
          <Link href={`/resume-builder?template=${TEMPLATES[templateIdx].id}`} className="mt-4 rounded-lg bg-purple-500 py-3 text-white text-sm hover:bg-purple-600 flex items-center justify-center w-full sm:w-auto px-5">
            Use This Template <MdOutlineKeyboardArrowRight size={22} />
          </Link>
          <Link href="/resume-builder" className="mt-2 rounded-lg border border-purple-300 py-2.5 text-purple-600 text-sm hover:bg-purple-50 flex items-center justify-center w-full sm:w-auto px-5">
            Browse All Templates <MdOutlineKeyboardArrowRight size={22} />
          </Link>

          {/* Stats */}
          {!loading && cvs.length > 0 && (
            <div className="mt-6 pt-4 border-t border-purple-100 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Your Resumes</h4>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total uploaded</span>
                <span className="font-semibold text-purple-600">{cvs.length}</span>
              </div>
              {(() => {
                const jobTypes = [...new Set(cvs.map((c) => c.job_type).filter(Boolean) as string[])]
                if (!jobTypes.length) return null
                return (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Job types</p>
                    <div className="flex flex-wrap gap-1">
                      {jobTypes.map((jt) => (
                        <span key={jt} className="bg-purple-50 text-purple-600 text-[11px] px-2 py-0.5 rounded-full border border-purple-100">{jt}</span>
                      ))}
                    </div>
                  </div>
                )
              })()}
              {/* Format breakdown */}
              <div className="flex gap-2 flex-wrap pt-1">
                {Object.entries(
                  cvs.reduce<Record<string, number>>((acc, cv) => {
                    const e = getExt(cv) || 'other'
                    acc[e] = (acc[e] || 0) + 1
                    return acc
                  }, {})
                ).map(([ext, count]) => (
                  <span key={ext} className="text-[11px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">
                    {ext.toUpperCase()} · {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}
