export interface TranscriptionResult {
  text: string
  isFinal: boolean
  confidence?: number
}

export class BrowserSpeechRecognitionManager {
  // Use `any` since some TS configs don't include SpeechRecognition in lib.dom
  private recognition: any = null
  private listening = false

  async startRecognition(
    _subscriptionKey: string | undefined,
    _region: string | undefined,
    onTranscription: (result: TranscriptionResult) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('Speech recognition is not available on the server')
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      const msg = 'Browser SpeechRecognition API is not supported in this browser.'
      console.error('[BrowserSpeechRecognition] Not supported')
      if (onError) onError(msg)
      throw new Error(msg)
    }

    try {
      this.recognition = new SpeechRecognition()
      this.recognition.lang = 'en-US'
      this.recognition.interimResults = true
      this.recognition.continuous = true

      // Use `any` for the event type to avoid TypeScript DOM lib mismatches in some environments
      this.recognition.onresult = (e: any) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i]
          const text = res[0]?.transcript || ''
          const isFinal = res.isFinal
          onTranscription({ text: text.trim(), isFinal })
        }
      }

      this.recognition.onerror = (ev: any) => {
        console.error('[BrowserSpeechRecognition] Error', ev)
        if (onError) onError(ev?.message || 'Speech recognition error')
      }

      this.recognition.onend = () => {
        this.listening = false
        console.log('[BrowserSpeechRecognition] Ended')
      }

      this.recognition.start()
      this.listening = true
      console.log('[BrowserSpeechRecognition] Started')
    } catch (err: any) {
      console.error('[BrowserSpeechRecognition] Start failed', err)
      if (onError) onError(err?.message || 'Failed to start browser speech recognition')
      throw err
    }
  }

  async stopRecognition(): Promise<void> {
    if (this.recognition && this.listening) {
      try {
        this.recognition.stop()
      } catch (err) {
        console.warn('[BrowserSpeechRecognition] Stop error', err)
      } finally {
        this.listening = false
        this.recognition = null
      }
    }
  }

  isActive(): boolean {
    return this.listening
  }
}

export const browserSpeechRecognitionManager = typeof window !== 'undefined'
  ? new BrowserSpeechRecognitionManager()
  : ({
      startRecognition: async () => { throw new Error('Speech recognition not available on server') },
      stopRecognition: async () => {},
      isActive: () => false,
    } as any as BrowserSpeechRecognitionManager)
