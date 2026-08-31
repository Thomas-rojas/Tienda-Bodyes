import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../../components/navbar/Navbar'
import Final from '../../components/final/Final'
import ProductCard from '../../components/common/ProductCard/ProductCard'
import { catalogProducts } from '../../constants/products'
import { fetchProducts } from '../../services/api'
import './Catalog.css'

function Catalog() {
  const location = useLocation()
  const [products, setProducts] = useState(catalogProducts)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchProducts()
      .then((data) => {
        if (!cancelled && data?.products?.length) setProducts(data.products)
      })
      .catch(() => { /* fallback */ })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  return (
    <>
      <Navbar />
      <main className="catalog">
        <header className="catalog__hero">
          <p className="page-eyebrow">Colección completa</p>
          <h1 className="page-title">Todos los bodies CLIO</h1>
          <p className="page-subtitle">
            Suavidad cruelty free con ajuste cómodo y tela inteligente.
            Encuentra la pieza perfecta para ti.
          </p>
        </header>

        <section className="catalog__section" aria-labelledby="catalog-title">
          <div className="catalog__section-inner">
            {loading ? (
              <ul className="catalog__grid catalog__grid--skeleton">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <li key={n}>
                    <div className="catalog__skeleton skeleton" />
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="catalog__grid">
                {products.map((product, index) => (
                  <li key={product.id}>
                    <ProductCard
                      product={product}
                      badge={index === 0 ? 'new' : index === 2 ? 'bestseller' : null}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="catalog__back">
          <Link className="btn btn--ghost" to="/">← Volver al inicio</Link>
        </div>
      </main>
      <Final />
    </>
  )
}

export default Catalog
