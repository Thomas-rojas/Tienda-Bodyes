import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../../components/navbar/Navbar'
import { fetchOrderByReference } from '../../services/api'
import './Receipt.css'

const STATUS_LABEL = {
  paid: 'Pagado',
  pending: 'Pendiente',
  declined: 'Rechazado',
  error: 'Error',
  voided: 'Anulado',
}

function Receipt() {
  const { reference } = useParams()
  const [state, setState] = useState({ loading: true, order: null, error: '', notifications: null })

  useEffect(() => {
    window.scrollTo(0, 0)
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchOrderByReference(reference)
        if (cancelled) return
        setState({
          loading: false,
          order: data.order,
          notifications: data.notifications,
          error: '',
        })
      } catch (err) {
        if (cancelled) return
        setState({
          loading: false,
          order: null,
          notifications: null,
          error: err.message || 'No encontramos este comprobante.',
        })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reference])

  const order = state.order

  return (
    <>
      <Navbar />
      <main className="receipt-page">
        <div className="receipt-page__inner">
          {state.loading ? (
            <p>Cargando comprobante…</p>
          ) : state.error ? (
            <div className="receipt-page__missing">
              <h1>Comprobante no encontrado</h1>
              <p>{state.error}</p>
              <Link to="/">Volver al inicio</Link>
            </div>
          ) : (
            <>
              <header className="receipt-page__header">
                <p className="receipt-page__brand">CLIO</p>
                <h1>Comprobante de compra</h1>
                <p>
                  Referencia <strong>{order.reference}</strong> ·{' '}
                  {STATUS_LABEL[order.status] || order.status}
                </p>
              </header>

              <section className="receipt-page__block">
                <h2>Cliente</h2>
                <p>{order.customer.name}</p>
                <p>{order.customer.email}</p>
                <p>{order.customer.phone}</p>
                <p>
                  {order.customer.documentType} {order.customer.documentNumber}
                </p>
                <p>
                  {order.customer.address}, {order.customer.city},{' '}
                  {order.customer.region}
                </p>
              </section>

              <section className="receipt-page__block">
                <h2>Detalle</h2>
                <ul>
                  {order.items.map((item) => (
                    <li key={`${item.productId}-${item.name}`}>
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <strong>{item.lineTotalFormatted}</strong>
                    </li>
                  ))}
                </ul>
                <div className="receipt-page__total">
                  <span>Total</span>
                  <strong>{order.amountFormatted}</strong>
                </div>
                {order.paymentMethodType && (
                  <p className="receipt-page__meta">
                    Método: {order.paymentMethodType}
                  </p>
                )}
                {order.wompiTransactionId && (
                  <p className="receipt-page__meta">
                    Transacción: {order.wompiTransactionId}
                  </p>
                )}
                {order.createdAt && (
                  <p className="receipt-page__meta">
                    Fecha:{' '}
                    {new Date(order.createdAt).toLocaleString('es-CO', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                )}
              </section>

              {order.status === 'paid' && (
                <p className="receipt-page__note">
                  Te enviamos la confirmación por correo y WhatsApp.
                </p>
              )}

              {state.notifications?.simulated && order.status === 'paid' && (
                <p className="receipt-page__note">
                  Modo desarrollo: configura correo (SMTP/Resend) y STORE_WHATSAPP
                  en el backend para notificaciones completas.
                </p>
              )}

              <div className="receipt-page__actions">
                <button
                  type="button"
                  className="receipt-page__print"
                  onClick={() => window.print()}
                >
                  Imprimir / Guardar PDF
                </button>
                <Link to="/catalogo">Seguir comprando</Link>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}

export default Receipt
