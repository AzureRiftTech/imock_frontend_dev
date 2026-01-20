'use client'

import { useAuth } from "@/context/auth-context";
import { getApiBaseUrl } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/error";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

// import * as React from 'react'
// import Link from 'next/link'
// import { useRouter } from 'next/navigation'
// import { Github, Linkedin } from 'lucide-react'

// import { Button } from '@/components/ui/button'
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import { FadeIn } from '@/components/motion/fade-in'
// import { getApiBaseUrl } from '@/lib/api'
// import { getApiErrorMessage } from '@/lib/error'
// import { useAuth } from '@/context/auth-context'

// export default function LoginPage() {
//   const router = useRouter()
//   const { login } = useAuth()

//   const [identifier, setIdentifier] = React.useState('')
//   const [password, setPassword] = React.useState('')
//   const [error, setError] = React.useState<string | null>(null)
//   const [submitting, setSubmitting] = React.useState(false)

//   const onSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setError(null)
//     setSubmitting(true)
//     try {
//       const res = await login(identifier, password)
//       const user = res.user
//       if (user && user.email_verified === 0) {
//         router.push('/verify-email')
//       } else {
//         router.push('/dashboard')
//       }
//     } catch (err: unknown) {
//       setError(getApiErrorMessage(err) || 'Failed to sign in')
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   const apiBase = getApiBaseUrl()

//   return (
//     <FadeIn>
//       <Card className="rounded-2xl border-white/70 bg-white/60 shadow-xl backdrop-blur">
//         <CardHeader>
//           <CardTitle className="text-2xl">Sign in</CardTitle>
//           <CardDescription>Welcome back — let’s get you interview-ready.</CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-5">
//           {error ? (
//             <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//               {error}
//             </div>
//           ) : null}

//           <form className="space-y-4" onSubmit={onSubmit}>
//             <div className="space-y-2">
//               <Label htmlFor="identifier">Email or username</Label>
//               <Input
//                 id="identifier"
//                 autoComplete="email"
//                 value={identifier}
//                 onChange={(e) => setIdentifier(e.target.value)}
//                 required
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="password">Password</Label>
//               <Input
//                 id="password"
//                 type="password"
//                 autoComplete="current-password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//               />
//             </div>

//             <Button type="submit" size="lg" className="w-full" disabled={submitting}>
//               {submitting ? 'Signing in…' : 'Sign in'}
//             </Button>

//             <div className="flex items-center justify-between text-sm text-zinc-600">
//               <Link href="/forgot-password" className="hover:text-zinc-900">
//                 Forgot password?
//               </Link>
//               <Link href="/register" className="text-brand-700 hover:text-brand-900">
//                 Create account
//               </Link>
//             </div>
//           </form>

//           <div className="space-y-2">
//             <Button
//               variant="outline"
//               size="lg"
//               className="w-full bg-white/60"
//               onClick={() => {
//                 window.location.href = `${apiBase}/auth/google`
//               }}
//             >
//               Continue with Google
//             </Button>
//             <Button
//               variant="outline"
//               size="lg"
//               className="w-full bg-white/60"
//               onClick={() => {
//                 window.location.href = `${apiBase}/auth/linkedin`
//               }}
//             >
//               <Linkedin className="h-4 w-4" />
//               Continue with LinkedIn
//             </Button>
//             <Button
//               variant="outline"
//               size="lg"
//               className="w-full bg-white/60"
//               onClick={() => {
//                 window.location.href = `${apiBase}/auth/github`
//               }}
//             >
//               <Github className="h-4 w-4" />
//               Continue with GitHub
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </FadeIn>
//   )
// }

export default function Login() {
  const router = useRouter()
  const { login } = useAuth()
  const [authMode, setAuthMode] = React.useState<'login' | 'signup'>('login')
  const [newsletter, setNewsletter] = React.useState(false)
  const [identifier, setIdentifier] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await login(identifier, password)
      const user = res.user
      if (user && user.email_verified === 0) {
        router.push('/verify-email')
      } else if (!res.hasDetails) {
        router.push('/user-details')
      } else {
        router.push('/dashboard')
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || 'Failed to sign in')
    } finally {
      setSubmitting(false)
    }
  }

  const apiBase = getApiBaseUrl()
  return (
    <section className="mx-auto relative max-w-7xl py-16 sm:py-20 flex flex-col lg:flex-row justify-between items-center gap-40 lg:gap-40">
      <div className="">
        <p className="text-[40px] xl:text-[60px] font-semibold text-start">Secure Your Next <br /><span className="text-[#9F50E9]">Job with Confidence</span></p>
        <div className="flex justify-between mt-20 ">
          <div className="flex flex-col gap-20 lg:gap-40 mr-10">
            <div className="relative rounded-2xl bg-white px-4 py-5 shadow-[0_20px_40px_rgba(168,85,247,0.25)]">
              <p className="text-[11px] md:text-xs font-medium text-[#4C0E87] text-center">
                Trusted user
              </p>

              <p className=" text-center mt-1 text-[20px] md:text-[26px] font-extrabold leading-none text-[#1F2E47]">
                125<span className="text-[#8D38DD]">K</span>
              </p>

              <button className="absolute underline left-5 right-5 -bottom-5 rounded-lg bg-gradient-to-r from-purple-500 to-purple-700 py-1.5  text-[9px] md:text-[11px] font-semibold text-white shadow">
                Join Now
              </button>
            </div>
            <div className="w-full flex flex-col bg-white shadow-2xl rounded-full px-8 py-2 items-center justify-center">
              <p className="text-[10px] md:text-xs font-medium  text-[#4C0E87]"> Role Based Segment</p>
              <p className="text-[#8D38DD]  text-xl md:text-2xl font-bold">450+</p>
            </div>
          </div>
          <Image
            src="/robot3.svg"
            alt="robot"
            width={50}
            height={50}
            className=" w-[340px] sm:w-[360px] lg:w-[300px] xl:w-[470px] object-contain absolute ml-10 sm:ml-24  sm:top-[18%] lg:top-[37%]"

          />

          <div className="flex flex-col justify-between">
            <div className=" w-[140px] rounded-2xl bg-[#8D38DD] flex flex-col py-8 items-center  ml-40 xl:ml-24">
              <p className="text-[26px] font-extrabold leading-none text-white">
                52+
              </p>
              <p className="text-[10px] md:text-[12px] font-medium text-white text-center">
                Languages to choose
              </p>
            </div>
            <div className="w-[180px] md:w-[200px] relative rounded-xl bg-white px-2 md:px-4 py-3 text-center shadow-[0_18px_40px_rgba(0,0,0,0.12)]  top-16 sm:top-20 lg:top-14  left-28 lg:left-10">
              {/* Avatars */}
              <div className="flex justify-center -space-x-2 ">
                {[1, 2, 3, 4].map((i) => (
                  <Image
                    key={i}
                    src={`/user${i}.svg`}
                    alt="user"
                    width={36}
                    height={36}
                    className="rounded-full border-2 border-white hover:scale-150"
                  />
                ))}
              </div>

              <p className="mt-2 text-sm font-semibold text-[#9F50E9]">
                Rated 4.9/5
              </p>
              <p className="text-xs text-gray-500">
                1,200+ car owners
              </p>
            </div>
          </div>
        </div>
      </div>

      {authMode === 'login' ? (
        <div className="relative w-[420px] rounded-2xl bg-white p-8 shadow-xl">

          <div className="flex gap-2 items-center justify-center">
            <Image
              src="/imock-logo.svg"
              alt="robot"
              width={50}
              height={50}
              className=""

            />
            <h2 className="text-center text-2xl font-bold text-[#9F50E9]">
              iMock
            </h2>

          </div>

          <p className="mt-2 text-center text-lg font-semibold text-[#9F50E9]">
            Welcome Back
          </p>
          <p className="mb-6 text-center text-sm text-gray-500">
            Enter your login details to sign in.
          </p>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-sm text-[#5C13A0]">Email address</label>
              <input
                type="text"
                autoComplete="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="Enter Your Name"
                className="mt-1 w-full placeholder-[#CA98F9] rounded-lg border border-[#5C13A0] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9B5CF6]"
              />
            </div>

            <div>
              <label className="text-sm text-[#5C13A0]">Create Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required

                placeholder="********"
                className="mt-1 w-full rounded-lg placeholder-[#CA98F9] border border-[#5C13A0] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9B5CF6]"
              />
            </div>

            <div className="text-right text-sm text-black">
              Forgot Password
            </div>

            <button className="mt-2 w-full rounded-md bg-[#9F50E9] py-3 text-white" type="submit" disabled={submitting}>
              {submitting ? "Log In ..." : "Log In"}
            </button>

            <div className={`flex gap-4 justify-center items-center text-[#9F50E9] mb-2 md:mb-6`}>
              <span className="w-16  h-0.5 bg-[#9F50E9]/40 " />
              <span className="text-center text-sm text-[#9F50E9]">
                Or sign in with
              </span>
              <span className="w-16 h-0.5 bg-[#9F50E9]/40" />
            </div>

            <div className="flex justify-center items-center gap-4">
              <div className="h-10 w-10  text-center rounded-full bg-gray-100 cursor-pointer" onClick={() => {
                window.location.href = `${apiBase}/auth/google`
              }}>
                <FcGoogle size={40} />
              </div>

              <div className="h-10 w-10 rounded-full text-center bg-gray-100 text-blue-700 cursor-pointer" onClick={() => {
                window.location.href = `${apiBase}/auth/linkedin`
              }}>
                <FaLinkedin size={40} />
              </div>
              <div className="h-10 w-10 rounded-full text-center bg-gray-100 cursor-pointer" onClick={() => {
                window.location.href = `${apiBase}/auth/github`
              }} >
                <FaGithub size={40} />
              </div>
            </div>
            <div className="flex justify-center items-center gap-10">
              <p className="mt-4 underline text-center text-xs text-gray-400">
                Terms of Service
              </p>

              <p className="mt-4 underline  text-center text-xs text-gray-400">
                privacy Policy
              </p>
            </div>

            <p className="text-center text-gray-600 text-sm">
              Don’t have an account?{" "}
              <span className="text-black font-semibold cursor-pointer" onClick={() => setAuthMode('signup')}>Sign up</span>
            </p>
          </form>

          {/* Bottom Robot Placeholder */}
          <div className=" hidden  md:block absolute -right-32 lg:-right-48 -bottom-16 lg:-bottom-32" >
            <Image
              src="/robot4.svg"
              alt="robot"
              width={200}
              height={200}
              className="h-auto w-[70%] lg:w-[100%]"

            />
          </div>
        </div>
      ) : (
        <div className="relative w-[420px] rounded-2xl bg-white p-8 shadow-xl">
          <div className="flex gap-2 items-center justify-center">
            <Image
              src="/imock-logo.svg"
              alt="robot"
              width={50}
              height={50}
              className=""

            />
            <h2 className="text-center text-2xl font-bold text-[#9F50E9]">
              iMock
            </h2>

          </div>
          <p className="mb-6 text-center text-sm text-[#9F50E9] mt-2">
            Enter your login details to sign in.
          </p>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-sm text-[#5C13A0]">First Name</label>
              <input
                type="text"
                required
                placeholder="First Name"
                className="mt-1 w-full placeholder-[#CA98F9] rounded-lg border border-[#5C13A0] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9B5CF6]"
              />
            </div>

            <div>
              <label className="text-sm text-[#5C13A0]">Last Name</label>
              <input
                type="text"
                required
                placeholder="Last Name"
                className="mt-1 w-full placeholder-[#CA98F9] rounded-lg border border-[#5C13A0] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9B5CF6]"
              />
            </div>

            <div>
              <label className="text-sm text-[#5C13A0]">Email address</label>
              <input
                type="text"
                autoComplete="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="Enter Your Name"
                className="mt-1 w-full placeholder-[#CA98F9] rounded-lg border border-[#5C13A0] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9B5CF6]"
              />
            </div>

            <div>
              <label className="text-sm text-[#5C13A0]">Phone Number</label>
              <input
                type="text"
                required
                placeholder="Phone number"
                className="mt-1 w-full placeholder-[#CA98F9] rounded-lg border border-[#5C13A0] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9B5CF6]"
              />
            </div>

            <div>
              <label className="text-sm text-[#5C13A0]">Create Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required

                placeholder="********"
                className="mt-1 w-full rounded-lg placeholder-[#CA98F9] border border-[#5C13A0] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9B5CF6]"
              />
            </div>

            <div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => setNewsletter(!newsletter)}
            >
              <div
                className={`h-4 w-4 rounded border flex items-center justify-center transition
      ${newsletter ? 'bg-[#9F50E9] border-[#9F50E9]' : 'border-gray-400'}
    `}
              >
                {newsletter && (
                  <svg
                    className="h-3 w-3 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              <span className="text-sm text-black">
                Sign me up for newsletters
              </span>
            </div>

            <button className="mt-2 w-full rounded-md bg-[#9F50E9] py-3 text-white" type="submit" disabled={submitting}>
              {submitting ? "Sign up ..." : "Sign up"}
            </button>

            <div className={`flex gap-4 justify-center items-center text-[#9F50E9] mb-2 md:mb-6`}>
              <span className="w-16  h-0.5 bg-[#9F50E9]/40 " />
              <span className="text-center text-sm text-[#9F50E9]">
                Or sign in with
              </span>
              <span className="w-16 h-0.5 bg-[#9F50E9]/40" />
            </div>

            <div className="flex justify-center items-center gap-4">
              <div className="h-10 w-10  text-center rounded-full bg-gray-100 cursor-pointer" onClick={() => {
                window.location.href = `${apiBase}/auth/google`
              }}>
                <FcGoogle size={40} />
              </div>

              <div className="h-10 w-10 rounded-full text-center bg-gray-100 text-blue-700 cursor-pointer" onClick={() => {
                window.location.href = `${apiBase}/auth/linkedin`
              }}>
                <FaLinkedin size={40} />
              </div>
              <div className="h-10 w-10 rounded-full text-center bg-gray-100 cursor-pointer" onClick={() => {
                window.location.href = `${apiBase}/auth/github`
              }} >
                <FaGithub size={40} />
              </div>
            </div>
            <div className="flex justify-center items-center gap-10">
              <p className="mt-4 underline text-center text-xs text-gray-400">
                Terms of Service
              </p>

              <p className="mt-4 underline  text-center text-xs text-gray-400">
                privacy Policy
              </p>
            </div>

            <p className="text-center text-gray-600 text-sm">
             Already have an account? {" "}
              <span className="text-black font-semibold cursor-pointer" onClick={() => setAuthMode('login')}>Log in</span>
            </p>
          </form>

          {/* Bottom Robot Placeholder */}
          <div className=" hidden  md:block absolute -right-32 lg:-right-48 -bottom-16 lg:-bottom-32" >
            <Image
              src="/robot4.svg"
              alt="robot"
              width={200}
              height={200}
              className="h-auto w-[70%] lg:w-[100%]"

            />
          </div>
        </div>
      )}

    </section>

  );
}
