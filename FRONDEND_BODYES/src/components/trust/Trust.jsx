import { useScrollReveal } from '../../hooks/useScrollReveal'
import SectionDivider from '../common/SectionDivider/SectionDivider'
import './Trust.css'

const items = [
  {
    id: 'envio',
    title: 'Envío nacional',
    text: 'Despachamos a todo Colombia con seguimiento en tiempo real.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M1.5 12.5h13.2V4.2H1.5v8.3Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14.7 8.2h4.1l2.7 3.4v.9h-6.8V8.2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="5.2" cy="15.8" r="1.8" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="17.8" cy="15.8" r="1.8" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'cambios',
    title: 'Cambios fáciles',
    text: 'Política de cambios pensada para tu tranquilidad y comodidad.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 7h12l2 4v6H4V7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'pago',
    title: 'Pago seguro',
    text: 'Transacciones protegidas con Mercado Pago y encriptación SSL.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'calidad',
    title: 'Calidad premium',
    text: 'Telas cruelty free seleccionadas para una segunda piel perfecta.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 20.5c-4.2-2.5-7-5.8-7-9.4C5 7.6 7.5 5.5 10 5.5c1.4 0 2.5.6 3.2 1.6.7-1 1.8-1.6 3.2-1.6 2.5 0 5 2.1 5 5.6 0 3.6-2.8 6.9-7 9.4-.7.4-1.7.4-2.4 0Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
]

function Trust() {
  const [ref, visible] = useScrollReveal({ threshold: 0.12 })

  return (
    <section className="trust" aria-label="Confianza CLIO">
      <SectionDivider />
      <div
        ref={ref}
        className={`trust__inner reveal${visible ? ' is-visible' : ''}`}
      >
        <ul className="trust__grid">
          {items.map((item, i) => (
            <li key={item.id} className={`trust__item reveal-delay-${i + 1}`}>
              <div className="trust__icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Trust
