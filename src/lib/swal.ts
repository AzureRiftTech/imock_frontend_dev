// Lightweight wrapper for SweetAlert2 with graceful fallback to window.alert/confirm
export async function getSwal() {
  try {
    const Swal = (await import('sweetalert2')).default
    return Swal
  } catch (err) {
    return null
  }
}

export async function sweetAlert(title: string, text?: string, icon: 'info' | 'success' | 'warning' | 'error' = 'info') {
  const Swal = await getSwal()
  if (Swal) {
    return Swal.fire({ title, text, icon })
  }
  // fallback
  window.alert(text ? `${title}\n\n${text}` : title)
  return Promise.resolve()
}

export async function sweetConfirm(message: string, title = 'Please confirm') {
  const Swal = await getSwal()
  if (Swal) {
    const res = await Swal.fire({ title, text: message, icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes', cancelButtonText: 'Cancel' })
    return Boolean(res.isConfirmed)
  }
  return Promise.resolve(window.confirm(message))
}
