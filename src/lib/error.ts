import axios from 'axios'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function getApiErrorMessage(err: unknown): string | null {
  if (!axios.isAxiosError(err)) return null

  const data: unknown = err.response?.data

  if (typeof data === 'string') return data

  if (isRecord(data)) {
    if (typeof data.error === 'string') return data.error
    if (typeof data.message === 'string') return data.message
  }

  return null
}
