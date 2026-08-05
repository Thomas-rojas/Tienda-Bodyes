import { useEffect, useState } from 'react'
import { fetchAdminOrders } from '../../services/api'
import AdminShell from './AdminShell'
import './Admin.css'

function AdminSales() {
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('paid')
  const [openId, setOpenId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchAdminOrders(status)
        if (!cancelled) setOrders(data.orders || [])
      } catch (err) {
        if (!cancelled) setError(err.message || 'No se pudo cargar ventas')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [status])

  return (
    <AdminShell title="Ventas">
      <p className="admin__lead">
        Historial de pedidos con correo de cada cliente.
      </p>
      <div className="admin-sales__filters">
        <label>
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="paid">Pagados</option>
            <option value="pending">Pendientes</option>
            <option value="declined">Rechazados</option>
            <option value="all">Todos</option>
          </select>
        </label>
      </div>
      {error && <p className="admin__error">{error}</p>}
      {loading ? (
        <p>Cargando ventas…</p>
      ) : orders.length === 0 ? (
        <p>No hay pedidos en este filtro.</p>
      ) : (
        <div className="admin-sales">
          {orders.map((order) => {
            const open = openId === order.id
            return (
              <article key={order.id} className="admin-sale">
                <button
                  type="button"
                  className="admin-sale__head"
                  onClick={() => setOpenId(open ? '' : order.id)}
                >
                  <div>
                    <strong>{order.reference}</strong>
                    <span>{order.customer?.email}</span>
                  </div>
                  <div className="admin-sale__meta">
                    <span>{order.status}</span>
                    <span>{order.amountFormatted}</span>
                    <span>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString('es-CO')
                        : '—'}
                    </span>
                  </div>
                </button>
                {open && (
                  <div className="admin-sale__body">
                    <p>
                      <strong>Cliente:</strong> {order.customer?.name}
                    </p>
                    <p>
                      <strong>Correo:</strong> {order.customer?.email}
                    </p>
                    <p>
                      <strong>Teléfono:</strong> {order.customer?.phone}
                    </p>
                    <p>
                      <strong>Envío:</strong>{' '}
                      {[order.customer?.address, order.customer?.city, order.customer?.region]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    <ul>
                      {(order.items || []).map((item) => (
                        <li key={`${order.id}-${item.productId}-${item.name}`}>
                          {item.name} × {item.quantity} — {item.lineTotalFormatted}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </AdminShell>
  )
}

export default AdminSales
