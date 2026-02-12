import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333'

export async function fetchFieldSuggestions(fieldName: string, existingValue: string | undefined, format: 'paragraph' | 'bulleted' = 'paragraph', index?: number, context?: Record<string, unknown>) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : undefined
  const body: Record<string, unknown> = { fieldName, format }
  if (existingValue) body.existingValue = existingValue
  if (typeof index === 'number') body.index = index
  if (context && typeof context === 'object') body.context = context

  const res = await axios.post(`${API_BASE_URL}/resume/suggestions`, body, {
    headers: { Authorization: token ? `Bearer ${token}` : '' },
  })
  return res.data
}
