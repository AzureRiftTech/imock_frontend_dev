import { useEffect, useState } from 'react'

export function useRazorpay() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Check if already loaded
    if (window.Razorpay) {
      setLoaded(true)
      return
    }

    // Load Razorpay script
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => setLoaded(true)
    script.onerror = () => {
      console.error('Failed to load Razorpay script')
      setLoaded(false)
    }

    document.body.appendChild(script)

    return () => {
      // Cleanup: remove script on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  return loaded
}
