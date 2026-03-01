'use client';

import Image from 'next/image';

const cards = {
  tags: [
    { icon: '🤖', text: 'AI - Based interview' },
    { text: 'Live mock interviews' },
    { text: 'Performance analytics' },
    { text: 'Role-based' },
  ],
};

export default function WhoIsFor() {
  return (
    <div className="min-h-screen mt-24 lg:mt-0">
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-6">

          {/* ================= LEFT COLUMN ================= */}
          <div className="md:w-[30%] space-y-5">

            {/* Students Card */}
            <div className="
              relative flex flex-col justify-between rounded-3xl px-3 py-3 overflow-hidden
              h-[280px] md:h-[300px] xl:h-[320px]
            ">
              <Image
                src="/Assets/Students & Freshers Card.webp"
                alt="Students and freshers preparing for campus placements and entry-level interviews using IMock AI mock interview platform"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 30vw"
              />
              <div className="relative z-10"></div>
              <div className="relative z-10 bg-white rounded-3xl p-4 flex flex-col justify-end
                shadow-[0_10px_30px_rgba(0,0,0,0.12)]
              ">
                <h3 className="text-xl font-bold text-[#9F50E9] mb-3">
                  Students and freshers
                </h3>
                <p className="text-sm text-[#9F50E9] leading-relaxed">
                  Students and freshers preparing for campus placements and entry-level interviews.
                </p>
              </div>
            </div>

            {/* Explore Platform Card */}
            <div className="
              relative flex justify-between items-center rounded-3xl py-8 px-4 overflow-hidden h-[110px]
            ">
              <Image
                src="/Assets/Explore the Platform Card.webp"
                alt="Explore the IMock AI interview platform featuring role-based mock interviews, performance analytics, and live sessions"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 30vw"
              />
              <div className="relative z-10 text-xl xl:text-2xl font-bold text-[#6B21A8] leading-tight px-3 py-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm">
                Explore<br />the Platform
              </div>

              <div className="relative z-10 flex justify-center items-center -space-x-3 bg-[#9F50E9] h-16 rounded-l-full px-2
                shadow-[0_8px_20px_rgba(0,0,0,0.25)] 
              ">
                {[1, 2, 3, 4].map((i) => (
                  <Image
                    key={i}
                    src={`/user${i}.svg`}
                    alt="user"
                    width={36}
                    height={36}
                    className="rounded-full border-2 border-white hover:scale-110 transition "
                  />
                ))}
              </div>
            </div>

            {/* Candidates Card */}
            <div className="
              relative rounded-3xl py-5 px-5 overflow-hidden
              h-[220px]
              shadow-[0_20px_50px_rgba(159,80,233,0.18)]
              transition-all duration-300
            ">
              <Image
                src="/Assets/candidate card.webp"
                alt="AI-based interview practice for job candidates with real-time feedback on answers, clarity, and confidence on IMock"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 30vw"
              />
              <div className="relative z-10 bg-white/80 backdrop-blur-md rounded-2xl px-4 pt-4 pb-2 mb-4 shadow-sm">
                <h3 className="text-xl font-bold text-[#6B21A8] mb-2">
                  Candidates
                </h3>
                <p className="text-sm text-[#6B21A8] leading-relaxed">
                  AI-based interviews practice with natural feedback on answers, clarity, and confidence.
                </p>
              </div>
              <button className="
                relative z-10 inline-flex items-center gap-2 px-5 py-3 bg-white rounded-full
                text-sm font-semibold text-[#9F50E9]
                shadow-[0_6px_18px_rgba(0,0,0,0.15)]
                hover:bg-purple-50 hover:-translate-y-0.5
                transition-all duration-300
              ">
                AI - Based interview
              </button>
            </div>

          </div>

          {/* ================= RIGHT COLUMN ================= */}
          <div className="
            relative w-full md:w-[70%] space-y-5 rounded-3xl p-6 overflow-hidden
            h-[710px] xl:h-[770px] flex flex-col justify-between
           
          ">
            <Image
              src="/Assets/who imock is for.webp"
              alt="Who IMock is for - AI mock interview platform designed for students, freshers, working professionals, and job seekers across 450+ roles"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 70vw"
            />

            {/* Title */}
            <div className="relative z-10 sm:p-10">
              <div className="inline-block bg-black/20 backdrop-blur-sm rounded-3xl px-6 py-4 mb-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Who <span className="text-[#9F50E9]">IMock</span> Is For
              </h1>

              <div className="flex flex-wrap gap-3 w-full lg:w-[70%]">
                {cards.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="
                      inline-flex items-center gap-2 px-5 py-2 bg-white rounded-full
                      text-sm font-medium text-[#9F50E9]
                      shadow-[0_6px_18px_rgba(0,0,0,0.15)]
                      hover:bg-purple-50 hover:-translate-y-0.5
                      transition-all duration-300
                    "
                  >
                    {tag.icon && <span>{tag.icon}</span>}
                    {tag.text}
                  </span>
                ))}
              </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="flex flex-col md:flex-row gap-5 relative z-10">

              {/* AI Card */}
              <div className="
                sm:w-[60%] xl:w-[40%] bg-white/90 backdrop-blur-md rounded-3xl px-5 py-5
                shadow-[0_18px_45px_rgba(0,0,0,0.15)]
              ">
                <h3 className="text-xl font-bold text-[#9F50E9] mb-1">
                  Artificial Intelligence
                </h3>
                <p className="text-md text-[#9F50E9] leading-relaxed">
                  AI-based interview practice with natural feedback on answers, clarity, and confidence.
                </p>
              </div>

              {/* Robot */}
              <div className="hidden md:block absolute sm:-right-32 lg:-right-20 xl:-right-36">
                <Image
                  src="/robot6.svg"
                  alt="robot"
                  width={260}
                  height={260}
                  className="drop-shadow-[0_40px_80px_rgb(207,165,255)] zoom-spin"
                />
              </div>

            </div>

          </div>

        </div>
      </section>
    </div>
  );
}
