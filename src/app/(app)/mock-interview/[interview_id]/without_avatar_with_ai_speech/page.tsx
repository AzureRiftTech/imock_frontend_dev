'use client'

import * as React from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/error'
import { browserSpeechRecognitionManager } from '@/lib/browserSpeechRecognition'
import Logo from '@/assets/react.svg'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Play, Square, ChevronRight, Eye, Video, Mic, MicOff, Camera, CameraOff, User } from 'lucide-react'

// Types (same as other mock interview pages)

type Question = {
  question: string
  difficulty: string
  focus_area: string
  example_answer: string
}

type Answer = {
  question: string
  answer: string
  timestamp: Date
  difficulty?: string
  focusArea?: string
  expectedAnswer?: string
}

type AnswerEvaluation = {
  question: string
  userAnswer: string
  evaluation: {
    accuracy_score: number
    strengths: string[]
    areas_of_improvement: string[]
    missing_key_points: string[]
    detailed_feedback: string
    technical_depth: number
    clarity: number
    completeness: number
    relevance?: number
    fluency?: number
    confidence?: number
    verbal_feedback?: string
  }
}

type GenerateResponse = {
  ok: boolean
  questions: Question[]
  saved?: { session_token?: string }
}

export default function MockInterviewNoAvatarWithAISpeechPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const interviewId = params?.interview_id as string
  const resumeIndex = searchParams?.get('index')
  const countParam = searchParams?.get('count')

  // --- States for Question Generation ---
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [questions, setQuestions] = React.useState<Question[]>([])
  const [generated, setGenerated] = React.useState(false)
  const [sessionToken, setSessionToken] = React.useState<string | null>(null)
  const attemptedRef = React.useRef(false)

  // --- States for Interview Session ---
  const [currentIndex, setCurrentIndex] = React.useState<number>(-1) // -1 = not started
  const [isSpeaking, setIsSpeaking] = React.useState(false)
  const [showAnswer, setShowAnswer] = React.useState(false)

  // Answer Recording States
  const [isRecording, setIsRecording] = React.useState(false)
  const [currentTranscript, setCurrentTranscript] = React.useState('')
  const [finalAnswer, setFinalAnswer] = React.useState('')
  const [answers, setAnswers] = React.useState<Answer[]>([])
  const [recordingError, setRecordingError] = React.useState<string | null>(null)

  // Evaluation States
  const [evaluations, setEvaluations] = React.useState<AnswerEvaluation[]>([])
  const evaluationsRef = React.useRef<AnswerEvaluation[]>([])
  const [isEvaluating, setIsEvaluating] = React.useState(false)
  const [interviewFinished, setInterviewFinished] = React.useState(false)
  const [overallStats, setOverallStats] = React.useState<any>(null)
  const evaluationInFlightRef = React.useRef(false)
  const lastEvaluationKeyRef = React.useRef<string | null>(null)

  // --- States for User Camera ---
  const [userStream, setUserStream] = React.useState<MediaStream | null>(null)
  const [cameraPermissionDenied, setCameraPermissionDenied] = React.useState(false)
  const userVideoRef = React.useRef<HTMLVideoElement>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      setUserStream(stream)
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error('[MockInterview] Camera access denied:', err)
      setCameraPermissionDenied(true)
    }
  }

  const stopCamera = () => {
    if (userStream) {
      userStream.getTracks().forEach(track => track.stop())
      setUserStream(null)
    }
  }

  // 1. Generate Questions on Load
  const generateQuestions = React.useCallback(async () => {
    if (!interviewId || resumeIndex === null) {
      setError('Missing interview ID or resume index')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await api.post('/mock-interview/generate-questions', {
        schedule_id: Number(interviewId),
        index: Number(resumeIndex),
        question_count: countParam ? Number(countParam) : 5,
        persist: true // persist questions and create a session token
      });

      const data = res.data as GenerateResponse & { saved?: { session_token?: string } }
      if (data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions)
        setGenerated(true)
        if (data.saved && (data.saved.session_token)) setSessionToken(String(data.saved.session_token))
      } else {
        throw new Error('No questions returned from AI')
      }
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to generate questions')
    } finally {
      setLoading(false)
    }
  }, [interviewId, resumeIndex, countParam])

  React.useEffect(() => {
    if (!attemptedRef.current && interviewId && resumeIndex !== null) {
      attemptedRef.current = true
      generateQuestions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cleanup recognition and camera on unmount
  React.useEffect(() => {
    return () => {
      if (browserSpeechRecognitionManager.isActive()) {
        browserSpeechRecognitionManager.stopRecognition()
      }
      stopCamera()
    }
  }, [])

  // ElevenLabs TTS using direct API call to backend streaming endpoint
  const speakWithElevenLabs = async (text: string): Promise<boolean> => {
    try {
      console.log('[MockInterview] Requesting ElevenLabs TTS for:', text.substring(0, 50))
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/elevenlabs/tts-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })
      
      if (!res.ok) {
        console.error('[MockInterview] ElevenLabs TTS request failed:', res.status)
        return false
      }
      
      const arrayBuffer = await res.arrayBuffer()
      console.log('[MockInterview] Received audio buffer:', arrayBuffer.byteLength, 'bytes')
      
      if (arrayBuffer.byteLength === 0) {
        console.error('[MockInterview] Empty audio buffer received')
        return false
      }
      
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      
      return new Promise((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(url)
          setIsSpeaking(false)
          console.log('[MockInterview] Audio playback completed')
          resolve(true)
        }
        
        audio.onerror = (err) => {
          URL.revokeObjectURL(url)
          setIsSpeaking(false)
          console.error('[MockInterview] Audio playback error:', err)
          resolve(false)
        }
        
        audio.play().catch(err => {
          URL.revokeObjectURL(url)
          setIsSpeaking(false)
          console.error('[MockInterview] Failed to play audio:', err)
          resolve(false)
        })
      })
    } catch (err) {
      console.error('[MockInterview] ElevenLabs TTS exception:', err)
      return false
    }
  }

  const speakText = async (text: string) => {
    setIsSpeaking(true)
    try {
      // Try ElevenLabs first (via backend)
      const ok = await speakWithElevenLabs(text)
      if (ok) return
      
      // Fallback to browser TTS
      if ('speechSynthesis' in window) {
        try {
          const utter = new SpeechSynthesisUtterance(text)
          utter.lang = 'en-US'
          utter.onend = () => setIsSpeaking(false)
          utter.onerror = () => setIsSpeaking(false)
          window.speechSynthesis.cancel()
          window.speechSynthesis.speak(utter)
        } catch (e) {
          console.warn('[MockInterview] Browser TTS failed', e)
          setIsSpeaking(false)
        }
      } else {
        console.warn('[MockInterview] No TTS available')
        setIsSpeaking(false)
      }
    } catch (e) {
      console.warn('[MockInterview] TTS failed:', e)
      setIsSpeaking(false)
    }
  }

  // Handlers
  const handleStartSession = async () => {
    setCurrentIndex(0)
    await startCamera() // Request camera access immediately
    if (questions[0]) {
      await speakText(questions[0].question)
    }
  }

  // ... the rest of the interview logic is identical to the without_avatar page and omitted for brevity ...
  // For simplicity, re-use the same evaluation & recording handlers and UI as the established implementation

  // (Below: include the same handlers for recording, stopRecording, evaluateAnswer, handleNext, etc.)

  // Start recording user's answer
  const startRecording = async () => {
    try {
      setIsRecording(true)
      setCurrentTranscript('')
      setFinalAnswer('')
      setRecordingError(null)

      await browserSpeechRecognitionManager.startRecognition(
        undefined,
        undefined,
        (result) => {
          if (result.isFinal) {
            setFinalAnswer(prev => prev + (prev ? ' ' : '') + result.text)
            setCurrentTranscript('')
          } else {
            setCurrentTranscript(result.text)
          }
        },
        (error) => {
          setRecordingError(error)
          setIsRecording(false)
        }
      )

      console.log('[MockInterview] Recording started (browser)')
    } catch (error: any) {
      console.error('[MockInterview] Recording failed:', error)
      setRecordingError(error.message || 'Failed to start recording (browser)')
      setIsRecording(false)
    }
  }

  const stopRecording = async () => {
    await browserSpeechRecognitionManager.stopRecognition()
    setIsRecording(false)

    if (finalAnswer || currentTranscript) {
      const completeAnswer = finalAnswer + (currentTranscript ? ' ' + currentTranscript : '')
      const evaluationKey = `${currentIndex}:${completeAnswer.trim()}`
      if (evaluationInFlightRef.current || lastEvaluationKeyRef.current === evaluationKey) {
        console.warn('[MockInterview] Evaluation already in progress or done for this answer')
        return
      }
      const newAnswer: Answer = {
        question: questions[currentIndex].question,
        answer: completeAnswer,
        timestamp: new Date(),
        difficulty: questions[currentIndex].difficulty,
        focusArea: questions[currentIndex].focus_area,
        expectedAnswer: questions[currentIndex].example_answer
      }
      setAnswers(prev => [...prev, newAnswer])
      console.log('[MockInterview] Answer saved:', completeAnswer)

      await evaluateAnswer(newAnswer, evaluationKey)
    }

    setCurrentTranscript('')
  }

  const evaluateAnswer = async (answer: Answer, evaluationKey?: string) => {
    const key = evaluationKey ?? `${currentIndex}:${answer.answer.trim()}`
    if (evaluationInFlightRef.current || lastEvaluationKeyRef.current === key) {
      console.warn('[MockInterview] Skipping duplicate evaluation')
      return
    }
    evaluationInFlightRef.current = true
    lastEvaluationKeyRef.current = key
    setIsEvaluating(true)
    try {
      const res = await api.post('/answer-analysis/evaluate', {
        question: answer.question,
        userAnswer: answer.answer,
        expectedAnswer: answer.expectedAnswer,
        difficulty: answer.difficulty,
        focusArea: answer.focusArea
      })

      if (res.data.success) {
        const evaluation = res.data.data
        setEvaluations(prev => {
          const next = [...prev, evaluation]
          evaluationsRef.current = next
          return next
        })
        console.log('[MockInterview] Answer evaluated:', evaluation.evaluation.accuracy_score)

        if (evaluation.evaluation.verbal_feedback) {
          try {
            await speakText(evaluation.evaluation.verbal_feedback)
          } catch (e) {
            console.warn('[MockInterview] Feedback AI TTS failed:', e)
          }
        }

        await handleNext(true)
      }
    } catch (error: any) {
      console.error('[MockInterview] Evaluation failed:', error)
      await handleNext(true)
    } finally {
      setIsEvaluating(false)
      setIsSpeaking(false)
      evaluationInFlightRef.current = false
    }
  }

  const handleNext = async (forceNext = false) => {
    if (isRecording && !forceNext) {
      await stopRecording()
      return
    }

    setShowAnswer(false)
    setFinalAnswer('')
    setCurrentTranscript('')

    if (currentIndex < questions.length - 1) {
      const next = currentIndex + 1
      setCurrentIndex(next)
      if (questions[next]) await speakText(questions[next].question)
    } else {
      stopCamera()
      setCurrentIndex(-2)
      
      // Calculate summary and save results
      let savedId = null
      if (evaluationsRef.current.length > 0) {
        const finalEvaluations = evaluationsRef.current
        
        // Calculate summary statistics
        const totalScore = finalEvaluations.reduce((sum, e) => sum + (e.evaluation.accuracy_score || 0), 0)
        const avgScore = Math.round(totalScore / finalEvaluations.length)
        
        const summary = {
          average_score: avgScore,
          average_technical_depth: (finalEvaluations.reduce((sum, e) => sum + (e.evaluation.technical_depth || 0), 0) / finalEvaluations.length).toFixed(1),
          average_clarity: (finalEvaluations.reduce((sum, e) => sum + (e.evaluation.clarity || 0), 0) / finalEvaluations.length).toFixed(1),
          average_completeness: (finalEvaluations.reduce((sum, e) => sum + (e.evaluation.completeness || 0), 0) / finalEvaluations.length).toFixed(1),
          average_relevance: (finalEvaluations.reduce((sum, e) => sum + (e.evaluation.relevance || 0), 0) / finalEvaluations.length).toFixed(1),
          average_fluency: (finalEvaluations.reduce((sum, e) => sum + (e.evaluation.fluency || 0), 0) / finalEvaluations.length).toFixed(1),
          average_confidence: (finalEvaluations.reduce((sum, e) => sum + (e.evaluation.confidence || 0), 0) / finalEvaluations.length).toFixed(1),
          total_questions: finalEvaluations.length
        }

        try {
          const res = await api.post('/answer-analysis/results', {
            interview_id: params.interview_id,
            evaluations: finalEvaluations,
            summary: summary,
            session_token: sessionToken
          })
          savedId = res.data?.data?.id ?? null
          console.log('[MockInterview] Results saved successfully', savedId)
        } catch (err) {
          console.error('[MockInterview] Failed to save results:', err)
        }
      }

      // Redirect to result page
      if (savedId) {
        router.push(`/mock-interview/${params.interview_id}/result/${savedId}`)
      } else if (sessionToken) {
        try {
          const lookup = await api.get(`/answer-analysis/results/${params.interview_id}`, { params: { session_token: sessionToken } })
          const resultId = lookup.data?.data?.id
          if (resultId) {
            router.push(`/mock-interview/${params.interview_id}/result/${resultId}`)
            return
          }
        } catch (e) {
          console.warn('[MockInterview] Could not lookup result by session_token:', e)
        }
        router.push(`/mock-interview/${params.interview_id}/result`)
      } else {
        router.push(`/mock-interview/${params.interview_id}/result`)
      }
    }
  }

  const handleRetrySpeak = () => {
    if (questions[currentIndex]) {
      speakText(questions[currentIndex].question)
    }
  }

  // Rendering (reusing same structure as without_avatar page)
  if (!interviewId) return <div className="p-8">Invalid Interview ID</div>

  if (loading && !generated) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center min-h-[60vh]">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-brand-600" />
        <h2 className="text-xl font-semibold mb-2">Preparing Your Interview</h2>
        <p className="text-zinc-600">Analyzing your resume and generating questions...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-950">
        <div className="max-w-md w-full bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-12 text-center shadow-2xl space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full animate-pulse" />
            <div className="relative bg-zinc-800 border border-red-500/20 rounded-full w-24 h-24 flex items-center justify-center">
              <Video className="w-10 h-10 text-red-500/80" />
              <div className="absolute -top-1 -right-1 bg-red-500 w-6 h-6 rounded-full flex items-center justify-center border-4 border-zinc-900">
                <span className="text-[10px] font-bold text-white uppercase italic">!</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white tracking-tight">Interruption Occurred</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              {error}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full h-14 rounded-2xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-base transition-all active:scale-95 shadow-xl"
              onClick={() => {
                attemptedRef.current = false
                setError(null)
                generateQuestions()
              }}
            >
              Retry Connection
            </Button>
            <Button
              variant="ghost"
              className="w-full text-zinc-500 hover:text-white"
              onClick={() => router.back()}
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (currentIndex === -1) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center space-y-6">
        <div className="bg-green-50 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <Video className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-zinc-900">Ready for your Interview?</h1>
        <p className="text-zinc-600 text-lg">
          We have prepared {questions.length} questions for you based on your resume.
          An AI interviewer will ask you each question.
        </p>
        <Button size="lg" onClick={handleStartSession} className="px-8 text-lg">
          Start Interview <ChevronRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    )
  }

  if (currentIndex === -2) {
    return (
      <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white gap-6">
        <Loader2 className="w-16 h-16 animate-spin text-brand-500" />
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Finalizing Interview</h2>
          <p className="text-zinc-500">Redirecting to your performance report...</p>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentIndex]

  if (currentIndex >= 0 && !currentQ) {
    return (
      <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-brand-500" />
        <p className="text-zinc-400 font-medium">Loading next question...</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-zinc-950 overflow-hidden flex flex-col font-[var(--font-plus-jakarta)]">
      {/* Top Bar Overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6 flex items-center justify-between pointer-events-none">
        <div className="flex flex-col gap-1 pointer-events-auto bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white font-medium">Live Mock Interview</span>
          </div>
          <h2 className="text-white/70 text-sm">
            Question {currentIndex + 1} of {questions.length}
          </h2>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            Exit Session
          </Button>
        </div>
      </div>

      {/* Main Interview Area: Side-by-Side Videos */}
      <div className="flex-1 flex flex-col md:flex-row items-stretch justify-center p-8 gap-8 w-full max-w-[1700px] mx-auto overflow-hidden">

        {/* Logo Side (replaces Avatar) */}
        <div className="flex-1 min-h-[500px] h-[60vh] bg-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl relative border border-white/5 ring-1 ring-white/10 group flex items-center justify-center">
          <div className="flex items-center justify-center p-8">
            <img src={Logo as unknown as string} alt="IMock Logo" className="w-40 h-40 object-contain opacity-80" />
          </div>

          {/* Label */}
          <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 z-20">
            <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
            <span className="text-white/80 text-xs font-bold uppercase tracking-widest">AI Interviewer</span>
          </div>

          {isSpeaking && (
            <div className="absolute top-6 right-6 flex gap-1 h-6 items-center pointer-events-none z-20 bg-brand-500/20 px-3 rounded-full border border-brand-500/30">
              <div className="w-1 h-2 bg-brand-500 rounded-full animate-[bounce_0.6s_infinite]" />
              <div className="w-1 h-4 bg-brand-500 rounded-full animate-[bounce_0.6s_infinite_0.1s]" />
              <div className="w-1 h-3 bg-brand-500 rounded-full animate-[bounce_0.6s_infinite_0.2s]" />
              <div className="w-1 h-5 bg-brand-500 rounded-full animate-[bounce_0.6s_infinite_0.3s]" />
            </div>
          )}
        </div>

        {/* User Camera Side */}
        <div className="flex-1 min-h-[500px] h-[60vh] bg-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl relative border border-white/5 ring-1 ring-white/10 group">
          {userStream ? (
            <video
              ref={userVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-white/40 gap-4">
              <div className="p-8 bg-white/5 rounded-full ring-1 ring-white/10">
                {cameraPermissionDenied ? <CameraOff className="w-16 h-16 opacity-40" /> : <User className="w-16 h-16 opacity-40" />}
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-base font-bold uppercase tracking-[0.2em] opacity-30">
                  {cameraPermissionDenied ? 'Access Denied' : 'Camera Off'}
                </span>
                <div className="flex items-center gap-2 opacity-20">
                  <div className="w-5 h-5 bg-brand-500 rounded flex items-center justify-center">
                    <span className="text-[10px] font-black text-white uppercase italic">i</span>
                  </div>
                  <span className="text-sm font-black text-white uppercase tracking-tighter">IMock</span>
                </div>
              </div>
            </div>
          )}

          {/* Label */}
          <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`} />
            <span className="text-white/80 text-xs font-bold uppercase tracking-widest">You (Candidate)</span>
          </div>

          {/* Transcription Overlay */}
          <div className="absolute left-6 right-6 bottom-6 flex flex-col gap-4 z-40">
            <div className="bg-black/60 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/5">
              <div className="p-3 px-6 border-b border-white/5 flex items-center justify-between">
                <h4 className="text-white/80 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                  {isRecording ? <Mic className="w-3 h-3 text-red-500 animate-pulse" /> : <MicOff className="w-3 h-3 text-white/40" />}
                  {isRecording ? 'Recording Live Answer' : 'Microphone Muted'}
                </h4>
                {isRecording && (
                  <div className="flex gap-0.5 items-end h-3">
                    <div className="w-0.5 h-1 bg-red-500 animate-[pulse_0.5s_infinite]" />
                    <div className="w-0.5 h-3 bg-red-500 animate-[pulse_0.4s_infinite]" />
                    <div className="w-0.5 h-2 bg-red-500 animate-[pulse_0.6s_infinite]" />
                  </div>
                )}
              </div>
              <div className="p-6 py-4 min-h-[80px] max-h-[160px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                {finalAnswer || currentTranscript ? (
                  <div className="space-y-3">
                    {finalAnswer && (
                      <p className="text-white/90 text-sm leading-relaxed">{finalAnswer}</p>
                    )}
                    {currentTranscript && (
                      <p className="text-white/40 text-sm italic animate-pulse">{currentTranscript}</p>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <p className="text-white/30 text-[11px] font-medium tracking-wide">
                      {isRecording ? 'Listening for your response...' : 'Your live transcript will appear here'}
                    </p>
                  </div>
                )}
              </div>
              {isEvaluating && (
                <div className="px-6 py-3 bg-brand-500/20 border-t border-white/5 flex items-center gap-3">
                  <Loader2 className="w-3 h-3 animate-spin text-brand-400" />
                  <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">AI Analyzing Response...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Ref Answer (absolute positioned to be less obstructive) */}
        {showAnswer && (
          <div className="absolute right-12 top-24 w-80 bg-green-500/10 backdrop-blur-2xl rounded-[2rem] border border-green-500/20 shadow-2xl p-6 animate-in slide-in-from-right-8 duration-500 z-50">
            <h4 className="text-green-400 text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4" />
              AI Reference Answer
            </h4>
            <p className="text-white/80 text-xs leading-relaxed max-h-48 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full font-medium">
              {currentQ?.example_answer}
            </p>
          </div>
        )}
      </div>

      {/* Question Overlay (Centered at the Bottom of screen) */}
      <div className="fixed bottom-36 left-1/2 -translate-x-1/2 w-full max-w-5xl px-8 z-30">
        <div className="bg-black/60 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/10 shadow-2xl transition-all duration-700 hover:bg-black/80 ring-1 ring-white/5">
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              <span className="text-brand-400 text-[10px] font-black uppercase tracking-[0.4em] bg-brand-500/10 px-5 py-2 rounded-full border border-brand-500/20">The Question</span>
              <span className="bg-blue-500/20 text-blue-300 text-[10px] px-4 py-2 rounded-full font-bold uppercase tracking-widest border border-blue-500/20">
                {currentQ?.difficulty}
              </span>
            </div>
            <h3 className="text-3xl lg:text-4xl font-semibold text-white leading-[1.2] drop-shadow-2xl px-4">
              {currentQ?.question}
            </h3>
          </div>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="z-50 p-12 flex items-center justify-center bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent">
        <div className="bg-zinc-900/90 backdrop-blur-3xl px-10 py-6 rounded-full border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] flex items-center gap-10 ring-1 ring-white/10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="w-16 h-16 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all hover:scale-110 active:scale-95 group"
            title="End Session"
          >
            <Square className="w-7 h-7 fill-current transition-transform group-hover:scale-90" />
          </Button>

          <div className="w-px h-12 bg-white/10" />

          {/* Camera Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={userStream ? stopCamera : startCamera}
            className={`w-16 h-16 rounded-full transition-all border shadow-lg ${userStream ? 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'}`}
            title={userStream ? "Turn Camera Off" : "Turn Camera On"}
          >
            {userStream ? <Camera className="w-7 h-7" /> : <CameraOff className="w-7 h-7" />}
          </Button>

          {/* Microphone Toggle (Primary Action) */}
          <div className="relative">
            <Button
              variant={isRecording ? "default" : "secondary"}
              size="lg"
              className={`h-20 px-16 rounded-full transition-all duration-300 font-bold text-xl shadow-[0_0_40px_rgba(var(--brand-primary),0.3)] ${isRecording
                ? "bg-red-600 hover:bg-red-700 text-white scale-105 ring-8 ring-red-500/10"
                : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                }`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isSpeaking || isEvaluating}
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="mr-3 w-7 h-7 animate-spin" />
                  Analyzing...
                </>
              ) : isRecording ? (
                <>
                  <MicOff className="mr-4 w-7 h-7" />
                  Done Speaking
                </>
              ) : (
                <>
                  <Mic className="mr-4 w-7 h-7" />
                  {isSpeaking ? 'AI is Speaking...' : 'Start Answering'}
                </>
              )}
            </Button>

            {isSpeaking && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-500 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full shadow-lg">
                Please Wait
              </div>
            )}
          </div>

          <div className="w-px h-12 bg-white/10" />

          <Button
            variant="ghost"
            className={`h-16 px-10 rounded-full font-bold tracking-wider transition-all text-lg ${showAnswer ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            onClick={() => setShowAnswer(!showAnswer)}
          >
            <Eye className="mr-4 w-6 h-6" />
            {showAnswer ? 'Hide Key' : 'Show Key'}
          </Button>
        </div>
      </div>
    </div>
  )
}
