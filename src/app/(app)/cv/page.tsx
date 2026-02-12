// 'use client'

import Image from "next/image";
import { CiHeart } from "react-icons/ci";
import { FaArrowLeft, FaArrowRight, FaRegImage } from "react-icons/fa";
import { GoArrowLeft, GoArrowRight } from "react-icons/go";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";

// import * as React from 'react'
// import dynamic from 'next/dynamic'
// import { api } from '@/lib/api'
// import { getApiErrorMessage } from '@/lib/error'
// import { Button } from '@/components/ui/button'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { sweetConfirm } from '@/lib/swal' 

// const ResumeBuilderForm = dynamic(
//   () => import('@/components/resume/ResumeBuilderFormV2').then((mod) => ({ default: mod.default })),
//   { ssr: false }
// )

// type CvRow = {
//   cv_id: number
//   original_filename?: string | null
//   created_at?: string | null
//   s3_url?: string | null
//   s3_md_url?: string | null
//   [key: string]: unknown
// }

// type UploadResult = {
//   success?: boolean
//   message?: string
//   chunks_created?: number
//   vectors_created?: number
//   [key: string]: unknown
// }

// function formatDate(value: string | null | undefined): string {
//   if (!value) return ''
//   const d = new Date(value)
//   if (Number.isNaN(d.getTime())) return String(value)
//   return d.toLocaleString()
// }

// export default function CvPage() {
//   const [tabValue, setTabValue] = React.useState(0)

//   // CV states
//   const [loading, setLoading] = React.useState(true)
//   const [error, setError] = React.useState<string | null>(null)
//   const [success, setSuccess] = React.useState<string | null>(null)
//   const [cvs, setCvs] = React.useState<CvRow[]>([])
//   const [uploading, setUploading] = React.useState(false)
//   const [uploadProgress, setUploadProgress] = React.useState<number>(0)
//   const [deletingId, setDeletingId] = React.useState<number | null>(null)


//   const load = React.useCallback(async () => {
//     setLoading(true)
//     setError(null)
//     try {
//       const res = await api.get('/cv/list')
//       setCvs((res.data?.cvs as CvRow[]) || [])
//     } catch (err) {
//       setError(getApiErrorMessage(err) || 'Failed to load CVs')
//       setCvs([])
//     } finally {
//       setLoading(false)
//     }
//   }, [])

//   React.useEffect(() => {
//     load()
//   }, [load])

//   const uploadCv = async (file: File | null) => {
//     if (!file) return
//     setUploading(true)
//     setUploadProgress(0)
//     setError(null)
//     setSuccess(null)

//     const formData = new FormData()
//     formData.append('cv', file)

//     try {
//       const res = await api.post('/cv/upload', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//         onUploadProgress: (evt) => {
//           const total = evt.total || 0
//           if (!total) return
//           setUploadProgress(Math.round((evt.loaded / total) * 100))
//         },
//       })

//       const data = res.data as UploadResult
//       const summary = [
//         data.message,
//         typeof data.chunks_created === 'number' ? `chunks: ${data.chunks_created}` : null,
//         typeof data.vectors_created === 'number' ? `vectors: ${data.vectors_created}` : null,
//       ]
//         .filter(Boolean)
//         .join(' · ')

//       setSuccess(summary || 'CV uploaded and processed')
//       await load()
//     } catch (err) {
//       setError(getApiErrorMessage(err) || 'Failed to upload CV')
//     } finally {
//       setUploading(false)
//       setUploadProgress(0)
//     }
//   }

//   const deleteCv = async (row: CvRow) => {
//     const ok = await sweetConfirm(`Delete CV “${row.original_filename || row.cv_id}”?`)
//     if (!ok) return

//     setDeletingId(row.cv_id)
//     setError(null)
//     setSuccess(null)
//     try {
//       await api.delete(`/cv/${row.cv_id}`)
//       setSuccess('CV deleted')
//       await load()
//     } catch (err) {
//       setError(getApiErrorMessage(err) || 'Failed to delete CV')
//     } finally {
//       setDeletingId(null)
//     }
//   }
//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
//         <div>
//           <h1 className="font-[var(--font-plus-jakarta)] text-2xl font-bold text-zinc-900">CV & Resume</h1>
//           <p className="mt-1 text-sm text-zinc-600">Upload your CV or generate a professional resume from your profile.</p>
//         </div>
//         {tabValue === 0 && (
//           <div className="flex items-center gap-2">
//             <Button variant="secondary" onClick={load} disabled={loading}>
//               Refresh
//             </Button>
//           </div>
//         )}
//       </div>

//       {/* Tab Navigation */}
//       <div className="flex gap-0 border-b border-zinc-200">
//         <button
//           onClick={() => {
//             setTabValue(0)
//             setError(null)
//             setSuccess(null)
//           }}
//           className={`px-4 py-3 text-sm font-medium transition-colors ${
//             tabValue === 0
//               ? 'border-b-2 border-brand-700 text-brand-700'
//               : 'text-zinc-600 hover:text-zinc-900'
//           }`}
//         >
//           Upload CV
//         </button>
//         <button
//           onClick={() => {
//             setTabValue(1)
//             setError(null)
//             setSuccess(null)
//           }}
//           className={`px-4 py-3 text-sm font-medium transition-colors ${
//             tabValue === 1
//               ? 'border-b-2 border-brand-700 text-brand-700'
//               : 'text-zinc-600 hover:text-zinc-900'
//           }`}
//         >
//           Resume Builder
//         </button>
//       </div>

//       {/* Tab 0: Upload CV */}
//       {tabValue === 0 && (
//         <>
//           {error ? (
//             <Card className="border-red-200 bg-red-50">
//               <CardContent className="py-4 text-sm text-red-800">{error}</CardContent>
//             </Card>
//           ) : null}

//           {success ? (
//             <Card className="border-emerald-200 bg-emerald-50">
//               <CardContent className="py-4 text-sm text-emerald-900">{success}</CardContent>
//             </Card>
//           ) : null}

//           <Card className="bg-white/60">
//             <CardHeader>
//               <CardTitle className="text-base">Upload</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-3">
//               <label className="inline-flex">
//                 <input
//                   type="file"
//                   accept=".pdf,.doc,.docx,.txt"
//                   className="hidden"
//                   onChange={(e) => {
//                     const file = e.target.files?.[0] || null
//                     void uploadCv(file)
//                     e.currentTarget.value = ''
//                   }}
//                 />
//                 <Button type="button" disabled={uploading}>
//                   {uploading ? 'Uploading…' : 'Choose file & upload'}
//                 </Button>
//               </label>
//               {uploading ? (
//                 <div className="text-sm text-zinc-600">Upload progress: {uploadProgress}%</div>
//               ) : (
//                 <div className="text-sm text-zinc-600">Allowed: PDF, DOCX, DOC, TXT (max 10MB)</div>
//               )}
//             </CardContent>
//           </Card>

//           <Card className="bg-white/60">
//             <CardHeader>
//               <CardTitle className="text-base">Your CVs</CardTitle>
//             </CardHeader>
//             <CardContent>
//               {loading ? (
//                 <div className="text-sm text-zinc-600">Loading…</div>
//               ) : cvs.length === 0 ? (
//                 <div className="text-sm text-zinc-600">No CVs uploaded yet.</div>
//               ) : (
//                 <div className="space-y-3">
//                   {cvs.map((cv) => (
//                     <div key={cv.cv_id} className="rounded-2xl border border-white/70 bg-white/70 p-4">
//                       <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
//                         <div className="space-y-1">
//                           <div className="text-sm font-semibold text-zinc-900">
//                             {cv.original_filename || `CV #${cv.cv_id}`}
//                           </div>
//                           {cv.created_at ? <div className="text-xs text-zinc-600">{formatDate(cv.created_at)}</div> : null}
//                           <div className="flex flex-wrap gap-3 text-sm">
//                             {cv.s3_url ? (
//                               <a className="text-brand-700 underline" href={cv.s3_url} target="_blank" rel="noreferrer">
//                                 Original
//                               </a>
//                             ) : null}
//                             {cv.s3_md_url ? (
//                               <a className="text-brand-700 underline" href={cv.s3_md_url} target="_blank" rel="noreferrer">
//                                 Markdown
//                               </a>
//                             ) : null}
//                           </div>
//                         </div>
//                         <Button
//                           type="button"
//                           variant="destructive"
//                           disabled={deletingId === cv.cv_id}
//                           onClick={() => void deleteCv(cv)}
//                         >
//                           {deletingId === cv.cv_id ? 'Deleting…' : 'Delete'}
//                         </Button>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </>
//       )}

//       {/* Tab 1: Resume Builder */}
//       {tabValue === 1 && <ResumeBuilderForm />}
//     </div>
//   )
// }


export default function CvPage() {
  return (
    <main className="min-h-screen p-3 sm:p-8">

      <div className="absolute inset-0 -z-10">
        <div className="absolute left-0 lg:left-1/2 top-0 h-[200px] w-[720px] -translate-x-1/2 rounded-full bg-[#e6cfff] blur-[140px]" />
      </div>
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-0 lg:left-1/2 bottom-0 h-[200px] w-[720px] -translate-x-1/2 rounded-full bg-[#e6cfff] blur-[140px]" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">

        {/* ================= LEFT SIDE ================= */}
        <div className="space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-lg font-semibold text-gray-800">
              Uploaded Resume
            </h2>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Sort by:</span>
              <select className="rounded-lg border px-3 py-1 text-sm focus:outline-none">
                <option>Latest</option>
                <option>Oldest</option>
              </select>
            </div>
          </div>

          {/* Resume Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="rounded-[20px] bg-white border border-purple-200 shadow-[0_10px_30px_rgba(139,92,246,0.15)] overflow-hidden"
              >
                {/* Image Placeholder */}
                <div className="h-40 bg-[#E9D5FF] flex items-center justify-center">
                  <FaRegImage size={50} color={"#AE73F3"} />
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700">
                    Resume Name 03
                  </p>

                  <div className="flex gap-3">
                    <button className="flex-1 rounded-lg border border-[#AE73F3] text-[#AE73F3] text-sm py-1.5 ">
                      View
                    </button>
                    <button className="flex-1 rounded-lg bg-[#AE73F3] text-white text-sm py-1.5">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Upload + ATS Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Upload Verification Doc */}
            <div className="rounded-[20px] bg-white border border-purple-200 p-8 flex flex-col items-center justify-center text-center space-y-3">
              <Image src="/file.svg" alt="" height={30} width={30} className="" />

              <p className="text-sm text-gray-600">
                Drop your files here or{" "}
                <span className="text-purple-600 font-medium cursor-pointer">
                  Click to upload
                </span>
              </p>

              <p className="text-xs text-gray-400">
                PDF, DOCX, PNG or JPG (max. 800x400px)
              </p>
            </div>

            {/* ATS Card */}
            <div className="rounded-[20px] bg-white border border-purple-200 p-3 flex gap-4 items-center">
              <div className="w-1/3 h-full rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 text-xl">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                  <Image src="/file.svg" alt="" height={30} width={30} className="" />
                </div>
              </div>

              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">
                  Try Our Resume Builder!
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  Your CV will be assessed on the basis of parameters.
                </p>

                <button className="mt-3 inline-flex items-center gap-2 rounded-lg bg-purple-500 px-2 sm:px-4 py-2 text-white text-xs sm:text-sm hover:bg-purple-600">
                 Generate Resume <MdOutlineKeyboardArrowRight size={22} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDEBAR ================= */}
        <aside className="rounded-[20px] bg-white border border-purple-200 p-4 shadow-[0_10px_30px_rgba(139,92,246,0.15)]">
          <h3 className="font-semibold text-gray-800 mb-4">
            CVs Templates
          </h3>

          {/* Template Image */}
          <div className="relative rounded-xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4"
              alt="template"
              className="h-56 w-full object-cover"
            />

            <button className="absolute top-3 left-3 bg-white rounded-lg p-2 shadow">
              <CiHeart size={20} />
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm flex items-center gap-1">
              🔥 <b>New</b>
            </span>

            <div className="flex gap-2 items-center justify-center">
              <div className="w-8 h-8 border border-[#AE73F3] rounded-lg flex items-center justify-center cursor-pointer hover:bg-purple-100 transition">
                <FaArrowLeft className="text-[#AE73F3]" />
              </div>

              <div className="w-8 h-8 border border-[#AE73F3] rounded-lg flex items-center justify-center cursor-pointer hover:bg-purple-100 transition">
                <FaArrowRight className="text-[#AE73F3]" />
              </div>
            </div>
          </div>

          <h4 className="mt-4 font-semibold text-gray-800">
            Top Tier CVs Templates
          </h4>

          <p className="text-sm text-gray-500 mt-2">
            Introducing a collection of full ATS friendly and visually appealing
            resume tailored to meet your requirement and development...
          </p>

          <button className="mt-4 rounded-lg bg-purple-500 py-3 text-white text-sm hover:bg-purple-600 flex items-center justify-center w-full sm:w-1/2">
            Browse Template  <MdOutlineKeyboardArrowRight size={22} />
          </button>
        </aside>
      </div>
    </main>
  );
}
