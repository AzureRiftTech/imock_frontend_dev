import { getErrorMessage } from '@/lib/error'

export interface TranscriptionResult {
  text: string
  isFinal: boolean
  confidence?: number
}

// Minimal runtime-compatible shape for browser SpeechRecognition instances
type SpeechRecognitionInstance = {
  lang?: string
  interimResults?: boolean
  continuous?: boolean
  onresult?: (e: unknown) => void
  onerror?: (e: unknown) => void
  onend?: () => void
  start?: () => void
  stop?: () => void
}

export class BrowserSpeechRecognitionManager {
  private recognition: SpeechRecognitionInstance | null = null
  private listening = false

  async startRecognition(
    _subscriptionKey: string | undefined,
    _region: string | undefined,
    onTranscription: (result: TranscriptionResult) => void,
    onError?: (error: unknown) => void
  ): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('Speech recognition is not available on the server')
    }

    const win = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }
    const SpeechRecognitionCtor = win.SpeechRecognition ?? win.webkitSpeechRecognition
    if (!SpeechRecognitionCtor) {
      const msg = 'Browser SpeechRecognition API is not supported in this browser.'
      console.error('[BrowserSpeechRecognition] Not supported')
      if (onError) onError(msg)
      throw new Error(msg)
    }

    try {
      this.recognition = new (SpeechRecognitionCtor as unknown as { new(): SpeechRecognitionInstance })()
      this.recognition.continuous = true

      // Use an event type compatible with SpeechRecognition; narrow locally from unknown
      this.recognition.onresult = (e: unknown) => {
        const evt = e as { resultIndex?: number; results?: Array<{ 0?: { transcript?: string }; isFinal?: boolean }>; }
        const start = evt.resultIndex ?? 0
        if (!evt.results) return
        for (let i = start; i < evt.results.length; i++) {
          const res = evt.results[i]
          const text = (res?.[0]?.transcript ?? '').trim()
          const isFinal = Boolean(res?.isFinal)
          onTranscription({ text, isFinal })
        }
      }

      this.recognition.onerror = (ev: unknown) => {
        const evt = ev as { error?: string; message?: string; type?: string }
        console.error('[BrowserSpeechRecognition] Error event:', {
          error: evt.error,
          message: evt.message,
          type: evt.type
        })
        
        // Pass the full error event so caller can inspect it
        if (onError) {
          onError(ev)
        }
      }

      this.recognition.onend = () => {
        this.listening = false
        console.log('[BrowserSpeechRecognition] Ended')
      }

      this.recognition.start?.()
      this.listening = true
      console.log('[BrowserSpeechRecognition] Started')
    } catch (err: unknown) {
      console.error('[BrowserSpeechRecognition] Start failed', err)
      if (onError) onError(getErrorMessage(err) || 'Failed to start browser speech recognition')
      throw err
    }
  }

  async stopRecognition(): Promise<void> {
    if (this.recognition && this.listening) {
      try {
        this.recognition.stop?.()
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
    } as unknown as BrowserSpeechRecognitionManager)
