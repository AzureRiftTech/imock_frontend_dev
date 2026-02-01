// import Link from 'next/link'
// import { Button } from '@/components/ui/button'
// import { Card } from '@/components/ui/card'

// export default function HomePage() {
//   return (
//     <main className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
//       <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
//         <div className="space-y-6">
//           <p className="inline-flex items-center rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-sm text-brand-900 shadow-sm backdrop-blur">
//             Premium AI interview practice
//           </p>
//           <h1 className="font-[var(--font-plus-jakarta)] text-4xl font-bold tracking-tight text-zinc-900 sm:text-6xl">
//             Practice interviews with{' '}
//             <span className="bg-gradient-to-r from-brand-600 to-fuchsia-500 bg-clip-text text-transparent">
//               calmer confidence
//             </span>
//             .
//           </h1>
//           <p className="max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">
//             iMock helps you simulate real interviews, track progress, and sharpen answers with a friendly AI assistant.
//           </p>
//           <div className="flex flex-col gap-3 sm:flex-row">
//             <Button asChild size="lg" className="shadow-glow">
//               <Link href="/login">Get started</Link>
//             </Button>
//             <Button asChild size="lg" variant="outline" className="bg-white/60">
//               <Link href="/dashboard">Open dashboard</Link>
//             </Button>
//           </div>
//           <div className="grid grid-cols-3 gap-4 pt-6">
//             <Stat label="Avg. setup" value="2 min" />
//             <Stat label="Practice modes" value="3+" />
//             <Stat label="AI insights" value="Instant" />
//           </div>
//         </div>

//         <Card className="rounded-2xl border-white/70 bg-white/60 p-6 shadow-xl backdrop-blur">
//           <div className="space-y-4">
//             <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-white to-brand-50 p-6">
//               <p className="text-sm text-zinc-500">AI Assistant</p>
//               <p className="mt-2 text-lg font-medium text-zinc-900">
//                 “Let’s do a quick behavioral round. I’ll ask 3 questions and score clarity, structure, and impact.”
//               </p>
//             </div>
//             <div className="grid gap-4 sm:grid-cols-2">
//               <MiniCard title="Clarity" value="A-" hint="Clean, direct" />
//               <MiniCard title="Structure" value="B+" hint="STAR-ready" />
//               <MiniCard title="Impact" value="A" hint="Strong metrics" />
//               <MiniCard title="Pace" value="Good" hint="Confident" />
//             </div>
//           </div>
//         </Card>
//       </div>
//     </main>
//   )
// }

// function Stat({ value, label }: { value: string; label: string }) {
//   return (
//     <div className="rounded-2xl border border-white/70 bg-white/50 px-4 py-3 shadow-sm backdrop-blur">
//       <div className="text-xl font-semibold text-zinc-900">{value}</div>
//       <div className="text-xs text-zinc-600">{label}</div>
//     </div>
//   )
// }

// function MiniCard({ title, value, hint }: { title: string; value: string; hint: string }) {
//   return (
//     <div className="rounded-2xl border border-brand-100 bg-white/60 px-4 py-4 shadow-sm">
//       <div className="text-xs font-medium text-zinc-500">{title}</div>
//       <div className="mt-1 text-2xl font-semibold text-zinc-900">{value}</div>
//       <div className="mt-1 text-xs text-zinc-600">{hint}</div>
//     </div>
//   )
// }

"use client";


import Image from "next/image";
import { useRouter } from "next/navigation";

export default function HomePage() {

  const router = useRouter();

  const handleNavigate = () => {
    router.push("/login"); // 👈 login page route
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
      {/* radial glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-0 lg:left-1/2 top-0 h-[220px] w-[720px] -translate-x-1/2 rounded-full bg-purple-400/80 blur-[140px]" />
      </div>

      <div className="w-full px-6 py-20">
        {/* top badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-purple-600 shadow">
            <span className="rounded-full bg-purple-600 px-2 py-0.5 text-xs text-white">
              Features
            </span>
            AI Virtual Assistant
          </div>
        </div>


        <div className="flex flex-col lg:flex-row justify-between items-center w-full gap-5 xl:gap-10">
          <div className="flex flex-row lg:flex-col gap-5 md:gap-20 lg:gap-40 lg:w-[20%]">
            <div className="w-full lg:w-[80%] flex flex-col bg-white shadow-xl rounded-full px-5 py-2 items-center justify-center">
              <p className="text-[11px] md:text-xs font-medium  text-[#4C0E87]"> Role Based Segment</p>
              <p className="text-[#8D38DD]  text-xl md:text-2xl font-bold">450+</p>
            </div>

            <div className="relative w-[50%] rounded-2xl bg-white px-4 py-3 shadow-[0_20px_40px_rgba(168,85,247,0.25)]">
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
          </div>

          <div className="flex flex-col justify-center items-center gap-10 w-full lg:w-[70%] mt-10">
            <p className="text-xl md:text-5xl text-center font-semibold">Land Your <span className="text-[#8D38DD]">Dream Gob </span>With <br />Confidence</p>
            <p className="text-center  text-sm md:text-lg">Prepare for real interviews using our AI-powered mock interview platform designed to adapt to your resume and role. Practice real-world questions, receive instant feedback, and improve your performance with every session.</p>
            <button onClick={handleNavigate} className="rounded-full px-7 py-3 bg-[#8D38DD] text-white shadow-[0_20px_40px_rgba(168,85,247,0.25)]">Start new session</button>
          </div>

          <div className=" relative flex flex-col items-center gap-20 w-full lg:w-[20%] ml-5">

            {/* 52+ CARD */}
            <div className="relative w-[140px] rounded-2xl bg-[#8D38DD] flex flex-col py-4 items-center  md:top-10 lg:-top-10  -right-28 md:-right-40 lg:-right-6">
              <p className="text-[26px] font-extrabold leading-none text-white">
                52+
              </p>
              <p className="text-[10px] font-medium text-white text-center">
                Languages to choose
              </p>
            </div>

            {/* ROBOT */}
            <Image
              src="/robot.svg"
              alt="robot"
              width={50}
              height={50}
              className=" w-[240px] sm:w-[360px] lg:w-[200%] object-contain absolute  lg:right-20  top-6 md:top-10 lg:-top-3 animate-bounce-pause"

            />

            {/* RATING CARD */}
            <div className="relative w-[200px] rounded-xl bg-white px-4 py-3 text-center shadow-[0_18px_40px_rgba(0,0,0,0.12)]  top-16 sm:top-40 lg:top-0 right-8">
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
        <div className="relative  top-40 md:top-80 lg:top-32 flex justify-center items-center">
          {/* Ellipse */}
          <Image
            src="/ellipse.svg"
            alt="Ellipse"
            width={260}
            height={260}
            className="w-full md:w-[70%] h-auto"
          />

          {/* Robot centered inside ellipse */}
          <Image
            src="/robot2.svg"
            alt="Assistant"
            width={200}
            height={200}
            className="absolute inset-0 m-auto h-[50%] w-[50%]  lg:-top-40"
          />

          {/* Labels */}
          <div className="absolute -top-5 w-[25%] md:w-[15%] lg:w-[12%] rounded-lg bg-white border border-[#9333EA]/40 px-2 py-2 text-center text-xs md:text-md text-[#9333EA] shadow font-semibold">
            Real-time AI feedback
          </div>

          <div className="absolute left-0 md:left-20 top-1/3 w-[25%] md:w-[15%] lg:w-[12%] rounded-lg bg-white border border-[#9333EA]/40 px-2 py-2 text-center text-xs md:text-md text-[#9333EA] shadow font-semibold">
            Real-time AI feedback
          </div>

          <div className="absolute right-0 md:right-20  top-1/3 w-[25%] md:w-[15%] lg:w-[12%] rounded-lg bg-white border border-[#9333EA]/40 px-2 py-2 text-center text-xs md:text-md text-[#9333EA] shadow font-semibold">
            Real-time AI feedback
          </div>
        </div>

      </div>

    </section>

  );
}


