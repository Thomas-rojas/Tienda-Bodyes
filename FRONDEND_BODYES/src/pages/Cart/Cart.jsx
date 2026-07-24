import { Link } from 'react-router-dom'
import Navbar from '../../components/navbar/Navbar'
import { useCart } from '../../context/CartContext'
import './Cart.css'

function formatMoney(value) {
  return `$${value.toFixed(2)}`
}

function Cart() {
  const { items, addItem, decreaseItem, removeItem, clearCart, totalItems, totalPrice } =
    useCart()

  return (
    <>
      <Navbar />
      <main className="cart-page">
        <div className="cart-page__inner">
          <header className="cart-page__header">
            <p className="cart-page__eyebrow">Tu selección</p>
            <h1 className="cart-page__title">Carrito</h1>
            <p className="cart-page__subtitle">
              {totalItems === 0
                ? 'Aún no has añadido piezas.'
                : `${totalItems} ${totalItems === 1 ? 'pieza' : 'piezas'} listas para ti.`}
            </p>
          </header>

          {items.length === 0 ? (
            <div className="cart-page__empty">
              <p>Tu carrito está vacío.</p>
              <Link className="cart-page__cta" to="/catalogo">
                Ver colección
              </Link>
            </div>
          ) : (
            <>
              <ul className="cart-page__list">
                {items.map((item) => (
                  <li key={item.id} className="cart-page__item">
                    <div className="cart-page__media">
                      <img src={item.image} alt={item.alt || item.name} />
                    </div>

                    <div className="cart-page__details">
                      <h2>{item.name}</h2>
                      <p className="cart-page__price">{item.price}</p>

                      <div className="cart-page__actions">
                        <div className="cart-page__qty" aria-label="Cantidad">
                          <button
                            type="button"
                            aria-label={`Quitar una unidad de ${item.name}`}
                            onClick={() => decreaseItem(item.id)}
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            aria-label={`Añadir una unidad de ${item.name}`}
                            onClick={() => addItem(item)}
                          >
                            +
                          </button>
                        </div>

                        <button
                          className="cart-page__remove"
                          type="button"
                          onClick={() => removeItem(item.id)}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="cart-page__summary">
                <div className="cart-page__total">
                  <span>Total</span>
                  <strong>{formatMoney(totalPrice)}</strong>
                </div>
                <div className="cart-page__summary-actions">
                  <Link className="cart-page__pay" to="/pagar">
                    Pagar
                  </Link>
                  <Link className="cart-page__cta" to="/catalogo">
                    Seguir comprando
                  </Link>
                  <button
                    className="cart-page__clear"
                    type="button"
                    onClick={clearCart}
                  >
                    Vaciar carrito
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}

export default Cart
