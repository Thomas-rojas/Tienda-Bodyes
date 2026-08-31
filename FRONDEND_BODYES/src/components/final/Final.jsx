import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import SectionDivider from '../common/SectionDivider/SectionDivider'
import './Final.css'

function Final() {
  const [email, setEmail] = useState('')
  const [emailState, setEmailState] = useState('idle')
  const [bannerRef, bannerVisible] = useScrollReveal()

  const handleNewsletter = (event) => {
    event.preventDefault()
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    if (!valid) {
      setEmailState('error')
      return
    }
    setEmailState('success')
    setEmail('')
    setTimeout(() => setEmailState('idle'), 4000)
  }

  return (
    <section id="comprar" className="final" aria-label="Cierre CLIO">
      <SectionDivider />
      <div className="final__inner">
        <div
          ref={bannerRef}
          className={`final__banner reveal${bannerVisible ? ' is-visible' : ''}`}
        >
          <img
            className="final__banner-image"
            src="/images/final-cta.jpg"
            alt="Mujer con body CLIO"
            loading="lazy"
          />
          <div className="final__banner-veil" aria-hidden="true" />
          <div className="final__banner-content">
            <p className="final__banner-eyebrow">Tu momento</p>
            <h2 className="final__banner-title">Tu nueva piel te espera</h2>
            <p className="final__banner-text">
              Únete a mujeres que eligen comodidad sin renunciar al estilo.
              Encuentra tu pieza perfecta hoy.
            </p>
            <Link className="btn btn--cta btn--pulse" to="/catalogo">
              Comprar ahora
            </Link>
          </div>
        </div>

        <footer id="contacto" className="final__footer">
          <div className="final__brand">
            <Link className="final__logo" to="/">CLIO</Link>
            <p className="final__brand-text">
              Elevando lo cotidiano con diseño consciente y calidad excepcional.
              El arte de vestir tu cuerpo con elegancia.
            </p>
            <div className="final__social">
              <a href="https://www.instagram.com/clioofficial.co?igsh=eTJib3kxdWo2ZjZ3" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="currentColor" strokeWidth="1.5" /><circle cx="12" cy="12" r="3.8" stroke="currentColor" strokeWidth="1.5" /><circle cx="17.2" cy="6.8" r="1" fill="currentColor" /></svg>
              </a>
              <a href="https://www.tiktok.com/@cliooficial.co?_r=1&_t=ZS-98I5UabDAAP" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M14.2 3.5c.6 2.3 2.1 3.9 4.3 4.4v2.5c-1.5-.1-2.9-.6-4.1-1.5v5.8c0 3.2-2.5 5.8-5.7 5.8S3 17.9 3 14.7c0-3.1 2.4-5.6 5.5-5.8v2.6c-1.5.2-2.6 1.4-2.6 3 0 1.7 1.3 3 3 3s3-1.3 3-3V3.5h2.3Z" fill="currentColor" /></svg>
              </a>
            </div>
          </div>

          <div className="final__col">
            <h3>Tienda</h3>
            <ul>
              <li><Link to="/catalogo">Colección</Link></li>
              <li><Link to="/catalogo">Best sellers</Link></li>
              <li><Link to="/catalogo">Nuevos ingresos</Link></li>
            </ul>
          </div>

          <div className="final__col">
            <h3>Ayuda</h3>
            <ul>
              <li><a href="#contacto">Envíos</a></li>
              <li><a href="#contacto">Términos</a></li>
              <li><a href="#contacto">Contacto</a></li>
            </ul>
          </div>

          <div className="final__col final__newsletter">
            <h3>Newsletter</h3>
            <p>Recibe novedades y ofertas exclusivas.</p>
            <form className={`final__form final__form--${emailState}`} onSubmit={handleNewsletter}>
              <label className="sr-only" htmlFor="newsletter-email">Email</label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailState('idle') }}
                placeholder="tu@email.com"
                autoComplete="email"
              />
              <button type="submit" aria-label="Suscribirse">
                <svg width="18" height="14" viewBox="0 0 20 14" fill="none"><path d="M1 7h17M12 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </form>
            {emailState === 'error' && <p className="final__form-msg final__form-msg--error">Ingresa un email válido.</p>}
            {emailState === 'success' && <p className="final__form-msg final__form-msg--success">¡Gracias por suscribirte!</p>}
          </div>
        </footer>

        <p className="final__copy">© {new Date().getFullYear()} CLIO · Soft · Cruelty free · Conscious</p>
      </div>
    </section>
  )
}

export default Final
