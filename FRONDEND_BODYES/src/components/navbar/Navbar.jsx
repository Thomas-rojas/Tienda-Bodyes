import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { catalogProducts } from '../../constants/products'
import './Navbar.css'

const menuLinks = [
  { href: '#inicio', label: 'Inicio', note: 'Bienvenida', type: 'section' },
  { href: '#coleccion', label: 'Colección', note: 'Piezas esenciales', type: 'section' },
  { to: '/catalogo', label: 'Ver todo', note: 'Colección completa', type: 'route' },
  { href: '#historia', label: 'Por qué CLIO', note: 'Cruelty free', type: 'section' },
  { href: '#comprar', label: 'Comprar', note: 'Tu nueva piel', type: 'section' },
  { href: '#contacto', label: 'Contacto', note: 'Estamos cerca', type: 'section' },
]

const searchableProducts = catalogProducts.map((product) => ({
  id: product.id,
  name: product.name,
  price: product.price,
  category: product.category,
}))

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function smoothScrollTo(targetY, duration = 380) {
  const startY = window.scrollY
  const distance = targetY - startY
  if (Math.abs(distance) < 2) return Promise.resolve()

  const startTime = performance.now()

  return new Promise((resolve) => {
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1)
      window.scrollTo(0, startY + distance * easeInOutCubic(progress))
      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        resolve()
      }
    }
    requestAnimationFrame(step)
  })
}

function Navbar() {
  const { totalItems } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isNavigating, setIsNavigating] = useState(false)
  const searchInputRef = useRef(null)

  useEffect(() => {
    document.body.style.overflow = menuOpen || searchOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen, searchOpen])

  useEffect(() => {
    if (searchOpen) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [searchOpen])

  useEffect(() => {
    if (!searchOpen) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setSearchQuery('')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [searchOpen])

  const closeMenu = () => setMenuOpen(false)

  const openSearch = () => {
    setMenuOpen(false)
    setSearchOpen(true)
  }

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchQuery('')
  }

  const results = searchableProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  )

  const scrollToHash = async (href) => {
    const target = document.querySelector(href)
    if (!target) return false

    setIsNavigating(true)
    const navOffset =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-height'),
      ) || 68
    const top =
      target.getBoundingClientRect().top + window.scrollY - navOffset - 8

    await smoothScrollTo(top, 400)
    history.replaceState(null, '', href)
    setIsNavigating(false)
    return true
  }

  const goToSection = async (event, href) => {
    event.preventDefault()
    setMenuOpen(false)
    closeSearch()

    if (location.pathname !== '/') {
      navigate(`/${href}`)
      return
    }

    await scrollToHash(href)
  }

  const goToCollection = async (event) => {
    event.preventDefault()
    closeSearch()
    setMenuOpen(false)
    navigate('/catalogo')
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <button
          className={`navbar__icon navbar__menu-btn${menuOpen ? ' is-open' : ''}`}
          type="button"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls="navbar-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M2 2l14 14M16 2 2 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="22" height="16" viewBox="0 0 22 16" fill="none" aria-hidden="true">
              <path d="M1 1h20M1 8h20M1 15h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          )}
        </button>

        <Link className="navbar__brand" to="/" onClick={closeMenu}>
          CLIO
        </Link>

        <div className="navbar__actions">
          <button
            className="navbar__icon"
            type="button"
            aria-label="Buscar"
            aria-expanded={searchOpen}
            aria-controls="navbar-search"
            onClick={openSearch}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M16 16l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>

          <Link
            className="navbar__cart"
            to="/carrito"
            aria-label={`Carrito de compras, ${totalItems} productos. Cruelty free.`}
            title="Carrito cruelty free"
          >
            <span className="navbar__cart-glow" aria-hidden="true" />
            <img
              className="navbar__cart-icon"
              src="/icons/cart-soft.png"
              alt=""
              width="28"
              height="28"
            />
            {totalItems > 0 && (
              <span className="navbar__cart-badge">{totalItems}</span>
            )}
            <span className="navbar__cart-tag">cruelty free</span>
          </Link>
        </div>
      </div>

      <div
        className={`navbar__backdrop${menuOpen || searchOpen ? ' is-visible' : ''}`}
        onClick={() => {
          closeMenu()
          closeSearch()
        }}
        aria-hidden={!menuOpen && !searchOpen}
      />

      <div
        className={`navbar__veil${isNavigating ? ' is-active' : ''}`}
        aria-hidden="true"
      />

      <div
        id="navbar-search"
        className={`navbar__search${searchOpen ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Buscar productos"
        aria-hidden={!searchOpen}
      >
        <form
          className="navbar__search-form"
          onSubmit={(event) => {
            event.preventDefault()
            goToCollection(event)
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M16 16l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar bodies, colores, estilos..."
            autoComplete="off"
          />
          <button
            className="navbar__search-close"
            type="button"
            aria-label="Cerrar búsqueda"
            onClick={closeSearch}
          >
            Cerrar
          </button>
        </form>

        <div className="navbar__search-results">
          {searchQuery.trim() === '' ? (
            <p className="navbar__search-hint">Escribe para encontrar tu pieza CLIO.</p>
          ) : results.length === 0 ? (
            <p className="navbar__search-hint">No encontramos coincidencias.</p>
          ) : (
            <ul>
              {results.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={goToCollection}
                  >
                    <span>{product.name}</span>
                    <span>{product.price}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <nav
        id="navbar-menu"
        className={`navbar__panel${menuOpen ? ' is-open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <div className="navbar__panel-top">
          <p className="navbar__panel-label">Menú</p>
          <p className="navbar__panel-ethic">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 20.5c-4.2-2.5-7-5.8-7-9.4C5 7.6 7.5 5.5 10 5.5c1.4 0 2.5.6 3.2 1.6.7-1 1.8-1.6 3.2-1.6 2.5 0 5 2.1 5 5.6 0 3.6-2.8 6.9-7 9.4-.7.4-1.7.4-2.4 0Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            Soft · Cruelty free · Conscious
          </p>
        </div>

        <ul className="navbar__links">
          {menuLinks.map((link, index) => (
            <li key={link.label} style={{ '--i': index }}>
              {link.type === 'route' ? (
                <Link
                  to={link.to}
                  onClick={() => {
                    setMenuOpen(false)
                    closeSearch()
                  }}
                >
                  <span className="navbar__link-index">0{index + 1}</span>
                  <span className="navbar__link-copy">
                    <span className="navbar__link-label">{link.label}</span>
                    <span className="navbar__link-note">{link.note}</span>
                  </span>
                  <span className="navbar__link-arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              ) : (
                <a href={link.href} onClick={(event) => goToSection(event, link.href)}>
                  <span className="navbar__link-index">0{index + 1}</span>
                  <span className="navbar__link-copy">
                    <span className="navbar__link-label">{link.label}</span>
                    <span className="navbar__link-note">{link.note}</span>
                  </span>
                  <span className="navbar__link-arrow" aria-hidden="true">
                    →
                  </span>
                </a>
              )}
            </li>
          ))}
        </ul>

        <p className="navbar__panel-foot">Diseñado con respeto por cada piel y cada vida.</p>
      </nav>
    </header>
  )
}

export default Navbar
