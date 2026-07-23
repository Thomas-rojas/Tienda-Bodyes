import './Final.css'

function Final() {
  return (
    <section className="final" aria-label="Cierre CLIO">
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
            <a className="final__banner-cta" href="/catalogo">
              COMPRAR AHORA
            </a>
          </div>
        </div>

        <footer className="final__footer">
          <div className="final__brand">
            <a className="final__logo" href="/">
              CLIO
            </a>
            <p className="final__brand-text">
              Elevando lo cotidiano a través del diseño consciente y la calidad
              excepcional. El arte de vestir tu cuerpo.
            </p>
            <div className="final__social">
              <a className="final__social-btn" href="#" aria-label="Código QR">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 3h3v4h-3v-4Zm4-3h3v3h-3v-3Zm0 4h3v3h-3v-3Z" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </a>
              <a className="final__social-btn" href="#" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="3.8" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
                </svg>
              </a>
            </div>
          </div>

          <div className="final__col">
            <h3 className="final__col-title">TIENDA</h3>
            <ul className="final__links">
              <li><a href="/catalogo">Colección</a></li>
              <li><a href="/catalogo">Best Sellers</a></li>
              <li><a href="/catalogo">Nuevos Ingresos</a></li>
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
