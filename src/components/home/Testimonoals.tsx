'use client'

import Image from 'next/image'
import React from 'react'

const Testimonials = () => {
    return (
        <section className="relative min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-white py-20 px-6 md:px-10 overflow-hidden">
            
            <style jsx>{`
                .clip-top-left {
                    clip-path: polygon(0 10%, 20% 0, 100% 0, 100% 100%, 0 100%);
                }
                .clip-both-corners {
                    clip-path: polygon(0 10%, 20% 0, 100% 0, 100% 90%, 80% 100%, 0 100%);
                }
            `}</style>

            <div className="max-w-7xl mx-auto">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-20 gap-6">
                    
                    <div className="bg-purple-200/80 backdrop-blur-sm rounded-full px-6 py-2.5 inline-flex items-center gap-2 shadow-sm">
                        <span className="text-lg">⭐</span>
                        <span className="text-purple-700 font-semibold text-sm">Testimonial</span>
                    </div>

                    <div className="flex-1 text-center px-4 md:px-8">
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                            Real owners. Real<br />
                            power. Real emotion.
                        </h2>
                    </div>

                    <div className="text-purple-600 text-6xl md:text-7xl font-bold leading-none">
                        ✱
                    </div>
                </div>

                {/* Testimonials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    
                    {/* Card 1 - Image with top-left clip */}
                    <div className="md:col-span-1 space-y-5">
                        
                        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm">
                            <p className="text-sm text-gray-700 leading-relaxed italic">
                                &quot;Life is poetry, every sound a verse, every moment decided to move —&quot;
                            </p>
                        </div>

                        <div className="relative h-[300px] bg-gradient-to-br from-gray-300 to-gray-400 shadow-xl hover:shadow-2xl transition-shadow clip-top-left">
                            <Image
                                src="/testimonial-image.jpg"
                                alt="Emily R"
                                fill
                                className="object-cover"
                            />
                        </div>

                        <div className="text-left pl-2">
                            <p className="font-bold text-lg text-gray-900">Sarah D.</p>
                            <p className="text-sm text-gray-600">Tech Entrepreneur & Collector</p>
                        </div>
                    </div>

                    {/* Card 2 - Text with both corners clipped */}
                    <div className="md:col-span-1 bg-white/70 backdrop-blur-md shadow-lg hover:shadow-xl transition-shadow h-fit clip-both-corners">
                        <div className="p-8 space-y-6">
                            <p className="text-base text-gray-800 leading-relaxed">
                                &quot;When I first pressed the ignition, time stopped.
                                <br /><br />
                                This isn&apos;t just a car — it&apos;s a living masterpiece that listens, breathes, and commands the road.&quot;
                            </p>

                            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                                <div className="w-14 h-14 bg-gradient-to-br from-purple-200 to-purple-300 rounded-full flex-shrink-0"></div>
                                <div>
                                    <p className="font-bold text-gray-900">Sarah D.</p>
                                    <p className="text-xs text-gray-600">Tech Entrepreneur & Collector</p>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <span className="text-6xl text-gray-300 font-serif leading-none">&quot;</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 3 - Text with both corners clipped */}
                    <div className="md:col-span-1 bg-white/70 backdrop-blur-md shadow-lg hover:shadow-xl transition-shadow h-fit clip-both-corners">
                        <div className="p-8 space-y-6">
                            <span className="text-6xl text-gray-300 font-serif leading-none block">&quot;</span>
                            
                            <p className="text-base text-gray-800 leading-relaxed -mt-4">
                                I&apos;ve driven everything — Formula 1, hypercars, prototypes.
                                <br /><br />
                                Nothing feels this personal speed; it&apos;s symphony.&quot;
                            </p>

                            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                                <div className="w-14 h-14 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex-shrink-0"></div>
                                <div>
                                    <p className="font-bold text-gray-900">Aulia Morgan.</p>
                                    <p className="text-xs text-gray-600">Officer</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Navigation */}
                <div className="flex justify-end gap-3 mt-12 md:mt-16">
                    <button className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-purple-50 hover:border-purple-400 transition-all duration-300">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center hover:bg-purple-700 transition-all duration-300 shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

            </div>
        </section>
    )
}

export default Testimonials