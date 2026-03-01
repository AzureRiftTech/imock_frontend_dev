'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Sparkles, Plus, Trash2, Save, Download, Upload, Github, FileText,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Link2, Image as ImageIcon,
  Minus, Plus as PlusIcon, Indent, Outdent, Type, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'
import axios from 'axios'
import jsPDF from 'jspdf'
import SuggestionPanel from './SuggestionPanel'
import { AutocompleteInput } from '@/components/ui/autocomplete-input'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333'

interface Experience {
  id: string
  company: string
  jobTitle: string
  date: string
  description: string
}

interface Education {
  id: string
  school: string
  degree: string
  gpa: string
  date: string
  additionalInfo: string
}

interface Project {
  id: string
  name: string
  link: string
  date: string
  description: string
}

export interface ResumeData {
  name: string
  location: string
  phone: string
  email: string
  website: string
  objective: string
  experiences: Experience[]
  education: Education[]
  projects: Project[]
  skills: string
  featuredSkills: Array<{ name: string; level: number }>
}

interface ResumeBuilderFormV2Props {
  onSavedToLibrary?: () => void
  initialState?: ResumeData
  initialLayout?: TemplateId
  /** Pre-populate the title field (e.g. from saved CV library entry) */
  initialTitle?: string
  /** If provided, auto-triggers resume import on mount (from CV page “Use Builder” flow) */
  autoImportFile?: File
  /** When true, skip restoring any previous draft (used in auto-import flow even if sessionStorage file transfer failed) */
  freshStart?: boolean
}

// ── Inline-editable span for the live HTML preview ────────────────────────────
function InlineEdit({
  value, onChange, style, className,
}: { value: string; onChange: (v: string) => void; style?: React.CSSProperties; className?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const focused = React.useRef(false)
  React.useEffect(() => {
    if (!focused.current && ref.current && ref.current.textContent !== value)
      ref.current.textContent = value
  }, [value])
  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => { focused.current = true }}
      onBlur={e => {
        focused.current = false
        const v = e.currentTarget.textContent ?? ''
        if (v !== value) onChange(v)
      }}
      title="Click to edit"
      className={`outline-none cursor-text hover:ring-1 hover:ring-blue-300 hover:rounded-sm focus:ring-2 focus:ring-blue-500 focus:rounded-sm ${className ?? ''}`}
      style={style}
    />
  )
}

// ── Block-editable div for multi-line content ─────────────────────────────────
function BlockEdit({
  value, onChange, style, className,
}: { value: string; onChange: (v: string) => void; style?: React.CSSProperties; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const focused = React.useRef(false)
  React.useEffect(() => {
    if (!focused.current && ref.current && ref.current.textContent !== value)
      ref.current.textContent = value
  }, [value])
  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => { focused.current = true }}
      onBlur={e => {
        focused.current = false
        const v = e.currentTarget.textContent ?? ''
        if (v !== value) onChange(v)
      }}
      title="Click to edit"
      className={`outline-none cursor-text hover:ring-1 hover:ring-blue-300 hover:rounded-sm focus:ring-2 focus:ring-blue-500 focus:rounded-sm ${className ?? ''}`}
      style={style}
    />
  )
}

// A4 dimensions (px at 96 dpi)
const A4_W = 794
const A4_H = 1123

// ── Import parsing steps ──────────────────────────────────────────────────────
const PARSE_STEPS = [
  { icon: '📄', text: 'Reading document...' },
  { icon: '🔍', text: 'Scanning resume structure...' },
  { icon: '🤖', text: 'AI detecting fields...' },
  { icon: '🧩', text: 'Analyzing work experience...' },
  { icon: '🎓', text: 'Extracting education details...' },
  { icon: '⚡', text: 'Identifying skills & projects...' },
  { icon: '✨', text: 'Preparing your resume...' },
]

// ── Save Dialog ── collect name, description, role before saving ───────────────
interface SaveDialogProps {
  open: boolean
  defaultName?: string
  mode: 'draft' | 'library'
  onConfirm: (meta: { name: string; description: string; jobType: string }) => void
  onCancel: () => void
}
function SaveDialog({ open, defaultName = '', mode, onConfirm, onCancel }: SaveDialogProps) {
  const [name, setName]           = useState(defaultName)
  const [description, setDesc]    = useState('')
  const [jobType, setJobType]     = useState('Resume Builder')
  useEffect(() => { if (open) setName(defaultName) }, [open, defaultName])
  if (!open) return null
  const isLib = mode === 'library'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {isLib ? <Upload className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {isLib ? 'Save to My Resumes' : 'Save Draft'}
          </h2>
          <p className="text-emerald-100 text-sm mt-1">
            {isLib ? 'Add this resume to your library' : 'Save your current progress'}
          </p>
        </div>
        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Resume Name <span className="text-red-500">*</span></label>
            <input
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="e.g. Software Engineer Resume"
              value={name} onChange={e => setName(e.target.value)}
            />
          </div>
          {isLib && (
            <>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                  placeholder="Brief description of this resume..."
                  rows={2}
                  value={description} onChange={e => setDesc(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Target Role / Job Type</label>
                <input
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="e.g. Frontend Developer, Data Analyst"
                  value={jobType} onChange={e => setJobType(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button
            size="sm"
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
            disabled={!name.trim()}
            onClick={() => onConfirm({ name: name.trim(), description: description.trim(), jobType: jobType.trim() || 'Resume Builder' })}
          >
            {isLib ? <><Upload className="w-4 h-4 mr-1.5" />Save to Library</> : <><Save className="w-4 h-4 mr-1.5" />Save Draft</>}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Preview Toolbar ── Google-Docs-style formatting bar ───────────────────────
const FONTS = ['Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Trebuchet MS', 'Verdana']
const COLORS = ['#111827','#DC2626','#2563EB','#16A34A','#9333EA','#EA580C','#0891B2','#BE185D','#854D0E']

// ── Template system (types & data from shared lib) ──────────────────────────
export type { TemplateId, PlanTier } from '@/lib/resume-templates'
import { TEMPLATES, TIER_LEVEL } from '@/lib/resume-templates'
import type { TemplateId, PlanTier, TemplateMeta } from '@/lib/resume-templates'

// ── Template Mini Preview ─────────────────────────────────────────────────────
function TemplateMiniPreview({ tpl, size = 'sm' }: { tpl: TemplateMeta; size?: 'sm' | 'lg' }) {
  const VW = 220
  const VH = 300
  const displayW = size === 'lg' ? 220 : 76
  const displayH = size === 'lg' ? 300 : 104
  const hdrH = tpl.hasSidebar ? VH : 68
  const sideW = tpl.hasSidebar ? 72 : 0
  const isLight = (col: string) => col === '#fff' || col === '#ffffff' || col.toLowerCase() === '#f1f5f9' || col.toLowerCase() === '#f8fafc'
  const textFill = isLight(tpl.headerBg) ? 'rgba(17,24,39,0.85)' : 'rgba(255,255,255,0.92)'
  const sideTextFill = isLight(tpl.sidebarBg || tpl.headerBg) ? 'rgba(17,24,39,0.85)' : 'rgba(255,255,255,0.92)'
  const lineW = [160,110,140,160,90,125,100,145,115,160,80,135,120,155,95,140,105,150,85]
  const sideLineW = [54,44,50,40,52,38,48,42]
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width={displayW} height={displayH} style={{ display: 'block', flexShrink: 0, borderRadius: size === 'lg' ? 6 : 3, overflow: 'hidden' }}>
      <rect x={0} y={0} width={VW} height={VH} fill={tpl.bodyBg === '#fff' ? '#ffffff' : tpl.bodyBg} />
      {tpl.hasSidebar ? (
        <>
          <rect x={0} y={0} width={sideW} height={VH} fill={tpl.sidebarBg || tpl.headerBg} />
          <rect x={8} y={20} width={sideW - 16} height={11} fill={sideTextFill} rx={2} />
          <rect x={8} y={35} width={(sideW - 16) * 0.65} height={6} fill={tpl.accent} opacity={0.85} rx={1} />
          <rect x={8} y={50} width={sideW - 16} height={1} fill={'rgba(255,255,255,0.15)'} />
          {sideLineW.map((w, i) => <rect key={i} x={8} y={58 + i * 14} width={w} height={5} fill={sideTextFill} opacity={0.4} rx={1} />)}
          <rect x={sideW + 10} y={14} width={130} height={9} fill={'#d1d5db'} rx={2} />
          {lineW.map((w, i) => i < 16 && (
            <rect key={i} x={sideW + 10} y={30 + i * 17} width={w} height={i % 4 === 0 ? 7 : 5} fill={i % 4 === 0 ? '#d1d5db' : '#e5e7eb'} rx={1} />
          ))}
        </>
      ) : (
        <>
          <rect x={0} y={0} width={VW} height={hdrH} fill={tpl.headerBg} />
          <rect x={14} y={17} width={140} height={14} fill={textFill} rx={2} />
          <rect x={14} y={35} width={100} height={8} fill={tpl.accent} opacity={0.75} rx={1} />
          <rect x={14} y={50} width={175} height={5} fill={textFill} opacity={0.5} rx={1} />
          <rect x={14} y={hdrH - 5} width={VW - 28} height={3} fill={tpl.accent} opacity={0.55} rx={1} />
          {lineW.map((w, i) => (
            <rect key={i} x={14} y={hdrH + 10 + i * 15} width={w} height={i % 4 === 0 ? 7 : 5} fill={i % 4 === 0 ? '#d1d5db' : '#e5e7eb'} rx={1} />
          ))}
        </>
      )}
    </svg>
  )
}

// ── Import Walkthrough Modal ───────────────────────────────────────────────────
interface ImportWalkthroughProps {
  open: boolean
  initialFile?: File
  userTier: PlanTier
  currentLayout: TemplateId
  onClose: () => void
  onComplete: (data: ResumeData, title: string, jobType: string, description: string, layout: TemplateId) => void
}
function ImportWalkthroughModal({ open, initialFile, userTier, currentLayout, onClose, onComplete }: ImportWalkthroughProps) {
  type WStep = 'pick' | 'parsing' | 'details' | 'template'
  const [step, setStep] = useState<WStep>('pick')
  const [parseProgress, setParseProgress] = useState(0)
  const [parseStepIdx, setParseStepIdx] = useState(0)
  const [parsedData, setParsedData] = useState<ResumeData | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [jobType, setJobType] = useState('')
  const [description, setDescription] = useState('')
  const [selectedLayout, setSelectedLayout] = useState<TemplateId>(currentLayout)
  const [hoveredTpl, setHoveredTpl] = useState<TemplateId>(currentLayout)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const parsingRef = useRef(false)

  // Reset + auto-start when modal opens
  useEffect(() => {
    if (!open) return
    parsingRef.current = false
    setParseProgress(0)
    setParseStepIdx(0)
    setParsedData(null)
    setParseError(null)
    setTitle('')
    setJobType('')
    setDescription('')
    setSelectedLayout(currentLayout)
    setHoveredTpl(currentLayout)
    if (initialFile) {
      setStep('parsing')
      runParse(initialFile)
    } else {
      setStep('pick')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialFile])

  // Animate progress bar while parsing
  useEffect(() => {
    if (step !== 'parsing') return
    setParseProgress(0)
    setParseStepIdx(0)
    const iv = setInterval(() => {
      setParseStepIdx(s => Math.min(s + 1, PARSE_STEPS.length - 1))
      setParseProgress(p => Math.min(p + 100 / PARSE_STEPS.length, 92))
    }, 900)
    return () => clearInterval(iv)
  }, [step])

  const runParse = async (file: File) => {
    if (parsingRef.current) return
    parsingRef.current = true
    try {
      const token = localStorage.getItem('token')
      const form = new FormData()
      form.append('resume', file)
      const res = await axios.post(`${API_BASE_URL}/resume/import`, form, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      })
      if (res.data?.data) {
        const data = res.data.data as ResumeData
        setParsedData(data)
        const namePart = (data.name || '').trim()
        const rolePart = (data.experiences?.[0]?.jobTitle || '').trim()
        const generated = [namePart, rolePart].filter(Boolean).join(' – ')
        setTitle(generated ? `${generated} Resume` : '')
        setJobType(rolePart || '')
        setParseProgress(100)
        setTimeout(() => setStep('details'), 600)
      } else { throw new Error('No data') }
    } catch {
      setParseError('Failed to parse resume. Please try again.')
      setStep('pick')
    } finally {
      parsingRef.current = false
    }
  }

  const handleFilePick = (file: File) => {
    setParseError(null)
    setStep('parsing')
    runParse(file)
  }

  const stepNum = step === 'pick' ? 1 : step === 'parsing' ? 1 : step === 'details' ? 2 : 3
  const previewTpl = TEMPLATES.find(t => t.id === hoveredTpl) ?? TEMPLATES[0]

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden" style={{ maxHeight: '92vh' }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {step === 'parsing' ? '⟳' : stepNum}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {step === 'pick' && 'Upload Your Resume'}
                {step === 'parsing' && 'Analyzing Resume...'}
                {step === 'details' && 'Review Details'}
                {step === 'template' && 'Choose a Template'}
              </h2>
              {/* Step progress bar */}
              <div className="flex items-center gap-1 mt-1">
                {(['Step 1', 'Step 2', 'Step 3'] as const).map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-300 ${
                    i < stepNum - 1 ? 'w-12 bg-indigo-500' :
                    i === stepNum - 1 ? 'w-12 bg-indigo-400' : 'w-8 bg-gray-200'
                  }`} />
                ))}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 shrink-0">✕</button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Pick file step */}
          {step === 'pick' && (
            <div className="space-y-4">
              {parseError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{parseError}</div>
              )}
              <div
                className="border-2 border-dashed border-indigo-200 rounded-2xl p-10 flex flex-col items-center gap-4 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFilePick(f) }}
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-3xl">📄</div>
                <div className="text-center">
                  <p className="font-semibold text-gray-800">Drop your resume here</p>
                  <p className="text-sm text-gray-500 mt-1">or click to browse · PDF, DOC, DOCX up to 50 MB</p>
                </div>
                <button className="px-4 py-2 rounded-xl border border-indigo-300 text-indigo-700 text-sm font-medium hover:bg-indigo-50 transition-colors">Browse File</button>
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFilePick(f) }} />
            </div>
          )}

          {/* Parsing step */}
          {step === 'parsing' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-6">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-ping opacity-40" />
                <div className="absolute inset-0 rounded-full border-4 border-purple-300" style={{ animation: 'spin 2s linear infinite' }} />
                <div className="absolute inset-0 flex items-center justify-center text-4xl">{PARSE_STEPS[parseStepIdx]?.icon}</div>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800 text-lg">{PARSE_STEPS[parseStepIdx]?.text}</p>
                <p className="text-sm text-gray-500 mt-1">AI is extracting your resume data</p>
              </div>
              <div className="w-80 space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Processing...</span><span>{Math.round(parseProgress)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                    style={{ width: `${parseProgress}%` }} />
                </div>
              </div>
              <div className="flex gap-2">
                {PARSE_STEPS.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-all ${
                    i < parseStepIdx ? 'bg-indigo-400' : i === parseStepIdx ? 'bg-indigo-600 scale-125' : 'bg-gray-200'
                  }`} />
                ))}
              </div>
            </div>
          )}

          {/* Details step */}
          {step === 'details' && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500">AI has analyzed your resume. Review and adjust the details before building.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Resume Title <span className="text-red-400">*</span></label>
                  <input value={title} onChange={e => setTitle(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="e.g. John Smith – Software Engineer Resume" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Role / Job Type</label>
                  <input value={jobType} onChange={e => setJobType(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="e.g. Software Engineer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-gray-400 text-xs font-normal">(optional)</span></label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                    placeholder="Brief description of this resume..." />
                </div>
              </div>
            </div>
          )}

          {/* Template step */}
          {step === 'template' && (
            <div className="flex gap-4" style={{ minHeight: 420 }}>
              {/* Left: large preview */}
              <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl border border-gray-200 p-5 min-w-0 gap-4">
                <div className="shadow-xl rounded-lg overflow-hidden ring-1 ring-black/5">
                  <TemplateMiniPreview tpl={previewTpl} size="lg" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900">{previewTpl.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{previewTpl.desc}</p>
                  <div className="mt-1.5 h-1 w-16 rounded-full mx-auto" style={{ background: previewTpl.accent }} />
                </div>
              </div>
              {/* Right: scrollable template cards */}
              <div className="w-52 overflow-y-auto space-y-3 pr-1 shrink-0">
                {(['basic', 'pro', 'enterprise'] as PlanTier[]).map(tier => (
                  <div key={tier}>
                    <p className={`text-xs font-bold uppercase tracking-wider px-1 mb-2 ${
                      tier === 'basic' ? 'text-slate-500' : tier === 'pro' ? 'text-amber-600' : 'text-purple-600'
                    }`}>{tier === 'basic' ? '✓ Free' : tier === 'pro' ? '⭐ Pro' : '💎 Enterprise'}</p>
                    <div className="space-y-1.5">
                      {TEMPLATES.filter(t => t.tier === tier).map(tpl => {
                        const locked = TIER_LEVEL[tpl.tier] > TIER_LEVEL[userTier]
                        const active = selectedLayout === tpl.id
                        return (
                          <button key={tpl.id} disabled={locked}
                            onClick={() => { if (!locked) { setSelectedLayout(tpl.id); setHoveredTpl(tpl.id) } }}
                            onMouseEnter={() => setHoveredTpl(tpl.id)}
                            onMouseLeave={() => setHoveredTpl(selectedLayout)}
                            className={`w-full relative rounded-xl border-2 p-2 transition-all flex items-center gap-2.5 text-left ${
                              active ? 'border-indigo-500 bg-indigo-50' :
                              locked ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed' :
                                       'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                            }`}
                          >
                            <TemplateMiniPreview tpl={tpl} size="sm" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-900 truncate">{tpl.name}</p>
                              <p className="text-[10px] text-gray-500 leading-snug truncate">{tpl.desc}</p>
                              <div className="mt-1 h-0.5 w-8 rounded-full" style={{ background: tpl.accent }} />
                            </div>
                            {active && <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[9px] shrink-0">✓</div>}
                            {locked && (
                              <div className="absolute inset-0 rounded-xl bg-white/80 flex flex-col items-center justify-center gap-1">
                                <span className="text-sm">🔒</span>
                                <a href="/subscriptions" className="text-[10px] text-blue-500 underline" onClick={e => e.stopPropagation()}>Upgrade</a>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {step !== 'parsing' && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 shrink-0">
            <button
              onClick={() => {
                if (step === 'pick') onClose()
                else if (step === 'details') setStep('pick')
                else if (step === 'template') setStep('details')
              }}
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              {step === 'pick' ? 'Cancel' : '← Back'}
            </button>
            {step === 'details' && (
              <button
                disabled={!title.trim()}
                onClick={() => setStep('template')}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >Choose Template →</button>
            )}
            {step === 'template' && (
              <button
                onClick={() => { if (parsedData) onComplete(parsedData, title, jobType, description, selectedLayout) }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
              >✨ Build My Resume</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Template Picker Modal (standalone, two-column) ─────────────────────────────
function TemplatePickerModal({ open, onClose, current, userTier, onSelect }: {
  open: boolean; onClose: () => void; current: TemplateId; userTier: PlanTier
  onSelect: (id: TemplateId) => void
}) {
  const [hovered, setHovered] = useState<TemplateId>(current)
  useEffect(() => { if (open) setHovered(current) }, [open, current])
  const previewTpl = TEMPLATES.find(t => t.id === hovered) ?? TEMPLATES[0]
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden" style={{ maxHeight: '88vh' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Choose Template</h2>
            <p className="text-xs text-gray-500 mt-0.5">Select a design for your resume preview &amp; export</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">✕</button>
        </div>
        <div className="flex gap-0 flex-1 overflow-hidden">
          {/* Left: large preview */}
          <div className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100 p-8 gap-4 shrink-0" style={{ width: 280 }}>
            <div className="shadow-xl rounded-lg overflow-hidden ring-1 ring-black/5">
              <TemplateMiniPreview tpl={previewTpl} size="lg" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900">{previewTpl.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{previewTpl.desc}</p>
              <div className="mt-1.5 h-1 w-16 rounded-full mx-auto" style={{ background: previewTpl.accent }} />
            </div>
            <button
              onClick={() => { onSelect(hovered); onClose() }}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
            >Use This Template</button>
          </div>
          {/* Right: template cards grid */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {(['basic', 'pro', 'enterprise'] as PlanTier[]).map(tier => (
              <div key={tier}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full ${
                    tier === 'basic' ? 'bg-slate-100 text-slate-600' :
                    tier === 'pro'   ? 'bg-amber-100 text-amber-700' :
                                      'bg-purple-100 text-purple-700'
                  }`}>{tier === 'basic' ? '✓ Free' : tier === 'pro' ? '⭐ Pro' : '💎 Enterprise'}</span>
                  {TIER_LEVEL[tier] > TIER_LEVEL[userTier] && <span className="text-xs text-gray-400">Upgrade to unlock</span>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.filter(t => t.tier === tier).map(tpl => {
                    const locked = TIER_LEVEL[tpl.tier] > TIER_LEVEL[userTier]
                    const active = current === tpl.id
                    return (
                      <button key={tpl.id} disabled={locked}
                        onClick={() => { if (!locked) { onSelect(tpl.id); onClose() } }}
                        onMouseEnter={() => setHovered(tpl.id)}
                        onMouseLeave={() => setHovered(current)}
                        className={`relative rounded-xl border-2 p-3 flex items-center gap-3 text-left transition-all ${
                          active  ? 'border-indigo-500 bg-indigo-50' :
                          locked  ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed' :
                                    'border-gray-200 hover:border-indigo-400 hover:shadow-sm'
                        }`}
                      >
                        <TemplateMiniPreview tpl={tpl} size="sm" />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{tpl.name}</p>
                          <p className="text-xs text-gray-500 leading-snug truncate">{tpl.desc}</p>
                          <div className="mt-1.5 h-0.5 w-10 rounded-full" style={{ background: tpl.accent }} />
                        </div>
                        {active && <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs shrink-0">✓</div>}
                        {locked && (
                          <div className="absolute inset-0 rounded-xl bg-white/85 flex flex-col items-center justify-center gap-1">
                            <span className="text-xl">🔒</span>
                            <a href="/subscriptions" className="text-xs text-blue-500 underline" onClick={e => e.stopPropagation()}>Upgrade →</a>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
function PreviewToolbar() {
  const [showColors, setShowColors] = useState(false)
  const [showFonts,  setShowFonts]  = useState(false)
  const [fontSize,   setFontSize]   = useState(12)
  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val)
  }
  const insertLink = () => {
    const url = window.prompt('Enter URL:', 'https://')
    if (url) exec('createLink', url)
  }
  const insertImage = () => {
    const url = window.prompt('Enter image URL:', 'https://')
    if (url) exec('insertImage', url)
  }
  const changeFontSize = (delta: number) => {
    const next = Math.min(28, Math.max(7, fontSize + delta))
    setFontSize(next)
    // execCommand fontSize only accepts 1-7, so use styleWithCSS
    document.execCommand('styleWithCSS', false, 'true')
    document.execCommand('fontSize', false, '3')
    // Then patch the just-created font tag
    const sel = window.getSelection()
    if (sel && sel.anchorNode) {
      const el = (sel.anchorNode as Element).closest?.('font') as HTMLElement | null
      if (el) { el.removeAttribute('size'); el.style.fontSize = `${next}px` }
    }
  }
  const TBtn = ({
    onClick, title, active, children,
  }: { onClick: () => void; title: string; active?: boolean; children: React.ReactNode }) => (
    <button
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={`px-1.5 py-1 rounded text-sm transition-colors ${
        active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >{children}</button>
  )
  const Sep = () => <div className="w-px bg-gray-200 mx-0.5 self-stretch" />
  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-white border-b border-gray-200 text-xs select-none relative">
      {/* Font family */}
      <div className="relative">
        <button
          onMouseDown={e => { e.preventDefault(); setShowFonts(v => !v); setShowColors(false) }}
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 text-gray-700 text-xs"
        >
          <Type className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Font</span>
          <span className="text-gray-400">▾</span>
        </button>
        {showFonts && (
          <div className="absolute top-full left-0 z-50 mt-0.5 bg-white border rounded-lg shadow-xl py-1 min-w-40">
            {FONTS.map(f => (
              <button key={f} className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-sm" style={{ fontFamily: f }}
                onMouseDown={e => { e.preventDefault(); exec('fontName', f); setShowFonts(false) }}>{f}</button>
            ))}
          </div>
        )}
      </div>
      <Sep />
      {/* Font size */}
      <div className="flex items-center gap-0.5">
        <TBtn onClick={() => changeFontSize(-1)} title="Decrease font size"><Minus className="w-3 h-3" /></TBtn>
        <span className="text-xs text-gray-600 w-6 text-center">{fontSize}</span>
        <TBtn onClick={() => changeFontSize(1)} title="Increase font size"><PlusIcon className="w-3 h-3" /></TBtn>
      </div>
      <Sep />
      {/* Text formatting */}
      <TBtn onClick={() => exec('bold')} title="Bold (Ctrl+B)"><Bold className="w-3.5 h-3.5" /></TBtn>
      <TBtn onClick={() => exec('italic')} title="Italic (Ctrl+I)"><Italic className="w-3.5 h-3.5" /></TBtn>
      <TBtn onClick={() => exec('underline')} title="Underline (Ctrl+U)"><Underline className="w-3.5 h-3.5" /></TBtn>
      <Sep />
      {/* Color */}
      <div className="relative">
        <button
          onMouseDown={e => { e.preventDefault(); setShowColors(v => !v); setShowFonts(false) }}
          title="Text color"
          className="p-1 rounded hover:bg-gray-100"
        >
          <Palette className="w-3.5 h-3.5 text-gray-600" />
        </button>
        {showColors && (
          <div className="absolute top-full left-0 z-50 mt-0.5 bg-white border rounded-lg shadow-xl p-2 grid grid-cols-3 gap-1.5">
            {COLORS.map(c => (
              <button key={c} className="w-6 h-6 rounded-full border-2 border-white hover:scale-110 transition-transform shadow"
                style={{ background: c }}
                onMouseDown={e => { e.preventDefault(); exec('foreColor', c); setShowColors(false) }}
              />
            ))}
          </div>
        )}
      </div>
      <Sep />
      {/* Alignment */}
      <TBtn onClick={() => exec('justifyLeft')} title="Align left"><AlignLeft className="w-3.5 h-3.5" /></TBtn>
      <TBtn onClick={() => exec('justifyCenter')} title="Align center"><AlignCenter className="w-3.5 h-3.5" /></TBtn>
      <TBtn onClick={() => exec('justifyRight')} title="Align right"><AlignRight className="w-3.5 h-3.5" /></TBtn>
      <Sep />
      {/* Indent */}
      <TBtn onClick={() => exec('indent')} title="Increase indent"><Indent className="w-3.5 h-3.5" /></TBtn>
      <TBtn onClick={() => exec('outdent')} title="Decrease indent"><Outdent className="w-3.5 h-3.5" /></TBtn>
      <Sep />
      {/* Insert */}
      <TBtn onClick={insertLink} title="Insert link"><Link2 className="w-3.5 h-3.5" /></TBtn>
      <TBtn onClick={insertImage} title="Insert image"><ImageIcon className="w-3.5 h-3.5" /></TBtn>
      <TBtn onClick={() => exec('insertHorizontalRule')} title="Insert divider"><Minus className="w-3.5 h-3.5" /></TBtn>
      <Sep />
      {/* List */}
      <TBtn onClick={() => exec('insertUnorderedList')} title="Bullet list">• List</TBtn>
      <TBtn onClick={() => exec('insertOrderedList')} title="Numbered list">1. List</TBtn>
    </div>
  )
}

export default function ResumeBuilderFormV2({ onSavedToLibrary, initialState, initialLayout, initialTitle, autoImportFile, freshStart }: ResumeBuilderFormV2Props = {}) {
  const [resumeData, setResumeData] = useState<ResumeData>({
    name: '',
    location: '',
    phone: '',
    email: '',
    website: '',
    objective: '',
    experiences: [{ id: '1', company: '', jobTitle: '', date: '', description: '' }],
    education: [{ id: '1', school: '', degree: '', gpa: '', date: '', additionalInfo: '' }],
    projects: [{ id: '1', name: '', link: '', date: '', description: '' }],
    skills: '',
    featuredSkills: [
      { name: '', level: 3 },
      { name: '', level: 3 },
      { name: '', level: 3 },
    ],
  })

  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingToLibrary, setUploadingToLibrary] = useState(false)
  const [librarySaveStatus, setLibrarySaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [layout, setLayout] = useState<TemplateId>(initialLayout ?? 'classic')
  const [userTier, setUserTier] = useState<PlanTier>('basic')
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [resumeTitle, setResumeTitle] = useState('')
  // Save dialog
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saveDialogMode, setSaveDialogMode] = useState<'draft' | 'library'>('library')

  // Populate title from prop (e.g. when re-opening a saved builder resume)
  useEffect(() => {
    if (initialTitle) setResumeTitle(initialTitle)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTitle])

  // Fetch user subscription tier
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    axios.get(`${API_BASE_URL}/users/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const planName: string = ((res.data?.subscription?.plan_name as string) || '').toLowerCase()
        if (planName.includes('enterprise')) setUserTier('enterprise')
        else if (planName.includes('pro') || planName.includes('premium') || planName.includes('plus')) setUserTier('pro')
        else setUserTier('basic')
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  type RefData = {
    college: string[]; university: string[]; branch: string[]
    skill: string[]; location: string[]; company: string[]
  }
  const [refData, setRefData] = useState<RefData>({
    college: [], university: [], branch: [], skill: [], location: [], company: [],
  })
  useEffect(() => {
    const token = localStorage.getItem('token')
    axios.get(`${API_BASE_URL}/ref-data/all`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { if (res.data) setRefData(res.data as RefData) })
      .catch(() => {})
  }, [])
  const previewRef  = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [previewScale, setPreviewScale] = useState(1)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasLoaded = useRef(false)
  const importRef = useRef<HTMLInputElement>(null) // kept for compat, unused
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [importing, setImporting] = useState(false) // kept for importResumeFile compat
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Import walkthrough modal
  const [importWalkthroughOpen, setImportWalkthroughOpen] = useState(false)
  const [importWalkthroughFile, setImportWalkthroughFile] = useState<File | undefined>(undefined)

  // GitHub repos
  const [hasGithub, setHasGithub] = useState(false)
  const [githubUsername, setGithubUsername] = useState<string | null>(null)
  const [githubRepos, setGithubRepos] = useState<Array<{ name: string; html_url: string; description: string | null; language: string | null; stargazers_count: number }>>( [])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [showGithubImport, setShowGithubImport] = useState(false)

  // Suggestions modal state
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [suggestionField, setSuggestionField] = useState<string>('')
  const [suggestionIndex, setSuggestionIndex] = useState<number | undefined>(undefined)
  const [suggestionExisting, setSuggestionExisting] = useState<string | undefined>(undefined)
  const [suggestionContext, setSuggestionContext] = useState<Record<string, unknown> | undefined>(undefined)

  // Responsive preview scaling — fit A4 (794px) into the available panel width
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const avail = el.clientWidth - 32  // 16px padding each side
      setPreviewScale(Math.min(1, Math.max(0.3, avail / A4_W)))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Load saved state on mount
  useEffect(() => {
    loadState()
  }, [])

  // Debounced auto-save — fires 2.5s after any resumeData change
  useEffect(() => {
    if (!hasLoaded.current) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      try {
        setAutoSaveStatus('saving')
        const token = localStorage.getItem('token')
        await axios.post(
          `${API_BASE_URL}/resume/builder`,
          { state: resumeData },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setAutoSaveStatus('saved')
        setTimeout(() => setAutoSaveStatus('idle'), 2500)
      } catch {
        setAutoSaveStatus('idle')
      }
    }, 2500)
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [resumeData])

  const loadState = async () => {
    // If an explicit initial state was passed (e.g. opened from CV library), use it directly
    if (initialState) {
      setResumeData(initialState)
      setTimeout(() => { hasLoaded.current = true }, 500)
      return
    }
    // If the caller is providing a file to auto-import OR has flagged a fresh start,
    // don't restore any old draft — importResumeFile will populate the form.
    if (autoImportFile || freshStart) {
      try {
        const token = localStorage.getItem('token')
        const prefillRes = await axios.get(`${API_BASE_URL}/resume/profile-prefill`, { headers: { Authorization: `Bearer ${token}` } })
        const pd = prefillRes.data
        setHasGithub(pd.hasGithub || false)
        setGithubUsername(pd.githubUsername || null)
      } catch { /* ignore */ }
      setTimeout(() => { hasLoaded.current = true }, 500)
      return
    }
    try {
      const token = localStorage.getItem('token')
      const [builderRes, prefillRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/resume/builder`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/resume/profile-prefill`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      // Stash github status regardless
      if (prefillRes.status === 'fulfilled') {
        const pd = prefillRes.value.data
        setHasGithub(pd.hasGithub || false)
        setGithubUsername(pd.githubUsername || null)
      }

      const response = builderRes.status === 'fulfilled' ? builderRes.value : null
      if (response && response.data.state) {
        // Existing saved draft — restore it
        setResumeData(response.data.state)
      } else if (prefillRes.status === 'fulfilled') {
        // No saved state — pre-fill from profile
        const pd = prefillRes.value.data.prefill
        setResumeData(prev => ({
          ...prev,
          name: pd.name || prev.name,
          email: pd.email || prev.email,
          phone: pd.phone || prev.phone,
          location: pd.location || prev.location,
          website: pd.website || prev.website,
          skills: pd.skills || prev.skills,
          objective: pd.objective || prev.objective,
          education: pd.education || prev.education,
          experiences: pd.experiences || prev.experiences,
        }))
      }
    } catch (error) {
      console.error('Failed to load resume state:', error)
    } finally {
      // Allow auto-save to fire only after initial load completes
      setTimeout(() => { hasLoaded.current = true }, 500)
    }
  }

  // Open save dialog
  const openSaveDialog = (mode: 'draft' | 'library') => {
    setSaveDialogMode(mode)
    setSaveDialogOpen(true)
  }

  const handleSaveConfirm = async (meta: { name: string; description: string; jobType: string }) => {
    setSaveDialogOpen(false)
    if (saveDialogMode === 'draft') {
      await saveState(meta.name)
    } else {
      await saveToLibrary(meta)
    }
  }

  const saveState = async (titleOverride?: string) => {
    try {
      setSaving(true)
      if (titleOverride) setResumeTitle(titleOverride)
      const token = localStorage.getItem('token')
      await axios.post(
        `${API_BASE_URL}/resume/builder`,
        { state: resumeData },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setAutoSaveStatus('saved')
      setTimeout(() => setAutoSaveStatus('idle'), 2500)
    } catch (error) {
      console.error('Failed to save resume:', error)
    } finally {
      setSaving(false)
    }
  }

  const generateField = async (fieldName: string, sectionType?: string, index?: number) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${API_BASE_URL}/resume/autofill`,
        { fieldName, sectionType, index },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const data = response.data
      
      // Update the specific field with AI-generated content
      if (fieldName === 'objective' && data.summary) {
        setResumeData(prev => ({ ...prev, objective: data.summary }))
      } else if (fieldName === 'skills' && data.skills) {
        setResumeData(prev => ({ ...prev, skills: data.skills.join(', ') }))
      } else if (sectionType === 'experience' && data.experience && data.experience[0]) {
        const exp = data.experience[0].split('\n')[0]
        setResumeData(prev => {
          const newExperiences = [...prev.experiences]
          if (index !== undefined && newExperiences[index]) {
            newExperiences[index].description = exp
          }
          return { ...prev, experiences: newExperiences }
        })
      } else if (sectionType === 'education' && data.education && data.education[0]) {
        const edu = data.education[0]
        setResumeData(prev => {
          const newEducation = [...prev.education]
          if (index !== undefined && newEducation[index]) {
            newEducation[index].additionalInfo = edu
          }
          return { ...prev, education: newEducation }
        })
      } else if (sectionType === 'project' && data.projects && data.projects[0]) {
        const proj = data.projects[0]
        setResumeData(prev => {
          const newProjects = [...prev.projects]
          if (index !== undefined && newProjects[index]) {
            newProjects[index].description = proj
          }
          return { ...prev, projects: newProjects }
        })
      }
    } catch (error) {
      console.error('Failed to generate content:', error)
      alert('Failed to generate AI content. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Open suggestions modal for a field
  const openSuggestions = (field: string, index?: number) => {
    let existing = ''
    if (field === 'skills') existing = resumeData.skills
    else if (field === 'objective') existing = resumeData.objective
    else if (field === 'experience') existing = resumeData.experiences?.[index || 0]?.description || ''
    else if (field === 'education') existing = resumeData.education?.[index || 0]?.additionalInfo || ''
    else if (field === 'project') existing = resumeData.projects?.[index || 0]?.description || ''

    setSuggestionField(field)
    setSuggestionIndex(index)
    setSuggestionExisting(existing)

    // attach field-specific object context for better placeholder filling
    if (field === 'experience') setSuggestionContext(resumeData.experiences?.[index || 0] as unknown as Record<string, unknown> | undefined)
    else if (field === 'education') setSuggestionContext(resumeData.education?.[index || 0] as unknown as Record<string, unknown> | undefined)
    else if (field === 'project') setSuggestionContext(resumeData.projects?.[index || 0] as unknown as Record<string, unknown> | undefined)
    else setSuggestionContext(undefined)

    setSuggestionsOpen(true)
  }

  const applySuggestion = (text: string) => {
    const field = suggestionField
    const index = suggestionIndex
    if (field === 'skills') setResumeData(prev => ({ ...prev, skills: text }))
    else if (field === 'objective') setResumeData(prev => ({ ...prev, objective: text }))
    else if (field === 'experience' && typeof index === 'number') {
      setResumeData(prev => {
        const newExperiences = [...prev.experiences]
        if (newExperiences[index]) newExperiences[index].description = text
        return { ...prev, experiences: newExperiences }
      })
    } else if (field === 'education' && typeof index === 'number') {
      setResumeData(prev => {
        const newEducation = [...prev.education]
        if (newEducation[index]) newEducation[index].additionalInfo = text
        return { ...prev, education: newEducation }
      })
    } else if (field === 'project' && typeof index === 'number') {
      setResumeData(prev => {
        const newProjects = [...prev.projects]
        if (newProjects[index]) newProjects[index].description = text
        return { ...prev, projects: newProjects }
      })
    }

    setSuggestionsOpen(false)
  }

  const addExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experiences: [...prev.experiences, { id: Date.now().toString(), company: '', jobTitle: '', date: '', description: '' }],
    }))
  }

  const removeExperience = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      experiences: prev.experiences.filter(exp => exp.id !== id),
    }))
  }

  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, { id: Date.now().toString(), school: '', degree: '', gpa: '', date: '', additionalInfo: '' }],
    }))
  }

  const removeEducation = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id),
    }))
  }

  const addProject = () => {
    setResumeData(prev => ({
      ...prev,
      projects: [...prev.projects, { id: Date.now().toString(), name: '', link: '', date: '', description: '' }],
    }))
  }

  const removeProject = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.filter(proj => proj.id !== id),
    }))
  }

  /** Capture the HTML preview as a multi-page PDF and trigger download */
  const exportPdf = async () => {
    const el = previewRef.current
    if (!el) { alert('Preview not ready — please wait a moment.'); return }
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', width: A4_W, windowWidth: A4_W })
      const pdf = new jsPDF('p', 'pt', 'a4')
      const pw = pdf.internal.pageSize.getWidth()   // 595.28 pt
      const ph = pdf.internal.pageSize.getHeight()  // 841.89 pt
      // How many canvas pixels map to one PDF point
      const pxPerPt  = canvas.width / pw              // ≈ 2.667  (scale=2)
      const pgHeightPx = ph * pxPerPt                 // canvas pixels per A4 page
      const totalPages = Math.ceil(canvas.height / pgHeightPx)
      for (let p = 0; p < totalPages; p++) {
        if (p > 0) pdf.addPage()
        const srcY  = Math.round(p * pgHeightPx)
        const srcH  = Math.min(pgHeightPx, canvas.height - srcY)
        // Crop this page into a fresh canvas
        const page  = document.createElement('canvas')
        page.width  = canvas.width
        page.height = Math.round(pgHeightPx)
        const ctx   = page.getContext('2d')!
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, page.width, page.height)
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH)
        pdf.addImage(page.toDataURL('image/png'), 'PNG', 0, 0, pw, ph)
      }
      pdf.save(`${(resumeData.name || 'Resume').replace(/[^a-zA-Z0-9 _-]/g, '')}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
      alert('Failed to export PDF. Please try again.')
    }
  }

  /** Build PDF blob from the HTML preview (used by saveToLibrary) */
  const buildPdfBlob = async (): Promise<Blob> => {
    const el = previewRef.current
    if (!el) return new Blob()
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', width: A4_W, windowWidth: A4_W })
    const pdf = new jsPDF('p', 'pt', 'a4')
    const pw = pdf.internal.pageSize.getWidth()
    const ph = pdf.internal.pageSize.getHeight()
    const pxPerPt    = canvas.width / pw
    const pgHeightPx = ph * pxPerPt
    const totalPages = Math.ceil(canvas.height / pgHeightPx)
    for (let p = 0; p < totalPages; p++) {
      if (p > 0) pdf.addPage()
      const srcY  = Math.round(p * pgHeightPx)
      const srcH  = Math.min(pgHeightPx, canvas.height - srcY)
      const page  = document.createElement('canvas')
      page.width  = canvas.width
      page.height = Math.round(pgHeightPx)
      const ctx   = page.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, page.width, page.height)
      ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH)
      pdf.addImage(page.toDataURL('image/png'), 'PNG', 0, 0, pw, ph)
    }
    return pdf.output('blob')
  }

  // ── GitHub helpers ─────────────────────────────────────────────
  const fetchGithubRepos = useCallback(async () => {
    setLoadingRepos(true)
    try {
      const token = localStorage.getItem('token')
      const params = githubUsername ? `?username=${encodeURIComponent(githubUsername)}` : ''
      const res = await axios.get(`${API_BASE_URL}/resume/github-projects${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setGithubRepos(res.data.projects || [])
      setShowGithubImport(true)
    } catch (err) {
      console.error('Failed to fetch GitHub repos:', err)
    } finally {
      setLoadingRepos(false)
    }
  }, [githubUsername])

  const insertGithubRepo = (repo: { name: string; html_url: string; description: string | null; language: string | null }) => {
    const newProj = {
      id: Date.now().toString(),
      name: repo.name,
      link: repo.html_url,
      date: '',
      description: repo.description || (repo.language ? `Built with ${repo.language}.` : ''),
    }
    setResumeData(prev => ({ ...prev, projects: [...prev.projects, newProj] }))
    setShowGithubImport(false)
  }
  // ───────────────────────────────────────────────────────────────

  const importResumeFile = async (file: File) => {
    setImporting(true)
    setImportStatus('idle')
    try {
      const token = localStorage.getItem('token')
      const form = new FormData()
      form.append('resume', file)
      const res = await axios.post(`${API_BASE_URL}/resume/import`, form, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      })
      if (res.data?.data) {
        const data = res.data.data as ResumeData
        setResumeData(data)
        // AI-generated title: "Name – Job Title Resume" (editable in toolbar)
        const namePart    = (data.name || '').trim()
        const rolePart    = (data.experiences?.[0]?.jobTitle || '').trim()
        const generated   = [namePart, rolePart].filter(Boolean).join(' – ')
        const finalTitle  = generated ? `${generated} Resume` : ''
        if (finalTitle) setResumeTitle(finalTitle)
        setImportStatus('success')
        setTimeout(() => setImportStatus('idle'), 3000)
      } else {
        throw new Error('No data returned')
      }
    } catch (err: unknown) {
      console.error('Import failed:', err)
      setImportStatus('error')
      setTimeout(() => setImportStatus('idle'), 4000)
    } finally {
      setImporting(false)
    }
  }

  // Auto-import file passed from CV page “Improve with Resume Builder” flow
  useEffect(() => {
    if (autoImportFile) {
      setImportWalkthroughFile(autoImportFile)
      setImportWalkthroughOpen(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoImportFile])
  // If freshStart but no file (sessionStorage quota exceeded) - open walkthrough to let user re-upload
  useEffect(() => {
    if (freshStart && !autoImportFile) {
      setImportWalkthroughFile(undefined)
      setImportWalkthroughOpen(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const importResume = () => {
    setImportWalkthroughFile(undefined)
    setImportWalkthroughOpen(true)
  }

  const saveToLibrary = async (meta?: { name: string; description: string; jobType: string }) => {
    setUploadingToLibrary(true)
    setLibrarySaveStatus('idle')
    try {
      const token = localStorage.getItem('token')
      // 1. Auto-save builder state
      await axios.post(`${API_BASE_URL}/resume/builder`, { state: resumeData }, { headers: { Authorization: `Bearer ${token}` } })

      // 2. Generate PDF blob
      const blob = await buildPdfBlob()
      const safeName = (meta?.name || resumeTitle || resumeData.name || 'Resume').replace(/[^a-zA-Z0-9_-\s]/g, '').trim() || 'Resume'
      const file = new File([blob], `${safeName}.pdf`, { type: 'application/pdf' })

      // 3. Upload to cv_documents with user-supplied metadata
      const form = new FormData()
      form.append('cv', file)
      form.append('resume_name', safeName)
      form.append('description', meta?.description || `Created with Resume Builder (${layout} layout)`)
      form.append('job_type', meta?.jobType || 'Resume Builder')

      const uploadRes = await axios.post(`${API_BASE_URL}/cv/upload`, form, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      })

      const savedCvId = uploadRes.data?.cv?.cv_id
      if (savedCvId) {
        try {
          sessionStorage.setItem(`rb_state_${savedCvId}`, JSON.stringify(resumeData))
          sessionStorage.setItem(`rb_title_${savedCvId}`, meta?.name || safeName)
        } catch { /* ignore quota errors */ }
      }

      setLibrarySaveStatus('success')
      onSavedToLibrary?.()
      setTimeout(() => setLibrarySaveStatus('idle'), 3000)
    } catch (err) {
      console.error('Failed to save to library:', err)
      setLibrarySaveStatus('error')
      setTimeout(() => setLibrarySaveStatus('idle'), 3000)
    } finally {
      setUploadingToLibrary(false)
    }
  }

  /** Render the resume as styled HTML inside an A4-dimensioned div.
   *  All text nodes are wrapped with InlineEdit / BlockEdit so the user
   *  can click any field to edit it directly in the preview. */
  const renderHTMLPreview = () => {

    // ── MINIMAL ────────────────────────────────────────────────────────────────
    if (layout === 'minimal') {
      const MS = ({ label }: { label: string }) => (
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#555', marginBottom: 7 }}>{label}</div>
      )
      return (
        <div style={{ width: A4_W, minHeight: A4_H, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 11, background: '#fff', padding: '48px 52px', boxSizing: 'border-box' as const, color: '#111' }}>
          <InlineEdit value={resumeData.name || 'Your Name'} onChange={v => setResumeData(p => ({...p, name: v}))} style={{ fontSize: 26, fontWeight: 300, letterSpacing: '0.04em', display: 'block', color: '#000', marginBottom: 6 }} />
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '3px 14px', fontSize: 9.5, color: '#666', marginBottom: 18 }}>
            {(['email','phone','location','website'] as const).filter(f => (resumeData as unknown as Record<string,string>)[f]).map(f => (
              <InlineEdit key={f} value={(resumeData as unknown as Record<string,string>)[f]} onChange={v => setResumeData(p => ({...p, [f]: v}))} />
            ))}
          </div>
          <div style={{ height: 0.5, background: '#888', marginBottom: 20 }} />
          {resumeData.objective && (<><MS label="Summary" /><BlockEdit value={resumeData.objective} onChange={v => setResumeData(p => ({...p, objective: v}))} style={{ fontSize: 10.5, lineHeight: 1.75, color: '#333', marginBottom: 16 }} /></>)}
          {resumeData.experiences.some(e => e.company || e.jobTitle) && (<>
            <MS label="Experience" />
            {resumeData.experiences.filter(e => e.company || e.jobTitle).map((exp, i) => (
              <div key={i} style={{ marginBottom: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <InlineEdit value={exp.company} onChange={v => { const n=[...resumeData.experiences]; n[i].company=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 12, fontWeight: 600 }} />
                  <InlineEdit value={exp.date} onChange={v => { const n=[...resumeData.experiences]; n[i].date=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 9.5, color: '#888' }} />
                </div>
                <InlineEdit value={exp.jobTitle} onChange={v => { const n=[...resumeData.experiences]; n[i].jobTitle=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 10, color: '#444', display: 'block', marginBottom: 3 }} />
                <BlockEdit value={exp.description} onChange={v => { const n=[...resumeData.experiences]; n[i].description=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 10.5, color: '#333', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const }} />
              </div>
            ))}
            <div style={{ height: 0.5, background: '#ccc', margin: '4px 0 14px' }} />
          </>)}
          {resumeData.education.some(e => e.school) && (<>
            <MS label="Education" />
            {resumeData.education.filter(e => e.school).map((edu, i) => (
              <div key={i} style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <InlineEdit value={edu.school} onChange={v => { const n=[...resumeData.education]; n[i].school=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 12, fontWeight: 600 }} />
                  <InlineEdit value={`${edu.degree}${edu.gpa ? ' · ' + edu.gpa : ''}`} onChange={v => { const n=[...resumeData.education]; n[i].degree=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 10, color: '#555', display: 'block', marginTop: 1 }} />
                </div>
                <InlineEdit value={edu.date} onChange={v => { const n=[...resumeData.education]; n[i].date=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 9.5, color: '#888', flexShrink: 0, marginLeft: 8 }} />
              </div>
            ))}
            <div style={{ height: 0.5, background: '#ccc', margin: '4px 0 14px' }} />
          </>)}
          {resumeData.projects.some(pr => pr.name) && (<>
            <MS label="Projects" />
            {resumeData.projects.filter(pr => pr.name).map((proj, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <InlineEdit value={proj.name} onChange={v => { const n=[...resumeData.projects]; n[i].name=v; setResumeData(p=>({...p,projects:n})) }} style={{ fontSize: 11, fontWeight: 600 }} />
                <BlockEdit value={proj.description} onChange={v => { const n=[...resumeData.projects]; n[i].description=v; setResumeData(p=>({...p,projects:n})) }} style={{ fontSize: 10.5, color: '#444', lineHeight: 1.65, whiteSpace: 'pre-wrap' as const }} />
              </div>
            ))}
            <div style={{ height: 0.5, background: '#ccc', margin: '4px 0 14px' }} />
          </>)}
          {resumeData.skills && (<><MS label="Skills" /><BlockEdit value={resumeData.skills} onChange={v => setResumeData(p => ({...p, skills: v}))} style={{ fontSize: 10.5, color: '#333', lineHeight: 1.7 }} /></>)}
        </div>
      )
    }

    // ── CREATIVE (Pro) ─────────────────────────────────────────────────────────
    if (layout === 'creative') {
      const CHead = ({ label }: { label: string }) => (
        <div style={{ marginTop: 18, marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#0D9488' }}>{label}</div>
          <div style={{ height: 2, background: 'linear-gradient(90deg,#0D9488,#0891B2)', borderRadius: 2, marginTop: 4, width: '100%' }} />
        </div>
      )
      return (
        <div style={{ width: A4_W, minHeight: A4_H, fontFamily: "'Arial', sans-serif", fontSize: 11, background: '#fff' }}>
          <div style={{ background: 'linear-gradient(135deg,#0D9488 0%,#0891B2 100%)', padding: '32px 40px 24px' }}>
            <InlineEdit value={resumeData.name || 'Your Name'} onChange={v => setResumeData(p => ({...p, name: v}))} style={{ fontSize: 30, fontWeight: 800, display: 'block', color: '#fff', letterSpacing: '-0.01em', marginBottom: 8 }} />
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px 18px', fontSize: 10, color: 'rgba(255,255,255,0.88)' }}>
              {(['email','phone','location','website'] as const).filter(f => (resumeData as unknown as Record<string,string>)[f]).map(f => (
                <InlineEdit key={f} value={(resumeData as unknown as Record<string,string>)[f]} onChange={v => setResumeData(p => ({...p, [f]: v}))} style={{ color: 'rgba(255,255,255,0.88)' }} />
              ))}
            </div>
          </div>
          <div style={{ padding: '20px 40px 36px', boxSizing: 'border-box' as const }}>
            {resumeData.objective && (<><CHead label="About Me" /><BlockEdit value={resumeData.objective} onChange={v => setResumeData(p => ({...p, objective: v}))} style={{ fontSize: 11, color: '#374151', lineHeight: 1.7 }} /></>)}
            {resumeData.experiences.some(e => e.company || e.jobTitle) && (<><CHead label="Experience" />
              {resumeData.experiences.filter(e => e.company || e.jobTitle).map((exp, i) => (
                <div key={i} style={{ marginBottom: 14, paddingLeft: 12, borderLeft: '3px solid #CCFBF1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <InlineEdit value={exp.company} onChange={v => { const n=[...resumeData.experiences]; n[i].company=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 13, fontWeight: 700, color: '#111827' }} />
                    <InlineEdit value={exp.date} onChange={v => { const n=[...resumeData.experiences]; n[i].date=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 9.5, color: '#9CA3AF' }} />
                  </div>
                  <InlineEdit value={exp.jobTitle} onChange={v => { const n=[...resumeData.experiences]; n[i].jobTitle=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 11, color: '#0D9488', fontWeight: 600, display: 'block', marginBottom: 3 }} />
                  <BlockEdit value={exp.description} onChange={v => { const n=[...resumeData.experiences]; n[i].description=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 11, color: '#4B5563', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const }} />
                </div>
              ))}
            </>)}
            {resumeData.education.some(e => e.school) && (<><CHead label="Education" />
              {resumeData.education.filter(e => e.school).map((edu, i) => (
                <div key={i} style={{ marginBottom: 11, paddingLeft: 12, borderLeft: '3px solid #CCFBF1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <InlineEdit value={edu.school} onChange={v => { const n=[...resumeData.education]; n[i].school=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 12, fontWeight: 700, color: '#111827' }} />
                    <InlineEdit value={edu.date} onChange={v => { const n=[...resumeData.education]; n[i].date=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 9.5, color: '#9CA3AF' }} />
                  </div>
                  <InlineEdit value={`${edu.degree}${edu.gpa ? ' · GPA ' + edu.gpa : ''}`} onChange={v => { const n=[...resumeData.education]; n[i].degree=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 10.5, color: '#0D9488', display: 'block', marginTop: 2 }} />
                </div>
              ))}
            </>)}
            {resumeData.projects.some(pr => pr.name) && (<><CHead label="Projects" />
              {resumeData.projects.filter(pr => pr.name).map((proj, i) => (
                <div key={i} style={{ marginBottom: 11, paddingLeft: 12, borderLeft: '3px solid #CCFBF1' }}>
                  <InlineEdit value={proj.name} onChange={v => { const n=[...resumeData.projects]; n[i].name=v; setResumeData(p=>({...p,projects:n})) }} style={{ fontSize: 12, fontWeight: 700, color: '#111827' }} />
                  <BlockEdit value={proj.description} onChange={v => { const n=[...resumeData.projects]; n[i].description=v; setResumeData(p=>({...p,projects:n})) }} style={{ fontSize: 11, color: '#4B5563', lineHeight: 1.65, whiteSpace: 'pre-wrap' as const }} />
                </div>
              ))}
            </>)}
            {resumeData.skills && (<><CHead label="Skills" /><BlockEdit value={resumeData.skills} onChange={v => setResumeData(p => ({...p, skills: v}))} style={{ fontSize: 11, color: '#374151', lineHeight: 1.7 }} /></>)}
          </div>
        </div>
      )
    }

    // ── TECH (Pro) ─────────────────────────────────────────────────────────────
    if (layout === 'tech') return (
      <div style={{ display: 'flex', width: A4_W, minHeight: A4_H, fontFamily: "'Arial', sans-serif", fontSize: 11, background: '#fff' }}>
        <div style={{ width: 198, background: '#0F172A', color: '#E2E8F0', padding: '30px 14px', flexShrink: 0, boxSizing: 'border-box' as const }}>
          <InlineEdit value={resumeData.name || 'Your Name'} onChange={v => setResumeData(p => ({...p, name: v}))} style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC', display: 'block', marginBottom: 4, lineHeight: 1.3, fontFamily: "'Courier New', monospace" }} />
          <div style={{ height: 2, background: '#10B981', marginBottom: 14 }} />
          <div style={{ fontSize: 8, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 6 }}>Contact</div>
          {(['email','phone','location','website'] as const).filter(f => (resumeData as unknown as Record<string,string>)[f]).map(f => (
            <InlineEdit key={f} value={(resumeData as unknown as Record<string,string>)[f]} onChange={v => setResumeData(p => ({...p, [f]: v}))} style={{ fontSize: 8.5, color: '#94A3B8', display: 'block', marginBottom: 4, wordBreak: 'break-all' as const }} />
          ))}
          {resumeData.skills && (<>
            <div style={{ height: 1, background: '#1E293B', margin: '12px 0 8px' }} />
            <div style={{ fontSize: 8, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 6 }}>Tech Stack</div>
            <BlockEdit value={resumeData.skills} onChange={v => setResumeData(p => ({...p, skills: v}))} style={{ fontSize: 8.5, color: '#94A3B8', lineHeight: 1.65 }} />
          </>)}
          {resumeData.education.some(e => e.school) && (<>
            <div style={{ height: 1, background: '#1E293B', margin: '12px 0 8px' }} />
            <div style={{ fontSize: 8, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 6 }}>Education</div>
            {resumeData.education.filter(e => e.school).map((edu, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <InlineEdit value={edu.school} onChange={v => { const n=[...resumeData.education]; n[i].school=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 9, fontWeight: 700, color: '#F1F5F9', display: 'block' }} />
                <InlineEdit value={edu.degree} onChange={v => { const n=[...resumeData.education]; n[i].degree=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 8.5, color: '#94A3B8', display: 'block', marginTop: 1 }} />
                <InlineEdit value={edu.date} onChange={v => { const n=[...resumeData.education]; n[i].date=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 8, color: '#64748B', display: 'block', marginTop: 1 }} />
              </div>
            ))}
          </>)}
        </div>
        <div style={{ flex: 1, padding: '30px 24px', boxSizing: 'border-box' as const }}>
          {resumeData.objective && (
            <div style={{ background: '#F0FDF4', borderLeft: '3px solid #10B981', padding: '8px 12px', marginBottom: 18, borderRadius: '0 4px 4px 0' }}>
              <BlockEdit value={resumeData.objective} onChange={v => setResumeData(p => ({...p, objective: v}))} style={{ fontSize: 10.5, color: '#064E3B', lineHeight: 1.65 }} />
            </div>
          )}
          {resumeData.experiences.some(e => e.company || e.jobTitle) && (<>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#10B981', marginBottom: 2 }}>Experience</div>
            <div style={{ height: 1.5, background: '#10B981', marginBottom: 12, opacity: 0.4 }} />
            {resumeData.experiences.filter(e => e.company || e.jobTitle).map((exp, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <InlineEdit value={exp.company} onChange={v => { const n=[...resumeData.experiences]; n[i].company=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }} />
                  <InlineEdit value={exp.date} onChange={v => { const n=[...resumeData.experiences]; n[i].date=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 9, color: '#94A3B8' }} />
                </div>
                <InlineEdit value={exp.jobTitle} onChange={v => { const n=[...resumeData.experiences]; n[i].jobTitle=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 10.5, color: '#10B981', fontFamily: "'Courier New', monospace", display: 'block', marginBottom: 3 }} />
                <BlockEdit value={exp.description} onChange={v => { const n=[...resumeData.experiences]; n[i].description=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 10.5, color: '#374151', lineHeight: 1.65, whiteSpace: 'pre-wrap' as const }} />
              </div>
            ))}
          </>)}
          {resumeData.projects.some(pr => pr.name) && (<>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#10B981', marginBottom: 2, marginTop: 14 }}>Projects</div>
            <div style={{ height: 1.5, background: '#10B981', marginBottom: 12, opacity: 0.4 }} />
            {resumeData.projects.filter(pr => pr.name).map((proj, i) => (
              <div key={i} style={{ marginBottom: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <InlineEdit value={proj.name} onChange={v => { const n=[...resumeData.projects]; n[i].name=v; setResumeData(p=>({...p,projects:n})) }} style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A' }} />
                  {proj.link && <InlineEdit value={proj.link} onChange={v => { const n=[...resumeData.projects]; n[i].link=v; setResumeData(p=>({...p,projects:n})) }} style={{ fontSize: 9, color: '#10B981' }} />}
                </div>
                <BlockEdit value={proj.description} onChange={v => { const n=[...resumeData.projects]; n[i].description=v; setResumeData(p=>({...p,projects:n})) }} style={{ fontSize: 10.5, color: '#4B5563', lineHeight: 1.65, whiteSpace: 'pre-wrap' as const }} />
              </div>
            ))}
          </>)}
        </div>
      </div>
    )

    // ── NEXUS (Pro) ────────────────────────────────────────────────────────────
    if (layout === 'nexus') {
      const NHead = ({ label }: { label: string }) => (
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7C3AED', marginBottom: 8, paddingBottom: 4, borderBottom: '2px solid #EDE9FE' }}>{label}</div>
      )
      return (
        <div style={{ width: A4_W, minHeight: A4_H, fontFamily: "'Arial', sans-serif", fontSize: 11, background: '#FAFAFA', padding: '32px 28px', boxSizing: 'border-box' as const }}>
          <div style={{ borderLeft: '4px solid #7C3AED', paddingLeft: 16, marginBottom: 20 }}>
            <InlineEdit value={resumeData.name || 'Your Name'} onChange={v => setResumeData(p => ({...p, name: v}))} style={{ fontSize: 26, fontWeight: 800, color: '#1F2937', display: 'block', marginBottom: 4 }} />
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px 16px', fontSize: 10, color: '#6B7280' }}>
              {(['email','phone','location','website'] as const).filter(f => (resumeData as unknown as Record<string,string>)[f]).map(f => (
                <InlineEdit key={f} value={(resumeData as unknown as Record<string,string>)[f]} onChange={v => setResumeData(p => ({...p, [f]: v}))} style={{ color: '#7C3AED' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
            <div>
              {resumeData.experiences.some(e => e.company || e.jobTitle) && (<>
                <NHead label="Experience" />
                {resumeData.experiences.filter(e => e.company || e.jobTitle).map((exp, i) => (
                  <div key={i} style={{ marginBottom: 13, background: '#fff', borderRadius: 6, padding: '8px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                    <InlineEdit value={exp.company} onChange={v => { const n=[...resumeData.experiences]; n[i].company=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 12, fontWeight: 700, color: '#111827', display: 'block' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <InlineEdit value={exp.jobTitle} onChange={v => { const n=[...resumeData.experiences]; n[i].jobTitle=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 10, color: '#7C3AED', fontWeight: 600 }} />
                      <InlineEdit value={exp.date} onChange={v => { const n=[...resumeData.experiences]; n[i].date=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 9, color: '#9CA3AF' }} />
                    </div>
                    <BlockEdit value={exp.description} onChange={v => { const n=[...resumeData.experiences]; n[i].description=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 10.5, color: '#4B5563', lineHeight: 1.6, whiteSpace: 'pre-wrap' as const }} />
                  </div>
                ))}
              </>)}
              {resumeData.projects.some(pr => pr.name) && (<>
                <NHead label="Projects" />
                {resumeData.projects.filter(pr => pr.name).map((proj, i) => (
                  <div key={i} style={{ marginBottom: 11, background: '#fff', borderRadius: 6, padding: '8px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                    <InlineEdit value={proj.name} onChange={v => { const n=[...resumeData.projects]; n[i].name=v; setResumeData(p=>({...p,projects:n})) }} style={{ fontSize: 11.5, fontWeight: 700, color: '#111827', display: 'block' }} />
                    <BlockEdit value={proj.description} onChange={v => { const n=[...resumeData.projects]; n[i].description=v; setResumeData(p=>({...p,projects:n})) }} style={{ fontSize: 10.5, color: '#4B5563', lineHeight: 1.6, whiteSpace: 'pre-wrap' as const }} />
                  </div>
                ))}
              </>)}
            </div>
            <div>
              {resumeData.objective && (<>
                <NHead label="Summary" />
                <div style={{ background: '#F5F3FF', borderRadius: 6, padding: '10px 12px', marginBottom: 14 }}>
                  <BlockEdit value={resumeData.objective} onChange={v => setResumeData(p => ({...p, objective: v}))} style={{ fontSize: 11, color: '#374151', lineHeight: 1.7 }} />
                </div>
              </>)}
              {resumeData.education.some(e => e.school) && (<>
                <NHead label="Education" />
                {resumeData.education.filter(e => e.school).map((edu, i) => (
                  <div key={i} style={{ marginBottom: 11, background: '#fff', borderRadius: 6, padding: '8px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                    <InlineEdit value={edu.school} onChange={v => { const n=[...resumeData.education]; n[i].school=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 12, fontWeight: 700, display: 'block' }} />
                    <InlineEdit value={`${edu.degree}${edu.gpa ? ' · ' + edu.gpa : ''}`} onChange={v => { const n=[...resumeData.education]; n[i].degree=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 10, color: '#7C3AED', display: 'block', marginTop: 2 }} />
                    <InlineEdit value={edu.date} onChange={v => { const n=[...resumeData.education]; n[i].date=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 9, color: '#9CA3AF', display: 'block', marginTop: 2 }} />
                  </div>
                ))}
              </>)}
              {resumeData.skills && (<>
                <NHead label="Skills" />
                <div style={{ background: '#fff', borderRadius: 6, padding: '10px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                  <BlockEdit value={resumeData.skills} onChange={v => setResumeData(p => ({...p, skills: v}))} style={{ fontSize: 10.5, color: '#374151', lineHeight: 1.7 }} />
                </div>
              </>)}
            </div>
          </div>
        </div>
      )
    }

    // ── CORPORATE (Enterprise) ─────────────────────────────────────────────────
    if (layout === 'corporate') {
      const CorpHead = ({ label }: { label: string }) => (
        <div style={{ marginTop: 18, marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#1E3A8A' }}>{label}</div>
          <div style={{ height: 1.5, background: '#1E3A8A', marginTop: 4 }} />
        </div>
      )
      return (
        <div style={{ width: A4_W, minHeight: A4_H, fontFamily: "'Times New Roman', Georgia, serif", fontSize: 12, background: '#fff' }}>
          <div style={{ background: '#1E3A8A', padding: '24px 44px 18px' }}>
            <InlineEdit value={resumeData.name || 'Your Name'} onChange={v => setResumeData(p => ({...p, name: v}))} style={{ fontSize: 26, fontWeight: 700, color: '#FFFFFF', display: 'block', letterSpacing: '0.04em', marginBottom: 8 }} />
            <div style={{ height: 1, background: 'rgba(255,255,255,0.3)', marginBottom: 8 }} />
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px 18px', fontSize: 10, color: 'rgba(255,255,255,0.82)' }}>
              {(['email','phone','location','website'] as const).filter(f => (resumeData as unknown as Record<string,string>)[f]).map(f => (
                <InlineEdit key={f} value={(resumeData as unknown as Record<string,string>)[f]} onChange={v => setResumeData(p => ({...p, [f]: v}))} style={{ color: 'rgba(255,255,255,0.82)' }} />
              ))}
            </div>
          </div>
          <div style={{ padding: '22px 44px 36px', boxSizing: 'border-box' as const }}>
            {resumeData.objective && (<><CorpHead label="Executive Summary" /><BlockEdit value={resumeData.objective} onChange={v => setResumeData(p => ({...p, objective: v}))} style={{ fontSize: 11.5, color: '#374151', lineHeight: 1.75 }} /></>)}
            {resumeData.experiences.some(e => e.company || e.jobTitle) && (<><CorpHead label="Professional Experience" />
              {resumeData.experiences.filter(e => e.company || e.jobTitle).map((exp, i) => (
                <div key={i} style={{ marginBottom: 15 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <InlineEdit value={exp.company} onChange={v => { const n=[...resumeData.experiences]; n[i].company=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 13, fontWeight: 700, color: '#1E3A8A' }} />
                    <InlineEdit value={exp.date} onChange={v => { const n=[...resumeData.experiences]; n[i].date=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 10, color: '#6B7280', fontStyle: 'italic' }} />
                  </div>
                  <InlineEdit value={exp.jobTitle} onChange={v => { const n=[...resumeData.experiences]; n[i].jobTitle=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 11, fontStyle: 'italic', color: '#475569', display: 'block', marginBottom: 4 }} />
                  <BlockEdit value={exp.description} onChange={v => { const n=[...resumeData.experiences]; n[i].description=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 11.5, color: '#374151', lineHeight: 1.75, whiteSpace: 'pre-wrap' as const }} />
                </div>
              ))}
            </>)}
            {resumeData.education.some(e => e.school) && (<><CorpHead label="Education" />
              {resumeData.education.filter(e => e.school).map((edu, i) => (
                <div key={i} style={{ marginBottom: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <InlineEdit value={edu.school} onChange={v => { const n=[...resumeData.education]; n[i].school=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 12.5, fontWeight: 700, color: '#1E3A8A' }} />
                    <InlineEdit value={`${edu.degree}${edu.gpa ? ', GPA ' + edu.gpa : ''}`} onChange={v => { const n=[...resumeData.education]; n[i].degree=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 11, fontStyle: 'italic', color: '#475569', display: 'block', marginTop: 2 }} />
                  </div>
                  <InlineEdit value={edu.date} onChange={v => { const n=[...resumeData.education]; n[i].date=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 10, color: '#6B7280', fontStyle: 'italic', flexShrink: 0, marginLeft: 10 }} />
                </div>
              ))}
            </>)}
            {resumeData.skills && (<><CorpHead label="Core Competencies" /><BlockEdit value={resumeData.skills} onChange={v => setResumeData(p => ({...p, skills: v}))} style={{ fontSize: 11.5, color: '#374151', lineHeight: 1.7 }} /></>)}
          </div>
        </div>
      )
    }

    // ── SPECTRUM (Enterprise) ──────────────────────────────────────────────────
    if (layout === 'spectrum') {
      const SHead = ({ label }: { label: string }) => (
        <div style={{ marginTop: 18, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'linear-gradient(135deg,#EC4899,#8B5CF6)', flexShrink: 0 }} />
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#374151' }}>{label}</div>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,#EC4899,#8B5CF6)', opacity: 0.3 }} />
        </div>
      )
      return (
        <div style={{ width: A4_W, minHeight: A4_H, fontFamily: "'Arial', sans-serif", fontSize: 11, background: '#fff', padding: '36px 44px', boxSizing: 'border-box' as const }}>
          <div style={{ marginBottom: 6 }}>
            <InlineEdit value={resumeData.name || 'Your Name'} onChange={v => setResumeData(p => ({...p, name: v}))}
              style={{ fontSize: 28, fontWeight: 900, display: 'block', marginBottom: 6,
                background: 'linear-gradient(90deg,#EC4899,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }} />
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px 16px', fontSize: 10, color: '#6B7280' }}>
              {(['email','phone','location','website'] as const).filter(f => (resumeData as unknown as Record<string,string>)[f]).map(f => (
                <InlineEdit key={f} value={(resumeData as unknown as Record<string,string>)[f]} onChange={v => setResumeData(p => ({...p, [f]: v}))} />
              ))}
            </div>
          </div>
          <div style={{ height: 3, background: 'linear-gradient(90deg,#EC4899,#8B5CF6,#06B6D4)', borderRadius: 9, marginBottom: 18 }} />
          {resumeData.objective && (<><SHead label="Profile" /><BlockEdit value={resumeData.objective} onChange={v => setResumeData(p => ({...p, objective: v}))} style={{ fontSize: 11, color: '#374151', lineHeight: 1.7 }} /></>)}
          {resumeData.experiences.some(e => e.company || e.jobTitle) && (<><SHead label="Experience" />
            {resumeData.experiences.filter(e => e.company || e.jobTitle).map((exp, i) => (
              <div key={i} style={{ marginBottom: 14, paddingLeft: 16, borderLeft: '2px solid #F3E8FF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <InlineEdit value={exp.company} onChange={v => { const n=[...resumeData.experiences]; n[i].company=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 13, fontWeight: 700, color: '#111827' }} />
                  <span style={{ fontSize: 9, fontWeight: 600, color: '#fff', background: 'linear-gradient(90deg,#EC4899,#8B5CF6)', padding: '2px 8px', borderRadius: 12 }}>
                    <InlineEdit value={exp.date} onChange={v => { const n=[...resumeData.experiences]; n[i].date=v; setResumeData(p=>({...p,experiences:n})) }} style={{ color: '#fff' }} />
                  </span>
                </div>
                <InlineEdit value={exp.jobTitle} onChange={v => { const n=[...resumeData.experiences]; n[i].jobTitle=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 11, color: '#8B5CF6', fontWeight: 600, display: 'block', marginBottom: 3 }} />
                <BlockEdit value={exp.description} onChange={v => { const n=[...resumeData.experiences]; n[i].description=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 11, color: '#4B5563', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const }} />
              </div>
            ))}
          </>)}
          {resumeData.education.some(e => e.school) && (<><SHead label="Education" />
            {resumeData.education.filter(e => e.school).map((edu, i) => (
              <div key={i} style={{ marginBottom: 10, paddingLeft: 16, borderLeft: '2px solid #F3E8FF' }}>
                <InlineEdit value={edu.school} onChange={v => { const n=[...resumeData.education]; n[i].school=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 12, fontWeight: 700, display: 'block' }} />
                <InlineEdit value={`${edu.degree}${edu.gpa ? ' · ' + edu.gpa : ''}`} onChange={v => { const n=[...resumeData.education]; n[i].degree=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 10.5, color: '#8B5CF6', display: 'block', marginTop: 2 }} />
                <InlineEdit value={edu.date} onChange={v => { const n=[...resumeData.education]; n[i].date=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 9.5, color: '#9CA3AF', display: 'block', marginTop: 1 }} />
              </div>
            ))}
          </>)}
          {resumeData.skills && (<><SHead label="Skills" />
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
              {resumeData.skills.split(/[,\n]+/).filter(Boolean).map((sk, i) => (
                <span key={i} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 500, background: ['#FDF2F8','#EFF6FF','#F5F3FF','#ECFDF5','#FEF9C3'][i % 5], color: ['#9D174D','#1D4ED8','#6D28D9','#065F46','#92400E'][i % 5] }}>
                  {sk.trim()}
                </span>
              ))}
            </div>
          </>)}
        </div>
      )
    }

    // ── PRESTIGE (Enterprise) ──────────────────────────────────────────────────
    if (layout === 'prestige') {
      const PHead = ({ label }: { label: string }) => (
        <div style={{ marginTop: 20, marginBottom: 10 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: '#D97706' }}>{label}</div>
          <div style={{ height: 1, background: '#D97706', marginTop: 5, opacity: 0.6 }} />
        </div>
      )
      return (
        <div style={{ width: A4_W, minHeight: A4_H, fontFamily: "'Georgia', serif", fontSize: 11.5, background: '#111827', color: '#E5E7EB' }}>
          <div style={{ padding: '40px 48px 22px', borderBottom: '2px solid #D97706' }}>
            <InlineEdit value={resumeData.name || 'Your Name'} onChange={v => setResumeData(p => ({...p, name: v}))} style={{ fontSize: 30, fontWeight: 700, color: '#D97706', display: 'block', letterSpacing: '0.06em', marginBottom: 8 }} />
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px 18px', fontSize: 10, color: '#9CA3AF' }}>
              {(['email','phone','location','website'] as const).filter(f => (resumeData as unknown as Record<string,string>)[f]).map(f => (
                <InlineEdit key={f} value={(resumeData as unknown as Record<string,string>)[f]} onChange={v => setResumeData(p => ({...p, [f]: v}))} style={{ color: '#9CA3AF' }} />
              ))}
            </div>
          </div>
          <div style={{ padding: '22px 48px 40px', boxSizing: 'border-box' as const }}>
            {resumeData.objective && (<><PHead label="Profile" /><BlockEdit value={resumeData.objective} onChange={v => setResumeData(p => ({...p, objective: v}))} style={{ fontSize: 11.5, color: '#D1D5DB', lineHeight: 1.75 }} /></>)}
            {resumeData.experiences.some(e => e.company || e.jobTitle) && (<><PHead label="Experience" />
              {resumeData.experiences.filter(e => e.company || e.jobTitle).map((exp, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <InlineEdit value={exp.company} onChange={v => { const n=[...resumeData.experiences]; n[i].company=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 13, fontWeight: 700, color: '#F9FAFB' }} />
                    <InlineEdit value={exp.date} onChange={v => { const n=[...resumeData.experiences]; n[i].date=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 9.5, color: '#D97706', flexShrink: 0, marginLeft: 8 }} />
                  </div>
                  <InlineEdit value={exp.jobTitle} onChange={v => { const n=[...resumeData.experiences]; n[i].jobTitle=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 11, fontStyle: 'italic', color: '#D97706', display: 'block', marginBottom: 4 }} />
                  <BlockEdit value={exp.description} onChange={v => { const n=[...resumeData.experiences]; n[i].description=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 11, color: '#D1D5DB', lineHeight: 1.75, whiteSpace: 'pre-wrap' as const }} />
                </div>
              ))}
            </>)}
            {resumeData.education.some(e => e.school) && (<><PHead label="Education" />
              {resumeData.education.filter(e => e.school).map((edu, i) => (
                <div key={i} style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <InlineEdit value={edu.school} onChange={v => { const n=[...resumeData.education]; n[i].school=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 12.5, fontWeight: 700, color: '#F9FAFB' }} />
                    <InlineEdit value={`${edu.degree}${edu.gpa ? ', GPA ' + edu.gpa : ''}`} onChange={v => { const n=[...resumeData.education]; n[i].degree=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic', display: 'block', marginTop: 2 }} />
                  </div>
                  <InlineEdit value={edu.date} onChange={v => { const n=[...resumeData.education]; n[i].date=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 9.5, color: '#D97706', flexShrink: 0, marginLeft: 10 }} />
                </div>
              ))}
            </>)}
            {resumeData.skills && (<><PHead label="Expertise" /><BlockEdit value={resumeData.skills} onChange={v => setResumeData(p => ({...p, skills: v}))} style={{ fontSize: 11.5, color: '#D1D5DB', lineHeight: 1.7 }} /></>)}
          </div>
        </div>
      )
    }

    const isProf = layout === 'executive'
    const isMod  = layout === 'modern'
    const ACCENT = isProf ? '#B45309' : isMod ? '#4F46E5' : '#DC2626'

    /** Reusable section divider */
    const SecHead = ({ label, color = ACCENT }: { label: string; color?: string }) => (
      <div style={{ marginTop: 16, marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color, textTransform: 'uppercase' as const }}>{label}</div>
        <div style={{ height: 1, background: color, marginTop: 3, opacity: 0.5 }} />
      </div>
    )

    // ── PROFESSIONAL (dark sidebar) ────────────────────────────────────────────
    if (isProf) return (
      <div style={{ display: 'flex', width: A4_W, minHeight: A4_H, fontFamily: "'Arial', sans-serif", fontSize: 12, background: '#fff' }}>
        {/* Sidebar */}
        <div style={{ width: 210, background: '#1E293B', color: '#F1F5F9', padding: '32px 16px', flexShrink: 0, boxSizing: 'border-box' as const }}>
          <InlineEdit value={resumeData.name || 'Your Name'} onChange={v => setResumeData(p => ({...p, name: v}))} style={{ fontSize: 17, fontWeight: 700, color: '#FFFFFF', display: 'block', lineHeight: '1.3', marginBottom: 14 }} />
          <div style={{ height: 2, background: '#F59E0B', marginBottom: 16 }} />

          <div style={{ fontSize: 8.5, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 6 }}>Contact</div>
          {([['email','✉'], ['phone','📞'], ['location','📍'], ['website','🔗']] as const).filter(([f]) => (resumeData as unknown as Record<string, string>)[f]).map(([field, icon]) => (
            <div key={field} style={{ display: 'flex', gap: 6, marginBottom: 5, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 9, flexShrink: 0, marginTop: 1 }}>{icon}</span>
              <InlineEdit value={(resumeData as unknown as Record<string, string>)[field]} onChange={v => setResumeData(p => ({...p, [field]: v}))} style={{ fontSize: 8.5, color: '#CBD5E1', wordBreak: 'break-all' as const }} />
            </div>
          ))}

          {resumeData.skills && (
            <>
              <div style={{ height: 1, background: '#334155', margin: '14px 0 10px' }} />
              <div style={{ fontSize: 8.5, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 6 }}>Skills</div>
              <BlockEdit value={resumeData.skills} onChange={v => setResumeData(p => ({...p, skills: v}))} style={{ fontSize: 9, color: '#CBD5E1', lineHeight: 1.65 }} />
            </>
          )}

          {resumeData.education.some(e => e.school) && (
            <>
              <div style={{ height: 1, background: '#334155', margin: '14px 0 10px' }} />
              <div style={{ fontSize: 8.5, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 6 }}>Education</div>
              {resumeData.education.filter(e => e.school).map((edu, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <InlineEdit value={edu.school} onChange={v => { const n=[...resumeData.education]; n[i].school=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 9.5, fontWeight: 700, color: '#F1F5F9', display: 'block' }} />
                  <InlineEdit value={edu.degree} onChange={v => { const n=[...resumeData.education]; n[i].degree=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 8.5, color: '#94A3B8', display: 'block', marginTop: 2 }} />
                  <InlineEdit value={edu.date} onChange={v => { const n=[...resumeData.education]; n[i].date=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 8, color: '#64748B', display: 'block', marginTop: 1 }} />
                </div>
              ))}
            </>
          )}

          {resumeData.projects.some(p => p.name) && (
            <>
              <div style={{ height: 1, background: '#334155', margin: '14px 0 10px' }} />
              <div style={{ fontSize: 8.5, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 6 }}>Projects</div>
              {resumeData.projects.filter(p => p.name).map((proj, i) => (
                <div key={i} style={{ marginBottom: 9 }}>
                  <InlineEdit value={proj.name} onChange={v => { const n=[...resumeData.projects]; n[i].name=v; setResumeData(p=>({...p,projects:n})) }} style={{ fontSize: 9, fontWeight: 700, color: '#F1F5F9', display: 'block' }} />
                  <BlockEdit value={proj.description} onChange={v => { const n=[...resumeData.projects]; n[i].description=v; setResumeData(p=>({...p,projects:n})) }} style={{ fontSize: 8.5, color: '#94A3B8', lineHeight: 1.5, marginTop: 2 }} />
                </div>
              ))}
            </>
          )}
        </div>

        {/* Main column */}
        <div style={{ flex: 1, padding: '32px 28px', boxSizing: 'border-box' as const }}>
          {resumeData.objective && (
            <div style={{ background: '#FEF3C7', borderLeft: '3px solid #F59E0B', padding: '8px 12px', marginBottom: 16, borderRadius: '0 4px 4px 0' }}>
              <BlockEdit value={resumeData.objective} onChange={v => setResumeData(p => ({...p, objective: v}))} style={{ fontSize: 10, color: '#78350F', lineHeight: 1.65 }} />
            </div>
          )}

          <SecHead label="Work Experience" color="#F59E0B" />
          {resumeData.experiences.filter(e => e.company || e.jobTitle).map((exp, i) => (
            <div key={i} style={{ marginBottom: 14, pageBreakInside: 'avoid' as const }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <InlineEdit value={exp.company} onChange={v => { const n=[...resumeData.experiences]; n[i].company=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }} />
                <InlineEdit value={exp.date} onChange={v => { const n=[...resumeData.experiences]; n[i].date=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 9, color: '#94A3B8', flexShrink: 0, marginLeft: 8 }} />
              </div>
              <InlineEdit value={exp.jobTitle} onChange={v => { const n=[...resumeData.experiences]; n[i].jobTitle=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 10.5, fontStyle: 'italic', color: '#475569', display: 'block', marginBottom: 4 }} />
              <BlockEdit value={exp.description} onChange={v => { const n=[...resumeData.experiences]; n[i].description=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 10.5, color: '#374151', lineHeight: 1.65, whiteSpace: 'pre-wrap' as const }} />
            </div>
          ))}
        </div>
      </div>
    )

    // ── MODERN (indigo accent header) ──────────────────────────────────────────
    if (isMod) return (
      <div style={{ width: A4_W, minHeight: A4_H, fontFamily: "'Arial', sans-serif", fontSize: 12, background: '#fff' }}>
        {/* Header */}
        <div style={{ background: '#F8FAFF', padding: '28px 40px 20px', borderBottom: '4px solid #4F46E5' }}>
          <InlineEdit value={resumeData.name || 'Your Name'} onChange={v => setResumeData(p => ({...p, name: v}))} style={{ fontSize: 28, fontWeight: 800, color: '#1E1B4B', display: 'block', marginBottom: 6 }} />
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px 16px', fontSize: 10, color: '#6B7280' }}>
            {([['email'], ['phone'], ['location'], ['website']] as const).filter(([f]) => (resumeData as unknown as Record<string, string>)[f]).map(([field]) => (
              <InlineEdit key={field} value={(resumeData as unknown as Record<string, string>)[field]} onChange={v => setResumeData(p => ({...p, [field]: v}))} style={{ color: '#4F46E5' }} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 40px 36px', boxSizing: 'border-box' as const }}>
          {resumeData.objective && (
            <><SecHead label="Objective" />
            <BlockEdit value={resumeData.objective} onChange={v => setResumeData(p => ({...p, objective: v}))} style={{ fontSize: 11, color: '#374151', lineHeight: 1.7, marginBottom: 4 }} /></>)}

          {resumeData.experiences.some(e => e.company || e.jobTitle) && (
            <><SecHead label="Work Experience" />
            {resumeData.experiences.filter(e => e.company || e.jobTitle).map((exp, i) => (
              <div key={i} style={{ marginBottom: 14, pageBreakInside: 'avoid' as const }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <InlineEdit value={exp.company} onChange={v => { const n=[...resumeData.experiences]; n[i].company=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 13, fontWeight: 700, color: '#111827' }} />
                  <InlineEdit value={exp.date} onChange={v => { const n=[...resumeData.experiences]; n[i].date=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 9.5, color: '#9CA3AF' }} />
                </div>
                <InlineEdit value={exp.jobTitle} onChange={v => { const n=[...resumeData.experiences]; n[i].jobTitle=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 11, color: '#4F46E5', fontWeight: 600, display: 'block', marginBottom: 3 }} />
                <BlockEdit value={exp.description} onChange={v => { const n=[...resumeData.experiences]; n[i].description=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 11, color: '#4B5563', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const }} />
              </div>
            ))}
            </>
          )}

          {resumeData.education.some(e => e.school) && (
            <><SecHead label="Education" />
            {resumeData.education.filter(e => e.school).map((edu, i) => (
              <div key={i} style={{ marginBottom: 12, pageBreakInside: 'avoid' as const }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <InlineEdit value={edu.school} onChange={v => { const n=[...resumeData.education]; n[i].school=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 12, fontWeight: 700, color: '#111827' }} />
                  <InlineEdit value={edu.date} onChange={v => { const n=[...resumeData.education]; n[i].date=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 9.5, color: '#9CA3AF' }} />
                </div>
                <InlineEdit value={`${edu.degree}${edu.gpa ? ' • GPA: ' + edu.gpa : ''}`} onChange={v => { const n=[...resumeData.education]; n[i].degree=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 11, color: '#4F46E5', display: 'block', marginBottom: 2 }} />
                {edu.additionalInfo && <BlockEdit value={edu.additionalInfo} onChange={v => { const n=[...resumeData.education]; n[i].additionalInfo=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 10.5, color: '#6B7280', lineHeight: 1.6 }} />}
              </div>
            ))}
            </>
          )}

          {resumeData.projects.some(p => p.name) && (
            <><SecHead label="Projects" />
            {resumeData.projects.filter(p => p.name).map((proj, i) => (
              <div key={i} style={{ marginBottom: 12, pageBreakInside: 'avoid' as const }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <InlineEdit value={proj.name} onChange={v => { const n=[...resumeData.projects]; n[i].name=v; setResumeData(p=>({...p,projects:n})) }} style={{ fontSize: 12, fontWeight: 700, color: '#111827' }} />
                  <InlineEdit value={proj.date} onChange={v => { const n=[...resumeData.projects]; n[i].date=v; setResumeData(p=>({...p,projects:n})) }} style={{ fontSize: 9.5, color: '#9CA3AF' }} />
                </div>
                {proj.link && <InlineEdit value={proj.link} onChange={v => { const n=[...resumeData.projects]; n[i].link=v; setResumeData(p=>({...p,projects:n})) }} style={{ fontSize: 9.5, color: '#4F46E5', display: 'block', marginBottom: 2 }} />}
                <BlockEdit value={proj.description} onChange={v => { const n=[...resumeData.projects]; n[i].description=v; setResumeData(p=>({...p,projects:n})) }} style={{ fontSize: 11, color: '#4B5563', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const }} />
              </div>
            ))}
            </>
          )}

          {resumeData.skills && (
            <><SecHead label="Skills" />
            <BlockEdit value={resumeData.skills} onChange={v => setResumeData(p => ({...p, skills: v}))} style={{ fontSize: 11, color: '#374151', lineHeight: 1.7 }} /></>
          )}
        </div>
      </div>
    )

    // ── CLASSIC (default — Georgia serif, red accents) ─────────────────────────
    return (
      <div style={{ width: A4_W, minHeight: A4_H, fontFamily: "'Georgia', serif", fontSize: 12, background: '#fff', padding: '36px 40px', boxSizing: 'border-box' as const }}>
        {/* Header */}
        <div style={{ textAlign: 'center' as const, paddingBottom: 10, marginBottom: 4 }}>
          <InlineEdit value={resumeData.name || 'Your Name'} onChange={v => setResumeData(p => ({...p, name: v}))} style={{ fontSize: 24, fontWeight: 700, color: '#111827', display: 'block' }} />
          <div style={{ height: 1, background: '#DC2626', margin: '8px 0 6px' }} />
          <div style={{ fontSize: 10, color: '#6B7280', display: 'flex', justifyContent: 'center', flexWrap: 'wrap' as const, gap: '0 10px' }}>
            {([['email'], ['phone'], ['location'], ['website']] as const)
              .filter(([f]) => (resumeData as unknown as Record<string,string>)[f])
              .map(([field], idx) => (
                <React.Fragment key={field}>
                  {idx > 0 && <span style={{ margin: '0 2px' }}>•</span>}
                  <InlineEdit value={(resumeData as unknown as Record<string,string>)[field]} onChange={v => setResumeData(p => ({...p, [field]: v}))} />
                </React.Fragment>
              ))}
          </div>
        </div>

        {resumeData.objective && (
          <><div style={{ fontSize: 10.5, fontWeight: 700, color: '#DC2626', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginTop: 14, marginBottom: 2 }}>Objective</div>
          <div style={{ height: 1, background: '#FCA5A5', marginBottom: 6 }} />
          <BlockEdit value={resumeData.objective} onChange={v => setResumeData(p => ({...p, objective: v}))} style={{ fontSize: 11, color: '#374151', lineHeight: 1.7, marginBottom: 4 }} /></>)}

        {resumeData.experiences.some(e => e.company || e.jobTitle) && (
          <><div style={{ fontSize: 10.5, fontWeight: 700, color: '#DC2626', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginTop: 14, marginBottom: 2 }}>Work Experience</div>
          <div style={{ height: 1, background: '#FCA5A5', marginBottom: 8 }} />
          {resumeData.experiences.filter(e => e.company || e.jobTitle).map((exp, i) => (
            <div key={i} style={{ marginBottom: 14, pageBreakInside: 'avoid' as const }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <InlineEdit value={exp.company} onChange={v => { const n=[...resumeData.experiences]; n[i].company=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 13, fontWeight: 700, color: '#111827' }} />
                <InlineEdit value={exp.date} onChange={v => { const n=[...resumeData.experiences]; n[i].date=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 9.5, color: '#9CA3AF' }} />
              </div>
              <InlineEdit value={exp.jobTitle} onChange={v => { const n=[...resumeData.experiences]; n[i].jobTitle=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 11, fontStyle: 'italic', color: '#4B5563', display: 'block', marginBottom: 3 }} />
              <BlockEdit value={exp.description} onChange={v => { const n=[...resumeData.experiences]; n[i].description=v; setResumeData(p=>({...p,experiences:n})) }} style={{ fontSize: 11, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const }} />
            </div>
          ))}
          </>
        )}

        {resumeData.education.some(e => e.school) && (
          <><div style={{ fontSize: 10.5, fontWeight: 700, color: '#DC2626', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginTop: 14, marginBottom: 2 }}>Education</div>
          <div style={{ height: 1, background: '#FCA5A5', marginBottom: 8 }} />
          {resumeData.education.filter(e => e.school).map((edu, i) => (
            <div key={i} style={{ marginBottom: 12, pageBreakInside: 'avoid' as const }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <InlineEdit value={edu.school} onChange={v => { const n=[...resumeData.education]; n[i].school=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 12, fontWeight: 700, color: '#111827' }} />
                <InlineEdit value={edu.date} onChange={v => { const n=[...resumeData.education]; n[i].date=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 9.5, color: '#9CA3AF' }} />
              </div>
              <InlineEdit value={`${edu.degree}${edu.gpa ? ' • GPA: ' + edu.gpa : ''}`} onChange={v => { const n=[...resumeData.education]; n[i].degree=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 11, color: '#374151', display: 'block', marginBottom: 2 }} />
              {edu.additionalInfo && <BlockEdit value={edu.additionalInfo} onChange={v => { const n=[...resumeData.education]; n[i].additionalInfo=v; setResumeData(p=>({...p,education:n})) }} style={{ fontSize: 10.5, color: '#6B7280', lineHeight: 1.6 }} />}
            </div>
          ))}
          </>
        )}

        {resumeData.projects.some(p => p.name) && (
          <><div style={{ fontSize: 10.5, fontWeight: 700, color: '#DC2626', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginTop: 14, marginBottom: 2 }}>Projects</div>
          <div style={{ height: 1, background: '#FCA5A5', marginBottom: 8 }} />
          {resumeData.projects.filter(p => p.name).map((proj, i) => (
            <div key={i} style={{ marginBottom: 12, pageBreakInside: 'avoid' as const }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <InlineEdit value={proj.name} onChange={v => { const n=[...resumeData.projects]; n[i].name=v; setResumeData(p=>({...p,projects:n})) }} style={{ fontSize: 12, fontWeight: 700, color: '#111827' }} />
                <InlineEdit value={proj.date} onChange={v => { const n=[...resumeData.projects]; n[i].date=v; setResumeData(p=>({...p,projects:n})) }} style={{ fontSize: 9.5, color: '#9CA3AF' }} />
              </div>
              {proj.link && <InlineEdit value={proj.link} onChange={v => { const n=[...resumeData.projects]; n[i].link=v; setResumeData(p=>({...p,projects:n})) }} style={{ fontSize: 9.5, color: '#6366F1', display: 'block', marginBottom: 2 }} />}
              <BlockEdit value={proj.description} onChange={v => { const n=[...resumeData.projects]; n[i].description=v; setResumeData(p=>({...p,projects:n})) }} style={{ fontSize: 11, color: '#4B5563', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const }} />
            </div>
          ))}
          </>
        )}

        {resumeData.skills && (
          <><div style={{ fontSize: 10.5, fontWeight: 700, color: '#DC2626', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginTop: 14, marginBottom: 2 }}>Skills</div>
          <div style={{ height: 1, background: '#FCA5A5', marginBottom: 6 }} />
          <BlockEdit value={resumeData.skills} onChange={v => setResumeData(p => ({...p, skills: v}))} style={{ fontSize: 11, color: '#374151', lineHeight: 1.7 }} /></>)}
      </div>
    )
  }

  return (
    <div className="flex h-screen gap-4 p-4 bg-gray-50">
      {/* Overlays */}
      <ImportWalkthroughModal
        open={importWalkthroughOpen}
        initialFile={importWalkthroughFile}
        userTier={userTier}
        currentLayout={layout}
        onClose={() => setImportWalkthroughOpen(false)}
        onComplete={(data, ttl, jt, desc, tplId) => {
          setResumeData(data)
          setResumeTitle(ttl)
          setLayout(tplId)
          setImportWalkthroughOpen(false)
          setImportStatus('success')
          setTimeout(() => setImportStatus('idle'), 3000)
        }}
      />
      <SaveDialog
        open={saveDialogOpen}
        mode={saveDialogMode}
        defaultName={resumeTitle || (resumeData.name ? `${resumeData.name}'s Resume` : '')}
        onConfirm={handleSaveConfirm}
        onCancel={() => setSaveDialogOpen(false)}
      />
      <TemplatePickerModal
        open={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        current={layout}
        userTier={userTier}
        onSelect={id => setLayout(id)}
      />

      {/* Left Sidebar - Form */}
      <div className="w-1/2 overflow-y-auto bg-white rounded-lg shadow-lg p-6 space-y-6">
        {/* ── Header ── */}
        <div className="space-y-3 mb-2">
          {/* Title row */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={resumeTitle}
                onChange={e => setResumeTitle(e.target.value)}
                placeholder="Untitled Resume"
                className="w-full text-xl font-bold text-gray-800 bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-indigo-400 focus:outline-none pb-0.5 transition-colors"
              />
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400">AI Resume Builder</span>
                {autoSaveStatus === 'saving' && <span className="text-xs text-gray-400">• Saving draft...</span>}
                {autoSaveStatus === 'saved'  && <span className="text-xs text-emerald-500">• ✓ Draft saved</span>}
              </div>
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => importResume()}
              size="sm" variant="outline"
              title="Import PDF or DOCX and auto-fill all fields"
              className={importStatus === 'success' ? 'border-emerald-400 text-emerald-600' : importStatus === 'error' ? 'border-red-400 text-red-500' : ''}
            >
              <FileText className="w-4 h-4 mr-1.5" />
              {importStatus === 'success' ? 'Imported!' : importStatus === 'error' ? 'Import failed' : 'Import Resume'}
            </Button>
            <Button onClick={() => openSaveDialog('draft')} disabled={saving} size="sm" variant="outline">
              <Save className="w-4 h-4 mr-1.5" />
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              onClick={() => openSaveDialog('library')}
              disabled={uploadingToLibrary}
              size="sm"
              className={librarySaveStatus === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' : librarySaveStatus === 'error' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}
            >
              <Upload className="w-4 h-4 mr-1.5" />
              {uploadingToLibrary ? 'Saving...' : librarySaveStatus === 'success' ? 'Saved!' : librarySaveStatus === 'error' ? 'Failed' : 'Save to My Resumes'}
            </Button>
            <Button onClick={exportPdf} size="sm" className="bg-orange-500 hover:bg-orange-600">
              <Download className="w-4 h-4 mr-1.5" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Personal Information */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Personal Information</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Name</label>
              <input
                type="text"
                value={resumeData.name}
                onChange={(e) => setResumeData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Location</label>
              <AutocompleteInput
                id="location"
                value={resumeData.location}
                onChange={(v) => setResumeData(prev => ({ ...prev, location: v }))}
                options={refData.location}
                placeholder="City / Location"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Phone</label>
              <input
                type="text"
                value={resumeData.phone}
                onChange={(e) => setResumeData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="(555) 555-5555"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input
                type="email"
                value={resumeData.email}
                onChange={(e) => setResumeData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="mail@email.com"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600">Website</label>
            <input
              type="text"
              value={resumeData.website}
              onChange={(e) => setResumeData(prev => ({ ...prev, website: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md text-sm"
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-gray-600">Objective</label>
              <button
                onClick={() => openSuggestions('objective')}
                disabled={loading}
                className="text-purple-600 hover:text-purple-700 disabled:opacity-50"
                title="AI Suggestions"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={resumeData.objective}
              onChange={(e) => setResumeData(prev => ({ ...prev, objective: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md text-sm"
              rows={3}
              placeholder="AI superpower to assist candidates..."
            />
          </div>
        </section>

        {/* Work Experience */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Work Experience</h3>

          {resumeData.experiences.map((exp, index) => (
            <div key={exp.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-orange-600">Experience #{index + 1}</span>
                {resumeData.experiences.length > 1 && (
                  <button onClick={() => removeExperience(exp.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600">Company</label>
                <AutocompleteInput
                  id={`company-${index}`}
                  value={exp.company}
                  onChange={(v) => {
                    const newExps = [...resumeData.experiences]
                    newExps[index].company = v
                    setResumeData(prev => ({ ...prev, experiences: newExps }))
                  }}
                  options={refData.company}
                  placeholder="Company Name"
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Job Title</label>
                  <input
                    type="text"
                    value={exp.jobTitle}
                    onChange={(e) => {
                      const newExps = [...resumeData.experiences]
                      newExps[index].jobTitle = e.target.value
                      setResumeData(prev => ({ ...prev, experiences: newExps }))
                    }}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    placeholder="Software Engineer"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Date</label>
                  <input
                    type="text"
                    value={exp.date}
                    onChange={(e) => {
                      const newExps = [...resumeData.experiences]
                      newExps[index].date = e.target.value
                      setResumeData(prev => ({ ...prev, experiences: newExps }))
                    }}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    placeholder="2024 - Present"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-gray-600">Description</label>
                  <button
                    onClick={() => openSuggestions('experience', index)}
                    disabled={loading}
                    className="text-purple-600 hover:text-purple-700 disabled:opacity-50"
                    title="AI Suggestions"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={exp.description}
                  onChange={(e) => {
                    const newExps = [...resumeData.experiences]
                    newExps[index].description = e.target.value
                    setResumeData(prev => ({ ...prev, experiences: newExps }))
                  }}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  rows={3}
                  placeholder="• Bullet point description..."
                />
              </div>
            </div>
          ))}

          <button
            onClick={addExperience}
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Experience
          </button>
        </section>

        {/* Education */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Education</h3>

          {resumeData.education.map((edu, index) => (
            <div key={edu.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-orange-600">Education #{index + 1}</span>
                {resumeData.education.length > 1 && (
                  <button onClick={() => removeEducation(edu.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600">School</label>
                <AutocompleteInput
                  id={`school-${index}`}
                  value={edu.school}
                  onChange={(v) => {
                    const newEdu = [...resumeData.education]
                    newEdu[index].school = v
                    setResumeData(prev => ({ ...prev, education: newEdu }))
                  }}
                  options={[...refData.university, ...refData.college]}
                  placeholder="University / College Name"
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Degree</label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => {
                      const newEdu = [...resumeData.education]
                      newEdu[index].degree = e.target.value
                      setResumeData(prev => ({ ...prev, education: newEdu }))
                    }}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    placeholder="BS Computer Science"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">GPA</label>
                  <input
                    type="text"
                    value={edu.gpa}
                    onChange={(e) => {
                      const newEdu = [...resumeData.education]
                      newEdu[index].gpa = e.target.value
                      setResumeData(prev => ({ ...prev, education: newEdu }))
                    }}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    placeholder="3.8"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Date</label>
                <input
                  type="text"
                  value={edu.date}
                  onChange={(e) => {
                    const newEdu = [...resumeData.education]
                    newEdu[index].date = e.target.value
                    setResumeData(prev => ({ ...prev, education: newEdu }))
                  }}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="2020 - 2024"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-gray-600">Additional Info</label>
                  <button
                    onClick={() => openSuggestions('education', index)}
                    disabled={loading}
                    className="text-purple-600 hover:text-purple-700 disabled:opacity-50"
                    title="AI Suggestions"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={edu.additionalInfo}
                  onChange={(e) => {
                    const newEdu = [...resumeData.education]
                    newEdu[index].additionalInfo = e.target.value
                    setResumeData(prev => ({ ...prev, education: newEdu }))
                  }}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  rows={2}
                  placeholder="Relevant coursework, honors..."
                />
              </div>
            </div>
          ))}

          <button
            onClick={addEducation}
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Education
          </button>
        </section>

        {/* Projects */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-lg font-semibold text-gray-700">Projects</h3>
            {hasGithub && (
              <button
                onClick={githubRepos.length > 0 ? () => setShowGithubImport(v => !v) : fetchGithubRepos}
                disabled={loadingRepos}
                className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition"
              >
                <Github className="w-3.5 h-3.5" />
                {loadingRepos ? 'Loading...' : 'Import from GitHub'}
              </button>
            )}
          </div>

          {/* GitHub repo picker */}
          {showGithubImport && githubRepos.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-900 text-white px-3 py-2 text-xs font-medium flex justify-between items-center">
                <span>📁 Your GitHub Repositories — click to add as project</span>
                <button onClick={() => setShowGithubImport(false)} className="text-gray-400 hover:text-white">×</button>
              </div>
              <div className="max-h-52 overflow-y-auto divide-y">
                {githubRepos.map((repo) => (
                  <button
                    key={repo.name}
                    onClick={() => insertGithubRepo(repo)}
                    className="w-full text-left px-3 py-2.5 hover:bg-purple-50 transition text-sm"
                  >
                    <div className="font-medium text-gray-800 flex items-center gap-2">
                      {repo.name}
                      {repo.language && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-normal">{repo.language}</span>
                      )}
                      {'stargazers_count' in repo && repo.stargazers_count > 0 && (
                        <span className="text-[10px] text-yellow-600">★ {repo.stargazers_count}</span>
                      )}
                    </div>
                    {repo.description && <div className="text-xs text-gray-500 truncate mt-0.5">{repo.description}</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {resumeData.projects.map((proj, index) => (
            <div key={proj.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-orange-600">Project #{index + 1}</span>
                {resumeData.projects.length > 1 && (
                  <button onClick={() => removeProject(proj.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600">Project Name</label>
                <input
                  type="text"
                  value={proj.name}
                  onChange={(e) => {
                    const newProj = [...resumeData.projects]
                    newProj[index].name = e.target.value
                    setResumeData(prev => ({ ...prev, projects: newProj }))
                  }}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="Project Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Link</label>
                  <input
                    type="text"
                    value={proj.link}
                    onChange={(e) => {
                      const newProj = [...resumeData.projects]
                      newProj[index].link = e.target.value
                      setResumeData(prev => ({ ...prev, projects: newProj }))
                    }}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    placeholder="https://github.com/..."
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Date</label>
                  <input
                    type="text"
                    value={proj.date}
                    onChange={(e) => {
                      const newProj = [...resumeData.projects]
                      newProj[index].date = e.target.value
                      setResumeData(prev => ({ ...prev, projects: newProj }))
                    }}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    placeholder="2024"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-gray-600">Description</label>
                  <button
                    onClick={() => openSuggestions('project', index)}
                    disabled={loading}
                    className="text-purple-600 hover:text-purple-700 disabled:opacity-50"
                    title="AI Suggestions"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={proj.description}
                  onChange={(e) => {
                    const newProj = [...resumeData.projects]
                    newProj[index].description = e.target.value
                    setResumeData(prev => ({ ...prev, projects: newProj }))
                  }}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  rows={2}
                  placeholder="Project description..."
                />
              </div>
            </div>
          ))}

          <button
            onClick={addProject}
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Project
          </button>
        </section>

        {/* Skills */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Skills</h3>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-gray-600">Skills List</label>
              <button
                onClick={() => openSuggestions('skills')}
                disabled={loading}
                className="text-purple-600 hover:text-purple-700 disabled:opacity-50"
                title="AI Suggestions"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={resumeData.skills}
              onChange={(e) => setResumeData(prev => ({ ...prev, skills: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md text-sm"
              rows={3}
              placeholder="JavaScript, React, Node.js, Python..."
            />
          </div>
        </section>
      </div>

      {/* Right Panel - Live HTML Preview */}
      <div className="w-1/2 bg-white rounded-lg shadow-lg flex flex-col overflow-hidden">
        {/* Docs-style meta bar */}
        <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-3 shrink-0">
          <span className="text-xs font-medium text-gray-500 truncate max-w-36">
            {resumeTitle || resumeData.name || 'Untitled Resume'}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            {/* Current template badge */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-gray-200 bg-white text-xs text-gray-700">
              <span>{TEMPLATES.find(t => t.id === layout)?.icon ?? '\ud83d\udcc4'}</span>
              <span className="font-medium">{TEMPLATES.find(t => t.id === layout)?.name ?? layout}</span>
              {TEMPLATES.find(t => t.id === layout)?.tier !== 'basic' && (
                <span className={`ml-0.5 text-xs font-bold ${TEMPLATES.find(t => t.id === layout)?.tier === 'pro' ? 'text-amber-500' : 'text-purple-500'}`}>
                  {TEMPLATES.find(t => t.id === layout)?.tier === 'pro' ? '\u2b50' : '\ud83d\udc8e'}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowTemplatePicker(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
            >
              Templates \u25be
            </button>
          </div>
        </div>
        {/* Formatting toolbar */}
        <PreviewToolbar />
        {/* Edit hint */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 border-b border-blue-100 text-xs text-blue-600 shrink-0">
          <span>✏️</span>
          <span>Click any text in the preview to edit it directly</span>
        </div>
        {/* Preview area */}
        <div ref={containerRef} className="flex-1 overflow-auto bg-gray-200 p-4">
          <div style={{ zoom: previewScale, display: 'inline-block', minWidth: A4_W }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div ref={previewRef} style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.18)', background: '#fff' }}>
                {renderHTMLPreview()}
              </div>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{
                  position: 'absolute', top: A4_H * (i + 1), left: 0, right: 0,
                  height: 0, borderTop: '2px dashed #60A5FA', pointerEvents: 'none', zIndex: 10,
                }}>
                  <span style={{ position: 'absolute', right: 8, top: -10, fontSize: 9, background: '#DBEAFE', color: '#1D4ED8', padding: '1px 6px', borderRadius: 4 }}>Page {i + 2}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Suggestion Panel Modal */}
      <SuggestionPanel
        open={suggestionsOpen}
        fieldName={suggestionField}
        existingValue={suggestionExisting}
        index={suggestionIndex}
        context={suggestionContext}
        onClose={() => setSuggestionsOpen(false)}
        onApply={applySuggestion}
      />
    </div>
  )
}




