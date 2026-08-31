import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function AdminGuard() {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (!isAdmin) {
    sessionStorage.setItem('auth_flash', 'Acceso no autorizado. Esta sección es solo para administradores.')
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default AdminGuard
