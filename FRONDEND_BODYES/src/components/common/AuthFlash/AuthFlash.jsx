import { useEffect, useState } from 'react'
import './AuthFlash.css'

function AuthFlash() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('auth_flash')
    if (!stored) return undefined
    sessionStorage.removeItem('auth_flash')
    setMessage(stored)
    const timer = setTimeout(() => setMessage(''), 5000)
    return () => clearTimeout(timer)
  }, [])

  if (!message) return null

  return (
    <div className="auth-flash" role="status">
      {message}
    </div>
  )
}

export default AuthFlash
