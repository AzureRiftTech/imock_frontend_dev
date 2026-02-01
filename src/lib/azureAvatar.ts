/**
 * Azure Avatar Service for Real-Time Synthesis
 * Uses Microsoft Azure Speech SDK for WebRTC-based avatar video generation
 */

import { api } from '@/lib/api'

declare global {
  interface Window {
    SpeechSDK: any
  }
}

export interface AvatarConfig {
  character: string
  style: string
  voiceName?: string
}

export class AzureAvatarManager {
  private avatarSynthesizer: any = null
  private peerConnection: RTCPeerConnection | null = null
  private videoElement: HTMLVideoElement | null = null
  private audioElement: HTMLAudioElement | null = null
  private isConnected: boolean = false
  private sdkLoaded: boolean = false

  /**
   * Load Azure Speech SDK dynamically
   */
  private loadSpeechSDK(): Promise<void> {
    // Check if running in browser
    if (typeof window === 'undefined') {
      return Promise.resolve()
    }

    if (this.sdkLoaded || window.SpeechSDK) {
      this.sdkLoaded = true
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      // Use direct CDN link for Azure Speech SDK
      script.src = 'https://cdn.jsdelivr.net/npm/microsoft-cognitiveservices-speech-sdk@latest/distrib/browser/microsoft.cognitiveservices.speech.sdk.bundle.js'
      script.crossOrigin = 'anonymous'
      script.onload = () => {
        console.log('[AzureAvatar] Speech SDK loaded')
        this.sdkLoaded = true
        resolve()
      }
      script.onerror = (error) => {
        console.error('[AzureAvatar] Script load error:', error)
        reject(new Error('Failed to load Speech SDK. Check network connection.'))
      }
      document.head.appendChild(script)
    })
  }

  /**
   * Initialize avatar connection
   */
  async startAvatar(
    config: AvatarConfig,
    videoContainer: HTMLElement,
    onError?: (error: string) => void
  ): Promise<void> {
    try {
      await this.loadSpeechSDK()

      // Get Speech config from backend
      const speechConfigRes = await api.get('/azure-avatar/speech-config')
      const { subscriptionKey, region } = speechConfigRes.data.data

      // Get ICE server token
      const iceTokenRes = await api.get('/azure-avatar/ice-token')
      const iceConfig = iceTokenRes.data.data

      const SpeechSDK = window.SpeechSDK

      // Create Speech Config
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, region)
      speechConfig.speechSynthesisVoiceName = config.voiceName || 'en-US-AvaMultilingualNeural'

      // Create Avatar Config
      const avatarConfig = new SpeechSDK.AvatarConfig(config.character, config.style)
      avatarConfig.backgroundColor = '#FFFFFFFF' // White background

      // Create WebRTC peer connection
      this.peerConnection = new RTCPeerConnection(iceConfig)

      // Set up video/audio elements
      this.peerConnection.ontrack = (event) => {
        console.log('[AzureAvatar] Received track:', event.track.kind)

        if (event.track.kind === 'video') {
          this.videoElement = document.createElement('video')
          this.videoElement.id = 'avatarVideo'
          this.videoElement.srcObject = event.streams[0]
          this.videoElement.autoplay = true
          this.videoElement.muted = true
          this.videoElement.playsInline = true
          this.videoElement.className = 'w-full h-full object-cover'

          // Clear and append video
          videoContainer.innerHTML = ''
          videoContainer.appendChild(this.videoElement)
        }

        if (event.track.kind === 'audio') {
          this.audioElement = document.createElement('audio')
          this.audioElement.id = 'avatarAudio'
          this.audioElement.srcObject = event.streams[0]
          this.audioElement.autoplay = true
          videoContainer.appendChild(this.audioElement)
        }
      }

      // Add transceivers
      this.peerConnection.addTransceiver('video', { direction: 'sendrecv' })
      this.peerConnection.addTransceiver('audio', { direction: 'sendrecv' })

      // Create Avatar Synthesizer
      this.avatarSynthesizer = new SpeechSDK.AvatarSynthesizer(speechConfig, avatarConfig)

      // Start avatar
      await this.avatarSynthesizer.startAvatarAsync(this.peerConnection)
      this.isConnected = true
      console.log('[AzureAvatar] Avatar started successfully')
    } catch (error: any) {
      console.error('[AzureAvatar] Failed to start avatar:', error)
      if (onError) {
        onError(error.message || 'Failed to start avatar')
      }
      throw error
    }
  }

  /**
   * Speak text through avatar
   */
  async speak(text: string): Promise<void> {
    if (!this.avatarSynthesizer || !this.isConnected) {
      throw new Error('Avatar not connected')
    }

    return new Promise((resolve, reject) => {
      // Set a safety timeout - sometimes Azure doesn't return the completion callback
      const timeout = setTimeout(() => {
        console.warn('[AzureAvatar] Speech timeout - resolving manually')
        resolve()
      }, 30000) // 30s max for any single utterance

      this.avatarSynthesizer.speakTextAsync(
        text,
        (result: any) => {
          clearTimeout(timeout)
          const SpeechSDK = window.SpeechSDK
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            console.log('[AzureAvatar] Speech completed')
            resolve()
          } else {
            console.error('[AzureAvatar] Speech failed:', result.reason)
            if (result.reason === SpeechSDK.ResultReason.Canceled) {
              const cancellation = SpeechSDK.CancellationDetails.fromResult(result)
              console.error('[AzureAvatar] Cancellation reason:', cancellation.reason)
              console.error('[AzureAvatar] Error details:', cancellation.errorDetails)
            }
            // Resolve instead of reject to avoid hanging the interview flow
            resolve()
          }
        },
        (error: any) => {
          clearTimeout(timeout)
          console.error('[AzureAvatar] Speech error:', error)
          // Resolve instead of reject to avoid hanging the interview flow
          resolve()
        }
      )
    })
  }

  /**
   * Stop avatar and close connections
   */
  async stopAvatar(): Promise<void> {
    if (this.avatarSynthesizer) {
      await this.avatarSynthesizer.close()
      this.avatarSynthesizer = null
    }

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null
      this.videoElement = null
    }

    if (this.audioElement) {
      this.audioElement.srcObject = null
      this.audioElement = null
    }

    this.isConnected = false
    console.log('[AzureAvatar] Avatar stopped')
  }

  /**
   * Check if avatar is connected
   */
  isAvatarConnected(): boolean {
    return this.isConnected
  }
}

// Lazy initialization - only create instance when accessed in browser
let managerInstance: AzureAvatarManager | null = null

export const azureAvatarManager = typeof window !== 'undefined'
  ? new AzureAvatarManager()
  : ({
    startAvatar: async () => { throw new Error('Avatar not available on server') },
    speak: async () => { throw new Error('Avatar not available on server') },
    stopAvatar: async () => { },
    isAvatarConnected: () => false
  } as any as AzureAvatarManager)
