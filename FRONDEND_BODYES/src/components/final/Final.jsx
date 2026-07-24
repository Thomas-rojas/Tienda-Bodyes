import { Link } from 'react-router-dom'
import './Final.css'

function Final() {
  return (
    <section id="comprar" className="final" aria-label="Cierre CLIO">
      <div className="final__inner">
        <div className="final__banner">
          <img
            className="final__banner-image"
            src="/images/final-cta.jpg"
            alt="Mujeres disfrutando la comodidad CLIO"
          />
          <div className="final__banner-veil" aria-hidden="true" />
          <div className="final__banner-content">
            <h2 className="final__banner-title">Tu Nueva Piel te Espera</h2>
            <p className="final__banner-text">
              Únete a la revolución de la comodidad y el estilo. Encuentra tu
              talla perfecta hoy.
            </p>
            <Link className="final__banner-cta" to="/catalogo">
              COMPRAR AHORA
            </Link>
          </div>
        </div>

        <footer id="contacto" className="final__footer">
          <div className="final__brand">
            <Link className="final__logo" to="/">
              CLIO
            </Link>
            <p className="final__brand-text">
              Elevando lo cotidiano a través del diseño consciente y la calidad
              excepcional. El arte de vestir tu cuerpo.
            </p>
            <div className="final__social">
              <a
                className="final__social-btn"
                href="https://www.instagram.com/clioofficial.co?igsh=eTJib3kxdWo2ZjZ3"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de CLIO"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="3.8" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
                </svg>
              </a>
              <a
                className="final__social-btn"
                href="https://www.tiktok.com/@cliooficial.co?_r=1&_t=ZS-98I5UabDAAP"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok de CLIO"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M14.2 3.5c.6 2.3 2.1 3.9 4.3 4.4v2.5c-1.5-.1-2.9-.6-4.1-1.5v5.8c0 3.2-2.5 5.8-5.7 5.8S3 17.9 3 14.7c0-3.1 2.4-5.6 5.5-5.8v2.6c-1.5.2-2.6 1.4-2.6 3 0 1.7 1.3 3 3 3s3-1.3 3-3V3.5h2.3Z"
                    fill="currentColor"
                  />
                </svg>
              </a>
            </div>
          </div>

          <div className="final__col">
            <h3 className="final__col-title">TIENDA</h3>
            <ul className="final__links">
              <li><Link to="/catalogo">Colección</Link></li>
              <li><Link to="/catalogo">Best Sellers</Link></li>
              <li><Link to="/catalogo">Nuevos Ingresos</Link></li>
            </ul>
          </div>

          <div className="final__col">
            <h3 className="final__col-title">AYUDA</h3>
            <ul className="final__links">
              <li><a href="#">Envíos</a></li>
              <li><a href="#">Términos</a></li>
              <li><a href="#">Contacto</a></li>
            </ul>
          </div>

          <div className="final__col final__newsletter">
            <h3 className="final__col-title">NEWSLETTER</h3>
            <p className="final__newsletter-text">
              Recibe noticias y ofertas exclusivas.
            </p>
            <form
              className="final__form"
              onSubmit={(event) => event.preventDefault()}
            >
              <label className="sr-only" htmlFor="newsletter-email">
                Email
              </label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Email"
                autoComplete="email"
              />
              <button type="submit" aria-label="Suscribirse">
                <svg width="18" height="14" viewBox="0 0 20 14" fill="none" aria-hidden="true">
                  <path d="M1 7h17M12 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          </div>
        </footer>
      </div>
    </section>
  )
}

export default Final
