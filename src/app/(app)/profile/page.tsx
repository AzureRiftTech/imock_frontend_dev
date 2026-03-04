// 'use client'

// import * as React from 'react'
// import Link from 'next/link'
// import { api, getApiBaseUrl } from '@/lib/api'
// import { getApiErrorMessage } from '@/lib/error'
// import { Button } from '@/components/ui/button'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import { sweetConfirm, sweetAlert } from '@/lib/swal' 
// import { useRazorpay } from '@/hooks/useRazorpay'


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

// type CreditPackage = {
//   package_id: number
//   name: string
//   credits: number
//   price_cents: number
// }

// type Subscription = {
//   subscription_id: number
//   plan_id: number
//   plan_name?: string | null
//   plan_type?: string | null
//   end_date: string
//   interval?: string | null
//   price_cents?: number | null
//   credits_allocated?: number | null
// }

// type Invoice = {
//   invoice_id: number
//   invoice_number: string
//   issued_at: string
//   total: number
//   payment_method?: string | null
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

// function formatDate(value: string): string {
//   const d = new Date(value)
//   if (Number.isNaN(d.getTime())) return value
//   return d.toLocaleString()
// }

// function formatMoneyFromCents(cents: number | null | undefined): string {
//   const n = typeof cents === 'number' ? cents : 0
//   return (n / 100).toLocaleString(undefined, { style: 'currency', currency: 'INR' })
// }

// export default function ProfilePage() {
//   const razorpayLoaded = useRazorpay()
//   const [loading, setLoading] = React.useState(true)
//   const [error, setError] = React.useState<string | null>(null)
//   const [success, setSuccess] = React.useState<string | null>(null)

//   const [details, setDetails] = React.useState<UserDetails | null>(null)
//   const [totalCredits, setTotalCredits] = React.useState<number>(0)
//   const [creditPackages, setCreditPackages] = React.useState<CreditPackage[]>([])
//   const [subscription, setSubscription] = React.useState<Subscription | null>(null)
//   const [invoices, setInvoices] = React.useState<Invoice[]>([])
//   const [connections, setConnections] = React.useState<{ provider: string }[]>([])

//   const [saving, setSaving] = React.useState(false)
//   const [uploading, setUploading] = React.useState(false)
//   const [deletingResumeUrl, setDeletingResumeUrl] = React.useState<string | null>(null)
//   const [purchasingPackageId, setPurchasingPackageId] = React.useState<number | null>(null)
//   const [skillInput, setSkillInput] = React.useState('')
//   const [skills, setSkills] = React.useState<string[]>([])

//   const load = React.useCallback(async () => {
//     setLoading(true)
//     setError(null)
//     setSuccess(null)
//     try {
//       const [detailsRes, packagesRes, meRes, subRes, invRes, connsRes] = await Promise.all([
//         api.get('/user-details/me'),
//         api.get('/credits/packages'),
//         api.get('/auth/me'),
//         api.get('/subscriptions/me'),
//         api.get('/subscriptions/invoices/me'),
//         api.get('/auth/connections'),
//       ])

//       setDetails((detailsRes.data?.details as UserDetails) || null)
//       setCreditPackages((packagesRes.data?.packages as CreditPackage[]) || [])
//       setTotalCredits(Number(meRes.data?.total_credits || 0))
//       setSubscription((subRes.data?.subscription as Subscription) || null)
//       setInvoices((invRes.data?.invoices as Invoice[]) || [])
//       setConnections((connsRes.data?.connections as { provider: string }[]) || [])
//       setSkills(normalizeSkills((detailsRes.data?.details as UserDetails) || null))
//     } catch (err) {
//       setError(getApiErrorMessage(err) || 'Failed to load profile')
//     } finally {
//       setLoading(false)
//     }
//   }, [])

//   React.useEffect(() => {
//     load()
//   }, [load])

//   const updateDetailsField = (key: keyof UserDetails, value: unknown) => {
//     setDetails((prev) => ({ ...(prev || {}), [key]: value }))
//   }

//   const addSkill = () => {
//     if (skillInput.trim() && !skills.includes(skillInput.trim())) {
//       setSkills((prev) => [...prev, skillInput.trim()])
//       setSkillInput('')
//     }
//   }

//   const removeSkill = (skill: string) => {
//     setSkills((prev) => prev.filter((s) => s !== skill))
//   }

//   const saveDetails = async () => {
//     setSaving(true)
//     setError(null)
//     setSuccess(null)
//     try {
//       const payload: Record<string, unknown> = { ...(details || {}) }
//       payload.resumes = normalizeResumes(details)
//       payload.skills = JSON.stringify(skills)
//       delete payload.created_at
//       delete payload.updated_at

//       let res
//       if (detailsResemblesExisting(details)) {
//         res = await api.put('/user-details/me', payload)
//       } else {
//         res = await api.post('/user-details', payload)
//       }
//       setDetails(res.data as UserDetails)
//       setSuccess('Profile details saved')
//     } catch (err) {
//       setError(getApiErrorMessage(err) || 'Failed to save profile details')
//     } finally {
//       setSaving(false)
//     }
//   }

//   const uploadResumes = async (files: FileList | null) => {
//     if (!files || files.length === 0) return

//     // client-side validation
//     if (files.length > 5) {
//       setError('You can upload up to 5 files at a time')
//       return
//     }
//     const hasNonPdf = Array.from(files).some((f) => !(f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')))
//     if (hasNonPdf) {
//       setError('Only PDF files are allowed')
//       return
//     }

//     const formData = new FormData()
//     Array.from(files).forEach((f) => formData.append('resumes', f))

//     setUploading(true)
//     setError(null)
//     setSuccess(null)
//     try {
//       await api.post('/user-details/me/resume', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       })
//       setSuccess('Resume uploaded')
//       await load()
//     } catch (err) {
//       setError(getApiErrorMessage(err) || 'Failed to upload resume')
//     } finally {
//       setUploading(false)
//     }
//   }

//   const deleteResume = async (url: string) => {
//     const ok = await sweetConfirm('Delete this resume?')
//     if (!ok) return
//     setDeletingResumeUrl(url)
//     setError(null)
//     setSuccess(null)
//     try {
//       await api.delete('/user-details/me/resume', { data: { url } })
//       setSuccess('Resume deleted')
//       await load()
//     } catch (err) {
//       setError(getApiErrorMessage(err) || 'Failed to delete resume')
//     } finally {
//       setDeletingResumeUrl(null)
//     }
//   }

//   const buyPackage = async (pkg: CreditPackage) => {
//     if (!razorpayLoaded) {
//       setError('Payment gateway not loaded. Please refresh the page.')
//       return
//     }

//     setPurchasingPackageId(pkg.package_id)
//     setError(null)
//     setSuccess(null)

//     try {
//       // Step 1: Create Razorpay order
//       const res = await api.post('/credits/purchase', { package_id: pkg.package_id })
//       const { order_id, amount, currency, key_id, payment_id, prefill } = res.data

//       // Step 2: Open Razorpay checkout
//       const options = {
//         key: key_id,
//         amount: amount,
//         currency: currency,
//         name: 'iMock',
//         description: `${pkg.name} - ${pkg.credits} credits`,
//         order_id: order_id,
//         prefill: prefill,
//         handler: async function (response: any) {
//           // Step 3: Verify payment on backend
//           try {
//             const verifyRes = await api.post('/credits/verify-payment', {
//               razorpay_order_id: response.razorpay_order_id,
//               razorpay_payment_id: response.razorpay_payment_id,
//               razorpay_signature: response.razorpay_signature,
//               payment_id: payment_id
//             })

//             setTotalCredits(Number(verifyRes.data?.total_credits || totalCredits))
//             setSuccess(`Payment successful! ${pkg.credits} credits added to your account.`)

//             // Reload data to refresh invoices
//             await load()
//           } catch (err) {
//             setError(getApiErrorMessage(err) || 'Payment verification failed')
//           } finally {
//             setPurchasingPackageId(null)
//           }
//         },
//         modal: {
//           ondismiss: function () {
//             setPurchasingPackageId(null)
//             setError('Payment cancelled')
//           }
//         },
//         theme: {
//           color: '#3399cc'
//         }
//       }

//       const razorpay = new (window as any).Razorpay(options)
//       razorpay.open()
//     } catch (err) {
//       setError(getApiErrorMessage(err) || 'Failed to initiate payment')
//       setPurchasingPackageId(null)
//     }
//   }

//   const uploadInputRef = React.useRef<HTMLInputElement | null>(null)
//   const resumes = normalizeResumes(details)
//   const connectedProviders = new Set(connections.map((c) => String(c.provider).toLowerCase()))
//   const currentRole = details?.current_role || ''

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
//         <div>
//           <h1 className="font-[var(--font-plus-jakarta)] text-2xl font-bold text-zinc-900">Profile</h1>
//           <p className="mt-1 text-sm text-zinc-600">Manage your details, resumes, and credits.</p>
//         </div>
//         <div className="flex items-center gap-2">
//           <Button variant="secondary" onClick={load} disabled={loading}>
//             Refresh
//           </Button>
//           <Button asChild variant="outline">
//             <Link href="/connected-accounts">Connected accounts</Link>
//           </Button>
//         </div>
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

//       <div className="grid gap-6 lg:grid-cols-3">
//         <Card className="bg-white/60">
//           <CardHeader>
//             <CardTitle className="text-base">Credits</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {loading ? (
//               <div className="text-sm text-zinc-600">Loading…</div>
//             ) : (
//               <div className="text-3xl font-semibold text-zinc-900">{totalCredits}</div>
//             )}
//           </CardContent>
//         </Card>

//         <Card className="bg-white/60">
//           <CardHeader>
//             <CardTitle className="text-base">Subscription</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {loading ? (
//               <div className="text-sm text-zinc-600">Loading…</div>
//             ) : subscription ? (
//               <div className="space-y-1">
//                 <div className="text-sm font-semibold text-zinc-900">
//                   {subscription.plan_name || subscription.plan_type || `Plan #${subscription.plan_id}`}
//                 </div>
//                 <div className="text-sm text-zinc-600">
//                   {formatMoneyFromCents(subscription.price_cents ?? null)} / {subscription.interval || 'monthly'}
//                 </div>
//                 <div className="text-xs text-zinc-600">Active until {formatDate(subscription.end_date)}</div>
//               </div>
//             ) : (
//               <div className="text-sm text-zinc-600">No active plan.</div>
//             )}
//           </CardContent>
//         </Card>

//         <Card className="bg-white/60">
//           <CardHeader>
//             <CardTitle className="text-base">Connections</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-2">
//             <div className="text-sm text-zinc-700">
//               GitHub: <span className="font-medium">{connectedProviders.has('github') ? 'connected' : 'not connected'}</span>
//             </div>
//             <div className="text-sm text-zinc-700">
//               LinkedIn: <span className="font-medium">{connectedProviders.has('linkedin') ? 'connected' : 'not connected'}</span>
//             </div>
//             <div className="text-sm text-zinc-700">
//               Google: <span className="font-medium">{connectedProviders.has('google') ? 'connected' : 'not connected'}</span>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <Card className="bg-white/60">
//         <CardHeader>
//           <CardTitle className="text-base">Profile details</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="grid gap-4 md:grid-cols-2">
//             <div className="grid gap-2">
//               <Label htmlFor="current_role">Current role</Label>
//               <select
//                 id="current_role"
//                 className="h-10 w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 text-sm outline-none focus:border-brand-500"
//                 value={String(details?.current_role || '')}
//                 onChange={(e) => updateDetailsField('current_role', e.target.value)}
//               >
//                 <option value="">Select…</option>
//                 <option value="Student">Student</option>
//                 <option value="Fresher">Fresher</option>
//                 <option value="Professional">Professional</option>
//               </select>
//             </div>
//             <div className="grid gap-2">
//               <Label htmlFor="full_name">Full name</Label>
//               <Input
//                 id="full_name"
//                 value={String(details?.full_name || '')}
//                 onChange={(e) => updateDetailsField('full_name', e.target.value)}
//               />
//             </div>

//             {/* Student-specific fields */}
//             {currentRole === 'Student' && (
//               <>
//                 <div className="grid gap-2">
//                   <Label htmlFor="university_name">University name</Label>
//                   <Input
//                     id="university_name"
//                     value={String(details?.university_name || '')}
//                     onChange={(e) => updateDetailsField('university_name', e.target.value)}
//                   />
//                 </div>
//                 <div className="grid gap-2">
//                   <Label htmlFor="college_name">College name</Label>
//                   <Input
//                     id="college_name"
//                     value={String(details?.college_name || '')}
//                     onChange={(e) => updateDetailsField('college_name', e.target.value)}
//                   />
//                 </div>
//                 <div className="grid gap-2">
//                   <Label htmlFor="branch">Branch</Label>
//                   <Input
//                     id="branch"
//                     value={String(details?.branch || '')}
//                     onChange={(e) => updateDetailsField('branch', e.target.value)}
//                   />
//                 </div>
//                 <div className="grid gap-2">
//                   <Label htmlFor="year_of_passout">Year of passout</Label>
//                   <Input
//                     id="year_of_passout"
//                     value={String(details?.year_of_passout || '')}
//                     onChange={(e) => updateDetailsField('year_of_passout', e.target.value)}
//                     placeholder="2025"
//                   />
//                 </div>
//                 <div className="grid gap-2">
//                   <Label htmlFor="contact_number">Contact number</Label>
//                   <Input
//                     id="contact_number"
//                     value={String(details?.contact_number || '')}
//                     onChange={(e) => updateDetailsField('contact_number', e.target.value)}
//                   />
//                 </div>
//               </>
//             )}

//             {/* Fresher-specific fields */}
//             {currentRole === 'Fresher' && (
//               <>
//                 <div className="grid gap-2">
//                   <Label htmlFor="headline">Aspiring role</Label>
//                   <Input
//                     id="headline"
//                     value={String(details?.headline || '')}
//                     onChange={(e) => updateDetailsField('headline', e.target.value)}
//                     placeholder="e.g., Software Developer"
//                   />
//                 </div>
//                 <div className="grid gap-2">
//                   <Label htmlFor="contact_number">Contact number</Label>
//                   <Input
//                     id="contact_number"
//                     value={String(details?.contact_number || '')}
//                     onChange={(e) => updateDetailsField('contact_number', e.target.value)}
//                   />
//                 </div>
//                 <div className="grid gap-2 md:col-span-2">
//                   <Label htmlFor="skills">Skills</Label>
//                   <div className="flex gap-2">
//                     <Input
//                       id="skills"
//                       value={skillInput}
//                       onChange={(e) => setSkillInput(e.target.value)}
//                       onKeyPress={(e) => {
//                         if (e.key === 'Enter') {
//                           e.preventDefault()
//                           addSkill()
//                         }
//                       }}
//                       placeholder="Type a skill and press Enter"
//                     />
//                     <Button type="button" onClick={addSkill} variant="outline">
//                       Add
//                     </Button>
//                   </div>
//                   {skills.length > 0 && (
//                     <div className="flex flex-wrap gap-2 mt-2">
//                       {skills.map((skill) => (
//                         <span
//                           key={skill}
//                           className="inline-flex items-center gap-1 bg-brand-100 text-brand-800 px-3 py-1 rounded-full text-sm"
//                         >
//                           {skill}
//                           <button
//                             type="button"
//                             onClick={() => removeSkill(skill)}
//                             className="hover:text-brand-900"
//                           >
//                             ×
//                           </button>
//                         </span>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </>
//             )}

//             {/* Professional-specific fields */}
//             {currentRole === 'Professional' && (
//               <>
//                 <div className="grid gap-2">
//                   <Label htmlFor="headline">Current role</Label>
//                   <Input
//                     id="headline"
//                     value={String(details?.headline || '')}
//                     onChange={(e) => updateDetailsField('headline', e.target.value)}
//                     placeholder="e.g., Senior Software Engineer"
//                   />
//                 </div>
//                 <div className="grid gap-2">
//                   <Label htmlFor="contact_number">Contact number</Label>
//                   <Input
//                     id="contact_number"
//                     value={String(details?.contact_number || '')}
//                     onChange={(e) => updateDetailsField('contact_number', e.target.value)}
//                   />
//                 </div>
//                 <div className="grid gap-2">
//                   <Label htmlFor="experience">Experience</Label>
//                   <Input
//                     id="experience"
//                     value={String(details?.experience || '')}
//                     onChange={(e) => updateDetailsField('experience', e.target.value)}
//                     placeholder="e.g., 3 years 6 months"
//                   />
//                 </div>
//                 <div className="grid gap-2 md:col-span-2">
//                   <Label htmlFor="skills">Skills</Label>
//                   <div className="flex gap-2">
//                     <Input
//                       id="skills"
//                       value={skillInput}
//                       onChange={(e) => setSkillInput(e.target.value)}
//                       onKeyPress={(e) => {
//                         if (e.key === 'Enter') {
//                           e.preventDefault()
//                           addSkill()
//                         }
//                       }}
//                       placeholder="Type a skill and press Enter"
//                     />
//                     <Button type="button" onClick={addSkill} variant="outline">
//                       Add
//                     </Button>
//                   </div>
//                   {skills.length > 0 && (
//                     <div className="flex flex-wrap gap-2 mt-2">
//                       {skills.map((skill) => (
//                         <span
//                           key={skill}
//                           className="inline-flex items-center gap-1 bg-brand-100 text-brand-800 px-3 py-1 rounded-full text-sm"
//                         >
//                           {skill}
//                           <button
//                             type="button"
//                             onClick={() => removeSkill(skill)}
//                             className="hover:text-brand-900"
//                           >
//                             ×
//                           </button>
//                         </span>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </>
//             )}

//             {/* Common fields */}
//             <div className="grid gap-2 md:col-span-2">
//               <Label htmlFor="bio">Bio</Label>
//               <textarea
//                 id="bio"
//                 className="min-h-24 w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-brand-500"
//                 value={String(details?.bio || '')}
//                 onChange={(e) => updateDetailsField('bio', e.target.value)}
//               />
//             </div>
//             <div className="grid gap-2">
//               <Label htmlFor="location">Location</Label>
//               <Input
//                 id="location"
//                 value={String(details?.location || '')}
//                 onChange={(e) => updateDetailsField('location', e.target.value)}
//               />
//             </div>
//             <div className="grid gap-2">
//               <Label htmlFor="phone">Phone</Label>
//               <Input
//                 id="phone"
//                 value={String(details?.phone || details?.contact_number || '')}
//                 onChange={(e) => updateDetailsField('phone', e.target.value)}
//                 placeholder="+91 ..."
//               />
//             </div>
//             <div className="grid gap-2">
//               <Label htmlFor="linkedin">LinkedIn</Label>
//               <Input
//                 id="linkedin"
//                 value={String(details?.linkedin || '')}
//                 onChange={(e) => updateDetailsField('linkedin', e.target.value)}
//                 placeholder="https://linkedin.com/in/..."
//               />
//             </div>
//             <div className="grid gap-2">
//               <Label htmlFor="github">GitHub</Label>
//               <Input
//                 id="github"
//                 value={String(details?.github || '')}
//                 onChange={(e) => updateDetailsField('github', e.target.value)}
//                 placeholder="https://github.com/..."
//               />
//             </div>
//             <div className="md:col-span-2 flex items-center justify-end gap-2">
//               <Button onClick={saveDetails} disabled={saving}>
//                 {saving ? 'Saving…' : 'Save details'}
//               </Button>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       <Card className="bg-white/60">
//         <CardHeader>
//           <CardTitle className="text-base">Resumes</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
//             <div className="text-sm text-zinc-600">Upload up to 5 PDF files per request.</div>

//             {/* Hidden file input + Button that opens file chooser via ref (reliable across browsers) */}
//             <input
//               ref={(el) => { uploadInputRef.current = el }}
//               type="file"
//               multiple
//               accept=".pdf,application/pdf"
//               className="hidden"
//               onChange={(e) => {
//                 void uploadResumes(e.target.files)
//                 // reset to allow re-upload same file name
//                 e.currentTarget.value = ''
//               }}
//             />

//             <Button
//               type="button"
//               variant="outline"
//               disabled={uploading}
//               onClick={() => uploadInputRef.current?.click()}
//               aria-label="Upload resumes (PDF)"
//             >
//               {uploading ? 'Uploading…' : 'Upload resumes (PDF)'}
//             </Button>
//           </div>
//           {resumes.length === 0 ? (
//             <div className="text-sm text-zinc-600">No resumes uploaded.</div>
//           ) : (
//             <div className="space-y-2">
//               {resumes.map((url) => {
//                 const fullUrl = url.startsWith('http') ? url : `${getApiBaseUrl()}${url}`
//                 return (
//                 <div key={url} className="flex flex-col gap-2 rounded-2xl border border-white/70 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
//                   <a className="text-sm font-semibold text-brand-700 underline" href={fullUrl} target="_blank" rel="noreferrer">
//                     {url}
//                   </a>
//                   <Button
//                     type="button"
//                     variant="destructive"
//                     disabled={deletingResumeUrl === url}
//                     onClick={() => void deleteResume(url)}
//                   >
//                     {deletingResumeUrl === url ? 'Deleting…' : 'Delete'}
//                   </Button>
//                 </div>
//               )})}  
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       <Card className="bg-white/60">
//         <CardHeader>
//           <CardTitle className="text-base">Buy credits</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {creditPackages.length === 0 ? (
//             <div className="text-sm text-zinc-600">No credit packages available.</div>
//           ) : (
//             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
//               {creditPackages.map((pkg) => (
//                 <div key={pkg.package_id} className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-sm">
//                   <div className="text-sm font-semibold text-zinc-900">{pkg.name}</div>
//                   <div className="mt-1 text-sm text-zinc-600">Credits: {pkg.credits}</div>
//                   <div className="mt-1 text-sm text-zinc-600">{formatMoneyFromCents(pkg.price_cents)}</div>
//                   <div className="mt-4">
//                     <Button
//                       className="w-full"
//                       onClick={() => void buyPackage(pkg)}
//                       disabled={purchasingPackageId === pkg.package_id}
//                     >
//                       {purchasingPackageId === pkg.package_id ? 'Purchasing…' : 'Buy'}
//                     </Button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       <Card className="bg-white/60">
//         <CardHeader>
//           <CardTitle className="text-base">Recent invoices</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {invoices.length === 0 ? (
//             <div className="text-sm text-zinc-600">No invoices yet.</div>
//           ) : (
//             <div className="space-y-3">
//               {invoices.slice(0, 10).map((inv) => (
//                 <div key={inv.invoice_id} className="rounded-2xl border border-white/70 bg-white/70 p-4">
//                   <div className="flex items-start justify-between gap-3">
//                     <div>
//                       <div className="text-sm font-semibold text-zinc-900">{inv.invoice_number}</div>
//                       <div className="mt-1 text-xs text-zinc-600">{formatDate(inv.issued_at)}</div>
//                       {inv.payment_method ? <div className="mt-1 text-xs text-zinc-600">Method: {inv.payment_method}</div> : null}
//                     </div>
//                     <div className="text-sm font-semibold text-zinc-900">
//                       {typeof inv.total === 'number'
//                         ? inv.total.toLocaleString(undefined, { style: 'currency', currency: 'INR' })
//                         : String(inv.total)}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

// function detailsResemblesExisting(details: UserDetails | null): boolean {
//   if (!details) return false
//   if (typeof details.user_details_id === 'number') return true
//   if (typeof details.user_id === 'number') return true
//   return false
// }


'use client'

import * as React from 'react'
import Link from 'next/link'
import { api, getApiBaseUrl } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/error'
import { sweetConfirm, sweetAlert } from '@/lib/swal'
import { useRazorpay } from '@/hooks/useRazorpay'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IoIosLogOut } from 'react-icons/io'

// ─── Types ────────────────────────────────────────────────────────────────────

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
  current_company?: string
  [key: string]: unknown
}

type CreditPackage = {
  package_id: number
  name: string
  credits: number
  price_cents: number
}

type Subscription = {
  subscription_id: number
  plan_id: number
  plan_name?: string | null
  plan_type?: string | null
  end_date: string
  interval?: string | null
  price_cents?: number | null
  credits_allocated?: number | null
}

type Invoice = {
  invoice_id: number
  invoice_number: string
  issued_at: string
  total: number
  payment_method?: string | null
}

type CvRow = {
  cv_id: number
  original_filename: string | null
  resume_name: string | null
  description: string | null
  job_type: string | null
  file_url: string | null
  s3_url: string | null
  local_path: string | null
  created_at: string | null
}

type ArtifactDef = {
  artifact_id: number; name: string; description: string | null
  icon_url: string | null; rarity: string; points_reward: number
}

type UserArtifact = ArtifactDef & {
  id: number; artifact_id: number; count: number
  first_earned_at: string; last_earned_at: string
}

const RARITY_EMOJI: Record<string, string> = {
  legendary: '🌟', epic: '💜', rare: '💎', uncommon: '🟢', common: '⚪',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeResumes(details: UserDetails | null): string[] {
  if (!details) return []
  const r = details.resumes
  if (!r) return []
  if (Array.isArray(r)) return r.map(String)
  if (typeof r === 'string') {
    try {
      const parsed = JSON.parse(r)
      return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)]
    } catch { return [r] }
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
    } catch { return [s] }
  }
  return []
}

function formatDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

function formatMoney(cents: number | null | undefined): string {
  const n = typeof cents === 'number' ? cents : 0
  return (n / 100).toLocaleString(undefined, { style: 'currency', currency: 'INR' })
}

function detailsResemblesExisting(details: UserDetails | null): boolean {
  if (!details) return false
  return typeof details.user_details_id === 'number' || typeof details.user_id === 'number'
}

// ─── Social providers config ──────────────────────────────────────────────────

type SocialProvider = {
  key: string
  label: string
  icon: string
  bg: string
  comingSoon?: boolean
}

const SOCIAL_PROVIDERS: SocialProvider[] = [
  { key: 'google',    label: 'Google',    icon: 'G',  bg: 'bg-red-500' },
  { key: 'github',    label: 'GitHub',    icon: 'GH', bg: 'bg-gray-800' },
  { key: 'linkedin',  label: 'LinkedIn',  icon: 'in', bg: 'bg-blue-700' },
  { key: 'facebook',  label: 'Facebook',  icon: 'f',  bg: 'bg-blue-500',   comingSoon: true },
  { key: 'discord',   label: 'Discord',   icon: 'D',  bg: 'bg-indigo-500', comingSoon: true },
  { key: 'instagram', label: 'Instagram', icon: 'IG', bg: 'bg-pink-500',   comingSoon: true },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const razorpayLoaded = useRazorpay()
  const uploadInputRef = React.useRef<HTMLInputElement | null>(null)

  // ── State ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const [details, setDetails] = React.useState<UserDetails | null>(null)
  const [totalCredits, setTotalCredits] = React.useState<number>(0)
  const [creditPackages, setCreditPackages] = React.useState<CreditPackage[]>([])
  const [subscription, setSubscription] = React.useState<Subscription | null>(null)
  const [invoices, setInvoices] = React.useState<Invoice[]>([])
  const [connections, setConnections] = React.useState<{ provider: string }[]>([])
  const [hasPassword, setHasPassword] = React.useState<boolean | null>(null)
  const [userEmail, setUserEmail] = React.useState<string>('')
  const [cvList, setCvList] = React.useState<CvRow[]>([])
  const [earnedArtifacts, setEarnedArtifacts] = React.useState<UserArtifact[]>([])
  const [deletingCvId, setDeletingCvId] = React.useState<number | null>(null)

  const [saving, setSaving] = React.useState(false)
  const [pwSaving, setPwSaving] = React.useState(false)
  const [pwForm, setPwForm] = React.useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [uploading, setUploading] = React.useState(false)
  const [deletingResumeUrl, setDeletingResumeUrl] = React.useState<string | null>(null)
  const [purchasingPackageId, setPurchasingPackageId] = React.useState<number | null>(null)
  const [skillInput, setSkillInput] = React.useState('')
  const [skills, setSkills] = React.useState<string[]>([])

  type RefData = {
    college: string[]; university: string[]; branch: string[]
    skill: string[]; location: string[]; company: string[]
  }
  const [refData, setRefData] = React.useState<RefData>({
    college: [], university: [], branch: [], skill: [], location: [], company: [],
  })

  React.useEffect(() => {
    api.get('/ref-data/all').then((res) => {
      if (res.data) setRefData(res.data as RefData)
    }).catch(() => {})
  }, [])

  const [currentIndex, setCurrentIndex] = React.useState<number>(0)
  const [animating, setAnimating] = React.useState(false)
  const [direction, setDirection] = React.useState<'left' | 'right'>('right')
  const [visible, setVisible] = React.useState(true)

  // ── Data loading ───────────────────────────────────────────────────────────
  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const [detailsRes, packagesRes, meRes, subRes, invRes, connsRes, cvsRes, artifactsRes] = await Promise.all([
        api.get('/user-details/me'),
        api.get('/credits/packages'),
        api.get('/auth/me'),
        api.get('/subscriptions/me'),
        api.get('/subscriptions/invoices/me'),
        api.get('/auth/connections'),
        api.get('/cv').catch(() => ({ data: [] })),
        api.get('/artifacts/mine').catch(() => ({ data: [] })),
      ])
      const d = (detailsRes.data?.details as UserDetails) || null
      setDetails(d)
      setCreditPackages((packagesRes.data?.packages as CreditPackage[]) || [])
      setTotalCredits(Number(meRes.data?.total_credits || 0))
      setSubscription((subRes.data?.subscription as Subscription) || null)
      setInvoices((invRes.data?.invoices as Invoice[]) || [])
      setConnections((connsRes.data?.connections as { provider: string }[]) || [])
      setHasPassword(meRes.data?.user?.has_password ?? null)
      setUserEmail(meRes.data?.user?.email || meRes.data?.email || '')
      setCvList(Array.isArray(cvsRes.data) ? (cvsRes.data as CvRow[]) : (cvsRes.data?.cvs as CvRow[]) || [])
      setEarnedArtifacts(Array.isArray(artifactsRes.data) ? (artifactsRes.data as UserArtifact[]) : [])
      setSkills(normalizeSkills(d))
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { load() }, [load])

  // Re-fetch connections when user returns to this tab (e.g. after OAuth redirect)
  React.useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [load])

  // ── Field helpers ──────────────────────────────────────────────────────────
  const updateField = (key: keyof UserDetails, value: unknown) =>
    setDetails(prev => ({ ...(prev || {}), [key]: value }))

  const addSkill = (skill?: string) => {
    const s = (skill ?? skillInput).trim()
    if (s && !skills.includes(s)) {
      setSkills((prev) => [...prev, s])
      if (!skill) setSkillInput('')
    }
  }
  const removeSkill = (s: string) => setSkills(prev => prev.filter(x => x !== s))

  // ── Save details ───────────────────────────────────────────────────────────
  const saveDetails = async () => {
    setSaving(true); setError(null); setSuccess(null)
    try {
      const payload: Record<string, unknown> = { ...(details || {}) }
      payload.resumes = normalizeResumes(details)
      payload.skills = JSON.stringify(skills)
      delete payload.created_at; delete payload.updated_at

      const res = detailsResemblesExisting(details)
        ? await api.put('/user-details/me', payload)
        : await api.post('/user-details', payload)

      setDetails(res.data as UserDetails)
      setSuccess('Profile saved successfully!')
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  // ── CV / Resume upload & delete ───────────────────────────────────────────
  const ALLOWED_CV_EXTS = ['.pdf', '.docx', '.doc', '.txt']
  const ALLOWED_CV_MIMES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword', 'text/plain',
  ]

  const uploadResumes = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (files.length > 5) { setError('Max 5 files at a time'); return }
    const invalid = Array.from(files).find(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase()
      return !ALLOWED_CV_EXTS.includes(ext) && !ALLOWED_CV_MIMES.includes(f.type)
    })
    if (invalid) { setError('Only PDF, DOCX, DOC, TXT files are allowed'); return }
    setUploading(true); setError(null); setSuccess(null)
    try {
      // Upload each file to /cv (same as CV page) so it appears in CV manager too
      await Promise.all(Array.from(files).map(f => {
        const fd = new FormData()
        fd.append('cv', f)
        fd.append('resume_name', f.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '))
        return api.post('/cv', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      }))
      setSuccess('CV uploaded!')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Upload failed')
    } finally { setUploading(false) }
  }

  const deleteCv = async (cv: CvRow) => {
    if (!(await sweetConfirm(`Delete "${cv.resume_name || cv.original_filename || 'this CV'}"?`))) return
    setDeletingCvId(cv.cv_id); setError(null); setSuccess(null)
    try {
      await api.delete(`/cv/${cv.cv_id}`)
      setSuccess('CV deleted'); await load()
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Delete failed')
    } finally { setDeletingCvId(null) }
  }

  // Legacy per-URL delete (for resumes stored in user-details)
  const deleteResume = async (url: string) => {
    if (!(await sweetConfirm('Delete this resume?'))) return
    setDeletingResumeUrl(url); setError(null); setSuccess(null)
    try {
      await api.delete('/user-details/me/resume', { data: { url } })
      setSuccess('Resume deleted'); await load()
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Delete failed')
    } finally { setDeletingResumeUrl(null) }
  }

  // ── Buy credits ────────────────────────────────────────────────────────────
  const buyPackage = async (pkg: CreditPackage) => {
    if (!razorpayLoaded) { setError('Payment gateway not ready. Please refresh.'); return }
    setPurchasingPackageId(pkg.package_id); setError(null); setSuccess(null)
    try {
      const res = await api.post('/credits/purchase', { package_id: pkg.package_id })
      const { order_id, amount, currency, key_id, payment_id, prefill } = res.data

      const options = {
        key: key_id, amount, currency,
        name: 'iMock',
        description: `${pkg.name} – ${pkg.credits} credits`,
        order_id, prefill,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: async (response: any) => {
          try {
            const verify = await api.post('/credits/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              payment_id,
            })
            setTotalCredits(Number(verify.data?.total_credits || totalCredits))
            setSuccess(`Payment successful! ${pkg.credits} credits added.`)
            await load()
          } catch (err) {
            setError(getApiErrorMessage(err) || 'Payment verification failed')
          } finally { setPurchasingPackageId(null) }
        },
        modal: { ondismiss: () => { setPurchasingPackageId(null); setError('Payment cancelled') } },
        theme: { color: '#7c3aed' },
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (window as any).Razorpay(options).open()
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Payment initiation failed')
      setPurchasingPackageId(null)
    }
  }

  // ── Connect social provider ──────────────────────────────────────────────
  const connectProvider = async (provider: SocialProvider) => {
    if (provider.comingSoon) {
      await sweetAlert(`${provider.label} integration is coming soon!`)
      return
    }
    const isConn = connectedProviders.has(provider.key)
    const msg = isConn
      ? `Re-connect ${provider.label}?\nYou will be redirected to ${provider.label} to re-authenticate.`
      : `Connect ${provider.label}?\nYou will be redirected to ${provider.label} to authenticate.`
    const ok = await sweetConfirm(msg)
    if (!ok) return
    const base = getApiBaseUrl().replace(/\/$/, '')
    window.location.href = `${base}/auth/${provider.key}`
  }

  const handleSetPassword = async () => {
    if (pwForm.newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setPwSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const payload: Record<string, string> = { newPassword: pwForm.newPassword }
      if (hasPassword) payload.currentPassword = pwForm.currentPassword
      await api.post('/auth/set-password', payload)
      setSuccess(hasPassword ? 'Password changed successfully' : 'Password created! You can now log in with your email and password.')
      setHasPassword(true)
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to set password')
    } finally {
      setPwSaving(false)
    }
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const resumes = normalizeResumes(details)
  const connectedProviders = new Set(connections.map(c => String(c.provider).toLowerCase()))
  const currentRole = details?.current_role || ''

  // Artifacts carousel — use earned artifacts; fall back to placeholder if none loaded yet
  const artifactItems: Array<{ id: number; emoji: string; label: string; iconUrl: string | null }> =
    earnedArtifacts.length > 0
      ? earnedArtifacts.map(a => ({
          id: a.artifact_id,
          emoji: RARITY_EMOJI[a.rarity] ?? '🏅',
          label: a.name,
          iconUrl: a.icon_url,
        }))
      : [
          { id: -1, emoji: '🔒', label: 'No artifacts yet', iconUrl: null },
          { id: -2, emoji: '🎯', label: 'Complete tasks', iconUrl: null },
        ]

  const VISIBLE_COUNT = 2

  const slide = (dir: 'left' | 'right') => {
    if (animating) return
    const maxIndex = Math.max(0, artifactItems.length - VISIBLE_COUNT)
    const nextIndex =
      dir === 'right'
        ? Math.min(currentIndex + 1, maxIndex)
        : Math.max(currentIndex - 1, 0)

    if (nextIndex === currentIndex) return

    setDirection(dir)
    setAnimating(true)
    setVisible(false)

    setTimeout(() => {
      setCurrentIndex(nextIndex)
      setVisible(true)
      setTimeout(() => setAnimating(false), 300)
    }, 200)
  }

  const visibleItems = artifactItems.slice(currentIndex, currentIndex + VISIBLE_COUNT)


  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full  ">

        {/* ── Hero Banner ── */}
        <div className="relative h-40 w-full flex items-center px-6 overflow-hidden rounded-t-lg">
          <Image
            src="/rectangle-profile.svg"
            alt="rectangle"
            fill
            className="object-cover object-center"
          />
          <h1 className="relative z-10 text-white text-3xl font-black leading-tight tracking-tight">
            Never<br />Give Up
          </h1>
        </div>

        {/* ── Profile Header ── */}
        <div className="px-6 pt-4 pb-3 flex flex-col items-start justify-between">
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center w-full'>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-purple-400 flex-shrink-0">
                <img
                  src="/rectangle-profile.svg"
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <p className="font-bold text-[#7B01FF] text-lg">{details?.full_name || 'Your Name'}</p>
                <p className="text-xs text-gray-400">{userEmail || 'Not loaded'}</p>
                <div className="flex items-center gap-3 mt-1">
                </div>
              </div>
            </div>
            <div className='bg-[#9F50E9] rounded-lg flex gap-2 px-5 py-2 items-center mt-3 sm:mt-0'>
              <p className='text-white text-xs'>Sign Out</p>
              <IoIosLogOut size={20} color={"white"} />

            </div>
          </div>
          <div className="flex  flex-col md:flex-row items-start md:item-center md:justify-between w-full mt-5">
            <div className="flex  gap-5 lg:gap-10 mt-5">
              <div className="border border-[#9F50E9]  bg-[#9F50E9]/10 rounded-lg px-5 py-2 h-auto">
                <p className="text-sm text-[#6C1BB8] leading-none">Credits</p>
                <p className="text-purple-600 font-black text-2xl leading-none mt-5">{totalCredits}</p>
              </div>

              <div className="flex justify-between rounded-lg  border border-[#9F50E9]  bg-[#9F50E9]/10 px-5">
                <div className="space-y-1 py-2">
                  <p className="text-sm text-[#6C1BB8] leading-none">Subscription</p>

                  {subscription ? (
                    <>
                      <span className="inline-block bg-purple-100 text-purple-700 text-xl font-semibold py-0.5 rounded-full">
                        {subscription.plan_name || subscription.plan_type || 'Active'}
                      </span>
                      <p className="text-xs text-[#6C1BB8]/70 leading-none mt-0.5">Until {formatDate(subscription.end_date)}</p>
                    </>
                  ) : (
                    <span className="inline-block bg-gray-100 text-gray-500 text-xs font-semibold py-0.5 rounded-full">Free</span>
                  )}
                </div>
                <Image src="/stars.svg" alt="star" height={60} width={60} />
              </div>
            </div>

            {/* Artifacts */}
            <div className="flex items-center justify-center mt-5 md:mt-0">
              <div className="border border-[#9F50E9] flex items-center gap-0 bg-[#9F50E9]/10 rounded-2xl md:px-3 py-3 shadow-sm">
                {visibleItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center">
                    <div
                      className="flex flex-col items-center px-3"
                      style={{
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateX(0)' : direction === 'right' ? 'translateX(-18px)' : 'translateX(18px)',
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                      }}
                    >
                      <span className="text-[#6C1BB8] font-bold text-xs mb-2 whitespace-nowrap max-w-[80px] truncate text-center">
                        {item.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => slide('left')}
                          disabled={currentIndex === 0}
                          className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white disabled:opacity-30 hover:bg-purple-600 transition-colors flex-shrink-0"
                        >
                          <ChevronLeft size={14} strokeWidth={3} />
                        </button>
                        <div className="w-10 md:w-14 h-10 md:h-14 flex items-center justify-center select-none">
                          {item.iconUrl
                            ? <img src={item.iconUrl} alt={item.label} className="w-10 h-10 object-contain" />
                            : <span className="text-4xl">{item.emoji}</span>
                          }
                        </div>
                        <button
                          onClick={() => slide('right')}
                          disabled={currentIndex >= artifactItems.length - VISIBLE_COUNT}
                          className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white disabled:opacity-30 hover:bg-purple-600 transition-colors flex-shrink-0"
                        >
                          <ChevronRight size={14} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                    {idx < visibleItems.length - 1 && (
                      <div className="w-px self-stretch bg-[#9F50E9] mx-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Alert Messages ── */}
        {error && (
          <div className="mx-6 mb-2 bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2 rounded-xl">
            {error}
          </div>
        )}
        {success && (
          <div className="mx-6 mb-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-4 py-2 rounded-xl">
            {success}
          </div>
        )}

        <div className="border-t border-gray-100 mx-6" />

        {/* ── Account Information Form ── */}
        <div className="px-6 py-4">
          <div className='flex gap-1 items-center w-full'>
            <h2 className="text-lg font-bold text-gray-700 mb-3 w-1/6">Account Information</h2>
            <span className='border w-full border-[#9F50E9]/20 h-0.5' />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Full Name */}
            <div>
              <label className="block text-lg text-[#4C0E87] mb-1">Full Name</label>
              <input
                className="w-full border border-[#9F50E9] rounded-lg px-3 py-4 text-sm bg-[#9F50E9]/5  focus:outline-none focus:ring-1 focus:ring-purple-400"
                placeholder="Full Name"
                value={String(details?.full_name || '')}
                onChange={e => updateField('full_name', e.target.value)}
              />
            </div>

            {/* Current Role */}
            <div>
              <label className="block text-lg text-[#4C0E87] mb-1">Current Role</label>
              <select
                className="w-full border border-[#9F50E9] rounded-lg px-3 py-4 text-sm bg-[#9F50E9]/5  focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={String(details?.current_role || '')}
                onChange={e => updateField('current_role', e.target.value)}
              >
                <option value="">Select…</option>
                <option value="Student">Student</option>
                <option value="Fresher">Fresher</option>
                <option value="Professional">Professional</option>
              </select>
            </div>

            {/* Headline / Aspiring Role */}
            <div>
              <label className="block text-lg text-[#4C0E87] mb-1">
                {currentRole === 'Professional' ? 'Job Title' : 'Aspiring Role'}
              </label>
              <input
                className="w-full border border-[#9F50E9] rounded-lg px-3 py-4 text-sm bg-[#9F50E9]/5  focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder={currentRole === 'Professional' ? 'e.g. Senior Engineer' : 'e.g. Software Developer'}
                value={String(details?.headline || '')}
                onChange={e => updateField('headline', e.target.value)}
              />
            </div>

            {/* Student fields */}
            {currentRole === 'Student' && (
              <>
                <div>
                  <label className="block text-lg text-[#4C0E87] mb-1">University</label>
                  <input
                    className="w-full border border-[#9F50E9] rounded-lg px-3 py-4 text-sm bg-[#9F50E9]/5 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="University"
                    value={String(details?.university_name || '')}
                    onChange={e => updateField('university_name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-lg text-[#4C0E87] mb-1">College</label>
                  <input
                    className="w-full border border-[#9F50E9] rounded-lg px-3 py-4 text-sm bg-[#9F50E9]/5 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="College"
                    value={String(details?.college_name || '')}
                    onChange={e => updateField('college_name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-lg text-[#4C0E87] mb-1">Branch</label>
                  <input
                    className="w-full border border-[#9F50E9] rounded-lg px-3 py-4 text-sm bg-[#9F50E9]/5 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="Branch"
                    value={String(details?.branch || '')}
                    onChange={e => updateField('branch', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-lg text-[#4C0E87] mb-1">Passing Year</label>
                  <input
                    className="w-full border border-[#9F50E9] rounded-lg px-3 py-4 text-sm bg-[#9F50E9]/5 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="2025"
                    value={String(details?.year_of_passout || '')}
                    onChange={e => updateField('year_of_passout', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Fresher-specific fields */}
            {currentRole === 'Fresher' && (
              <>
                <div>
                  <label className="block text-lg text-[#4C0E87] mb-1">Contact Number</label>
                  <input
                    className="w-full border border-[#9F50E9] rounded-lg px-3 py-4 text-sm bg-[#9F50E9]/5 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="+91 ..."
                    value={String(details?.contact_number || '')}
                    onChange={e => updateField('contact_number', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Professional-specific fields */}
            {currentRole === 'Professional' && (
              <>
                <div>
                  <label className="block text-lg text-[#4C0E87] mb-1">Experience</label>
                  <input
                    className="w-full border border-[#9F50E9] rounded-lg px-3 py-4 text-sm bg-[#9F50E9]/5 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="e.g. 3 years 6 months"
                    value={String(details?.experience || '')}
                    onChange={e => updateField('experience', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-lg text-[#4C0E87] mb-1">Current Company</label>
                  <input
                    className="w-full border border-[#9F50E9] rounded-lg px-3 py-4 text-sm bg-[#9F50E9]/5 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="e.g. Google, TCS, Infosys"
                    value={String(details?.current_company || '')}
                    onChange={e => updateField('current_company', e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {/* Location + Bio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-lg text-[#4C0E87] mb-1">Location</label>
              <div className="relative">
                <input
                  className="w-full border border-[#9F50E9] rounded-lg px-3 py-4 text-sm bg-[#9F50E9]/5 pr-7 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="City, Country"
                  value={String(details?.location || '')}
                  onChange={e => updateField('location', e.target.value)}
                />
                <span className="absolute right-2 top-2 text-gray-400 text-xs">📍</span>
              </div>
            </div>
            <div>
              <label className="block text-lg text-[#4C0E87] mb-1">Type your Bio</label>
              <textarea
                className="w-full border border-[#9F50E9] rounded-lg px-3 py-4 text-sm bg-[#9F50E9]/5 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                rows={3}
                placeholder="Write something about yourself..."
                value={String(details?.bio || '')}
                onChange={e => updateField('bio', e.target.value)}
              />
            </div>
          </div>

          {/* Phone + LinkedIn + GitHub */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <div>
              <label className="block text-lg text-[#4C0E87] mb-1">Phone Number</label>
              <input
                className="w-full border border-[#9F50E9] rounded-lg px-3 py-4 text-sm bg-[#9F50E9]/5 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="+91 ..."
                value={String(details?.phone || details?.contact_number || '')}
                onChange={e => updateField('phone', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-lg text-[#4C0E87] mb-1">LinkedIn</label>
              <input
                className="w-full border border-[#9F50E9] rounded-lg px-3 py-4 text-sm bg-[#9F50E9]/5 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="linkedin.com/in/..."
                value={String(details?.linkedin || '')}
                onChange={e => updateField('linkedin', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-lg text-[#4C0E87] mb-1">GitHub</label>
              <input
                className="w-full border border-[#9F50E9] rounded-lg px-3 py-4 text-sm bg-[#9F50E9]/5 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="github.com/..."
                value={String(details?.github || '')}
                onChange={e => updateField('github', e.target.value)}
              />
            </div>
          </div>

          {/* Skills (Fresher & Professional) */}
          {(currentRole === 'Fresher' || currentRole === 'Professional') && (
            <div className="mt-3">
              <label className="block text-lg text-[#4C0E87] mb-1">Skills</label>
              <div className="flex gap-2">
                <input
                  className="w-full border border-[#9F50E9] rounded-lg px-3 py-4 text-sm bg-[#9F50E9]/5 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Type a skill and press Enter"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                />
                <button
                  type="button"
                  onClick={() => addSkill()}
                  className="px-4 py-2 text-xs bg-purple-100 text-purple-700 rounded-lg font-semibold hover:bg-purple-200 transition"
                >
                  Add
                </button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {skills.map(skill => (
                    <span key={skill} className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs font-medium">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="hover:text-purple-900 leading-none">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-center md:justify-end gap-3 mt-4">
            <button
              onClick={() => load()}
              className="px-8 py-3 text-sm text-[#9F50E9] border border-[#9F50E9] rounded-lg bg-[#9F50E9]/10"
            >
              Cancel
            </button>
            <button
              onClick={saveDetails}
              disabled={saving}
              className="px-8 py-3 text-sm text-white bg-purple-600 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Submit'}
            </button>
          </div>
        </div>

        <div className="border-t border-gray-100 mx-6" />

        {/* ── Link Account + Upload CV ── */}
        <div className="px-6 py-4 flex  flex-col md:flex-row gap-4">
          {/* Social Connections */}
          <div className="flex-1">
            <div className='flex gap-5 md:gap-1 items-center w-full'>
              <h2 className="text-sm md:text-lg font-bold text-gray-700 mb-3 w-1/6">Link Account</h2>
              <span className='border w-full border-[#9F50E9]/20 h-0.5' />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border border-[#9F50E9] rounded-lg  p-5">
              {SOCIAL_PROVIDERS.map(s => {
                const isConn = connectedProviders.has(s.key)
                return (
                  <div key={s.key} className="flex items-center justify-between rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center text-white text-xs font-bold`}>
                        {s.icon}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{s.label}</p>
                        <p className={`text-xs ${isConn ? 'text-green-500' : s.comingSoon ? 'text-gray-300' : 'text-gray-400'}`}>
                          {isConn ? 'Connected' : s.comingSoon ? 'Coming soon' : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    {/* Clickable toggle — connects or re-connects the provider */}
                    <button
                      type="button"
                      title={s.comingSoon ? 'Coming soon' : isConn ? `Re-connect ${s.label}` : `Connect ${s.label}`}
                      onClick={() => void connectProvider(s)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                        isConn ? 'bg-purple-500' : s.comingSoon ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${isConn ? 'translate-x-4' : 'translate-x-1'}`} />
                    </button>
                  </div>
                )
              })}
            </div>

          </div>

          {/* Upload CV */}
          <div className="w-full md:w-1/5 flex flex-col gap-2 h-48 md:mt-10">
            <input
              ref={el => { uploadInputRef.current = el }}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain"
              className="hidden"
              onChange={e => { void uploadResumes(e.target.files); e.currentTarget.value = '' }}
            />
            <div
              onClick={() => uploadInputRef.current?.click()}
              className="flex-1 border  border-[#9F50E9]  rounded-xl flex flex-col items-center justify-center text-center py-2 px-3 cursor-pointer hover:border-purple-400 transition"
            >
              <div className='bg-[#9F50E9]/20 w-full rounded-lg h-full flex items-center justify-center'>
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center ">
                  <Image src="/file.svg" alt="" height={30} width={30} className="" />
                </div>
              </div>
              <button
                onClick={() => uploadInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-2  mt-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition disabled:opacity-60"
              >
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>
        </div>

        {/* ── CVs / Uploaded Resumes ── show both CV-page uploads and legacy user-details resumes */}
        {(cvList.length > 0 || resumes.length > 0) && (
          <>
            <div className="border-t border-gray-100 mx-6" />
            <div className="px-6 py-4">
              <h2 className="text-sm font-bold text-gray-700 mb-3">Uploaded CVs &amp; Resumes</h2>
              <div className="space-y-2">
                {/* CV-page uploads */}
                {cvList.map(cv => {
                  const displayName = cv.resume_name || cv.original_filename || `CV #${cv.cv_id}`
                  const href = cv.file_url || cv.s3_url
                    ? (cv.file_url || cv.s3_url || '')
                    : cv.local_path
                      ? `${getApiBaseUrl()}/cv/${cv.cv_id}/preview`
                      : null
                  return (
                    <div key={`cv-${cv.cv_id}`} className="flex items-center justify-between bg-purple-50 rounded-xl border border-purple-100 px-3 py-2">
                      <div className="flex flex-col min-w-0">
                        {href
                          ? <a href={href} target="_blank" rel="noreferrer" className="text-xs text-purple-700 underline font-medium truncate max-w-[220px]">{displayName}</a>
                          : <span className="text-xs text-purple-700 font-medium truncate max-w-[220px]">{displayName}</span>
                        }
                        {cv.job_type && <span className="text-[10px] text-gray-400">{cv.job_type}</span>}
                        {cv.created_at && <span className="text-[10px] text-gray-400">{formatDate(cv.created_at)}</span>}
                      </div>
                      <button
                        onClick={() => void deleteCv(cv)}
                        disabled={deletingCvId === cv.cv_id}
                        className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50 transition ml-2 flex-shrink-0"
                      >
                        {deletingCvId === cv.cv_id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  )
                })}
                {/* Legacy user-details resumes not already covered by CV list */}
                {resumes.map(url => {
                  const fullUrl = url.startsWith('http') ? url : `${getApiBaseUrl()}${url}`
                  return (
                    <div key={url} className="flex items-center justify-between bg-gray-50 rounded-xl border border-gray-100 px-3 py-2">
                      <a href={fullUrl} target="_blank" rel="noreferrer" className="text-xs text-purple-700 underline font-medium truncate max-w-[70%]">
                        {url.split('/').pop() || url}
                      </a>
                      <button
                        onClick={() => void deleteResume(url)}
                        disabled={deletingResumeUrl === url}
                        className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50 transition"
                      >
                        {deletingResumeUrl === url ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Credit Packages ── */}
        {creditPackages.length > 0 && (
          <>
            <div className="border-t border-gray-100 mx-6" />
            <div className="px-6 py-4">
              <h2 className="text-sm font-bold text-gray-700 mb-3">Buy Credits</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {creditPackages.map(pkg => (
                  <div key={pkg.package_id} className="rounded-xl border border-purple-100 bg-purple-50 p-3 flex flex-col gap-1">
                    <p className="text-xs font-bold text-gray-800">{pkg.name}</p>
                    <p className="text-lg text-[#4C0E87]">{pkg.credits} credits</p>
                    <p className="text-sm font-bold text-purple-700">{formatMoney(pkg.price_cents)}</p>
                    <button
                      onClick={() => void buyPackage(pkg)}
                      disabled={purchasingPackageId === pkg.package_id}
                      className="mt-1 w-full py-1.5 text-xs bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-60"
                    >
                      {purchasingPackageId === pkg.package_id ? 'Processing…' : 'Buy'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Password Section ── */}
        <>
          <div className="border-t border-gray-100 mx-6" />
          <div className="px-6 py-4">
            <div className='flex gap-1 items-center w-full mb-3'>
              <h2 className="text-lg font-bold text-gray-700 w-auto whitespace-nowrap">{hasPassword ? 'Change Password' : 'Create Password'}</h2>
              <span className='border w-full border-[#9F50E9]/20 h-0.5 ml-2' />
            </div>
            {!hasPassword && (
              <p className="text-sm text-gray-500 mb-3">You signed up with a social account. Add a password so you can also log in with your email.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl">
              {hasPassword && (
                <div>
                  <label className="block text-lg text-[#4C0E87] mb-1">Current Password</label>
                  <input
                    type="password"
                    className="w-full border border-[#9F50E9] rounded-lg px-3 py-4 text-sm bg-[#9F50E9]/5 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="Enter current password"
                    value={pwForm.currentPassword}
                    onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                  />
                </div>
              )}
              <div>
                <label className="block text-lg text-[#4C0E87] mb-1">{hasPassword ? 'New Password' : 'Password'}</label>
                <input
                  type="password"
                  className="w-full border border-[#9F50E9] rounded-lg px-3 py-4 text-sm bg-[#9F50E9]/5 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="At least 8 characters"
                  value={pwForm.newPassword}
                  onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-lg text-[#4C0E87] mb-1">Confirm Password</label>
                <input
                  type="password"
                  className="w-full border border-[#9F50E9] rounded-lg px-3 py-4 text-sm bg-[#9F50E9]/5 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Repeat password"
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <button
                onClick={handleSetPassword}
                disabled={pwSaving}
                className="px-8 py-3 text-sm text-white bg-purple-600 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-60"
              >
                {pwSaving ? 'Saving…' : hasPassword ? 'Change password' : 'Set password'}
              </button>
            </div>
          </div>
        </>

        {/* ── Recent Invoices ── */}
        {invoices.length > 0 && (
          <>
            <div className="border-t border-gray-100 mx-6" />
            <div className="px-6 py-4">
              <h2 className="text-sm font-bold text-gray-700 mb-3">Recent Invoices</h2>
              <div className="space-y-2">
                {invoices.slice(0, 10).map(inv => (
                  <div key={inv.invoice_id} className="flex items-center justify-between bg-gray-50 rounded-xl border border-gray-100 px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{inv.invoice_number}</p>
                      <p className="text-xs text-gray-400">{formatDate(inv.issued_at)}</p>
                      {inv.payment_method && (
                        <p className="text-xs text-gray-400">via {inv.payment_method}</p>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-800">
                      {typeof inv.total === 'number'
                        ? inv.total.toLocaleString(undefined, { style: 'currency', currency: 'INR' })
                        : String(inv.total)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}