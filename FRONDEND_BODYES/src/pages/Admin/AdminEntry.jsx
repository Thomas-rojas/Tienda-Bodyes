import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function AdminEntry() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  return <Navigate to="/login" state={{ from: '/admin' }} replace />
}

export default AdminEntry
