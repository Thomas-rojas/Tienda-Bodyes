import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/navbar/Navbar'
import { useCart } from '../../context/CartContext'
import { syncPayment } from '../../services/api'
import './PaymentStatus.css'

function PaymentResult() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { clearCart } = useCart()
  const [state, setState] = useState({ loading: true, uiStatus: 'pending', order: null, error: '' })

  useEffect(() => {
    window.scrollTo(0, 0)
    const id = params.get('id') || params.get('transaction_id')
    const reference =
      params.get('reference') || sessionStorage.getItem('clio_last_reference')

    let cancelled = false
    ;(async () => {
      try {
        const data = await syncPayment({ id, reference })
        if (cancelled) return
        if (data.uiStatus === 'success' && sessionStorage.getItem('clio_clear_cart_on_paid')) {
          clearCart()
          sessionStorage.removeItem('clio_clear_cart_on_paid')
        }
        setState({
          loading: false,
          uiStatus: data.uiStatus,
          order: data.order,
          error: '',
        })
      } catch (err) {
        if (cancelled) return
        setState({
          loading: false,
          uiStatus: 'error',
          order: null,
          error: err.message || 'No pudimos verificar el pago.',
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [params, clearCart])

  const order = state.order

  return (
    <>
      <Navbar />
      <main className="payment-status">
        <div className="payment-status__inner">
          {state.loading ? (
            <>
              <p className="payment-status__eyebrow">CLIO</p>
              <h1>Verificando tu pago…</h1>
              <p>Esto puede tomar unos segundos.</p>
            </>
          ) : state.uiStatus === 'success' ? (
            <>
              <p className="payment-status__eyebrow payment-status__eyebrow--ok">
                Pago exitoso
              </p>
              <h1>¡Gracias por tu compra!</h1>
              <p>
                Tu pedido <strong>{order?.reference}</strong> fue confirmado.
                Enviamos el comprobante a tu correo y WhatsApp.
              </p>
              <div className="payment-status__actions">
                <Link
                  className="payment-status__cta"
                  to={`/comprobante/${encodeURIComponent(order.reference)}`}
                >
                  Ver comprobante
                </Link>
                <Link className="payment-status__link" to="/catalogo">
                  Seguir comprando
                </Link>
              </div>
            </>
          ) : state.uiStatus === 'declined' ? (
            <>
              <p className="payment-status__eyebrow payment-status__eyebrow--bad">
                Pago rechazado
              </p>
              <h1>No pudimos completar el pago</h1>
              <p>
                La pasarela rechazó la transacción
                {order?.reference ? ` (${order.reference})` : ''}. Puedes intentar
                con otro método o revisar los datos con tu banco.
              </p>
              <div className="payment-status__actions">
                <button
                  className="payment-status__cta"
                  type="button"
                  onClick={() => navigate('/pagar')}
                >
                  Intentar de nuevo
                </button>
                <Link className="payment-status__link" to="/carrito">
                  Volver al carrito
                </Link>
              </div>
            </>
          ) : state.uiStatus === 'pending' ? (
            <>
              <p className="payment-status__eyebrow">Pago en proceso</p>
              <h1>Estamos confirmando tu pago</h1>
              <p>
                Algunas operaciones (PSE/Nequi) tardan un momento. Recarga esta
                página o revisa tu correo en unos minutos.
              </p>
              {order?.reference && (
                <Link
                  className="payment-status__cta"
                  to={`/comprobante/${encodeURIComponent(order.reference)}`}
                >
                  Ver estado del pedido
                </Link>
              )}
            </>
          ) : (
            <>
              <p className="payment-status__eyebrow payment-status__eyebrow--bad">
                Error en la transacción
              </p>
              <h1>Ocurrió un problema</h1>
              <p>
                {state.error ||
                  'Hubo un error durante el pago. No se cobró de forma confirmada; si ves un cargo, contáctanos con la referencia.'}
              </p>
              <div className="payment-status__actions">
                <Link className="payment-status__cta" to="/pagar">
                  Volver a pagar
                </Link>
                <Link className="payment-status__link" to="/">
                  Ir al inicio
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}

export default PaymentResult
