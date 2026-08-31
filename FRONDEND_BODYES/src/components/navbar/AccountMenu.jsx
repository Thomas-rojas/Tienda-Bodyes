import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './AccountMenu.css'

function AccountMenu() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    const onDocClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const handleLogout = () => {
    logout()
    setOpen(false)
    navigate('/')
  }

  if (!user) {
    return (
      <Link className="navbar__utility account-menu__login" to="/login" aria-label="Iniciar sesión">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.15" />
          <path
            d="M5 20c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5"
            stroke="currentColor"
            strokeWidth="1.15"
            strokeLinecap="round"
          />
        </svg>
      </Link>
    )
  }

  return (
    <div className={`account-menu${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="navbar__utility"
        aria-label="Mi cuenta"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.15" />
          <path
            d="M5 20c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5"
            stroke="currentColor"
            strokeWidth="1.15"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <div className="account-menu__panel">
        <Link to="/cuenta" onClick={() => setOpen(false)}>Mi cuenta</Link>
        <Link to="/mis-pedidos" onClick={() => setOpen(false)}>Mis pedidos</Link>
        {isAdmin && (
          <Link to="/admin/dashboard" onClick={() => setOpen(false)}>Panel de administración</Link>
        )}
        <button type="button" onClick={handleLogout}>Cerrar sesión</button>
      </div>
    </div>
  )
}

export default AccountMenu
