'use client'

import * as React from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/error'
import { azureAvatarManager, type AvatarConfig } from '@/lib/azureAvatar'
import { speechRecognitionManager } from '@/lib/speechRecognition'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Play, Square, ChevronRight, Eye, Video, Mic, MicOff } from 'lucide-react'

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
  }
}

type GenerateResponse = {
  ok: boolean
  questions: Question[]
  saved?: unknown
}

type LipSyncResponse = {
  task_id: string
  status: string
  generated: string[]
}

export default function MockInterviewPage() {
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
  const attemptedRef = React.useRef(false)

  // --- States for Interview Session ---
  const [currentIndex, setCurrentIndex] = React.useState<number>(-1) // -1 = not started
  const [avatarLoading, setAvatarLoading] = React.useState(false)
  const [avatarError, setAvatarError] = React.useState<string | null>(null)
  const [showAnswer, setShowAnswer] = React.useState(false)
  const [isSpeaking, setIsSpeaking] = React.useState(false)
  const videoContainerRef = React.useRef<HTMLDivElement>(null)
  const avatarInitializedRef = React.useRef(false)

  // Answer Recording States
  const [isRecording, setIsRecording] = React.useState(false)
  const [currentTranscript, setCurrentTranscript] = React.useState('')
  const [finalAnswer, setFinalAnswer] = React.useState('')
  const [answers, setAnswers] = React.useState<Answer[]>([])
  const [recordingError, setRecordingError] = React.useState<string | null>(null)

  // Evaluation States
  const [evaluations, setEvaluations] = React.useState<AnswerEvaluation[]>([])
  const [isEvaluating, setIsEvaluating] = React.useState(false)
  const [interviewFinished, setInterviewFinished] = React.useState(false)
  const [overallStats, setOverallStats] = React.useState<any>(null)

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
        question_count: countParam ? Number(countParam) : 5
      })

      const data = res.data as GenerateResponse
      if (data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions)
        setGenerated(true)
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

  // Cleanup avatar and recognition on unmount
  React.useEffect(() => {
    return () => {
      if (azureAvatarManager.isAvatarConnected()) {
        azureAvatarManager.stopAvatar()
      }
      if (speechRecognitionManager.isActive()) {
        speechRecognitionManager.stopRecognition()
      }
    }
  }, [])

  // Initialize Avatar Connection
  const initializeAvatar = async () => {
    if (!videoContainerRef.current || avatarInitializedRef.current) return

    setAvatarLoading(true)
    setAvatarError(null)

    try {
      const config: AvatarConfig = {
        character: 'lisa',
        style: 'casual-sitting',
        voiceName: 'en-US-AvaMultilingualNeural'
      }

      await azureAvatarManager.startAvatar(
        config,
        videoContainerRef.current,
        (error) => setAvatarError(error)
      )

      avatarInitializedRef.current = true
      setAvatarLoading(false)
      console.log('[MockInterview] Avatar initialized')
    } catch (error: any) {
      console.error('[MockInterview] Avatar init failed:', error)
      setAvatarError(error.message || 'Failed to initialize avatar')
      setAvatarLoading(false)
    }
  }

  // Speak Question through Avatar
  const speakQuestion = async (questionText: string) => {
    if (!azureAvatarManager.isAvatarConnected()) {
      console.warn('[MockInterview] Avatar not connected, initializing...')
      await initializeAvatar()
    }

    setIsSpeaking(true)
    setAvatarError(null)

    try {
      await azureAvatarManager.speak(questionText)
      console.log('[MockInterview] Question spoken successfully')
      setIsSpeaking(false)
    } catch (error: any) {
      console.error('[MockInterview] Speak failed:', error)
      setAvatarError(error.message || 'Failed to speak question')
      setIsSpeaking(false)
    }
  }

  // Handlers
  const handleStartSession = async () => {
    setCurrentIndex(0)
    await initializeAvatar()
    if (questions[0]) {
      speakQuestion(questions[0].question)
    }
  }

  const handleNext = async () => {
    // Stop recording if active
    if (isRecording) {
      await stopRecording()
    }

    setShowAnswer(false)
    setFinalAnswer('')
    setCurrentTranscript('')
    setRecordingError(null)
    
    if (currentIndex < questions.length - 1) {
        const next = currentIndex + 1
        setCurrentIndex(next)
        if (questions[next]) {
          await speakQuestion(questions[next].question)
        }
    } else {
        // Finished - Show results
        await azureAvatarManager.stopAvatar()
        console.log('[MockInterview] All answers:', answers)
        console.log('[MockInterview] All evaluations:', evaluations)
        
        // Calculate overall stats
        if (evaluations.length > 0) {
          const totalScore = evaluations.reduce((sum, e) => sum + e.evaluation.accuracy_score, 0)
          const avgScore = totalScore / evaluations.length
          const avgTechnicalDepth = evaluations.reduce((sum, e) => sum + e.evaluation.technical_depth, 0) / evaluations.length
          const avgClarity = evaluations.reduce((sum, e) => sum + e.evaluation.clarity, 0) / evaluations.length
          const avgCompleteness = evaluations.reduce((sum, e) => sum + e.evaluation.completeness, 0) / evaluations.length

          setOverallStats({
            average_score: Math.round(avgScore),
            average_technical_depth: avgTechnicalDepth.toFixed(1),
            average_clarity: avgClarity.toFixed(1),
            average_completeness: avgCompleteness.toFixed(1),
            total_questions: evaluations.length
          })
        }
        
        setInterviewFinished(true)
        setCurrentIndex(-2) // Set to -2 to show results screen
    }
  }

  const handleRetrySpeak = () => {
    if (questions[currentIndex]) {
      speakQuestion(questions[currentIndex].question)
    }
  }

  // Start recording user's answer
  const startRecording = async () => {
    try {
      // Get speech config from backend
      const res = await api.get('/azure-avatar/speech-config')
      const { subscriptionKey, region } = res.data.data

      setIsRecording(true)
      setCurrentTranscript('')
      setFinalAnswer('')
      setRecordingError(null)

      await speechRecognitionManager.startRecognition(
        subscriptionKey,
        region,
        (result) => {
          if (result.isFinal) {
            // Append final result to answer
            setFinalAnswer(prev => prev + (prev ? ' ' : '') + result.text)
            setCurrentTranscript('')
          } else {
            // Show interim result
            setCurrentTranscript(result.text)
          }
        },
        (error) => {
          setRecordingError(error)
          setIsRecording(false)
        }
      )

      console.log('[MockInterview] Recording started')
    } catch (error: any) {
      console.error('[MockInterview] Recording failed:', error)
      setRecordingError(error.message || 'Failed to start recording')
      setIsRecording(false)
    }
  }

  // Stop recording and save answer
  const stopRecording = async () => {
    await speechRecognitionManager.stopRecognition()
    setIsRecording(false)

    // Save answer with question
    if (finalAnswer || currentTranscript) {
      const completeAnswer = finalAnswer + (currentTranscript ? ' ' + currentTranscript : '')
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

      // Evaluate answer immediately
      await evaluateAnswer(newAnswer)
    }

    setCurrentTranscript('')
  }

  // Evaluate single answer using Gemini
  const evaluateAnswer = async (answer: Answer) => {
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
        setEvaluations(prev => [...prev, evaluation])
        console.log('[MockInterview] Answer evaluated:', evaluation.evaluation.accuracy_score)
      }
    } catch (error: any) {
      console.error('[MockInterview] Evaluation failed:', error)
    } finally {
      setIsEvaluating(false)
    }
  }

  // --- Rendering ---

  if (!interviewId) return <div className="p-8">Invalid Interview ID</div>

  // 1. Loading Questions Screen
  if (loading && !generated) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center min-h-[60vh]">
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-brand-600" />
          <h2 className="text-xl font-semibold mb-2">Preparing Your Interview</h2>
          <p className="text-zinc-600">Analyzing your resume and generating questions...</p>
        </div>
      )
  }

  // 2. Error Screen
  if (error) {
    return (
        <div className="p-8 flex flex-col items-center">
             <p className="text-red-600 mb-4">{error}</p>
             <Button onClick={() => {
               attemptedRef.current = false
               setError(null)
               generateQuestions()
             }}>Retry</Button>
        </div>
    )
  }

  // 3. Start Screen (Questions Ready)
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
                Start Interview <ChevronRight className="ml-2 w-5 h-5"/>
            </Button>
        </div>
      )
  }

  // 4. Results Screen (After Interview Completion)
  if (currentIndex === -2 && interviewFinished) {
    return (
      <div className="mx-auto max-w-6xl py-8 px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="bg-green-50 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
            <Video className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900">Interview Complete!</h1>
          <p className="text-zinc-600">Here's your performance analysis</p>
        </div>

        {/* Overall Statistics */}
        {overallStats && (
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-zinc-500 mb-1">Overall Score</p>
                  <p className="text-4xl font-bold text-brand-600">{overallStats.average_score}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-zinc-500 mb-1">Technical Depth</p>
                  <p className="text-4xl font-bold text-blue-600">{overallStats.average_technical_depth}/10</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-zinc-500 mb-1">Clarity</p>
                  <p className="text-4xl font-bold text-purple-600">{overallStats.average_clarity}/10</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-zinc-500 mb-1">Completeness</p>
                  <p className="text-4xl font-bold text-orange-600">{overallStats.average_completeness}/10</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Question</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {evaluations.map((evaluation, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-700">Q{idx + 1}</span>
                    <span className="text-sm font-semibold text-brand-600">{evaluation.evaluation.accuracy_score}%</span>
                  </div>
                  <div className="w-full bg-zinc-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-brand-500 to-brand-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${evaluation.evaluation.accuracy_score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Feedback for Each Answer */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-zinc-900">Detailed Feedback</h2>
          {evaluations.map((evaluation, idx) => (
            <Card key={idx} className="border-l-4 border-l-brand-500">
              <CardHeader>
                <CardTitle className="text-lg">Question {idx + 1}</CardTitle>
                <p className="text-sm text-zinc-600">{evaluation.question}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Score Breakdown */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-zinc-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-zinc-500">Technical</p>
                    <p className="text-lg font-bold text-blue-600">{evaluation.evaluation.technical_depth}/10</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-500">Clarity</p>
                    <p className="text-lg font-bold text-purple-600">{evaluation.evaluation.clarity}/10</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-500">Complete</p>
                    <p className="text-lg font-bold text-orange-600">{evaluation.evaluation.completeness}/10</p>
                  </div>
                </div>

                {/* Your Answer vs Expected Answer Comparison */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Your Answer</h4>
                    <p className="text-sm text-zinc-700 leading-relaxed">{evaluation.userAnswer}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">Expected Answer (Reference)</h4>
                    <p className="text-sm text-zinc-700 leading-relaxed">
                      {questions[idx]?.example_answer || 'Not available'}
                    </p>
                  </div>
                </div>

                {/* Strengths */}
                {evaluation.evaluation.strengths.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-green-700 mb-2">✓ Strengths</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-zinc-700">
                      {evaluation.evaluation.strengths.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Areas of Improvement */}
                {evaluation.evaluation.areas_of_improvement.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-orange-700 mb-2">→ Areas of Improvement</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-zinc-700">
                      {evaluation.evaluation.areas_of_improvement.map((area, i) => (
                        <li key={i}>{area}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Key Points */}
                {evaluation.evaluation.missing_key_points.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-700 mb-2">✗ Missing Key Points</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-zinc-700">
                      {evaluation.evaluation.missing_key_points.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Detailed Feedback */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-zinc-800">{evaluation.evaluation.detailed_feedback}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-6">
          <Button variant="outline" size="lg" onClick={() => router.back()}>
            Back to Interviews
          </Button>
          <Button size="lg" onClick={() => window.location.reload()}>
            Start New Interview
          </Button>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentIndex]

  // 5. Active Interview Screen
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-muted-foreground font-medium">
             Question {currentIndex + 1} of {questions.length}
        </h2>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>Exit</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Left: Avatar / Video Area */}
        <div className="space-y-4">
           <div 
             ref={videoContainerRef}
             className="aspect-video bg-zinc-900 rounded-xl overflow-hidden shadow-lg relative flex items-center justify-center"
           >
                {avatarLoading ? (
                    <div className="text-center text-white/80 p-6 space-y-3">
                        <Loader2 className="w-10 h-10 animate-spin mx-auto text-brand-500"/>
                        <p>Initializing AI Avatar...</p>
                        <p className="text-xs opacity-60">Connecting via Azure Speech Services</p>
                    </div>
                ) : avatarError ? (
                    <div className="text-center text-white p-6">
                         <p className="text-red-400 font-medium">{avatarError}</p>
                         <p className="text-sm opacity-60 mt-2">(Check Azure configuration)</p>
                         <Button 
                           variant="outline" 
                           size="sm" 
                           className="mt-4 border-zinc-600 text-zinc-300 hover:bg-zinc-800" 
                           onClick={() => initializeAvatar()}
                         >
                             Retry Connection
                         </Button>
                    </div>
                ) : !azureAvatarManager.isAvatarConnected() ? (
                    <div className="text-center text-white/60 p-6">
                        <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Avatar ready to connect</p>
                    </div>
                ) : isSpeaking ? (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Speaking...
                    </div>
                ) : null}
           </div>
           
           <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200">
               <h3 className="text-sm font-semibold text-zinc-500 uppercase mb-2">Topic</h3>
               <div className="flex gap-2">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                        {currentQ.difficulty}
                    </span>
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
                        {currentQ.focus_area}
                    </span>
               </div>
           </div>
        </div>

        {/* Right: Question Text & Controls */}
        <div className="flex flex-col justify-between py-2">
           <div className="space-y-6">
               <div>
                   <h3 className="text-2xl font-semibold text-zinc-900 leading-tight">
                       {currentQ.question}
                   </h3>
               </div>

               {/* Answer Recording Section */}
               <div className="space-y-3">
                 <div className="flex items-center justify-between">
                   <h4 className="text-sm font-semibold text-zinc-700">Your Answer</h4>
                   {isRecording && (
                     <div className="flex items-center gap-2 text-red-500 text-sm animate-pulse">
                       <div className="w-2 h-2 bg-red-500 rounded-full" />
                       Recording...
                     </div>
                   )}
                   {isEvaluating && (
                     <div className="flex items-center gap-2 text-blue-500 text-sm">
                       <Loader2 className="w-3 h-3 animate-spin" />
                       Analyzing...
                     </div>
                   )}
                 </div>

                 {/* Transcription Display */}
                 <div className="min-h-32 max-h-48 overflow-y-auto bg-zinc-50 rounded-xl p-4 border border-zinc-200">
                   {finalAnswer || currentTranscript ? (
                     <div className="space-y-2">
                       {finalAnswer && (
                         <p className="text-zinc-800 leading-relaxed">{finalAnswer}</p>
                       )}
                       {currentTranscript && (
                         <p className="text-zinc-400 italic">{currentTranscript}</p>
                       )}
                     </div>
                   ) : (
                     <p className="text-zinc-400 text-sm text-center py-8">
                       {isRecording ? 'Listening... Start speaking' : 'Click "Give Answer" to record your response'}
                     </p>
                   )}
                 </div>

                 {recordingError && (
                   <p className="text-red-500 text-sm">{recordingError}</p>
                 )}

                 {/* Recording Control Button */}
                 <Button 
                   variant={isRecording ? "destructive" : "default"}
                   className="w-full" 
                   onClick={isRecording ? stopRecording : startRecording}
                 >
                   {isRecording ? (
                     <>
                       <MicOff className="mr-2 w-4 h-4" />
                       Stop Recording
                     </>
                   ) : (
                     <>
                       <Mic className="mr-2 w-4 h-4" />
                       Give Answer
                     </>
                   )}
                 </Button>
               </div>

               {showAnswer && (
                   <div className="bg-green-50 rounded-xl p-5 border border-green-100 animate-in fade-in slide-in-from-bottom-2">
                       <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                           <Eye className="w-4 h-4"/> Example Answer
                       </h4>
                       <p className="text-zinc-700 leading-relaxed">
                           {currentQ.example_answer}
                       </p>
                   </div>
               )}
           </div>

           <div className="space-y-3 pt-6">
               {!showAnswer && (
                   <Button 
                     variant="outline" 
                     className="w-full" 
                     onClick={() => setShowAnswer(true)}
                   >
                       Show Example Answer
                   </Button>
               )}
               
               <Button 
                 className="w-full h-12 text-lg" 
                 onClick={handleNext}
                 disabled={isRecording}
               >
                   {currentIndex === questions.length - 1 ? 'Finish Interview' : 'Next Question'} 
                   <ChevronRight className="ml-2 w-5 h-5" />
               </Button>
           </div>
        </div>

      </div>
    </div>
  )
}