import { useEffect, useState } from 'react'
import AdminShell from './AdminShell'
import { fetchAdminCustomers } from '../../services/api'
import { formatCop } from '../../constants/products'
import './Admin.css'

function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetchAdminCustomers()
      .then((res) => setCustomers(res.customers || []))
      .catch(() => {})
  }, [])

  const filtered = customers.filter((customer) => {
    const q = query.toLowerCase()
    return (
      customer.name?.toLowerCase().includes(q) ||
      customer.email?.toLowerCase().includes(q) ||
      customer.documentNumber?.includes(q)
    )
  })

  return (
    <AdminShell title="Clientes">
      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Buscar por nombre, email o identificación"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Pedidos</th>
              <th>Total gastado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.email}</td>
                <td>{customer.phone}</td>
                <td>{customer.ordersCount || 0}</td>
                <td>{formatCop(customer.totalSpentPesos || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  )
}

export default AdminCustomers
