import { useEffect, useState } from 'react'
import AdminShell from './AdminShell'
import { fetchAdminUsers, updateAdminUserRole } from '../../services/api'
import './Admin.css'

function AdminUsers() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')

  const load = () => {
    fetchAdminUsers()
      .then((res) => setUsers(res.users || []))
      .catch((err) => setError(err.message || 'Error al cargar usuarios'))
  }

  useEffect(() => {
    load()
  }, [])

  const changeRole = async (id, role) => {
    try {
      await updateAdminUserRole(id, role)
      load()
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el rol')
    }
  }

  return (
    <AdminShell title="Usuarios">
      {error && <p className="admin__error">{error}</p>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Identificación</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.documentNumber}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => changeRole(user.id, e.target.value)}
                    disabled={user.id === 'env-admin'}
                  >
                    <option value="cliente">Cliente</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  )
}

export default AdminUsers
