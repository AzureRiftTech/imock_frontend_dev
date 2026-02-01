'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/error'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { sweetConfirm } from '@/lib/swal' 

const ResumeBuilderForm = dynamic(
  () => import('@/components/resume/ResumeBuilderFormV2').then((mod) => ({ default: mod.default })),
  { ssr: false }
)

type CvRow = {
  cv_id: number
  original_filename?: string | null
  created_at?: string | null
  s3_url?: string | null
  s3_md_url?: string | null
  [key: string]: unknown
}

type UploadResult = {
  success?: boolean
  message?: string
  chunks_created?: number
  vectors_created?: number
  [key: string]: unknown
}

function formatDate(value: string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString()
}

export default function CvPage() {
  const [tabValue, setTabValue] = React.useState(0)
  
  // CV states
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [cvs, setCvs] = React.useState<CvRow[]>([])
  const [uploading, setUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState<number>(0)
  const [deletingId, setDeletingId] = React.useState<number | null>(null)


  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/cv/list')
      setCvs((res.data?.cvs as CvRow[]) || [])
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to load CVs')
      setCvs([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const uploadCv = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    setUploadProgress(0)
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append('cv', file)

    try {
      const res = await api.post('/cv/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          const total = evt.total || 0
          if (!total) return
          setUploadProgress(Math.round((evt.loaded / total) * 100))
        },
      })

      const data = res.data as UploadResult
      const summary = [
        data.message,
        typeof data.chunks_created === 'number' ? `chunks: ${data.chunks_created}` : null,
        typeof data.vectors_created === 'number' ? `vectors: ${data.vectors_created}` : null,
      ]
        .filter(Boolean)
        .join(' · ')

      setSuccess(summary || 'CV uploaded and processed')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to upload CV')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const deleteCv = async (row: CvRow) => {
    const ok = await sweetConfirm(`Delete CV “${row.original_filename || row.cv_id}”?`)
    if (!ok) return

    setDeletingId(row.cv_id)
    setError(null)
    setSuccess(null)
    try {
      await api.delete(`/cv/${row.cv_id}`)
      setSuccess('CV deleted')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to delete CV')
    } finally {
      setDeletingId(null)
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[var(--font-plus-jakarta)] text-2xl font-bold text-zinc-900">CV & Resume</h1>
          <p className="mt-1 text-sm text-zinc-600">Upload your CV or generate a professional resume from your profile.</p>
        </div>
        {tabValue === 0 && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={load} disabled={loading}>
              Refresh
            </Button>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-0 border-b border-zinc-200">
        <button
          onClick={() => {
            setTabValue(0)
            setError(null)
            setSuccess(null)
          }}
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            tabValue === 0
              ? 'border-b-2 border-brand-700 text-brand-700'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          Upload CV
        </button>
        <button
          onClick={() => {
            setTabValue(1)
            setError(null)
            setSuccess(null)
          }}
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            tabValue === 1
              ? 'border-b-2 border-brand-700 text-brand-700'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          Resume Builder
        </button>
      </div>

      {/* Tab 0: Upload CV */}
      {tabValue === 0 && (
        <>
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

          <Card className="bg-white/60">
            <CardHeader>
              <CardTitle className="text-base">Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="inline-flex">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    void uploadCv(file)
                    e.currentTarget.value = ''
                  }}
                />
                <Button type="button" disabled={uploading}>
                  {uploading ? 'Uploading…' : 'Choose file & upload'}
                </Button>
              </label>
              {uploading ? (
                <div className="text-sm text-zinc-600">Upload progress: {uploadProgress}%</div>
              ) : (
                <div className="text-sm text-zinc-600">Allowed: PDF, DOCX, DOC, TXT (max 10MB)</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/60">
            <CardHeader>
              <CardTitle className="text-base">Your CVs</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm text-zinc-600">Loading…</div>
              ) : cvs.length === 0 ? (
                <div className="text-sm text-zinc-600">No CVs uploaded yet.</div>
              ) : (
                <div className="space-y-3">
                  {cvs.map((cv) => (
                    <div key={cv.cv_id} className="rounded-2xl border border-white/70 bg-white/70 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-zinc-900">
                            {cv.original_filename || `CV #${cv.cv_id}`}
                          </div>
                          {cv.created_at ? <div className="text-xs text-zinc-600">{formatDate(cv.created_at)}</div> : null}
                          <div className="flex flex-wrap gap-3 text-sm">
                            {cv.s3_url ? (
                              <a className="text-brand-700 underline" href={cv.s3_url} target="_blank" rel="noreferrer">
                                Original
                              </a>
                            ) : null}
                            {cv.s3_md_url ? (
                              <a className="text-brand-700 underline" href={cv.s3_md_url} target="_blank" rel="noreferrer">
                                Markdown
                              </a>
                            ) : null}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          disabled={deletingId === cv.cv_id}
                          onClick={() => void deleteCv(cv)}
                        >
                          {deletingId === cv.cv_id ? 'Deleting…' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Tab 1: Resume Builder */}
      {tabValue === 1 && <ResumeBuilderForm />}
    </div>
  )
}
