import { Navigate, Outlet } from 'react-router-dom'
import { isAdminAuthenticated } from '../../services/adminAuth'

function AdminGuard() {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin" replace />
  }
  return <Outlet />
}

export default AdminGuard
