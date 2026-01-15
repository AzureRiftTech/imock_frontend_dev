import axios from 'axios'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function getApiErrorMessage(err: unknown): string | null {
  if (!axios.isAxiosError(err)) return null

  const data: unknown = err.response?.data
  let rawMessage = ''

  if (typeof data === 'string') {
    rawMessage = data
  } else if (isRecord(data)) {
    if (typeof data.error === 'string') rawMessage = data.error
    else if (typeof data.message === 'string') rawMessage = data.message
  }

  if (!rawMessage) return null

  // Capture Gemini-specific overloaded/503 errors and return a friendly message
  if (
    rawMessage.toLowerCase().includes('model is overloaded') ||
    rawMessage.toLowerCase().includes('503 service unavailable') ||
    rawMessage.toLowerCase().includes('service unavailable')
  ) {
    return 'Our AI Interviewer is currently experiencing high demand. Please wait a moment and click retry.'
  }

  return rawMessage
}
