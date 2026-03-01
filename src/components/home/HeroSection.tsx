
"use client";

import Image from 'next/image'
import { useRouter } from 'next/navigation';
import React from 'react'

const HeroSection = () => {

    const router = useRouter();

    const handleNavigate = () => {
        router.push("/login");
    };
    return (
        <section>
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
                        <div className="relative w-full lg:w-[80%] flex flex-col bg-white shadow-xl rounded-full px-5 py-2 items-center justify-center overflow-visible">

                            {/* Ping outside */}
                            <span className="absolute inset-0 rounded-full bg-[#4C0E87]/30 opacity-20 animate-ping pointer-events-none" />

                            <p className="text-[11px] md:text-xs font-medium text-[#4C0E87]">
                                Role Based Segment
                            </p>
                            <p className="text-[#8D38DD] text-xl md:text-2xl font-bold">
                                450+
                            </p>
                        </div>


                        <div className="relative w-[50%] rounded-2xl bg-white px-4 py-3 shadow-[0_20px_40px_rgba(168,85,247,0.25)]">
                            <span className="absolute inset-0 rounded-2xl bg-[#4C0E87]/30 opacity-20 animate-ping pointer-events-none" />
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
                        <p className="text-xl md:text-5xl text-center font-semibold leading-tight">
                            <span className="typewriter-multiline">
                                Land Your <span className="text-[#8D38DD]">Dream Job </span>With
                                <br />
                                Confidence
                            </span>
                        </p>
                        <p className="text-center  text-sm md:text-lg">Prepare for real interviews using our AI-powered mock interview platform designed to adapt to your resume and role. Practice real-world questions, receive instant feedback, and improve your performance with every session.</p>
                        <button onClick={handleNavigate} className="rounded-full px-7 py-3 bg-[#8D38DD] text-white shadow-[0_20px_40px_rgba(168,85,247,0.25)] hover:animate-pulse">Start new session</button>
                    </div>

                    <div className=" relative flex flex-col items-center gap-20 w-full lg:w-[20%] ml-5">

                        {/* 52+ CARD */}
                        <div className="relative w-[140px] rounded-2xl bg-[#8D38DD] flex flex-col py-4 items-center  md:top-10 lg:-top-10  -right-24 md:-right-40 lg:-right-6">
                            <span className="absolute inset-0 rounded-2xl bg-[#4C0E87]/30 opacity-20 animate-ping pointer-events-none" />

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
                            <span className="absolute inset-0 rounded-2xl bg-[#4C0E87]/30 opacity-20 animate-ping pointer-events-none" />
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
        </section>
    )
}

export default HeroSection