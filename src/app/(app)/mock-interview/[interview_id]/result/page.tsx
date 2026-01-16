
'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import {
    Loader2,
    Trophy,
    Download,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Target,
    Zap,
    BarChart3,
    Brain,
    MessageSquare,
    Star,
    ChevronRight,
    RefreshCw,
    Home
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

interface Evaluation {
    question: string
    userAnswer: string
    expectedAnswer: string
    evaluation: {
        accuracy_score: number
        strengths: string[]
        areas_of_improvement: string[]
        missing_key_points: string[]
        detailed_feedback: string
        technical_depth: number
        clarity: number
        completeness: number
        relevance: number
        fluency: number
        confidence: number
    }
}

interface InterviewResult {
    overall_score: number
    avg_technical_depth: number
    avg_clarity: number
    avg_completeness: number
    avg_relevance: number
    avg_fluency: number
    avg_confidence: number
    merit_pts: number
    badge: string
    evaluations: Evaluation[]
    summary: any
}

export default function InterviewResultPage({ params }: { params: Promise<{ interview_id: string }> }) {
    const { interview_id: interviewId } = use(params)
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [result, setResult] = useState<InterviewResult | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const res = await api.get(`/answer-analysis/results/${interviewId}`)
                if (res.data.success) {
                    setResult(res.data.data)
                } else {
                    setError('Failed to fetch interview results')
                }
            } catch (err: any) {
                console.error('Fetch error:', err)
                setError(err.response?.data?.error || 'Failed to load results')
            } finally {
                setLoading(false)
            }
        }

        fetchResults()
    }, [interviewId])

    if (loading) {
        return (
            <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white gap-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-brand-500/20 blur-3xl rounded-full animate-pulse" />
                    <Loader2 className="w-16 h-16 animate-spin text-brand-500 relative" />
                </div>
                <div className="space-y-2 text-center">
                    <h2 className="text-2xl font-bold tracking-tight">Compiling Your Report</h2>
                    <p className="text-zinc-500">Fine-tuning insights and calculating your score...</p>
                </div>
            </div>
        )
    }

    if (error || !result) {
        return (
            <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-8">
                <div className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-[2.5rem] p-12 text-center shadow-2xl space-y-8">
                    <div className="bg-red-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-2xl font-bold text-white">Results Unavailable</h2>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            {error || "We couldn't find the results for this session."}
                        </p>
                    </div>
                    <Button
                        className="w-full h-14 rounded-2xl bg-white text-zinc-950 font-bold"
                        onClick={() => router.push('/dashboard')}
                    >
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        )
    }

    const radarData = [
        { subject: 'Accuracy', A: (result.avg_technical_depth * 10) || 0, fullMark: 100 },
        { subject: 'Relevance', A: (result.avg_relevance * 10) || 0, fullMark: 100 },
        { subject: 'Fluency', A: (result.avg_fluency * 10) || 0, fullMark: 100 },
        { subject: 'Depth', A: (result.avg_clarity * 10) || 0, fullMark: 100 },
        { subject: 'Confidence', A: (result.avg_confidence * 10) || 0, fullMark: 100 },
    ]

    // Flatten all areas for improvement and strengths for the summary sections
    const allStrengths = Array.from(new Set(result.evaluations.flatMap(e => e.evaluation.strengths))).slice(0, 5)
    const allImprovements = Array.from(new Set(result.evaluations.flatMap(e => e.evaluation.areas_of_improvement))).slice(0, 5)

    return (
        <div className="min-h-screen bg-zinc-950 text-white pb-24 selection:bg-brand-500/30">
            {/* Premium Header/Navigation Mimic */}
            <nav className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                            <Star className="w-5 h-5 text-zinc-950 fill-current" />
                        </div>
                        <span className="text-lg font-bold tracking-tight">iMock <span className="text-brand-500">Analytics</span></span>
                    </div>
                    <div className="flex items-center gap-6">
                        <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={() => router.push('/dashboard')}>
                            Dashboard
                        </Button>
                        <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={() => router.push('/interviews')}>
                            My Interviews
                        </Button>
                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10" />
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 h-12 flex items-center gap-8 text-xs font-medium text-zinc-500 uppercase tracking-widest">
                    <span className="text-brand-500 border-b-2 border-brand-500 h-full flex items-center px-1">Overview</span>
                    <span className="hover:text-white cursor-pointer transition-colors">Questions</span>
                    <span className="hover:text-white cursor-pointer transition-colors">Improvement Plan</span>
                    <span className="hover:text-white cursor-pointer transition-colors">Transcripts</span>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-12 space-y-10">

                {/* Main Performance Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative group"
                >
                    <div className="absolute -inset-1 bg-gradient-to-r from-brand-500/20 to-blue-500/20 rounded-[3rem] blur-xl group-hover:blur-2xl transition-all" />
                    <div className="relative bg-zinc-900/90 backdrop-blur-3xl border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
                        <div className="p-10 lg:p-14 flex flex-col lg:flex-row gap-12 items-center lg:items-center">

                            {/* Left: Badge & Score */}
                            <div className="flex-1 space-y-8 w-full">
                                <div className="space-y-4">
                                    <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">Performance Report</h1>
                                    <div className="flex items-center gap-4">
                                        <div className="flex text-yellow-500">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star key={s} className={`w-6 h-6 ${s <= (result.overall_score / 20) ? 'fill-current' : 'opacity-20'}`} />
                                            ))}
                                        </div>
                                        <span className="text-2xl font-bold text-brand-400">{result.badge}</span>
                                    </div>
                                    <p className="text-zinc-400 text-lg max-w-md">
                                        {result.overall_score > 75
                                            ? "Outstanding performance! You've demonstrated deep technical knowledge and clear communication."
                                            : "Good effort! Keep practicing on the basics and technical clarity to reach the next level."
                                        }
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <div className="px-5 py-2.5 rounded-full bg-zinc-800 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Domain: Technical</div>
                                    <div className="px-5 py-2.5 rounded-full bg-zinc-800 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Mode: AI Simulation</div>
                                </div>
                            </div>

                            {/* Middle: Key Stats */}
                            <div className="flex gap-4 lg:gap-6">
                                <div className="bg-zinc-800/50 border border-white/5 p-8 rounded-[2rem] text-center min-w-[140px] flex flex-col justify-center gap-1">
                                    <span className="text-5xl font-black text-white">{result.overall_score / 100}</span>
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Overall Score</span>
                                </div>
                                <div className="bg-brand-500/10 border border-brand-500/20 p-8 rounded-[2rem] text-center min-w-[140px] flex flex-col justify-center gap-1 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-12 h-12 bg-brand-500/10 blur-xl rounded-full" />
                                    <span className="text-5xl font-black text-brand-500">+{result.merit_pts}</span>
                                    <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest italic">Merit Pts</span>
                                </div>
                            </div>

                            {/* Right: Action */}
                            <div className="lg:ml-auto">
                                <Button className="h-16 px-10 rounded-[1.5rem] bg-white text-zinc-950 hover:bg-zinc-200 transition-all active:scale-95 flex items-center gap-3 font-bold text-lg shadow-xl shadow-brand-500/10">
                                    <Download className="w-5 h-5" />
                                    Download Report
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Charts & Breakdown Grid */}
                <div className="grid lg:grid-cols-2 gap-10">

                    {/* Skill Radar */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-[3rem] p-10 space-y-8"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-brand-500/10 rounded-2xl">
                                <Target className="w-6 h-6 text-brand-500" />
                            </div>
                            <h2 className="text-2xl font-bold">Skill Radar</h2>
                        </div>

                        <div className="h-[400px] w-full mt-4 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#333" />
                                    <PolarAngleAxis
                                        dataKey="subject"
                                        tick={{ fill: '#888', fontSize: 12, fontWeight: 700 }}
                                    />
                                    <PolarRadiusAxis
                                        angle={30}
                                        domain={[0, 100]}
                                        tick={false}
                                        axisLine={false}
                                    />
                                    <Radar
                                        name="Skills"
                                        dataKey="A"
                                        stroke="#D97706"
                                        fill="#D97706"
                                        fillOpacity={0.5}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Understading Score Breakdown */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-[3rem] p-10 space-y-8"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/10 rounded-2xl">
                                <BarChart3 className="w-6 h-6 text-blue-500" />
                            </div>
                            <h2 className="text-2xl font-bold">Understanding Your Score</h2>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6">
                            {[
                                { label: 'Accuracy', score: result.avg_technical_depth, desc: 'Technical correctness and factual precision.', color: 'text-blue-500' },
                                { label: 'Relevance', score: result.avg_relevance, desc: 'How directly the answer addresses the prompt.', color: 'text-brand-500' },
                                { label: 'Fluency', score: result.avg_fluency, desc: 'Smoothness, pacing, and lack of hesitation.', color: 'text-purple-500' },
                                { label: 'Depth', score: result.avg_clarity, desc: 'Comprehensiveness and detail of the explanation.', color: 'text-emerald-500' },
                                { label: 'Confidence', score: result.avg_confidence, desc: 'Assuredness and clarity in delivery.', color: 'text-orange-500' },
                                { label: 'Merit Pts', score: result.merit_pts / 5, desc: 'Bonus for exceptional depth or insights.', color: 'text-yellow-500', isMerit: true }
                            ].map((item, i) => (
                                <div key={i} className="p-6 bg-zinc-800/40 rounded-2xl border border-white/5 space-y-3 group hover:bg-zinc-800/60 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <span className={`font-bold ${item.color}`}>{item.label}</span>
                                        <span className="px-3 py-1 rounded-full bg-zinc-950 text-[10px] font-bold text-zinc-400">
                                            {item.isMerit ? `+${result.merit_pts}` : `${(item.score || 0).toFixed(1)}/10`}
                                        </span>
                                    </div>
                                    <p className="text-zinc-500 text-xs leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Strengths & Improvements */}
                <div className="grid lg:grid-cols-2 gap-10">
                    {/* Strong Areas */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-emerald-500/5 border border-emerald-500/10 rounded-[3rem] p-10 space-y-6"
                    >
                        <div className="flex items-center gap-3 text-emerald-500">
                            <CheckCircle2 className="w-6 h-6" />
                            <h3 className="text-2xl font-bold">Strong Areas</h3>
                        </div>
                        <div className="space-y-4">
                            {allStrengths.map((str, i) => (
                                <div key={i} className="flex gap-4 p-5 bg-zinc-900/50 rounded-2xl border border-white/5 items-start">
                                    <div className="w-6 h-6 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">{i + 1}</div>
                                    <p className="text-white/80 text-sm leading-relaxed">{str}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Areas for Improvement */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-red-500/5 border border-red-500/10 rounded-[3rem] p-10 space-y-6"
                    >
                        <div className="flex items-center gap-3 text-red-500">
                            <AlertCircle className="w-6 h-6" />
                            <h3 className="text-2xl font-bold">Areas for Improvement</h3>
                        </div>
                        <div className="space-y-4">
                            {allImprovements.map((imp, i) => (
                                <div key={i} className="flex gap-4 p-5 bg-zinc-900/50 rounded-2xl border border-white/5 items-start">
                                    <div className="w-6 h-6 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">{i + 1}</div>
                                    <p className="text-white/80 text-sm leading-relaxed">{imp}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Actionable Plan */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-brand-500/5 border border-brand-500/10 rounded-[3rem] p-10 lg:p-14 space-y-10"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-brand-500">
                                <Brain className="w-6 h-6" />
                                <h3 className="text-2xl font-bold uppercase tracking-widest text-[14px]">Actionable Improvement Plan</h3>
                            </div>
                            <h4 className="text-4xl font-black text-white">How to Level Up</h4>
                        </div>
                        <Button className="h-14 px-8 rounded-2xl bg-brand-500 hover:bg-brand-600 font-bold transition-all active:scale-95">
                            Get Full Detailed Roadmap
                        </Button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: 1, title: 'Refine Technical Core', desc: 'Focus on explaining complex architectural patterns with simpler analogies to improve clarity scores.' },
                            { step: 2, title: 'Improve Delivery Pacing', desc: 'Take deliberate pauses between key points to reduce hesitation markers and increase fluency.' },
                            { step: 3, title: 'Cite Specific Examples', desc: 'Back up theoretical answers with real-world scenarios from your GitHub projects to boost depth and accuracy.' }
                        ].map((step, i) => (
                            <div key={i} className="bg-zinc-950/50 border border-white/5 p-8 rounded-[2.5rem] space-y-4 hover:border-brand-500/30 transition-all group">
                                <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-brand-500 font-black text-xl group-hover:bg-brand-500 group-hover:text-zinc-950 transition-all">
                                    {step.step}
                                </div>
                                <h5 className="text-xl font-bold text-white leading-tight">{step.title}</h5>
                                <p className="text-zinc-500 text-sm leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Badges & Analysis Section */}
                <div className="grid lg:grid-cols-2 gap-10">
                    <div className="bg-zinc-900/50 border border-white/10 rounded-[3rem] p-10 flex gap-8 items-center">
                        <div className="w-32 h-32 bg-brand-500/10 rounded-full flex items-center justify-center relative flex-shrink-0">
                            <div className="absolute inset-0 bg-brand-500/20 blur-2xl rounded-full" />
                            <Star className="w-16 h-16 text-brand-500 fill-current relative" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em]">Job Readiness Badge</h3>
                            <p className="text-4xl font-black text-white uppercase italic">{result.badge}</p>
                            <p className="text-zinc-500 text-sm">Based on your technical accuracy, communication, and problem-solving skills.</p>
                        </div>
                    </div>

                    <div className="bg-zinc-900/50 border border-white/10 rounded-[3rem] p-10 space-y-4">
                        <div className="flex items-center gap-3 text-purple-500">
                            <MessageSquare className="w-5 h-5" />
                            <h3 className="font-bold text-sm uppercase tracking-widest">Behavioral Analysis</h3>
                        </div>
                        <p className="text-white/60 text-sm leading-[1.8] italic">
                            "The candidate demonstrates a {result.overall_score > 70 ? 'strong' : 'developing'} command of the subject matter. Their communication style is {result.overall_score > 80 ? 'exceptionally clear and structured' : 'competent but could benefit from more direct engagement with specific Technical pillars.'}"
                        </p>
                    </div>
                </div>

                {/* Detailed Breakdown Footer Navigation */}
                <div className="pt-20 text-center space-y-10">
                    <h2 className="text-4xl font-bold">Detailed Question Breakdown</h2>
                    <div className="space-y-6 max-w-5xl mx-auto">
                        {result.evaluations.map((ev, idx) => (
                            <div key={idx} className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 text-left group hover:bg-zinc-900/50 transition-all">
                                <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center font-black text-2xl text-zinc-500 group-hover:text-brand-500 transition-colors">
                                    {idx + 1}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest">Question {idx + 1}</p>
                                    <h4 className="text-xl font-medium text-white/90">{ev.question}</h4>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-xs text-zinc-500 font-medium">Score</p>
                                    <p className="text-3xl font-black text-brand-500">{ev.evaluation.accuracy_score}%</p>
                                </div>
                                <Button variant="ghost" className="p-4 rounded-full bg-white/5 hover:bg-white/10">
                                    <ChevronRight className="w-6 h-6" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4 justify-center pt-10">
                        <Button size="lg" variant="outline" className="h-14 px-8 rounded-2xl border-white/10" onClick={() => router.push('/dashboard')}>
                            <Home className="mr-2 w-5 h-5" />
                            Dashboard
                        </Button>
                        <Button size="lg" className="h-14 px-10 rounded-2xl bg-brand-500 hover:bg-brand-600 font-bold" onClick={() => router.push('/interviews')}>
                            <RefreshCw className="mr-2 w-5 h-5" />
                            Start Another Session
                        </Button>
                    </div>
                </div>

            </main>
        </div>
    )
}
