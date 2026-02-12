/**
 * Azure Speech Recognition Service
 * Provides real-time speech-to-text transcription
 */

import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk'
import { getErrorMessage } from '@/lib/error'

export interface TranscriptionResult {
  text: string
  isFinal: boolean
  confidence?: number
}

export class SpeechRecognitionManager {
  private recognizer: SpeechSDK.SpeechRecognizer | null = null
  private isListening: boolean = false

  /**
   * Start continuous speech recognition
   */
  async startRecognition(
    subscriptionKey: string,
    region: string,
    onTranscription: (result: TranscriptionResult) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    try {
      // Create speech config
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, region)
      speechConfig.speechRecognitionLanguage = 'en-US'

      // Create audio config (use default microphone)
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput()

      // Create recognizer
      this.recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig)

      // Handle recognizing (interim results)
      this.recognizer.recognizing = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizingSpeech) {
          onTranscription({
            text: e.result.text,
            isFinal: false
          })
        }
      }

      // Handle recognized (final results)
      this.recognizer.recognized = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          const confidenceStr = e.result.properties?.getProperty(
            SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult
          )
          onTranscription({
            text: e.result.text,
            isFinal: true,
            confidence: confidenceStr ? parseFloat(confidenceStr) : undefined
          })
        } else if (e.result.reason === SpeechSDK.ResultReason.NoMatch) {
          console.log('[SpeechRecognition] No speech recognized')
        }
      }

      // Handle errors
      this.recognizer.canceled = (s, e) => {
        console.error('[SpeechRecognition] Canceled:', e.reason)
        
        if (e.reason === SpeechSDK.CancellationReason.Error) {
          console.error('[SpeechRecognition] Error details:', e.errorDetails)
          if (onError) {
            onError(e.errorDetails || 'Speech recognition error')
          }
        }
        
        this.stopRecognition()
      }

      // Start continuous recognition
      this.recognizer.startContinuousRecognitionAsync(
        () => {
          this.isListening = true
          console.log('[SpeechRecognition] Started')
        },
        (error) => {
          console.error('[SpeechRecognition] Start failed:', error)
          if (onError) {
            onError('Failed to start recognition')
          }
        }
      )
    } catch (error: unknown) {
      console.error('[SpeechRecognition] Init error:', getErrorMessage(error))
      if (onError) {
        onError(getErrorMessage(error) || 'Failed to initialize speech recognition')
      }
      throw error
    }
  }

  /**
   * Stop speech recognition
   */
  async stopRecognition(): Promise<void> {
    if (this.recognizer && this.isListening) {
      return new Promise((resolve) => {
        this.recognizer!.stopContinuousRecognitionAsync(
          () => {
            this.isListening = false
            this.recognizer?.close()
            this.recognizer = null
            console.log('[SpeechRecognition] Stopped')
            resolve()
          },
          (error) => {
            console.error('[SpeechRecognition] Stop error:', error)
            this.isListening = false
            this.recognizer?.close()
            this.recognizer = null
            resolve()
          }
        )
      })
    }
  }

  /**
   * Check if recognition is active
   */
  isActive(): boolean {
    return this.isListening
  }
}

// Lazy initialization - only create instance when accessed in browser
export const speechRecognitionManager = typeof window !== 'undefined'
  ? new SpeechRecognitionManager()
  : ({
      startRecognition: async () => { throw new Error('Speech recognition not available on server') },
      stopRecognition: async () => {},
      isActive: () => false
    } as unknown as SpeechRecognitionManager)
