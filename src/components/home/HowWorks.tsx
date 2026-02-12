"use client";

import {
  Zap,
  Medal,
  ChevronsUp,
  TrendingUp,
} from "lucide-react";

const steps = [
  {
    id: "01",
    title: "User register",
    desc: "User registers and selects an interview or exam preparation goal.",
    icon: Zap,
  },
  {
    id: "02",
    title: "User practices",
    desc: "User practices using AI-driven mock interviews or books live interview sessions.",
    icon: Medal,
  },
  {
    id: "03",
    title: "User receives",
    desc: "User receives structured feedback and improvement recommendations.",
    icon: ChevronsUp,
  },
  {
    id: "04",
    title: "User tracks",
    desc: "User tracks each progress and builds interview confidence over time.",
    icon: TrendingUp,
  },
];

export default function HowIMockWorks() {
  return (
    <section className=" bg-purple-50  py-16 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Heading */}
        <h2 className="text-4xl md:text-5xl font-bold text-[#9F50E9] mb-12 md:mb-16">
          How IMock Works
        </h2>

        {/* Cards Container */}
        <div className="relative">
          
          {/* Connection Line - Desktop */}
          <div className="hidden lg:block absolute top-20 left-0 right-0 pointer-events-none">
            <div className="relative mx-auto" style={{ width: '90%' }}>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex flex-col">
                  
                  {/* Card */}
                  <div className="bg-white rounded-3xl p-6 text-center shadow-sm hover:shadow-lg transition-all duration-300 flex-1">
                    
                    {/* Icon */}
                    <div className="flex justify-center mb-5">
                      <Icon className="w-12 h-12 text-purple-600" strokeWidth={2.5} />
                    </div>

                    {/* Number Badge */}
                    <div className="flex justify-center mb-4">
                      <div className="w-14 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center bg-white shadow-sm">
                        <span className="text-sm font-bold text-gray-800">
                          {step.id}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-purple-600 mb-3">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-gray-600 leading-relaxed px-2">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}