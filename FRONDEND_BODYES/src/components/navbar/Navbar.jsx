import { useCart } from '../../context/CartContext'
import './Navbar.css'

function Navbar() {
  const { totalItems } = useCart()

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <button className="navbar__icon" type="button" aria-label="Abrir menú">
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none" aria-hidden="true">
            <path d="M1 1h20M1 8h20M1 15h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        <a className="navbar__brand" href="/">
          CLIO
        </a>

        <div className="navbar__actions">
          <button className="navbar__icon" type="button" aria-label="Buscar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M16 16l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>

          <a
            className="navbar__cart"
            href="/carrito"
            aria-label={`Carrito de compras, ${totalItems} productos. Cruelty free.`}
            title="Carrito cruelty free"
          >
            <span className="navbar__cart-glow" aria-hidden="true" />
            <img
              className="navbar__cart-icon"
              src="/icons/cart.png"
              alt=""
              width="28"
              height="28"
            />
            {totalItems > 0 && (
              <span className="navbar__cart-badge">{totalItems}</span>
            )}
            <span className="navbar__cart-tag">cruelty free</span>
          </a>
        </div>
      </div>
    </header>
  )
}

export default Navbar
