import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import './Navbar.css'

const desktopLinks = [
  { href: '#inicio', label: 'Inicio', type: 'section' },
  { href: '#coleccion', label: 'Colección', type: 'section' },
  { to: '/catalogo', label: 'Ver todo', type: 'route' },
]

const drawerLinks = [
  ...desktopLinks,
  { href: '#historia', label: 'Nosotros', type: 'section' },
  { href: '#contacto', label: 'Contacto', type: 'section' },
]

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function smoothScrollTo(targetY, duration = 450) {
  const startY = window.scrollY
  const distance = targetY - startY
  if (Math.abs(distance) < 2) return Promise.resolve()

  const startTime = performance.now()
  return new Promise((resolve) => {
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1)
      window.scrollTo(0, startY + distance * easeInOutCubic(progress))
      if (progress < 1) requestAnimationFrame(step)
      else resolve()
    }
    requestAnimationFrame(step)
  })
}

function CartButton({ totalItems, badgePop, onClick, className = '' }) {
  return (
    <button
      className={`navbar__cart${badgePop ? ' is-pop' : ''}${className ? ` ${className}` : ''}`}
      type="button"
      aria-label={`Carrito, ${totalItems} productos`}
      onClick={onClick}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 6h15l-1.5 9H7.5L6 6ZM6 6 5 3H2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="20" r="1.2" fill="currentColor" />
        <circle cx="18" cy="20" r="1.2" fill="currentColor" />
      </svg>
      {totalItems > 0 && (
        <span className="navbar__cart-badge">{totalItems}</span>
      )}
    </button>
  )
}

function Navbar() {
  const { totalItems, openDrawer } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [badgePop, setBadgePop] = useState(false)
  const prevTotal = useRef(totalItems)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      if (!menuOpen) document.body.style.overflow = ''
    }
  }, [menuOpen])

  useEffect(() => {
    if (totalItems > prevTotal.current) {
      setBadgePop(true)
      const t = setTimeout(() => setBadgePop(false), 500)
      prevTotal.current = totalItems
      return () => clearTimeout(t)
    }
    prevTotal.current = totalItems
    return undefined
  }, [totalItems])

  const closeMenu = () => setMenuOpen(false)

  const scrollToHash = async (href) => {
    const target = document.querySelector(href)
    if (!target) return false
    const navOffset =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72
    const top = target.getBoundingClientRect().top + window.scrollY - navOffset - 8
    await smoothScrollTo(top, 450)
    history.replaceState(null, '', href)
    return true
  }

  const goToSection = async (event, href) => {
    event.preventDefault()
    closeMenu()
    if (location.pathname !== '/') {
      navigate(`/${href}`)
      return
    }
    await scrollToHash(href)
  }

  const goHome = (event) => {
    event.preventDefault()
    closeMenu()
    if (location.pathname !== '/') navigate('/')
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      history.replaceState(null, '', '/')
    })
  }

  return (
    <header className={`navbar${scrolled ? ' is-scrolled' : ''}`}>
      <div className="navbar__inner">
        <div className="navbar__left">
          <button
            className={`navbar__menu-btn${menuOpen ? ' is-open' : ''}`}
            type="button"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span /><span /><span />
          </button>

          <nav className="navbar__desktop" aria-label="Principal">
            <ul>
              {desktopLinks.map((link) => (
                <li key={link.label}>
                  {link.type === 'route' ? (
                    <Link to={link.to} onClick={closeMenu}>{link.label}</Link>
                  ) : (
                    <a href={link.href} onClick={(e) => goToSection(e, link.href)}>{link.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <Link className="navbar__brand" to="/" onClick={goHome}>
          <span className="navbar__brand-text">CLIO</span>
        </Link>

        <div className="navbar__right">
          <CartButton
            totalItems={totalItems}
            badgePop={badgePop}
            onClick={openDrawer}
            className="navbar__cart--desktop"
          />
          <CartButton
            totalItems={totalItems}
            badgePop={badgePop}
            onClick={openDrawer}
            className="navbar__cart--mobile"
          />
        </div>
      </div>

      <div
        className={`navbar__backdrop${menuOpen ? ' is-visible' : ''}`}
        onClick={closeMenu}
        aria-hidden={!menuOpen}
      />

      <nav className={`navbar__drawer${menuOpen ? ' is-open' : ''}`} aria-hidden={!menuOpen}>
        <div className="navbar__drawer-head">
          <span className="navbar__drawer-label">Menú</span>
          <button type="button" aria-label="Cerrar" onClick={closeMenu}>×</button>
        </div>
        <ul className="navbar__drawer-links">
          {drawerLinks.map((link, i) => (
            <li key={link.label} style={{ '--i': i }}>
              {link.type === 'route' ? (
                <Link to={link.to} onClick={closeMenu}>
                  <span>{link.label}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <a href={link.href} onClick={(e) => goToSection(e, link.href)}>
                  <span>{link.label}</span>
                  <span aria-hidden="true">→</span>
                </a>
              )}
            </li>
          ))}
        </ul>
        <p className="navbar__drawer-foot">Soft · Cruelty free · Conscious</p>
      </nav>
    </header>
  )
}

export default Navbar
