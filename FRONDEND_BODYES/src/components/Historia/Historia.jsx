import { useScrollReveal } from '../../hooks/useScrollReveal'
import SectionDivider from '../common/SectionDivider/SectionDivider'
import './Historia.css'

const features = [
  {
    id: 'moldeador',
    title: 'Efecto moldeador',
    text: 'Realza tu silueta con soporte natural, sin sacrificar la comodidad que mereces.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'tela',
    title: 'Tela inteligente',
    text: 'Transpirable y suave como una segunda piel. Diseñada para durar uso tras uso.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 20.5c-4.2-2.5-7-5.8-7-9.4C5 7.6 7.5 5.5 10 5.5c1.4 0 2.5.6 3.2 1.6.7-1 1.8-1.6 3.2-1.6 2.5 0 5 2.1 5 5.6 0 3.6-2.8 6.9-7 9.4-.7.4-1.7.4-2.4 0Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'versatilidad',
    title: 'Versatilidad total',
    text: 'De la oficina a una cena especial. La base perfecta para cualquier outfit impecable.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 4.2 12.9 7h2.9l-2.3 1.8.9 2.9L12 10.1 9.6 11.7l.9-2.9L8.2 7h2.9L12 4.2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    ),
  },
]

function Historia() {
  const [ref, visible] = useScrollReveal({ threshold: 0.1 })

  return (
    <section id="historia" className="historia" aria-labelledby="historia-title">
      <SectionDivider />
      <div
        ref={ref}
        className={`historia__inner reveal${visible ? ' is-visible' : ''}`}
      >
        <header className="historia__header">
          <p className="historia__eyebrow">Nuestra esencia</p>
          <h2 id="historia-title" className="historia__title">
            ¿Por qué CLIO?
          </h2>
          <p className="historia__lead">
            Lencería consciente que celebra la feminidad con elegancia, suavidad y empoderamiento.
          </p>
        </header>

        <ul className="historia__grid">
          {features.map((feature, i) => (
            <li key={feature.id} className={`historia__item reveal-delay-${i + 1}`}>
              <div className="historia__icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Historia
