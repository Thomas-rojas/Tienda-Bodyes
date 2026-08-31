import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../../components/navbar/Navbar'
import { useAuth } from '../../context/AuthContext'
import './Auth.css'

function redirectByRole(user, from) {
  if (user.role === 'admin') return '/admin/dashboard'
  if (from && from !== '/login' && from !== '/registro') return from
  return '/catalogo'
}

function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, login, register } = useAuth()
  const initialTab = location.pathname === '/registro' ? 'register' : 'login'
  const [tab, setTab] = useState(initialTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [loginForm, setLoginForm] = useState({ identificacion: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    documentType: 'CC',
    identificacion: '',
  })

  if (user) {
    return <Navigate to={redirectByRole(user, location.state?.from)} replace />
  }

  const onLogin = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const logged = await login(loginForm.identificacion.trim(), loginForm.password)
      navigate(redirectByRole(logged, location.state?.from), { replace: true })
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const onRegister = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const created = await register({
        name: registerForm.name,
        email: registerForm.email,
        phone: registerForm.phone,
        documentType: registerForm.documentType,
        identificacion: registerForm.identificacion,
      })
      navigate(redirectByRole(created, location.state?.from), { replace: true })
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-tabs">
            <button
              type="button"
              className={tab === 'login' ? 'is-active' : ''}
              onClick={() => { setTab('login'); setError('') }}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              className={tab === 'register' ? 'is-active' : ''}
              onClick={() => { setTab('register'); setError('') }}
            >
              Registrarme
            </button>
          </div>

          {tab === 'login' ? (
            <form onSubmit={onLogin}>
              <label>
                Identificación*
                <input
                  value={loginForm.identificacion}
                  onChange={(e) => setLoginForm((f) => ({ ...f, identificacion: e.target.value }))}
                  required
                  autoComplete="username"
                />
              </label>
              <label>
                Contraseña*
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete="current-password"
                />
              </label>
              <p className="auth-hint">
                (por defecto es tu identificación si te registraste)
              </p>
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={onRegister}>
              <label>
                Nombre completo*
                <input
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </label>
              <label>
                Email*
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  autoComplete="email"
                />
              </label>
              <label>
                Celular* (requerido)
                <input
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, phone: e.target.value }))}
                  required
                  autoComplete="tel"
                />
              </label>
              <label>
                Tipo de identificación*
                <select
                  value={registerForm.documentType}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, documentType: e.target.value }))}
                >
                  <option value="CC">Cédula</option>
                  <option value="CE">Cédula extranjería</option>
                  <option value="PA">Pasaporte</option>
                </select>
              </label>
              <label>
                Identificación*
                <input
                  value={registerForm.identificacion}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, identificacion: e.target.value }))}
                  required
                />
              </label>
              <p className="auth-note">La contraseña será tu número de identificación</p>
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Creando…' : 'Crear cuenta y entrar'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}

export default AuthPage
