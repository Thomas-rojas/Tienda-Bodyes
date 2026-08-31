import { Link } from 'react-router-dom'
import { featuredProducts } from '../../constants/products'
import ProductCard from '../common/ProductCard/ProductCard'
import SectionDivider from '../common/SectionDivider/SectionDivider'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import './Coleccion.css'

const badges = ['new', 'bestseller', null, 'new']

function Coleccion() {
  const [headerRef, headerVisible] = useScrollReveal()
  const [gridRef, gridVisible] = useScrollReveal({ threshold: 0.08 })

  return (
    <section id="coleccion" className="coleccion" aria-labelledby="coleccion-title">
      <SectionDivider />
      <div className="coleccion__inner">
        <header
          ref={headerRef}
          className={`coleccion__header reveal${headerVisible ? ' is-visible' : ''}`}
        >
          <div>
            <p className="coleccion__eyebrow">Selección curada</p>
            <h2 id="coleccion-title" className="coleccion__title">
              Colección destacada
            </h2>
            <p className="coleccion__subtitle">
              Piezas esenciales que elevan tu estilo con suavidad y sofisticación.
            </p>
          </div>
          <Link className="btn btn--ghost" to="/catalogo">
            Explorar todo
          </Link>
        </header>

        <ul
          ref={gridRef}
          className={`coleccion__grid reveal${gridVisible ? ' is-visible' : ''}`}
        >
          {featuredProducts.map((product, index) => (
            <li key={product.id} className={`reveal-delay-${(index % 3) + 1}`}>
              <ProductCard product={product} badge={badges[index]} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Coleccion
