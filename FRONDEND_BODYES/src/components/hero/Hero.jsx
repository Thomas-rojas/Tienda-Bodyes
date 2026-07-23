import './Hero.css'

function Hero() {
  return (
    <section className="hero" aria-label="Hero CLIO">
      <div className="hero__stage">
        <img
          className="hero__image"
          src="/images/hero.jpg"
          alt="Mujer con body CLIO en tonos tierra"
        />
        <div className="hero__veil" aria-hidden="true" />

        <div className="hero__content">
          <div className="hero__panel">
            <h1 className="hero__title">
              El Body Perfecto: Comodidad que Empodera
            </h1>
            <p className="hero__text">
              Diseñados para adaptarse a tu cuerpo y a tu ritmo de vida. Descubre
              la suavidad de nuestra tela premium que se siente como una segunda
              piel.
            </p>
            <a className="hero__cta" href="/catalogo">
              VER COLECCIÓN
            </a>
          </div>
        </div>
      </div>

      <div className="hero__benefits">
        <div className="hero__benefit">
          <svg width="22" height="18" viewBox="0 0 24 20" fill="none" aria-hidden="true">
            <path
              d="M1.5 12.5h13.2V4.2H1.5v8.3Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M14.7 8.2h4.1l2.7 3.4v.9h-6.8V8.2Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle cx="5.2" cy="15.8" r="1.8" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="17.8" cy="15.8" r="1.8" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span>ENVÍOS GRATIS EN COMPRAS +$75</span>
        </div>

        <div className="hero__benefit">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M4.5 4.8v3.8h3.8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>DEVOLUCIONES SENCILLAS</span>
        </div>
      </div>
    </section>
  )
}

export default Hero
