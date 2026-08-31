import { useEffect, useState } from 'react'
import AdminShell from './AdminShell'
import { useToast } from '../../context/ToastContext'
import { exportAdminOrdersCsv, fetchAdminOrders, updateAdminOrderFulfillment } from '../../services/api'
import './Admin.css'

const FULFILLMENT_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
]

function AdminSales() {
  const { pushToast } = useToast()
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('paid')
  const [openId, setOpenId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState('')

  const loadOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchAdminOrders(status)
      setOrders(data.orders || [])
    } catch (err) {
      setError(err.message || 'No se pudo cargar ventas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [status])

  const changeFulfillment = async (orderId, payload) => {
    setSavingId(orderId)
    try {
      const data = await updateAdminOrderFulfillment(orderId, payload)
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? data.order : order)),
      )
      pushToast('Pedido actualizado')
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el estado')
    } finally {
      setSavingId('')
    }
  }

  const exportCsv = async () => {
    try {
      const response = await exportAdminOrdersCsv()
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'pedidos-clio.csv'
      link.click()
      URL.revokeObjectURL(url)
      pushToast('Exportación descargada')
    } catch {
      pushToast('No se pudo exportar', 'error')
    }
  }

  return (
    <AdminShell title="Pedidos">
      <div className="admin-toolbar">
        <button type="button" className="btn btn--outline" onClick={exportCsv}>
          Exportar CSV
        </button>
      </div>
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
                    <span>{order.fulfillmentStatus || 'pendiente'}</span>
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
                    <label className="admin-sale__fulfillment">
                      Estado logístico
                      <select
                        value={order.fulfillmentStatus || 'pendiente'}
                        disabled={savingId === order.id}
                        onChange={(e) => changeFulfillment(order.id, { fulfillmentStatus: e.target.value })}
                      >
                        {FULFILLMENT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="admin-sale__fulfillment">
                      Número de guía
                      <input
                        defaultValue={order.trackingNumber || ''}
                        placeholder="Ej. 1234567890"
                        onBlur={(e) => changeFulfillment(order.id, { trackingNumber: e.target.value })}
                      />
                    </label>
                    <ul>
                      {(order.items || []).map((item) => (
                        <li key={`${order.id}-${item.productId}-${item.name}`}>
                          {item.name} × {item.quantity} — {item.lineTotalFormatted}
                        </li>
                      ))}
                    </ul>
                    {order.whatsappStoreUrl && (
                      <p className="admin-sale__wa">
                        <a
                          href={order.whatsappStoreUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Avisar al cliente por WhatsApp
                        </a>
                      </p>
                    )}
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
