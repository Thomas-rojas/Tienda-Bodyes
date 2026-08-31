import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSiteContent } from '../../hooks/useSiteContent'
import { subscribeNewsletter } from '../../services/api'
import './Final.css'

function Final() {
  const site = useSiteContent()
  const [email, setEmail] = useState('')
  const [emailState, setEmailState] = useState('idle')

  const handleNewsletter = async (event) => {
    event.preventDefault()
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    if (!valid) {
      setEmailState('error')
      return
    }
    try {
      await subscribeNewsletter(email.trim())
      setEmailState('success')
      setEmail('')
      setTimeout(() => setEmailState('idle'), 4000)
    } catch {
      setEmailState('error')
    }
  }

  return (
    <footer id="contacto" className="final" aria-label="Pie de página CLIO">
      <div className="final__inner">
        <div className="final__grid">
          <div className="final__col">
            <h3>Ayuda</h3>
            <ul>
              <li><a href="#contacto">Envíos</a></li>
              <li><a href="#contacto">Devoluciones</a></li>
              <li><a href="#contacto">Contacto</a></li>
            </ul>
          </div>

          <div className="final__col">
            <h3>La maison</h3>
            <ul>
              <li><a href="#historia">Nosotros</a></li>
              <li><Link to="/catalogo">Bodys</Link></li>
              <li><a href="#contacto">Tiendas</a></li>
            </ul>
          </div>

          <div className="final__col">
            <h3>Redes</h3>
            <ul className="final__social">
              <li>
                <a href={site.footer.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  Instagram
                </a>
              </li>
              <li>
                <a href={site.footer.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                  TikTok
                </a>
              </li>
            </ul>
          </div>

          <div className="final__col final__newsletter">
            <h3>Newsletter</h3>
            <p>Novedades editoriales y acceso anticipado.</p>
            <form className={`final__form final__form--${emailState}`} onSubmit={handleNewsletter}>
              <label className="sr-only" htmlFor="newsletter-email">Email</label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailState('idle') }}
                placeholder="Email"
                autoComplete="email"
              />
              <button type="submit" className="btn btn--pink">Suscribirse</button>
            </form>
            {emailState === 'error' && <p className="final__msg final__msg--error">Email inválido</p>}
            {emailState === 'success' && <p className="final__msg final__msg--success">Gracias por suscribirte</p>}
          </div>
        </div>

        <div className="final__bottom">
          <Link className="final__logo" to="/">CLIO</Link>
          <p className="final__copy">© {new Date().getFullYear()} {site.footer.copyright}</p>
        </div>
      </div>
    </footer>
  )
}

export default Final
