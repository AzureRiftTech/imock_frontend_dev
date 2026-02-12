"use client";
import Image from "next/image";
import React, { useState } from "react";
import { RxDoubleArrowDown } from "react-icons/rx";
import { HiArrowRight } from "react-icons/hi";
import { GoArrowRight } from "react-icons/go";

const DesktopApplication = () => {
    const [active, setActive] = useState(0);

    return (
        <section className="relative min-h-screen bg-white px-10 py-20 mt-10 -z-20">
            <div className="flex flex-col lg:flex-row w-full items-center lg:justify-between">


                {/* ================= LEFT SIDEBAR ================= */}
                <div className="w-[120px] h-[20vh] lg:h-[60vh] flex flex-col items-center justify-center lg:justify-between gap-10 lg:gap-0">
                    <div className="flex flex-row  lg:flex-col items-center gap-5">
                        <div className="flex items-center gap-4 text-xl font-bold">
                            01 <span className="w-10 border-t border-black" />
                        </div>

                        {["/vector2.svg", "/vector1.svg", "/vector.svg"].map((icon, index) => (
                            <div
                                key={index}
                                className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition"
                            >
                                <Image src={icon} alt="" width={18} height={18} />
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-row lg:flex-col gap-10 sm:gap-20">
                        {["MY PROFILE", "MY COURSES", "BROWSE"].map((text) => (
                            <span
                                key={text}
                                className="lg:-rotate-90 whitespace-nowrap text-xs font-bold text-gray-700"
                            >
                                {text}
                            </span>
                        ))}
                    </div>
                </div>

                {/* ================= CENTER CONTENT ================= */}
                <div className="flex-1 relative flex items-center justify-center">

                    {/* ===== Main Shape Wrapper ===== */}
                    <div className="relative w-full">
                        <div
                            className="
                            absolute -left-60 top-16
                            w-[100%] h-[60%]
                            bg-gradient-to-r from-[#E9C6FF] via-[#F3DCFF] to-transparent
                            blur-[50px] opacity-90
                            -z-20
                             "
                        />

                        {/* 🌸 BOTTOM PINK GLOW */}
                        <div className="absolute -bottom-20 left-0 w-full h-20 -z-20 opacity-90">
                            <div className="absolute inset-0 bg-gradient-to-t from-[#E9C6FF] via-[#f7f0ff] to-transparent" />

                            <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white" />
                        </div>

                        {/* Main Shape */}
                        <Image
                            src="/Subtract.svg"
                            alt="Main background"
                            width={100}
                            height={100}
                            className="object-contain w-full h-auto"
                            priority
                        />

                        {/* Bottom-left small shape */}
                        <Image
                            src="/Subtract-1.svg"
                            alt=""
                            width={100}
                            height={100}
                            className="absolute bottom-8 sm:bottom-10 left-3 w-[16%] sm:w-[17%] md:w-[19%] lg:w-[20%] h-auto"
                        />

                        {/* Top-right small shape */}
                        <Image
                            src="/Subtract-2.svg"
                            alt=""
                            width={100}
                            height={100}
                            className="absolute top-[18%] -right-5 w-[30%] h-auto rotate-2"
                        />

                        {/* 🔥 NEW: DEMO + ARROW */}
                        <div className="absolute bottom-[35%] sm:bottom-[38%] md:bottom-[36%] xl:bottom-[35%] left-[9%] flex items-center gap-3">
                            <span className="px-1 sm:px-4 lg:px-6 xl:px-8 md:py-1 border border-gray-400 rounded-full text-[10px] md:text-xs lg:text-sm bg-white">
                                Demo
                            </span>

                        </div>

                        <div className="absolute bottom-[20%] left-[18%] md:left-[20%] border-4 rounded-full border-white flex items-center gap-3">
                            <div className="w-5 sm:w-8 h-5 sm:h-8 rounded-full bg-purple-600 flex items-center justify-center">
                                <HiArrowRight className="text-white text-lg" />
                            </div>
                        </div>

                        {/* 🔥 NEW: BOTTOM OVERLAY TEXT */}
                        <div className="absolute bottom-5 md:bottom-16 left-[45%] -translate-x-1/3 sm:-translate-x-1/4 text-left max-w-3xl xl:max-w-4xl">
                            <h3 className="text-white text-sm  sm:text-lg md:text-2xl xl:text-4xl font-semibold mb-2">
                                Application Design
                            </h3>
                            <p className="text-[#9F50E9] text-[8px] sm:text-[10px] md:text-xs xl:text-sm leading-relaxed">
                                Mock offers a desktop application that functions as a real-time AI interview assistant.
                                The application operates silently in the background and provides contextual support
                                during interviews, including response structuring, keyword suggestions, and confidence cues.
                            </p>

                            <div className="flex flex-wrap justify-center gap-2 mt-4 w-full">
                                {["Minimal UI", "Stealth Mode", "Low Resource Usage"].map((tag) => (
                                    <span
                                        key={tag}
                                        className="flex items-center lg:gap-2 px-1  sm:px-2 xl:px-6 sm:py-1 border border-white/40 rounded-full text-[8px] lg:text-xs text-white"
                                    >
                                        {tag}
                                        <GoArrowRight size={20} />
                                    </span>

                                ))}

                            </div>
                        </div>

                    </div>
                </div>

                {/* ================= TITLE ================= */}
                <div className="absolute  right-0 lg:right-20  top-56 sm:top-60 lg:top-5 text-right z-10">
                    <h1 className="text-sm sm:text-lg md:text-2xl lg:text-5xl font-bold">
                        <span className="text-purple-600">Desktop</span>
                    </h1>
                    <h1 className="text-sm sm:text-lg md:text-2xl lg:text-5xl font-bold">
                        <span className="text-purple-500">Application</span>
                    </h1>
                    <p className="text-xs sm:text-sm md:text-xl lg:text-2xl text-gray-800 font-medium sm:mt-2 text-left">
                        AI Interview Assistant
                    </p>
                </div>

                {/* ================= RIGHT SIDEBAR ================= */}
                <div className="w-full lg:w-[120px] lg:h-[60vh] flex flex-col md:flex-row lg:flex-col items-center justify-between mt-10 md:mt-0 lg:mt-20">
                    <div className="flex flex-row lg:flex-col items-center gap-5">
                        {["/vector2.svg", "/vector1.svg", "/vector.svg"].map((icon, index) => (
                            <div
                                key={index}
                                className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition"
                            >
                                <Image src={icon} alt="" width={18} height={18} />
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-row lg:flex-col items-center gap-5 mt-10">
                        <div className="w-10 h-10 rounded-full border border-purple-500 flex items-center justify-center text-purple-500">
                            <RxDoubleArrowDown />
                        </div>

                        <span className="text-sm text-gray-700">Visual</span>

                        <div className="flex flex-row lg:flex-col gap-8 mt-2">
                            {[0, 1, 2].map((item) => (
                                <div
                                    key={item}
                                    onClick={() => setActive(item)}
                                    className={`w-10 h-10 rounded-full cursor-pointer transition-all
                    ${active === item
                                            ? "bg-purple-500 scale-110"
                                            : "bg-gray-300 hover:bg-purple-300 hover:scale-110"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default DesktopApplication;
