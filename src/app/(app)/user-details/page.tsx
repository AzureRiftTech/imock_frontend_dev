// 'use client'

// import * as React from 'react'
// import { useRouter } from 'next/navigation'
// import { api, getApiBaseUrl } from '@/lib/api'
// import { getApiErrorMessage } from '@/lib/error'
// import { Button } from '@/components/ui/button'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'

// type UserDetails = {
//   user_details_id?: number
//   user_id?: number
//   current_role?: 'Student' | 'Fresher' | 'Professional' | string
//   full_name?: string
//   headline?: string
//   bio?: string
//   location?: string
//   phone?: string
//   contact_number?: string
//   year_of_passout?: string
//   linkedin?: string
//   github?: string
//   resumes?: string[] | string | null
//   university_name?: string
//   college_name?: string
//   branch?: string
//   skills?: string[] | string | null
//   experience?: string
//   [key: string]: unknown
// }

// function normalizeResumes(details: UserDetails | null): string[] {
//   if (!details) return []
//   const r = details.resumes
//   if (!r) return []
//   if (Array.isArray(r)) return r.map(String)
//   if (typeof r === 'string') {
//     try {
//       const parsed = JSON.parse(r)
//       return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)]
//     } catch {
//       return [r]
//     }
//   }
//   return []
// }

// function normalizeSkills(details: UserDetails | null): string[] {
//   if (!details) return []
//   const s = details.skills
//   if (!s) return []
//   if (Array.isArray(s)) return s.map(String)
//   if (typeof s === 'string') {
//     try {
//       const parsed = JSON.parse(s)
//       return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)]
//     } catch {
//       return [s]
//     }
//   }
//   return []
// }

// function detailsResemblesExisting(details: UserDetails | null): boolean {
//   if (!details) return false
//   if (typeof details.user_details_id === 'number') return true
//   if (typeof details.user_id === 'number') return true
//   return false
// }

// export default function UserDetailsPage() {
//   const router = useRouter()

//   const [loading, setLoading] = React.useState(true)
//   const [saving, setSaving] = React.useState(false)
//   const [uploading, setUploading] = React.useState(false)
//   const [error, setError] = React.useState<string | null>(null)
//   const [success, setSuccess] = React.useState<string | null>(null)

//   const [details, setDetails] = React.useState<UserDetails | null>(null)
//   const [skillInput, setSkillInput] = React.useState('')
//   const [skills, setSkills] = React.useState<string[]>([])
//   const [pendingResumeFiles, setPendingResumeFiles] = React.useState<File[]>([])
//   const uploadInputRef = React.useRef<HTMLInputElement | null>(null)
//   const resumes = normalizeResumes(details)

//   const load = React.useCallback(async () => {
//     setLoading(true)
//     setError(null)
//     try {
//       const res = await api.get('/user-details/me')
//       const loadedDetails = (res.data?.details as UserDetails) || null
//       setDetails(loadedDetails)
//       setSkills(normalizeSkills(loadedDetails))
//     } catch (err) {
//       setError(getApiErrorMessage(err) || 'Failed to load details')
//     } finally {
//       setLoading(false)
//     }
//   }, [])

//   React.useEffect(() => {
//     void load()
//   }, [load])

//   const addSkill = () => {
//     if (skillInput.trim() && !skills.includes(skillInput.trim())) {
//       setSkills((prev) => [...prev, skillInput.trim()])
//       setSkillInput('')
//     }
//   }

//   const removeSkill = (skill: string) => {
//     setSkills((prev) => prev.filter((s) => s !== skill))
//   }

//   const updateDetailsField = (key: keyof UserDetails, value: unknown) => {
//     setDetails((prev) => ({ ...(prev || {}), [key]: value }))
//   }

//   const validateRequiredFields = (): string | null => {
//     const role = details?.current_role

//     if (!role) return 'Please select a current role'
//     if (!details?.full_name?.trim()) return 'Full name is required'

//     if (role === 'Student') {
//       if (!details?.university_name?.trim()) return 'University name is required'
//       if (!details?.college_name?.trim()) return 'College name is required'
//       if (!details?.branch?.trim()) return 'Branch is required'
//       if (!details?.year_of_passout?.trim()) return 'Year of passout is required'
//     }

//     if (role === 'Fresher') {
//       if (!details?.headline?.trim()) return 'Aspiring role is required'
//       if (!details?.contact_number?.trim()) return 'Contact number is required'
//       if (skills.length === 0) return 'At least one skill is required'
//       if (!details?.bio?.trim()) return 'Bio is required'
//     }

//     if (role === 'Professional') {
//       if (!details?.headline?.trim()) return 'Current role is required'
//       if (!details?.contact_number?.trim()) return 'Contact number is required'
//       if (!details?.experience?.trim()) return 'Experience is required'
//       if (skills.length === 0) return 'At least one skill is required'
//     }

//     return null
//   }

//   const saveDetails = async () => {
//     setSaving(true)
//     setError(null)
//     setSuccess(null)

//     const validationError = validateRequiredFields()
//     if (validationError) {
//       setError(validationError)
//       setSaving(false)
//       return
//     }

//     try {
//       // Upload resumes first if any are pending
//       if (pendingResumeFiles.length > 0) {
//         await uploadResumes()
//       }

//       const payload: Record<string, unknown> = { ...(details || {}) }
//       payload.resumes = normalizeResumes(details)
//       payload.skills = JSON.stringify(skills)
//       delete payload.created_at
//       delete payload.updated_at

//       let res: unknown

//       if (detailsResemblesExisting(details)) {
//         res = await api.put('/user-details/me', payload)
//       } else {
//         res = await api.post('/user-details', payload)
//       }

//       setDetails(res.data as UserDetails)
//       setSuccess('Saved. Redirecting to dashboard…')
//       setTimeout(() => router.push('/dashboard'), 600)
//     } catch (err) {
//       setError(getApiErrorMessage(err) || 'Failed to save details')
//     } finally {
//       setSaving(false)
//     }
//   }

//   const handleFileSelection = (files: FileList | null) => {
//     if (!files || files.length === 0) return
//     setPendingResumeFiles(Array.from(files))
//   }

//   const removePendingResume = (index: number) => {
//     setPendingResumeFiles((prev) => prev.filter((_, i) => i !== index))
//   }

//   const uploadResumes = async () => {
//     if (pendingResumeFiles.length === 0) return

//     const formData = new FormData()
//     pendingResumeFiles.forEach((f) => formData.append('resumes', f))

//     setUploading(true)
//     try {
//       await api.post('/user-details/me/resume', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       })
//       setPendingResumeFiles([])
//       await load()
//     } catch (err) {
//       throw err
//     } finally {
//       setUploading(false)
//     }
//   }

//   const currentRole = details?.current_role || ''

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="font-[var(--font-plus-jakarta)] text-2xl font-bold text-zinc-900">User details</h1>
//         <p className="mt-1 text-sm text-zinc-600">Fill in your details to personalize interviews.</p>
//       </div>

//       {error ? (
//         <Card className="border-red-200 bg-red-50">
//           <CardContent className="py-4 text-sm text-red-800">{error}</CardContent>
//         </Card>
//       ) : null}
//       {success ? (
//         <Card className="border-emerald-200 bg-emerald-50">
//           <CardContent className="py-4 text-sm text-emerald-900">{success}</CardContent>
//         </Card>
//       ) : null}

//       <Card className="bg-white/60">
//         <CardHeader>
//           <CardTitle className="text-base">Details</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {loading ? (
//             <div className="text-sm text-zinc-600">Loading…</div>
//           ) : (
//             <div className="grid gap-4 md:grid-cols-2">
//               <div className="grid gap-2">
//                 <Label htmlFor="current_role">Current role <span className="text-red-500">*</span></Label>
//                 <select
//                   id="current_role"
//                   className="h-10 w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 text-sm outline-none focus:border-brand-500"
//                   value={String(details?.current_role || '')}
//                   onChange={(e) => updateDetailsField('current_role', e.target.value)}
//                   required
//                 >
//                   <option value="">Select…</option>
//                   <option value="Student">Student</option>
//                   <option value="Fresher">Fresher</option>
//                   <option value="Professional">Professional</option>
//                 </select>
//               </div>
//               <div className="grid gap-2">
//                 <Label htmlFor="full_name">Full name <span className="text-red-500">*</span></Label>
//                 <Input
//                   id="full_name"
//                   value={String(details?.full_name || '')}
//                   onChange={(e) => updateDetailsField('full_name', e.target.value)}
//                   required
//                 />
//               </div>

//               {/* Student-specific fields */}
//               {currentRole === 'Student' && (
//                 <>
//                   <div className="grid gap-2">
//                     <Label htmlFor="university_name">University name <span className="text-red-500">*</span></Label>
//                     <Input
//                       id="university_name"
//                       value={String(details?.university_name || '')}
//                       onChange={(e) => updateDetailsField('university_name', e.target.value)}
//                       required
//                     />
//                   </div>
//                   <div className="grid gap-2">
//                     <Label htmlFor="college_name">College name <span className="text-red-500">*</span></Label>
//                     <Input
//                       id="college_name"
//                       value={String(details?.college_name || '')}
//                       onChange={(e) => updateDetailsField('college_name', e.target.value)}
//                       required
//                     />
//                   </div>
//                   <div className="grid gap-2">
//                     <Label htmlFor="branch">Branch <span className="text-red-500">*</span></Label>
//                     <Input
//                       id="branch"
//                       value={String(details?.branch || '')}
//                       onChange={(e) => updateDetailsField('branch', e.target.value)}
//                       required
//                     />
//                   </div>
//                   <div className="grid gap-2">
//                     <Label htmlFor="year_of_passout">Year of passout <span className="text-red-500">*</span></Label>
//                     <Input
//                       id="year_of_passout"
//                       value={String(details?.year_of_passout || '')}
//                       onChange={(e) => updateDetailsField('year_of_passout', e.target.value)}
//                       placeholder="2025"
//                       required
//                     />
//                   </div>
//                   <div className="grid gap-2">
//                     <Label htmlFor="contact_number">Contact number</Label>
//                     <Input
//                       id="contact_number"
//                       value={String(details?.contact_number || '')}
//                       onChange={(e) => updateDetailsField('contact_number', e.target.value)}
//                     />
//                   </div>
//                 </>
//               )}

//               {/* Fresher-specific fields */}
//               {currentRole === 'Fresher' && (
//                 <>
//                   <div className="grid gap-2">
//                     <Label htmlFor="headline">Aspiring role <span className="text-red-500">*</span></Label>
//                     <Input
//                       id="headline"
//                       value={String(details?.headline || '')}
//                       onChange={(e) => updateDetailsField('headline', e.target.value)}
//                       placeholder="e.g., Software Developer"
//                       required
//                     />
//                   </div>
//                   <div className="grid gap-2">
//                     <Label htmlFor="contact_number">Contact number <span className="text-red-500">*</span></Label>
//                     <Input
//                       id="contact_number"
//                       value={String(details?.contact_number || '')}
//                       onChange={(e) => updateDetailsField('contact_number', e.target.value)}
//                       required
//                     />
//                   </div>
//                   <div className="grid gap-2 md:col-span-2">
//                     <Label htmlFor="skills">Skills <span className="text-red-500">*</span></Label>
//                     <div className="flex gap-2">
//                       <Input
//                         id="skills"
//                         value={skillInput}
//                         onChange={(e) => setSkillInput(e.target.value)}
//                         onKeyPress={(e) => {
//                           if (e.key === 'Enter') {
//                             e.preventDefault()
//                             addSkill()
//                           }
//                         }}
//                         placeholder="Type a skill and press Enter"
//                       />
//                       <Button type="button" onClick={addSkill} variant="outline">
//                         Add
//                       </Button>
//                     </div>
//                     {skills.length > 0 && (
//                       <div className="flex flex-wrap gap-2 mt-2">
//                         {skills.map((skill) => (
//                           <span
//                             key={skill}
//                             className="inline-flex items-center gap-1 bg-brand-100 text-brand-800 px-3 py-1 rounded-full text-sm"
//                           >
//                             {skill}
//                             <button
//                               type="button"
//                               onClick={() => removeSkill(skill)}
//                               className="hover:text-brand-900"
//                             >
//                               ×
//                             </button>
//                           </span>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 </>
//               )}

//               {/* Professional-specific fields */}
//               {currentRole === 'Professional' && (
//                 <>
//                   <div className="grid gap-2">
//                     <Label htmlFor="headline">Current role <span className="text-red-500">*</span></Label>
//                     <Input
//                       id="headline"
//                       value={String(details?.headline || '')}
//                       onChange={(e) => updateDetailsField('headline', e.target.value)}
//                       placeholder="e.g., Senior Software Engineer"
//                       required
//                     />
//                   </div>
//                   <div className="grid gap-2">
//                     <Label htmlFor="contact_number">Contact number <span className="text-red-500">*</span></Label>
//                     <Input
//                       id="contact_number"
//                       value={String(details?.contact_number || '')}
//                       onChange={(e) => updateDetailsField('contact_number', e.target.value)}
//                       required
//                     />
//                   </div>
//                   <div className="grid gap-2">
//                     <Label htmlFor="experience">Experience <span className="text-red-500">*</span></Label>
//                     <Input
//                       id="experience"
//                       value={String(details?.experience || '')}
//                       onChange={(e) => updateDetailsField('experience', e.target.value)}
//                       placeholder="e.g., 3 years 6 months"
//                       required
//                     />
//                   </div>
//                   <div className="grid gap-2 md:col-span-2">
//                     <Label htmlFor="skills">Skills <span className="text-red-500">*</span></Label>
//                     <div className="flex gap-2">
//                       <Input
//                         id="skills"
//                         value={skillInput}
//                         onChange={(e) => setSkillInput(e.target.value)}
//                         onKeyPress={(e) => {
//                           if (e.key === 'Enter') {
//                             e.preventDefault()
//                             addSkill()
//                           }
//                         }}
//                         placeholder="Type a skill and press Enter"
//                       />
//                       <Button type="button" onClick={addSkill} variant="outline">
//                         Add
//                       </Button>
//                     </div>
//                     {skills.length > 0 && (
//                       <div className="flex flex-wrap gap-2 mt-2">
//                         {skills.map((skill) => (
//                           <span
//                             key={skill}
//                             className="inline-flex items-center gap-1 bg-brand-100 text-brand-800 px-3 py-1 rounded-full text-sm"
//                           >
//                             {skill}
//                             <button
//                               type="button"
//                               onClick={() => removeSkill(skill)}
//                               className="hover:text-brand-900"
//                             >
//                               ×
//                             </button>
//                           </span>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 </>
//               )}

//               {/* Common fields for all roles */}
//               <div className="grid gap-2 md:col-span-2">
//                 <Label htmlFor="bio">Bio {currentRole === 'Fresher' && <span className="text-red-500">*</span>}</Label>
//                 <textarea
//                   id="bio"
//                   className="min-h-24 w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-brand-500"
//                   value={String(details?.bio || '')}
//                   onChange={(e) => updateDetailsField('bio', e.target.value)}
//                   required={currentRole === 'Fresher'}
//                 />
//               </div>
//               <div className="grid gap-2">
//                 <Label htmlFor="location">Location</Label>
//                 <Input
//                   id="location"
//                   value={String(details?.location || '')}
//                   onChange={(e) => updateDetailsField('location', e.target.value)}
//                 />
//               </div>
//               <div className="grid gap-2">
//                 <Label htmlFor="phone">Phone</Label>
//                 <Input
//                   id="phone"
//                   value={String(details?.phone || details?.contact_number || '')}
//                   onChange={(e) => updateDetailsField('phone', e.target.value)}
//                 />
//               </div>
//               <div className="grid gap-2">
//                 <Label htmlFor="linkedin">LinkedIn</Label>
//                 <Input
//                   id="linkedin"
//                   value={String(details?.linkedin || '')}
//                   onChange={(e) => updateDetailsField('linkedin', e.target.value)}
//                 />
//               </div>
//               {/* removed duplicate/malformed fields */}
//               <div className="grid gap-2 md:col-span-2">
//                 <Label htmlFor="github">GitHub</Label>
//                 <Input
//                   id="github"
//                   value={String(details?.github || '')}
//                   onChange={(e) => updateDetailsField('github', e.target.value)}
//                 />
//               </div>

//               <div className="md:col-span-2 flex flex-col gap-4">


//                 {pendingResumeFiles.length > 0 && (
//                   <div className="space-y-2">
//                     <div className="text-xs text-zinc-600 font-medium">Files ready to upload:</div>
//                     {pendingResumeFiles.map((file, idx) => (
//                       <div key={idx} className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl border border-yellow-200">
//                         <span className="text-sm text-zinc-900 truncate flex-1">{file.name}</span>
//                         <button
//                           type="button"
//                           onClick={() => removePendingResume(idx)}
//                           className="text-red-600 hover:text-red-800 ml-2"
//                         >
//                           ×
//                         </button>
//                       </div>
//                     ))}
//                   </div>
//                 )}

//                 {resumes.length > 0 && (
//                   <div className="space-y-2">
//                     <div className="text-xs text-zinc-600 font-medium">Uploaded resumes:</div>
//                     {resumes.map((url, idx) => {
//                       const fullUrl = url.startsWith('http') ? url : `${getApiBaseUrl()}${url}`
//                       return (
//                         <div key={idx} className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-zinc-200">
//                           <a 
//                             href={fullUrl} 
//                             target="_blank" 
//                             rel="noreferrer" 
//                             className="text-sm text-brand-600 hover:underline truncate flex-1"
//                           >
//                             Resume {idx + 1}
//                           </a>
//                         </div>
//                       )
//                     })}
//                   </div>
//                 )}
//               </div>

//               <div className="md:col-span-2 flex items-center justify-end">
//                 <Button onClick={saveDetails} disabled={saving}>
//                   {saving ? 'Saving…' : 'Save & continue'}
//                 </Button>
//               </div>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

"use client";
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/error';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';


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
  const [active, setActive] = useState("student")

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [toast, setToast] = React.useState<string | null>(null)

  const [details, setDetails] = React.useState<UserDetails | null>(null)
  const [skillInput, setSkillInput] = React.useState('')
  const [skills, setSkills] = React.useState<string[]>([])
  const [pendingResumeFiles, setPendingResumeFiles] = React.useState<File[]>([])
  const [agreed, setAgreed] = React.useState(false)
  const uploadInputRef = React.useRef<HTMLInputElement | null>(null)
  const fullNameRef = React.useRef<HTMLInputElement | null>(null)
  const resumes = normalizeResumes(details)

  // const handleInputChange = (e) => {
  //   const { name, value, type, checked } = e.target;
  //   setFormData(prev => ({
  //     ...prev,
  //     [name]: type === 'checkbox' ? checked : value
  //   }));
  // };

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/user-details/me')
      console.log("res", res)
      const loadedDetails = (res.data?.details as UserDetails) || null
      console.log(loadedDetails)
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

  const validateRequiredFields = (d?: UserDetails): string | null => {
    const dd = d || details
    const role = dd?.current_role

    if (!role) return 'Please select a current role'
    if (!dd?.full_name?.trim()) return 'Full name is required'

    if (role === 'Student') {
      if (!dd?.university_name?.trim()) return 'University name is required'
      if (!dd?.college_name?.trim()) return 'College name is required'
      if (!dd?.branch?.trim()) return 'Branch is required'
      if (!dd?.year_of_passout?.trim()) return 'Year of passout is required'
    }

    if (role === 'Fresher') {
      if (!dd?.headline?.trim()) return 'Aspiring role is required'
      if (!dd?.contact_number?.trim()) return 'Contact number is required'
      if (skills.length === 0) return 'At least one skill is required'
      if (!dd?.bio?.trim()) return 'Bio is required'
    }

    if (role === 'Professional') {
      if (!dd?.headline?.trim()) return 'Current role is required'
      if (!dd?.contact_number?.trim()) return 'Contact number is required'
      if (!dd?.experience?.trim()) return 'Experience is required'
      if (skills.length === 0) return 'At least one skill is required'
    }

    return null
  }

  const saveDetails = async () => {
    console.log('saveDetails called', { details, skills, saving })
    setSaving(true)
    setError(null)
    setSuccess(null)

    // Auto-fill bio for Fresher from headline if missing
    let localDetails = details || {}
    const roleForAutofill = localDetails?.current_role
    if (roleForAutofill === 'Fresher' && !(localDetails?.bio || '').trim() && (localDetails?.headline || '').trim()) {
      localDetails = { ...(localDetails || {}), bio: String(localDetails.headline) }
      setDetails(localDetails)
    }

    const validationError = validateRequiredFields(localDetails)
    if (validationError) {
      console.warn('Validation failed:', validationError)
      setError(validationError)
      setSaving(false)
      if (validationError.toLowerCase().includes('full name')) {
        fullNameRef.current?.focus()
      }
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

      console.log('Saving payload:', payload)

      let res: unknown

      try {
        if (detailsResemblesExisting(details)) {
          console.log('Sending PUT /user-details/me')
          res = await api.put('/user-details/me', payload)
        } else {
          console.log('Sending POST /user-details')
          res = await api.post('/user-details', payload)
        }
      } catch (err) {
        console.error('API request failed:', err)
        setError(getApiErrorMessage(err) || 'Failed to save details (network/error)')
        throw err
      }

      console.log('Save response:', res)

      // Accept response with either `{ details: {...} }` or direct object
      const returnedDetails = (() => {
        const r = res as unknown
        if (!r) return null
        const rd = (r as { data?: unknown }).data
        return rd ? ((rd as { details?: unknown }).details ?? rd) : r
      })()
      setDetails(returnedDetails as UserDetails)
      // Update skills state from returned details if available
      if ((returnedDetails as UserDetails | null)?.skills) {
        setSkills(normalizeSkills(returnedDetails as UserDetails))
      }
      // show toast and redirect after short delay so user sees confirmation
      setToast('User details saved')
      setSuccess('Saved. Redirecting to dashboard…')
      setTimeout(() => {
        setToast(null)
        router.push('/dashboard')
      }, 1500)
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
  useEffect(() => {
    console.log('DETAILS:', details)
  }, [details])

  const currentRole = details?.current_role || ''


  return (
    <div className="relative min-h-screen flex items-center justify-center py-20 bg-[#cbb8de]">

      <div
        className="hidden lg:block absolute top-32 xl:right-[10%] w-[200px] h-[200px] z-60"
        style={{
          background:
            "radial-gradient(circle at top right, rgb(149,91,204) 0%, rgb(149,91,204)  60%, transparent 60%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="hidden lg:block absolute bottom-1/4 -left-10 w-[800px] h-[400px] z-60"
        style={{
          background:
            "radial-gradient(circle at top left, rgb(157,104,207) 0%, rgb(168,117,222)  25%, transparent 60%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="hidden lg:block absolute bottom-0 right-0 w-[400px] h-[600px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at bottom right, rgb(168,117,222) 0%, rgb(168,117,222) 30%, transparent 50%)",
          filter: "blur(40px)",
        }}
      />
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl p-8 sm:p-10 relative z-99">

        <div
          className="hidden lg:block absolute bottom-0 -left-32 w-[400px] h-[600px] pointer-events-none -z-10"
          style={{
            background:
              "radial-gradient(circle at bottom right, rgb(236,220,255) 0%, rgb(236,220,255) 30%, transparent 60%)",
            filter: "blur(40px)",
          }}
        />
        <div className="flex items-center justify-center gap-2 mb-8  ">
          <Image
            src="/imock-logo.svg"
            alt="robot"
            width={50}
            height={50}
            className="z-60"

          />
          <h1 className="text-3xl font-bold text-purple-600 z-60">iMock</h1>
        </div>
        <div className="relative w-full bg-gradient-to-b from-[#ecdaff] via-purple-[#ecdaff] to-transparent z-60">
          <div className="text-center mb-8">
            <h2 className="text-[24px] lg:text-[40px] font-bold text-[#292929] mb-2">
              Complete Your Profile
            </h2>
            <p className="text-sm lg:text-[20px] text-[#292929]">
              Tell us a bit about yourself to personalize your experience.
            </p>
          </div>

          {toast && (
            <div className="fixed right-6 top-6 z-50">
              <div className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg">{toast}</div>
            </div>
          )}
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 mt-6">{error}</div>
        ) : null}
        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 mt-6">{success}</div>
        ) : null}

        <div className="flex items-center justify-center gap-3 lg:gap-20 mb-8 w-full ">
          <button
            onClick={() => updateDetailsField('current_role', 'Student')}
            className={`w-full md:w-[20%] px-1 lg:px-2  py-2 lg:py-3 rounded-lg font-semibold transition-all
      ${currentRole === 'Student'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-100 text-[#4C0E87] hover:bg-gray-200'
              }`}
          >
            Student
          </button>

          <button
            onClick={() => updateDetailsField('current_role', 'Fresher')}
            className={`w-full md:w-[20%] px-1 lg:px-2  py-2 lg:py-3  rounded-lg font-semibold transition-all
      ${currentRole === 'Fresher'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-100 text-[#4C0E87] hover:bg-gray-200'
              }`}
          >
            Fresher
          </button>

          <button
            onClick={() => updateDetailsField('current_role', 'Professional')}
            className={`w-full md:w-[20%] px-1 lg:px-2  py-2 lg:py-3  rounded-lg font-semibold transition-all
      ${currentRole === 'Professional'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-100 text-[#4C0E87] hover:bg-gray-200'
              }`}
          >
            Professional
          </button>
        </div>


        {/* Personal Details - Common for all */}
        <div className="mb-6 w-full md:w-2/3 mx-auto">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Personal Details</h3>
          <div>
            <label className="block text-xs text-[#4C0E87] mb-2">Full name <span className="text-red-500">*</span></label>
            <input
              id="full_name"
              ref={fullNameRef}
              value={String(details?.full_name || '')}
              onChange={(e) => updateDetailsField('full_name', e.target.value)}
              required
              type="text"
              placeholder="Enter your full name"
              className="w-full px-4 py-2.5 border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>
        </div>

        {/* Student Fields */}
        {currentRole === 'Student' && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Education</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs text-[#4C0E87] mb-2">University Name</label>
                <input
                  id="university_name"
                  value={String(details?.university_name || '')}
                  onChange={(e) => updateDetailsField('university_name', e.target.value)}
                  required
                  type="text"
                  placeholder="University Name"
                  className="w-full px-4 py-2.5  placeholder-[#9F50E9] border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#4C0E87] mb-2">College Name</label>
                <input
                  id="college_name"
                  value={String(details?.college_name || '')}
                  onChange={(e) => updateDetailsField('college_name', e.target.value)}
                  required
                  type="text"
                  placeholder="Enter College"
                  className="w-full px-4  placeholder-[#9F50E9]  py-2.5 border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#4C0E87] mb-2">Branch Name</label>
                <input
                  id="branch"
                  value={String(details?.branch || '')}
                  onChange={(e) => updateDetailsField('branch', e.target.value)}
                  required
                  type="text"
                  placeholder="Branch"
                  className="w-full px-4 py-2.5 placeholder-[#9F50E9]  border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#4C0E87] mb-2">Passout Year</label>
                {/* <select
                  name="selectYear"
                  value={formData.selectYear}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-500"
                >
                  <option value="">Year/Seminar</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select> */}
                <input
                  type="text"
                  id="year_of_passout"
                  value={String(details?.year_of_passout || '')}
                  onChange={(e) => updateDetailsField('year_of_passout', e.target.value)}
                  placeholder="2025"
                  required
                  className="w-full px-4 py-2.5 placeholder-[#9F50E9]  border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#4C0E87] mb-2">Contact Number</label>
                <input
                  id="contact_number"
                  value={String(details?.contact_number || '')}
                  onChange={(e) => updateDetailsField('contact_number', e.target.value)}
                  type="number"
                  placeholder="9999999999"
                  className="w-full px-4 py-2.5 placeholder-[#9F50E9]  border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

            </div>
          </div>
        )}

        {/* Fresher Fields */}
        {currentRole === 'Fresher' && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Education & Skills</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#4C0E87] mb-2">Headline</label>
                <input
                  type="text"
                  id="headline"
                  value={String(details?.headline || '')}
                  onChange={(e) => updateDetailsField('headline', e.target.value)}
                  placeholder="e.g., Software Developer"
                  required
                  className="w-full px-4 py-2.5 placeholder-[#9F50E9] border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#4C0E87] mb-2">Contact Number</label>
                <input
                  type="number"
                  id="contact_number"
                  value={String(details?.contact_number || '')}
                  onChange={(e) => updateDetailsField('contact_number', e.target.value)}
                  required
                  placeholder="9999999999"
                  className="w-full px-4 py-2.5 placeholder-[#9F50E9] border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <div className="">
                <label className="block text-xs text-[#4C0E87] mb-2">Skills</label>
                <input
                  type="text"
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
                  className="w-full px-4 py-2.5 placeholder-[#9F50E9] border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
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
        )}

        {/* Professional Fields */}
        {currentRole === 'Professional' && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Professional Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#4C0E87] mb-2">Headline</label>
                <input
                  type="text"
                  id="headline"
                  value={String(details?.headline || '')}
                  onChange={(e) => updateDetailsField('headline', e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  required
                  className="w-full px-4 py-2.5 placeholder-[#9F50E9] border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#4C0E87] mb-2">Contact Number</label>
                <input
                  type="text"
                  id="contact_number"
                  value={String(details?.contact_number || '')}
                  onChange={(e) => updateDetailsField('contact_number', e.target.value)}
                  required
                  placeholder="9999999999"
                  className="w-full px-4 py-2.5  placeholder-[#9F50E9] border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#4C0E87] mb-2">Experience</label>
                <input
                  type="text"
                  id="experience"
                  value={String(details?.experience || '')}
                  onChange={(e) => updateDetailsField('experience', e.target.value)}
                  placeholder="e.g., 3 years 6 months"
                  required
                  className="w-full placeholder-[#9F50E9] px-4 py-2.5 border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#4C0E87] mb-2">Skills</label>
                <input
                  type="text"
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
                  className="w-full px-4 py-2.5  placeholder-[#9F50E9] border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex  items-center gap-1 bg-brand-100 text-brand-800 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:text-brand-900 "
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div>
                <label className="block text-xs text-[#4C0E87] mb-2">Bio</label>
                <textarea
                  id="bio"
                  value={String(details?.bio || '')}
                  onChange={(e) => updateDetailsField('bio', e.target.value)}
                  // required={currentRole === 'Fresher'}
                  placeholder="Type your bio"
                  className="w-full px-4  placeholder-[#9F50E9] py-2.5 border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#4C0E87] mb-2">Location</label>
                <input
                  type="text"
                  id="location"
                  value={String(details?.location || '')}
                  onChange={(e) => updateDetailsField('location', e.target.value)}
                  placeholder="location"
                  className="w-full px-4 py-2.5  placeholder-[#9F50E9] border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#4C0E87] mb-2">Phone Number</label>
                <input
                  type="number"
                  id="phone"
                  placeholder='9999999999'
                  value={String(details?.phone || details?.contact_number || '')}
                  onChange={(e) => updateDetailsField('phone', e.target.value)}
                  className="w-full px-4 py-2.5  placeholder-[#9F50E9] border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#4C0E87] mb-2">Linkedin</label>
                <input
                  id="linkedin"
                  value={String(details?.linkedin || '')}
                  placeholder='/https/linkedin.com'
                  onChange={(e) => updateDetailsField('linkedin', e.target.value)}
                  className="w-full px-4 py-2.5 placeholder-[#9F50E9]  border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#4C0E87] mb-2">Github</label>
                <input
                  id="github"
                  placeholder='github'
                  value={String(details?.github || '')}
                  onChange={(e) => updateDetailsField('github', e.target.value)}
                  className="w-full px-4 py-2.5  placeholder-[#9F50E9] border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

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
            </div>

          </div>
        )}

        {/* Terms & Conditions */}
        <div className="mb-6 border border-[#8D38DD]/40 rounded-lg p-2 w-full md:w-[60%] xl:w-[55%]">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-[#9F50E9] rounded focus:ring-purple-500 cursor-pointer accent-purple-600"
            />
            <span className="text-xs text-[#4C0E87]">
              I agree to the <span className="text-purple-600 font-semibold cursor-pointer hover:underline">Terms & Conditions</span> and{' '}
              <span className="text-purple-600 font-semibold cursor-pointer hover:underline">Privacy Policy</span>. I understand that AI services may have limitations.
            </span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex justify-center md:justify-end gap-5 md:gap-10 w-full">
          <button
            className="px-8 md:px-20 py-2  border border-[#8D38DD]/40  bg-[#faf5ff] text-[#8D38DD] rounded-lg font-semibold hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>

          <button
            className={`px-8 md:px-20 py-2 rounded-lg font-semibold transition-all shadow-lg ${!agreed || saving
                ? 'bg-purple-300 text-white cursor-not-allowed'
                : 'bg-[#8D38DD] text-white hover:bg-purple-700'
              }`}
            onClick={saveDetails}
            disabled={saving || !agreed}
          >
            {saving ? 'Submitting…' : "Submit"}
          </button>
        </div>

      </div>
    </div>
  );
}