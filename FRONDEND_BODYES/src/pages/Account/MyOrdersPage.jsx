import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/navbar/Navbar'
import { fetchMyOrders } from '../../services/api'
import './Account.css'

const FULFILLMENT_LABELS = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

function MyOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMyOrders()
      .then((data) => setOrders(data.orders || []))
      .catch((err) => setError(err.message || 'No se pudieron cargar los pedidos'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Navbar />
      <main className="account-page">
        <div className="account-page__inner">
          <p className="page-eyebrow page-eyebrow--pink">Mis pedidos</p>
          <h1>Historial de compras</h1>
          <p>Consulta el estado de tus bodys CLIO.</p>

          {loading && <p>Cargando…</p>}
          {error && <p className="account-msg">{error}</p>}

          {!loading && !error && orders.length === 0 && (
            <p>No tienes pedidos aún. <Link to="/catalogo">Explorar catálogo</Link></p>
          )}

          <ul className="orders-list">
            {orders.map((order) => (
              <li key={order.reference}>
                <strong>{order.reference}</strong>
                <span>{order.amountFormatted} · Pago: {order.status}</span>
                <span className="status">
                  {FULFILLMENT_LABELS[order.fulfillmentStatus] || order.fulfillmentStatus}
                </span>
                <span>{new Date(order.createdAt).toLocaleDateString('es-CO')}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  )
}

export default MyOrdersPage
