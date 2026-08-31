import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Admin.css'

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/productos', label: 'Productos' },
  { to: '/admin/colecciones', label: 'Colecciones' },
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/clientes', label: 'Clientes' },
  { to: '/admin/contenido', label: 'Contenido' },
  { to: '/admin/cupones', label: 'Cupones' },
  { to: '/admin/configuracion', label: 'Configuración' },
  { to: '/admin/usuarios', label: 'Usuarios' },
]

function AdminShell({ title, children }) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link className="admin-sidebar__brand" to="/admin/dashboard">
          CLIO
          <span>Panel de control</span>
        </Link>
        <nav className="admin-sidebar__nav">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to}>{item.label}</Link>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <Link to="/">Ver tienda</Link>
          <button type="button" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </aside>
      <div className="admin-layout__main">
        <header className="admin-layout__header">
          <h1>{title}</h1>
        </header>
        <main className="admin-layout__content">{children}</main>
      </div>
    </div>
  )
}

export default AdminShell
