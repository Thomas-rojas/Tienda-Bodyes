import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/navbar/Navbar'
import { useCart } from '../../context/CartContext'
import './Checkout.css'

function formatMoney(value) {
  return `$${value.toFixed(2)}`
}

function Checkout() {
  const navigate = useNavigate()
  const { items, totalItems, totalPrice, clearCart } = useCart()
  const [paid, setPaid] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (!paid && items.length === 0) {
    return (
      <>
        <Navbar />
        <main className="checkout-page">
          <div className="checkout-page__inner checkout-page__empty">
            <h1>No hay nada para pagar</h1>
            <p>Agrega un body y vuelve a intentar.</p>
            <Link className="checkout-page__cta" to="/catalogo">
              Ver colección
            </Link>
          </div>
        </main>
      </>
    )
  }

  if (paid) {
    return (
      <>
        <Navbar />
        <main className="checkout-page">
          <div className="checkout-page__inner checkout-page__success">
            <p className="checkout-page__eyebrow">CLIO</p>
            <h1>Pago recibido</h1>
            <p>
              Gracias por tu compra. Te enviaremos la confirmación a tu correo.
            </p>
            <Link className="checkout-page__cta" to="/">
              Volver al inicio
            </Link>
          </div>
        </main>
      </>
    )
  }

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const onSubmit = (event) => {
    event.preventDefault()
    clearCart()
    setPaid(true)
  }

  return (
    <>
      <Navbar />
      <main className="checkout-page">
        <div className="checkout-page__inner">
          <header className="checkout-page__header">
            <p className="checkout-page__eyebrow">Checkout</p>
            <h1>Pagar</h1>
            <p>
              {totalItems} {totalItems === 1 ? 'pieza' : 'piezas'} · Total{' '}
              <strong>{formatMoney(totalPrice)}</strong>
            </p>
          </header>

          <div className="checkout-page__layout">
            <form className="checkout-page__form" onSubmit={onSubmit}>
              <label>
                Nombre completo
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  required
                  autoComplete="name"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  required
                  autoComplete="email"
                />
              </label>
              <label>
                Teléfono
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  required
                  autoComplete="tel"
                />
              </label>
              <label>
                Dirección de envío
                <textarea
                  name="address"
                  value={form.address}
                  onChange={onChange}
                  required
                  rows={3}
                  autoComplete="street-address"
                />
              </label>

              <button className="checkout-page__pay" type="submit">
                Confirmar y pagar {formatMoney(totalPrice)}
              </button>
              <button
                className="checkout-page__back"
                type="button"
                onClick={() => navigate(-1)}
              >
                Volver
              </button>
            </form>

            <aside className="checkout-page__summary">
              <h2>Tu pedido</h2>
              <ul>
                {items.map((item) => (
                  <li key={item.id}>
                    <img src={item.image} alt={item.alt || item.name} />
                    <div>
                      <p>{item.name}</p>
                      <span>
                        {item.quantity} × {item.price}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="checkout-page__total">
                <span>Total</span>
                <strong>{formatMoney(totalPrice)}</strong>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  )
}

export default Checkout
