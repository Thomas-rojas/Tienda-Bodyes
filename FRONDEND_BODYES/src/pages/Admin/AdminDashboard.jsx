import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminShell from './AdminShell'
import { fetchAdminDashboard } from '../../services/api'
import { formatCop } from '../../constants/products'
import './Admin.css'

function AdminDashboard() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAdminDashboard(days)
      .then((res) => setData(res.dashboard))
      .catch((err) => setError(err.message || 'Error al cargar dashboard'))
  }, [days])

  const maxSales = Math.max(...(data?.salesByDay?.map((d) => d.salesPesos) || [1]), 1)

  return (
    <AdminShell title="Dashboard">
      {error && <p className="admin__error">{error}</p>}
      <div className="admin-toolbar">
        <label>
          Período
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>7 días</option>
            <option value={30}>30 días</option>
            <option value={90}>90 días</option>
          </select>
        </label>
      </div>

      {data && (
        <>
          <div className="admin-stats">
            <article className="admin-stat">
              <span>Ventas del período</span>
              <strong>{formatCop(data.totalSalesPesos)}</strong>
              <small>{data.salesChangePercent >= 0 ? '+' : ''}{data.salesChangePercent}% vs período anterior</small>
            </article>
            <article className="admin-stat">
              <span>Pedidos pagados</span>
              <strong>{data.paidOrdersCount}</strong>
            </article>
            <article className="admin-stat">
              <span>Ticket promedio</span>
              <strong>{formatCop(data.avgTicketPesos)}</strong>
            </article>
            <article className="admin-stat">
              <span>Nuevos clientes</span>
              <strong>{data.newClientsCount}</strong>
            </article>
            <article className="admin-stat admin-stat--alert">
              <span>Bajo stock</span>
              <strong>{data.lowStockCount}</strong>
            </article>
          </div>

          <section className="admin-panel">
            <h2>Ventas por día</h2>
            <div className="admin-chart">
              {data.salesByDay.map((day) => (
                <div key={day.date} className="admin-chart__bar-wrap" title={`${day.date}: ${formatCop(day.salesPesos)}`}>
                  <div
                    className="admin-chart__bar"
                    style={{ height: `${Math.max(8, (day.salesPesos / maxSales) * 100)}%` }}
                  />
                  <span>{day.date.slice(5)}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="admin-grid-2">
            <section className="admin-panel">
              <h2>Productos más vendidos</h2>
              <ul className="admin-list">
                {data.topProducts.map((item) => (
                  <li key={item.name}>{item.name} · {item.qty} uds · {formatCop(item.revenue)}</li>
                ))}
              </ul>
            </section>
            <section className="admin-panel">
              <h2>Pedidos recientes</h2>
              <ul className="admin-list">
                {data.recentOrders.map((order) => (
                  <li key={order.reference}>{order.reference} · {order.amountFormatted}</li>
                ))}
              </ul>
              <Link to="/admin/pedidos">Ver pedidos</Link>
            </section>
          </div>
        </>
      )}
    </AdminShell>
  )
}

export default AdminDashboard
