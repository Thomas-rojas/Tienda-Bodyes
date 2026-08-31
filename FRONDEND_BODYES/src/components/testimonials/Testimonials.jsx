import { useEffect, useState } from 'react'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import './Testimonials.css'

const testimonials = [
  {
    id: 1,
    name: 'Valentina R.',
    city: 'Medellín',
    text: 'Nunca había sentido un body tan suave. Se adapta a mi cuerpo como si fuera hecho a medida. CLIO es mi nueva obsesión.',
    initial: 'V',
  },
  {
    id: 2,
    name: 'Camila S.',
    city: 'Bogotá',
    text: 'Elegante, cómodo y con un acabado impecable. Lo uso de día y de noche — la versatilidad es real.',
    initial: 'C',
  },
  {
    id: 3,
    name: 'Isabella M.',
    city: 'Cali',
    text: 'Amo que sea cruelty free sin sacrificar calidad. La tela respira y mantiene su forma después de muchos usos.',
    initial: 'I',
  },
]

function Testimonials() {
  const [active, setActive] = useState(0)
  const [ref, visible] = useScrollReveal({ threshold: 0.15 })

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % testimonials.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const current = testimonials[active]

  return (
    <section className="testimonials" aria-label="Testimonios">
      <div
        ref={ref}
        className={`testimonials__inner reveal${visible ? ' is-visible' : ''}`}
      >
        <p className="testimonials__eyebrow">Lo que dicen</p>
        <h2 className="testimonials__title">Mujeres que aman CLIO</h2>

        <div className="testimonials__carousel">
          <blockquote key={current.id} className="testimonials__quote">
            <p>"{current.text}"</p>
            <footer>
              <span className="testimonials__avatar">{current.initial}</span>
              <span>
                <strong>{current.name}</strong>
                <span>{current.city}</span>
              </span>
            </footer>
          </blockquote>

          <div className="testimonials__dots" role="tablist" aria-label="Testimonios">
            {testimonials.map((t, i) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Testimonio ${i + 1}`}
                className={i === active ? 'is-active' : ''}
                onClick={() => setActive(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
