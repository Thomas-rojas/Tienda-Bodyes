import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { formatCop } from '../../constants/products'
import './CartDrawer.css'

function CartDrawer() {
  const {
    items,
    addItem,
    decreaseItem,
    removeItem,
    totalItems,
    totalPrice,
    drawerOpen,
    closeDrawer,
  } = useCart()

  return (
    <>
      <div
        className={`cart-drawer__backdrop${drawerOpen ? ' is-open' : ''}`}
        onClick={closeDrawer}
        aria-hidden={!drawerOpen}
      />

      <aside
        className={`cart-drawer${drawerOpen ? ' is-open' : ''}`}
        aria-label="Carrito de compras"
        aria-hidden={!drawerOpen}
      >
        <header className="cart-drawer__header">
          <div>
            <p className="cart-drawer__eyebrow">Selección</p>
            <h2 className="cart-drawer__title">Carrito</h2>
          </div>
          <button
            className="cart-drawer__close"
            type="button"
            aria-label="Cerrar carrito"
            onClick={closeDrawer}
          >
            ×
          </button>
        </header>

        {items.length === 0 ? (
          <div className="cart-drawer__empty">
            <p>Tu carrito está vacío.</p>
            <Link className="btn btn--outline" to="/catalogo" onClick={closeDrawer}>
              Ver bodys
            </Link>
          </div>
        ) : (
          <>
            <ul className="cart-drawer__list">
              {items.map((item) => (
                <li key={item.id} className="cart-drawer__item">
                  <div className="cart-drawer__media">
                    <img src={item.image} alt={item.alt || item.name} loading="lazy" />
                  </div>
                  <div className="cart-drawer__info">
                    <h3>{item.name}</h3>
                    <p>{item.price}</p>
                    <div className="cart-drawer__qty">
                      <button type="button" aria-label="Disminuir" onClick={() => decreaseItem(item.id)}>−</button>
                      <span>{item.quantity}</span>
                      <button type="button" aria-label="Aumentar" onClick={() => addItem(item, { openDrawer: false })}>+</button>
                    </div>
                  </div>
                  <button
                    className="cart-drawer__remove"
                    type="button"
                    aria-label={`Quitar ${item.name}`}
                    onClick={() => removeItem(item.id)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>

            <footer className="cart-drawer__footer">
              <div className="cart-drawer__total">
                <span>Total ({totalItems})</span>
                <strong>{formatCop(totalPrice)}</strong>
              </div>
              <Link className="btn btn--primary btn--full" to="/pagar" onClick={closeDrawer}>
                Ir a pagar
              </Link>
              <Link className="cart-drawer__link" to="/carrito" onClick={closeDrawer}>
                Ver carrito completo
              </Link>
            </footer>
          </>
        )}
      </aside>
    </>
  )
}

export default CartDrawer
