"use client";
import Image from "next/image";
import React, { useState } from "react";
import { RxDoubleArrowDown } from "react-icons/rx";
import { GoArrowRight } from "react-icons/go";

const slides = [
    {
        src: "/Assets/Large Main Screen (Primary Visual).webp",
        alt: "IMock AI desktop application showing confidence score dashboard with response structure suggestions and tone analysis",
        label: "Confidence Dashboard",
        tag: "AI Scoring",
    },
    {
        src: "/Assets/slide 2.webp",
        alt: "IMock AURA feature showing discreet interview prompts and structured answer hints overlay on desktop",
        label: "AURA Assist",
        tag: "Stealth Mode",
    },
    {
        src: "/Assets/slide 3.webp",
        alt: "IMock AI Interview Assistant displayed on a monitor during a live virtual interview session with real-time analytics",
        label: "Live Interview",
        tag: "Real-Time AI",
    },
];

const DesktopApplication = () => {
    const [active, setActive] = useState(0);

    return (
        <section className="relative bg-white px-6 md:px-10 py-20 mt-10 overflow-hidden">

            {/* ── ambient glow ── */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[60%] bg-purple-200/40 blur-[100px] -z-10 pointer-events-none" />

            {/* ── section header ── */}
            <div className="max-w-7xl mx-auto mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold tracking-widest text-purple-400 uppercase mb-2">Platform Preview</p>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                        <span className="text-purple-600">Desktop</span>{" "}
                        <span className="text-gray-900">Application</span>
                    </h2>
                    <p className="text-gray-500 text-sm md:text-base mt-2">AI Interview Assistant — runs silently, supports confidently.</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <span className="w-8 border-t border-gray-300" />
                    0{active + 1} / 0{slides.length}
                    <span className="w-8 border-t border-gray-300" />
                </div>
            </div>

            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-stretch">

                {/* ══════════════ SLIDER STACK ══════════════ */}
                <div className="flex-1 relative" style={{ minHeight: "520px" }}>

                    {/* ── geometric accent lines (top-left corner) ── */}
                    <div className="absolute -top-3 -left-3 w-12 h-12 border-t-2 border-l-2 border-purple-400 rounded-tl-xl z-20 pointer-events-none" />
                    <div className="absolute -bottom-3 -right-3 w-12 h-12 border-b-2 border-r-2 border-purple-300 rounded-br-xl z-20 pointer-events-none" />

                    {/* ── diagonal accent stripe (background) ── */}
                    <div
                        className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-3xl"
                        aria-hidden="true"
                    >
                        <div className="absolute -top-10 -right-10 w-40 h-[120%] bg-purple-500/10 rotate-12 rounded-full blur-sm" />
                        <div className="absolute -bottom-10 -left-10 w-24 h-[80%] bg-purple-400/10 rotate-12 rounded-full blur-sm" />
                    </div>

                    {/* ── slide images ── */}
                    {slides.map((slide, i) => (
                        <div
                            key={i}
                            aria-hidden={active !== i}
                            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                                active === i
                                    ? "opacity-100 translate-x-0 scale-100 z-10"
                                    : i < active
                                    ? "opacity-0 -translate-x-8 scale-95 z-0"
                                    : "opacity-0 translate-x-8 scale-95 z-0"
                            }`}
                            style={{
                                clipPath: "polygon(0 0, 96% 0, 100% 4%, 100% 100%, 4% 100%, 0 96%)",
                            }}
                        >
                            <Image
                                src={slide.src}
                                alt={slide.alt}
                                fill
                                className="object-cover"
                                sizes="(max-width: 1024px) 95vw, 60vw"
                                priority={i === 0}
                            />
                            {/* bottom scrim */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                            {/* ── slide info overlay ── */}
                            <div className="absolute bottom-8 left-8 right-8 z-10">
                                <span className="inline-block mb-2 px-3 py-1 rounded-full bg-purple-500/80 backdrop-blur-sm text-white text-[10px] font-bold tracking-widest uppercase">
                                    {slide.tag}
                                </span>
                                <h3 className="text-white text-2xl md:text-3xl font-bold drop-shadow-md">
                                    {slide.label}
                                </h3>
                            </div>

                            {/* ── geometric corner cut indicator (active) ── */}
                            <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-t-purple-500 border-l-[40px] border-l-transparent opacity-80" />
                        </div>
                    ))}

                    {/* ── feature tags row (below slides, always visible) ── */}
                    <div className="absolute -bottom-14 left-0 right-0 flex flex-wrap gap-2 z-20">
                        {["Minimal UI", "Stealth Mode", "Low Resource Usage"].map((tag) => (
                            <span
                                key={tag}
                                className="flex items-center gap-1.5 px-4 py-1.5 border border-purple-200 rounded-full text-xs text-purple-600 bg-white shadow-sm hover:bg-purple-50 transition"
                            >
                                {tag}
                                <GoArrowRight size={14} />
                            </span>
                        ))}
                    </div>
                </div>

                {/* ══════════════ RIGHT PANEL ══════════════ */}
                <div className="lg:w-[220px] flex flex-row lg:flex-col justify-between items-center lg:items-start gap-6 lg:gap-0 mt-16 lg:mt-0">

                    {/* slide counter + description */}
                    <div className="flex-1 lg:flex-none space-y-3">
                        <p className="text-xs font-semibold tracking-widest text-purple-400 uppercase">Slides</p>
                        {slides.map((slide, i) => (
                            <button
                                key={i}
                                onClick={() => setActive(i)}
                                className={`flex items-start gap-3 w-full text-left group transition-all duration-300 ${
                                    active === i ? "opacity-100" : "opacity-40 hover:opacity-70"
                                }`}
                            >
                                {/* progress bar */}
                                <div className="mt-1.5 flex-shrink-0 w-1 h-10 rounded-full overflow-hidden bg-gray-200">
                                    <div className={`w-full bg-purple-500 rounded-full transition-all duration-300 ${active === i ? "h-full" : "h-0"}`} />
                                </div>
                                {/* thumbnail + label */}
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden border border-purple-100 shadow-sm"
                                        style={{ clipPath: "polygon(0 0, 85% 0, 100% 15%, 100% 100%, 15% 100%, 0 85%)" }}
                                    >
                                        <Image
                                            src={slide.src}
                                            alt={`${slide.label} thumbnail`}
                                            fill
                                            className="object-cover"
                                            sizes="40px"
                                        />
                                    </div>
                                    <span className={`text-xs font-semibold truncate ${active === i ? "text-purple-700" : "text-gray-500"}`}>
                                        {slide.label}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* scroll indicator */}
                    <div className="hidden lg:flex flex-col items-center gap-2 mt-auto">
                        <div className="w-8 h-8 rounded-full border border-purple-400 flex items-center justify-center text-purple-400">
                            <RxDoubleArrowDown size={14} />
                        </div>
                        <span className="text-[10px] text-gray-400 tracking-widest uppercase">Scroll</span>
                    </div>

                </div>

            </div>
        </section>
    );
};

export default DesktopApplication;
