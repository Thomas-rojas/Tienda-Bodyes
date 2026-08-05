import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { adminLogin } from '../../services/api'
import {
  isAdminAuthenticated,
  setAdminToken,
} from '../../services/adminAuth'
import './Admin.css'

function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@clio.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAdminAuthenticated()) {
    return <Navigate to="/admin/productos" replace />
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await adminLogin(email, password)
      setAdminToken(data.token)
      navigate('/admin/productos')
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin admin--login">
      <form className="admin-login" onSubmit={onSubmit}>
        <p className="admin__eyebrow">CLIO</p>
        <h1>Panel de administración</h1>
        <p className="admin-login__hint">
          Acceso para gestionar colección y ventas.
        </p>
        <label>
          Correo
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className="admin__error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

export default AdminLogin
