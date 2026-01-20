'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { api, getApiBaseUrl } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/error'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type UserDetails = {
  user_details_id?: number
  user_id?: number
  current_role?: 'Student' | 'Fresher' | 'Professional' | string
  full_name?: string
  headline?: string
  bio?: string
  location?: string
  phone?: string
  contact_number?: string
  year_of_passout?: string
  linkedin?: string
  github?: string
  resumes?: string[] | string | null
  university_name?: string
  college_name?: string
  branch?: string
  skills?: string[] | string | null
  experience?: string
  [key: string]: unknown
}

function normalizeResumes(details: UserDetails | null): string[] {
  if (!details) return []
  const r = details.resumes
  if (!r) return []
  if (Array.isArray(r)) return r.map(String)
  if (typeof r === 'string') {
    try {
      const parsed = JSON.parse(r)
      return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)]
    } catch {
      return [r]
    }
  }
  return []
}

function normalizeSkills(details: UserDetails | null): string[] {
  if (!details) return []
  const s = details.skills
  if (!s) return []
  if (Array.isArray(s)) return s.map(String)
  if (typeof s === 'string') {
    try {
      const parsed = JSON.parse(s)
      return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)]
    } catch {
      return [s]
    }
  }
  return []
}

function detailsResemblesExisting(details: UserDetails | null): boolean {
  if (!details) return false
  if (typeof details.user_details_id === 'number') return true
  if (typeof details.user_id === 'number') return true
  return false
}

export default function UserDetailsPage() {
  const router = useRouter()

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const [details, setDetails] = React.useState<UserDetails | null>(null)
  const [skillInput, setSkillInput] = React.useState('')
  const [skills, setSkills] = React.useState<string[]>([])
  const [pendingResumeFiles, setPendingResumeFiles] = React.useState<File[]>([])
  const uploadInputRef = React.useRef<HTMLInputElement | null>(null)
  const resumes = normalizeResumes(details)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/user-details/me')
      const loadedDetails = (res.data?.details as UserDetails) || null
      setDetails(loadedDetails)
      setSkills(normalizeSkills(loadedDetails))
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to load details')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills((prev) => [...prev, skillInput.trim()])
      setSkillInput('')
    }
  }

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill))
  }

  const updateDetailsField = (key: keyof UserDetails, value: unknown) => {
    setDetails((prev) => ({ ...(prev || {}), [key]: value }))
  }

  const validateRequiredFields = (): string | null => {
    const role = details?.current_role
    
    if (!role) return 'Please select a current role'
    if (!details?.full_name?.trim()) return 'Full name is required'
    
    if (role === 'Student') {
      if (!details?.university_name?.trim()) return 'University name is required'
      if (!details?.college_name?.trim()) return 'College name is required'
      if (!details?.branch?.trim()) return 'Branch is required'
      if (!details?.year_of_passout?.trim()) return 'Year of passout is required'
    }
    
    if (role === 'Fresher') {
      if (!details?.headline?.trim()) return 'Aspiring role is required'
      if (!details?.contact_number?.trim()) return 'Contact number is required'
      if (skills.length === 0) return 'At least one skill is required'
      if (!details?.bio?.trim()) return 'Bio is required'
    }
    
    if (role === 'Professional') {
      if (!details?.headline?.trim()) return 'Current role is required'
      if (!details?.contact_number?.trim()) return 'Contact number is required'
      if (!details?.experience?.trim()) return 'Experience is required'
      if (skills.length === 0) return 'At least one skill is required'
    }
    
    return null
  }

  const saveDetails = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    
    const validationError = validateRequiredFields()
    if (validationError) {
      setError(validationError)
      setSaving(false)
      return
    }
    
    try {
      // Upload resumes first if any are pending
      if (pendingResumeFiles.length > 0) {
        await uploadResumes()
      }

      const payload: Record<string, unknown> = { ...(details || {}) }
      payload.resumes = normalizeResumes(details)
      payload.skills = JSON.stringify(skills)
      delete payload.created_at
      delete payload.updated_at

      let res: any

      if (detailsResemblesExisting(details)) {
        res = await api.put('/user-details/me', payload)
      } else {
        res = await api.post('/user-details', payload)
      }

      setDetails(res.data as UserDetails)
      setSuccess('Saved. Redirecting to dashboard…')
      setTimeout(() => router.push('/dashboard'), 600)
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to save details')
    } finally {
      setSaving(false)
    }
  }

  const handleFileSelection = (files: FileList | null) => {
    if (!files || files.length === 0) return
    setPendingResumeFiles(Array.from(files))
  }

  const removePendingResume = (index: number) => {
    setPendingResumeFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadResumes = async () => {
    if (pendingResumeFiles.length === 0) return
    
    const formData = new FormData()
    pendingResumeFiles.forEach((f) => formData.append('resumes', f))

    setUploading(true)
    try {
      await api.post('/user-details/me/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setPendingResumeFiles([])
      await load()
    } catch (err) {
      throw err
    } finally {
      setUploading(false)
    }
  }

  const currentRole = details?.current_role || ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-plus-jakarta)] text-2xl font-bold text-zinc-900">User details</h1>
        <p className="mt-1 text-sm text-zinc-600">Fill in your details to personalize interviews.</p>
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

      <Card className="bg-white/60">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-zinc-600">Loading…</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="current_role">Current role <span className="text-red-500">*</span></Label>
                <select
                  id="current_role"
                  className="h-10 w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 text-sm outline-none focus:border-brand-500"
                  value={String(details?.current_role || '')}
                  onChange={(e) => updateDetailsField('current_role', e.target.value)}
                  required
                >
                  <option value="">Select…</option>
                  <option value="Student">Student</option>
                  <option value="Fresher">Fresher</option>
                  <option value="Professional">Professional</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="full_name">Full name <span className="text-red-500">*</span></Label>
                <Input
                  id="full_name"
                  value={String(details?.full_name || '')}
                  onChange={(e) => updateDetailsField('full_name', e.target.value)}
                  required
                />
              </div>

              {/* Student-specific fields */}
              {currentRole === 'Student' && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="university_name">University name <span className="text-red-500">*</span></Label>
                    <Input
                      id="university_name"
                      value={String(details?.university_name || '')}
                      onChange={(e) => updateDetailsField('university_name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="college_name">College name <span className="text-red-500">*</span></Label>
                    <Input
                      id="college_name"
                      value={String(details?.college_name || '')}
                      onChange={(e) => updateDetailsField('college_name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="branch">Branch <span className="text-red-500">*</span></Label>
                    <Input
                      id="branch"
                      value={String(details?.branch || '')}
                      onChange={(e) => updateDetailsField('branch', e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="year_of_passout">Year of passout <span className="text-red-500">*</span></Label>
                    <Input
                      id="year_of_passout"
                      value={String(details?.year_of_passout || '')}
                      onChange={(e) => updateDetailsField('year_of_passout', e.target.value)}
                      placeholder="2025"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contact_number">Contact number</Label>
                    <Input
                      id="contact_number"
                      value={String(details?.contact_number || '')}
                      onChange={(e) => updateDetailsField('contact_number', e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Fresher-specific fields */}
              {currentRole === 'Fresher' && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="headline">Aspiring role <span className="text-red-500">*</span></Label>
                    <Input
                      id="headline"
                      value={String(details?.headline || '')}
                      onChange={(e) => updateDetailsField('headline', e.target.value)}
                      placeholder="e.g., Software Developer"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contact_number">Contact number <span className="text-red-500">*</span></Label>
                    <Input
                      id="contact_number"
                      value={String(details?.contact_number || '')}
                      onChange={(e) => updateDetailsField('contact_number', e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="skills">Skills <span className="text-red-500">*</span></Label>
                    <div className="flex gap-2">
                      <Input
                        id="skills"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addSkill()
                          }
                        }}
                        placeholder="Type a skill and press Enter"
                      />
                      <Button type="button" onClick={addSkill} variant="outline">
                        Add
                      </Button>
                    </div>
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 bg-brand-100 text-brand-800 px-3 py-1 rounded-full text-sm"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="hover:text-brand-900"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Professional-specific fields */}
              {currentRole === 'Professional' && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="headline">Current role <span className="text-red-500">*</span></Label>
                    <Input
                      id="headline"
                      value={String(details?.headline || '')}
                      onChange={(e) => updateDetailsField('headline', e.target.value)}
                      placeholder="e.g., Senior Software Engineer"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contact_number">Contact number <span className="text-red-500">*</span></Label>
                    <Input
                      id="contact_number"
                      value={String(details?.contact_number || '')}
                      onChange={(e) => updateDetailsField('contact_number', e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="experience">Experience <span className="text-red-500">*</span></Label>
                    <Input
                      id="experience"
                      value={String(details?.experience || '')}
                      onChange={(e) => updateDetailsField('experience', e.target.value)}
                      placeholder="e.g., 3 years 6 months"
                      required
                    />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="skills">Skills <span className="text-red-500">*</span></Label>
                    <div className="flex gap-2">
                      <Input
                        id="skills"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addSkill()
                          }
                        }}
                        placeholder="Type a skill and press Enter"
                      />
                      <Button type="button" onClick={addSkill} variant="outline">
                        Add
                      </Button>
                    </div>
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 bg-brand-100 text-brand-800 px-3 py-1 rounded-full text-sm"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="hover:text-brand-900"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Common fields for all roles */}
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="bio">Bio {currentRole === 'Fresher' && <span className="text-red-500">*</span>}</Label>
                <textarea
                  id="bio"
                  className="min-h-24 w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-brand-500"
                  value={String(details?.bio || '')}
                  onChange={(e) => updateDetailsField('bio', e.target.value)}
                  required={currentRole === 'Fresher'}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={String(details?.location || '')}
                  onChange={(e) => updateDetailsField('location', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={String(details?.phone || details?.contact_number || '')}
                  onChange={(e) => updateDetailsField('phone', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={String(details?.linkedin || '')}
                  onChange={(e) => updateDetailsField('linkedin', e.target.value)}
                />
              </div>
              {/* removed duplicate/malformed fields */}
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="github">GitHub</Label>
                <Input
                  id="github"
                  value={String(details?.github || '')}
                  onChange={(e) => updateDetailsField('github', e.target.value)}
                />
              </div>

              <div className="md:col-span-2 flex flex-col gap-4">
                
                
                {pendingResumeFiles.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-zinc-600 font-medium">Files ready to upload:</div>
                    {pendingResumeFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                        <span className="text-sm text-zinc-900 truncate flex-1">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removePendingResume(idx)}
                          className="text-red-600 hover:text-red-800 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {resumes.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-zinc-600 font-medium">Uploaded resumes:</div>
                    {resumes.map((url, idx) => {
                      const fullUrl = url.startsWith('http') ? url : `${getApiBaseUrl()}${url}`
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-zinc-200">
                          <a 
                            href={fullUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-sm text-brand-600 hover:underline truncate flex-1"
                          >
                            Resume {idx + 1}
                          </a>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 flex items-center justify-end">
                <Button onClick={saveDetails} disabled={saving}>
                  {saving ? 'Saving…' : 'Save & continue'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
