import { Link } from 'react-router-dom'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import './Hero.css'

function Hero() {
  const [contentRef, contentVisible] = useScrollReveal({ threshold: 0.2 })

  return (
    <section id="inicio" className="hero" aria-label="Hero CLIO">
      <div className="hero__bg">
        <img
          className="hero__image"
          src="/images/hero.jpg"
          alt="Mujer con body CLIO — lencería premium"
        />
        <div className="hero__gradient" aria-hidden="true" />
      </div>

      <div
        ref={contentRef}
        className={`hero__content reveal${contentVisible ? ' is-visible' : ''}`}
      >
        <div className="hero__copy">
          <p className="hero__eyebrow">Lencería consciente · Colombia</p>
          <h1 className="hero__title">
            La segunda piel que
            <em> empodera</em>
          </h1>
          <p className="hero__text">
            Bodies diseñados para abrazar tu silueta con suavidad excepcional.
            Elegancia sensual, comodidad sin compromisos.
          </p>
          <div className="hero__actions">
            <Link className="btn btn--cta btn--pulse" to="/catalogo">
              Descubrir colección
            </Link>
            <a className="btn btn--ghost" href="#coleccion">
              Ver destacados
            </a>
          </div>
        </div>
        <div className="hero__visual-space" aria-hidden="true" />
      </div>

      <div className="hero__scroll" aria-hidden="true">
        <span>Scroll</span>
        <div className="hero__scroll-line" />
      </div>
    </section>
  )
}

export default Hero
