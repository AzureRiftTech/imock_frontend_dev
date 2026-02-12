// Global ambient declarations for browser and SDK types we rely on
// Keep these minimal and typed as `any` to avoid over-assuming SDK shapes in the short term.

declare global {
  interface Window {
    SpeechSDK?: unknown
    SpeechRecognition?: unknown
    webkitSpeechRecognition?: unknown
    Razorpay?: unknown
  }

  type SpeechRecognition = unknown
  var SpeechRecognition: unknown
  var webkitSpeechRecognition: unknown
} 

export {}
