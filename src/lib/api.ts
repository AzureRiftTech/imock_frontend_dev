'use client'

import axios from 'axios'

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || 'http://localhost:3333'

export const api = axios.create({
  baseURL,
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('token')
    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

export function getApiBaseUrl() {
  return baseURL
}
