import { Link } from 'react-router-dom'
import { useStoreCollections } from '../../hooks/useSiteContent'
import CollectionCard from './CollectionCard'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import './Coleccion.css'

function Coleccion() {
  const collections = useStoreCollections()
  const [headerRef, headerVisible] = useScrollReveal()
  const [gridRef, gridVisible] = useScrollReveal({ threshold: 0.08 })

  return (
    <section id="coleccion" className="coleccion" aria-labelledby="coleccion-title">
      <div className="coleccion__inner">
        <header
          ref={headerRef}
          className={`coleccion__header reveal${headerVisible ? ' is-visible' : ''}`}
        >
          <p className="eyebrow">Selección</p>
          <h2 id="coleccion-title" className="section-title">
            Bodys esenciales
          </h2>
          <Link className="coleccion__link" to="/catalogo">
            Ver todos los bodys
          </Link>
        </header>

        <ul
          ref={gridRef}
          className={`coleccion__grid reveal${gridVisible ? ' is-visible' : ''}`}
        >
          {collections.map((collection, index) => (
            <li key={collection.slug} className={`reveal-delay-${(index % 3) + 1}`}>
              <CollectionCard collection={collection} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Coleccion
