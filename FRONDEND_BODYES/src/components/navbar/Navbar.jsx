import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import AccountMenu from './AccountMenu'
import { useSiteContent } from '../../hooks/useSiteContent'
import './Navbar.css'

const navLinksLeft = [
  { href: '#coleccion', label: 'Colección', type: 'section' },
  { to: '/catalogo', label: 'Bodys', type: 'route' },
]

const navLinksRight = [
  { href: '#historia', label: 'La maison', type: 'section' },
  { href: '#contacto', label: 'Contacto', type: 'section' },
]

const navLinksAll = [...navLinksLeft, ...navLinksRight]

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

function NavLink({ link, location, onSection, onClose, className = '' }) {
  const isActive =
    link.type === 'route'
      ? location.pathname === link.to
      : location.pathname === '/' && location.hash === link.href

  const sharedClass = `navbar__link${isActive ? ' is-active' : ''}${className ? ` ${className}` : ''}`

  if (link.type === 'route') {
    return (
      <Link className={sharedClass} to={link.to} onClick={onClose}>
        {link.label}
      </Link>
    )
  }

  return (
    <a className={sharedClass} href={link.href} onClick={(e) => onSection(e, link.href)}>
      {link.label}
    </a>
  )
}

function Navbar() {
  const site = useSiteContent()
  const { totalItems, openDrawer } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [badgePop, setBadgePop] = useState(false)
  const prevTotal = useRef(totalItems)

  const isHome = location.pathname === '/'
  const overlayMode = isHome && !scrolled

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
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
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 116
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

  const headerClass = [
    'navbar',
    scrolled ? 'is-scrolled' : '',
    overlayMode ? 'is-overlay' : '',
    menuOpen ? 'is-menu-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <header className={headerClass}>
      <div className="navbar__promo" aria-hidden={scrolled}>
        <Link to={site.navbar.promoLink || '/catalogo'} className="navbar__promo-link">
          {site.navbar.promoText}
        </Link>
      </div>

      <div className="navbar__shell">
        <div className="navbar__row">
          <button
            className={`navbar__menu-btn${menuOpen ? ' is-open' : ''}`}
            type="button"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span /><span /><span />
          </button>

          <nav className="navbar__nav navbar__nav--left" aria-label="Navegación izquierda">
            <ul className="navbar__links">
              {navLinksLeft.map((link) => (
                <li key={link.label}>
                  <NavLink
                    link={link}
                    location={location}
                    onSection={goToSection}
                    onClose={closeMenu}
                  />
                </li>
              ))}
            </ul>
          </nav>

          <Link className="navbar__brand" to="/" onClick={goHome} aria-label="CLIO — Inicio">
            CLIO
          </Link>

          <div className="navbar__right">
            <nav className="navbar__nav navbar__nav--right" aria-label="Navegación derecha">
              <ul className="navbar__links">
                {navLinksRight.map((link) => (
                  <li key={link.label}>
                    <NavLink
                      link={link}
                      location={location}
                      onSection={goToSection}
                      onClose={closeMenu}
                    />
                  </li>
                ))}
              </ul>
            </nav>

            <div className="navbar__utilities">
            <AccountMenu />
            <button
              type="button"
              className={`navbar__utility navbar__cart${badgePop ? ' is-pop' : ''}`}
              aria-label={`Bolsa, ${totalItems} productos`}
              onClick={openDrawer}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M6 6h15l-1.5 9H7.5L6 6ZM6 6 5 3H2"
                  stroke="currentColor"
                  strokeWidth="1.15"
                  strokeLinejoin="round"
                />
                <circle cx="9" cy="20" r="1" stroke="currentColor" strokeWidth="1.15" />
                <circle cx="18" cy="20" r="1" stroke="currentColor" strokeWidth="1.15" />
              </svg>
              {totalItems > 0 && <span className="navbar__cart-count">{totalItems}</span>}
            </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`navbar__backdrop${menuOpen ? ' is-visible' : ''}`}
        onClick={closeMenu}
        aria-hidden={!menuOpen}
      />

      <nav
        className={`navbar__drawer${menuOpen ? ' is-open' : ''}`}
        aria-hidden={!menuOpen}
        aria-label="Menú móvil"
      >
        <div className="navbar__drawer-top">
          <span className="navbar__drawer-brand">CLIO</span>
          <button type="button" className="navbar__drawer-close" aria-label="Cerrar" onClick={closeMenu}>
            <span /><span />
          </button>
        </div>

        <ul className="navbar__drawer-links">
          {navLinksAll.map((link, i) => (
            <li key={link.label} style={{ '--i': i }}>
              <NavLink
                link={link}
                location={location}
                onSection={goToSection}
                onClose={closeMenu}
                className="navbar__drawer-link"
              />
            </li>
          ))}
        </ul>

        <div className="navbar__drawer-footer">
          <button
            type="button"
            className="navbar__drawer-action"
            onClick={() => { closeMenu(); openDrawer() }}
          >
            Bolsa{totalItems > 0 ? ` (${totalItems})` : ''}
          </button>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
