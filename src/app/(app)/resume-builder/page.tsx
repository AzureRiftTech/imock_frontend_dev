'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import type { ResumeData } from '@/components/resume/ResumeBuilderFormV2'
import type { TemplateId } from '@/lib/resume-templates'
import { TEMPLATES } from '@/lib/resume-templates'

const ResumeBuilderFormV2 = dynamic(
  () => import('@/components/resume/ResumeBuilderFormV2'),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center h-screen text-gray-500 text-sm">
      Loading Resume Builder...
    </div>
  )}
)

// ─── Inner component that reads search params ─────────────────────────────────

function ResumeBuilderInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cvId = searchParams.get('cv')
  const templateParam = searchParams.get('template') as TemplateId | null
  const autoImport = searchParams.get('autoImport') === '1'
  const initialLayout: TemplateId | undefined = templateParam && TEMPLATES.some(t => t.id === templateParam) ? templateParam : undefined
  const [initialState, setInitialState] = useState<ResumeData | undefined>(undefined)
  const [initialTitle, setInitialTitle] = useState<string | undefined>(undefined)
  const [autoImportFile, setAutoImportFile] = useState<File | undefined>(undefined)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Load state saved by "Open in Builder" from CV library
    if (cvId) {
      try {
        const raw = sessionStorage.getItem(`rb_state_${cvId}`)
        if (raw) setInitialState(JSON.parse(raw) as ResumeData)
        const savedTitle = sessionStorage.getItem(`rb_title_${cvId}`)
        if (savedTitle) setInitialTitle(savedTitle)
      } catch {
        // ignore parse errors — fall through to normal load
      }
    }
    // Restore file uploaded via CV page "Use Resume Builder" option
    if (autoImport) {
      try {
        const base64 = sessionStorage.getItem('rb_auto_import_file')
        const name = sessionStorage.getItem('rb_auto_import_name') || 'resume.pdf'
        const type = sessionStorage.getItem('rb_auto_import_type') || 'application/pdf'
        if (base64) {
          const byteStr = atob(base64.split(',')[1])
          const ab = new ArrayBuffer(byteStr.length)
          const ia = new Uint8Array(ab)
          for (let i = 0; i < byteStr.length; i++) ia[i] = byteStr.charCodeAt(i)
          const blob = new Blob([ab], { type })
          setAutoImportFile(new File([blob], name, { type }))
          sessionStorage.removeItem('rb_auto_import_file')
          sessionStorage.removeItem('rb_auto_import_name')
          sessionStorage.removeItem('rb_auto_import_type')
        }
      } catch {
        // ignore — file too large for sessionStorage or parse error
      }
    }
    setReady(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!ready) return null

  return (
    <div className="flex flex-col h-screen">
      {/* Breadcrumb bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-white border-b shadow-sm shrink-0">
        <Link
          href="/cv"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          My Resumes
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-800">Resume Builder</span>
      </div>

      {/* Builder fills remaining height */}
      <div className="flex-1 overflow-hidden">
        <ResumeBuilderFormV2
          onSavedToLibrary={() => router.push('/cv')}
          initialState={initialState}
          initialLayout={initialLayout}
          initialTitle={initialTitle}
          autoImportFile={autoImportFile}
          freshStart={autoImport}
        />
      </div>
    </div>
  )
}

// ─── Page export — wrapped in Suspense for useSearchParams ───────────────────

export default function ResumeBuilderPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen text-gray-500 text-sm">
        Loading Resume Builder...
      </div>
    }>
      <ResumeBuilderInner />
    </Suspense>
  )
}
