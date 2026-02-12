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
              flex flex-col justify-between bg-[#d9d9d9] rounded-3xl px-3 py-3
              md:h-[40%] xl:h-[50%]
        
            ">
              <div></div>
              <div className="bg-white rounded-3xl p-4 flex flex-col justify-end
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
              flex justify-between bg-[#d9d9d9] rounded-3xl py-8
          
            ">
              <div className="text-xl xl:text-3xl font-bold text-[#9F50E9] leading-tight px-3">
                Explore<br />the Platform
              </div>

              <div className="flex justify-center items-center -space-x-3 bg-[#9F50E9] h-16 rounded-l-full px-2
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
              bg-[#d9d9d9] rounded-3xl py-5 px-5
              shadow-[0_20px_50px_rgba(159,80,233,0.18)]
              shadow-[0_30px_80px_rgba(159,80,233,0.25)]
              transition-all duration-300
            ">
              <h3 className="text-xl font-bold text-[#9F50E9] mb-3">
                Candidates
              </h3>
              <p className="text-sm text-[#9F50E9] leading-relaxed mb-5">
                AI-based interviews practice with natural feedback on answers, clarity, and confidence.
              </p>
              <button className="
                inline-flex items-center gap-2 px-5 py-3 bg-white rounded-full
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
            relative w-full md:w-[70%] space-y-5 bg-[#d9d9d9] rounded-3xl p-6
            h-[710px] xl:h-[770px] flex flex-col justify-between
           
          ">

            {/* Title */}
            <div className="sm:p-10">
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

            {/* Bottom Row */}
            <div className="flex flex-col md:flex-row gap-5 relative">

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
