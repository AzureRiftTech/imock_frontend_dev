import Image from 'next/image'
import React from 'react'
import { HiArrowUpRight, HiOutlineBellAlert } from 'react-icons/hi2'

const WhyChooseIMock = () => {
    return (
        <section className="relative min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 py-20 px-6 md:px-10 -z-20">

            <div className="absolute top-0 left-0 w-full h-80 z-20 opacity-90">
                <div className="absolute inset-0 bg-gradient-to-b from-[#E9C6FF] via-[#f7f0ff] to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white" />
            </div>
            <div className="relative max-w-7xl mx-auto z-20">


                {/* Top Right Title */}
                <div className="text-right mb-20">
                    <h2 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                        Why Choose
                    </h2>
                    <h2 className="text-5xl md:text-6xl font-bold text-purple-600 leading-tight">
                        IMock
                    </h2>
                </div>

                {/* Cards Container */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-end">

                    {/* Card 1 - Tall Card (Affordable Pricing) */}
                    <div className="lg:col-span-1 w-full h-[450px] bg-[#BFBFBF] rounded-[32px] p-6 flex flex-col justify-end ">
                        <div className="space-y-2">
                            <p className="text-sm text-[#505050] leading-relaxed font-medium">
                                Affordable pricing tailored for students and professionals
                            </p>
                        </div>
                    </div>

                    {/* Card 2 - Medium Card (Tracking & Detection) */}
                    <div className="lg:col-span-1 w-full h-[380px] rounded-[32px] p-6 flex flex-col justify-end ">
                        <div className="lg:col-span-1 w-full h-[450px] bg-[#BFBFBF] rounded-[32px] p-6 flex flex-col justify-end ">
                        </div>
                        <div className="space-y-4">
                            {/* Icons Row */}
                            <div className="flex gap-3">
                                <div className="flex items-center gap-1.5 bg-white/40 backdrop-blur-sm rounded-lg px-3 py-1.5">
                                    <span className="text-base">📊</span>
                                    <span className="text-xs font-semibold text-gray-800">Tracking</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white/40 backdrop-blur-sm rounded-lg px-3 py-1.5">
                                    <span className="text-base"><HiOutlineBellAlert size={24} /></span>
                                    <span className="text-xs font-semibold text-gray-800">Detection</span>
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-[#505050] leading-relaxed font-medium">
                                practical interview experience beyond theoretical preparation.
                            </p>
                        </div>
                    </div>

                    {/* Arrow Icon */}
                    <div className="flex justify-center  md:mb-40">
                        <div className="w-14 h-14 rounded-full border border-[#9F50E9] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                            <HiArrowUpRight size={30} color="#9F50E9" />
                        </div>
                    </div>

                    {/* Card 3 - Medium Card (Combination of AI) */}
                    <div className="lg:col-span-1 w-full h-[380px]  rounded-[32px] p-6 flex flex-col justify-end ">
                        <div className="lg:col-span-1 w-full h-[450px] bg-[#BFBFBF] rounded-[32px] p-6 flex flex-col justify-end mb-5 ">
                        </div>
                        <div className="space-y-4">
                            {/* Learn More Button */}
                            <button className="bg-[#9F50E9] text-white text-xs font-bold px-6 py-2.5 rounded-full transition-all hover:scale-105 shadow-md">
                                Learn More
                            </button>

                            {/* Title */}
                            <h3 className="text-base text-[#202020] leading-snug">
                                Combination Of AI Intelligence
                            </h3>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}

export default WhyChooseIMock