"use client";
import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'

const EllipseSection = () => {

    const sectionRef = useRef<HTMLDivElement | null>(null);
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setAnimate(true);
                    observer.disconnect(); // 🔥 run only once
                }
            },
            { threshold: 0.4 } // triggers when 40% visible
        );

        if (sectionRef.current) observer.observe(sectionRef.current);

        return () => observer.disconnect();
    }, []);

    return (
        <section className='mt-28 md:mt-20' ref={sectionRef}>
            {/* Bottom Glow Shadows */}



            <h3 className="text-black font-bol text-3xl text-center">Core Feature</h3>
            <div className='flex justify-between md:px-20 py-20 md:py-0'>
                <div className="relative w-[140px] rounded-2xl bg-white px-4 py-3 -rotate-12 shadow-[0_20px_40px_rgba(168,85,247,0.25)] ">
                    <span className="absolute inset-0 rounded-2xl bg-[#4C0E87]/30 opacity-20 animate-ping pointer-events-none" />

                    <p className="text-[11px] md:text-xs font-medium text-[#4C0E87] text-center ">
                        Trusted user
                    </p>

                    <p className=" text-center mt-1 text-[20px] md:text-[26px] font-extrabold leading-none text-[#1F2E47]">
                        125<span className="text-[#8D38DD]">K</span>
                    </p>

                    <button className="absolute underline left-5 right-5 -bottom-5 rounded-lg bg-gradient-to-r from-purple-500 to-purple-700 py-1.5  text-[9px] md:text-[11px] font-semibold text-white shadow">
                        Join Now
                    </button>
                </div>
                <div className="rotate-12 w-[140px] rounded-2xl bg-[#8D38DD] flex flex-col py-4 items-center  md:top-10 lg:-top-10  -right-24 md:-right-40 lg:-right-6">
                    <span className="absolute inset-0 rounded-2xl bg-[#4C0E87]/30 opacity-20 animate-ping pointer-events-none" />

                    <p className="text-[26px] font-extrabold leading-none text-white">
                        52+
                    </p>
                    <p className="text-[10px] font-medium text-white text-center">
                        Languages to choose
                    </p>
                </div>
            </div>

            <div className="relative  flex justify-center items-center">

                {/* Ellipse */}
                <Image
                    src="/ellipse.svg"
                    alt="Ellipse"
                    width={260}
                    height={260}
                    className="w-full md:w-[70%] h-auto animate-pulse"
                />

                {/* Robot centered inside ellipse */}
                <Image
                    src="/robot2.svg"
                    alt="Assistant"
                    width={200}
                    height={200}
                    className={`absolute inset-0 m-auto h-[50%] w-[50%] lg:-top-40 ${animate ? "robot-zoom" : "scale-0"
                        }`}
                />

                {/* Labels */}
                <div className="absolute -top-5 w-[25%] md:w-[15%] lg:w-[12%] rounded-lg bg-white border border-[#9333EA]/40 px-2 py-2 text-center text-xs md:text-md text-[#9333EA] shadow font-semibold">
                    AI-based interview practice
                </div>

                <div className="absolute left-0 md:left-40 top-1/3 w-[25%] md:w-[15%] lg:w-[10%] rounded-lg bg-white border border-[#9333EA]/40 px-2 py-2 text-center text-xs md:text-md text-[#9333EA] shadow font-semibold">

                    Performance analytics
                </div>

                <div className="absolute right-0 md:right-40  top-1/3 w-[25%] md:w-[15%] lg:w-[10%] rounded-lg bg-white border border-[#9333EA]/40 px-1 py-2 text-center text-xs md:text-md text-[#9333EA] shadow font-semibold">
                    Live mock interviews
                </div>

            </div>
            <div className='flex justify-between gap-5 md:px-20 -mt-10 sm:-mt-20 md:-mt-60'>
                <div className="w-auto rounded-full bg-white px-8  py-2 flex flex-col items-center justify-center rotate-12 shadow-xl">
                    <span className="absolute inset-0 rounded-full bg-[#4C0E87]/30 opacity-20 animate-ping pointer-events-none" />

                    <p className="text-[11px] md:text-xs font-medium text-[#8D38DD] text-center ">
                        Role Based Segment
                    </p>

                    <p className=" text-center mt-1 text-[20px] md:text-[20px] font-extrabold leading-none text-[#8D38DD]">
                        450<span className="text-[#8D38DD]">K</span>
                    </p>


                </div>
                <div className="w-auto rounded-full bg-white px-8 py-2 flex flex-col items-center justify-center -rotate-12 shadow-xl">
                    <span className="absolute inset-0 rounded-full bg-[#4C0E87]/30 opacity-20 animate-ping pointer-events-none" />

                    <p className="text-[11px] md:text-xs font-medium text-[#8D38DD] text-center ">
                        Role Based Segment
                    </p>

                    <p className=" text-center mt-1 text-[20px] md:text-[20px] font-extrabold leading-none text-[#8D38DD]">
                        450<span className="text-[#8D38DD]">K</span>
                    </p>


                </div>
            </div>


        </section>
    )
}

export default EllipseSection