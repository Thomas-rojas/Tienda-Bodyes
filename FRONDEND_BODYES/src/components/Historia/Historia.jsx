import './Historia.css'

const features = [
  {
    id: 'moldeador',
    title: 'Efecto Moldeador',
    text: 'Tecnología que realza tu silueta de forma natural, brindando soporte sin sacrificar la comodidad.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'tela',
    title: 'Tela Inteligente',
    text: 'Transpirable y suave como una segunda piel. Hecha para durar y mantener su forma uso tras uso.',
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
    title: 'Versatilidad Total',
    text: 'De la oficina a una cena especial en segundos. La base perfecta para cualquier outfit impecable.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 4.2 12.9 7h2.9l-2.3 1.8.9 2.9L12 10.1 9.6 11.7l.9-2.9L8.2 7h2.9L12 4.2Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="m6.2 13.2.6 1.8h1.8l-1.5 1.1.6 1.8-1.5-1.1-1.5 1.1.6-1.8-1.5-1.1h1.8l.6-1.8Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path
          d="m17.8 13.2.6 1.8h1.8l-1.5 1.1.6 1.8-1.5-1.1-1.5 1.1.6-1.8-1.5-1.1h1.8l.6-1.8Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
]

function Historia() {
  return (
    <section id="historia" className="historia" aria-labelledby="historia-title">
      <div className="historia__inner">
        <h2 id="historia-title" className="historia__title">
          ¿POR QUÉ CLIO?
        </h2>

        <ul className="historia__grid">
          {features.map((feature) => (
            <li key={feature.id} className="historia__item">
              <div className="historia__icon">{feature.icon}</div>
              <h3 className="historia__heading">{feature.title}</h3>
              <p className="historia__text">{feature.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Historia
