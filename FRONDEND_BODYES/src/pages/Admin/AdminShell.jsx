import { Link, useNavigate } from 'react-router-dom'
import { clearAdminToken } from '../../services/adminAuth'
import './Admin.css'

function AdminShell({ title, children }) {
  const navigate = useNavigate()

  const logout = () => {
    clearAdminToken()
    navigate('/admin')
  }

  return (
    <div className="admin">
      <header className="admin__top">
        <div className="admin__brand">
          <p className="admin__eyebrow">CLIO</p>
          <h1>{title}</h1>
        </div>
        <nav className="admin__nav">
          <Link to="/admin/productos">Colección</Link>
          <Link to="/admin/ventas">Ventas</Link>
          <Link to="/">Tienda</Link>
          <button type="button" onClick={logout}>
            Salir
          </button>
        </nav>
      </header>
      <main className="admin__main">{children}</main>
    </div>
  )
}

export default AdminShell
