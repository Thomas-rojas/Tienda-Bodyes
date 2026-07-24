import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../../components/navbar/Navbar'
import Final from '../../components/final/Final'
import { useCart } from '../../context/CartContext'
import { catalogProducts } from '../../constants/products'
import './Catalog.css'

function ProductGrid({ products }) {
  const { addItem } = useCart()

  return (
    <ul className="catalog__grid">
      {products.map((product) => (
        <li key={product.id} className="catalog__item">
          <article className="catalog__card">
            <Link className="catalog__media" to={`/producto/${product.id}`}>
              <img src={product.image} alt={product.alt} />
            </Link>
            <div className="catalog__info">
              <div>
                <h3 className="catalog__name">{product.name}</h3>
                <p className="catalog__price">{product.price}</p>
              </div>
              <button
                className="catalog__add"
                type="button"
                onClick={() => addItem(product)}
              >
                Añadir a carrito
              </button>
            </div>
          </article>
        </li>
      ))}
    </ul>
  )
}

function Catalog() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <>
      <Navbar />
      <main className="catalog">
        <header className="catalog__hero">
          <div className="catalog__hero-inner">
            <p className="catalog__eyebrow">Colección completa</p>
            <h1 className="catalog__title">Todos los bodies CLIO</h1>
            <p className="catalog__subtitle">
              Suavidad cruelty free con ajuste cómodo y tela inteligente. Encuentra
              la pieza perfecta para ti.
            </p>
          </div>
        </header>

        <section className="catalog__section" aria-labelledby="catalog-title">
          <div className="catalog__section-inner">
            <div className="catalog__section-head">
              <h2 id="catalog-title">Colección</h2>
              <p>Bodies esenciales con ajuste suave y tela inteligente.</p>
            </div>
            <ProductGrid products={catalogProducts} />
          </div>
        </section>

        <div className="catalog__back">
          <Link to="/">Volver al inicio</Link>
        </div>
      </main>
      <Final />
    </>
  )
}

export default Catalog
