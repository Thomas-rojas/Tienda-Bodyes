import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/navbar/Navbar'
import Final from '../../components/final/Final'
import ProductCard from '../../components/common/ProductCard/ProductCard'
import { catalogProducts } from '../../constants/products'
import {
  filterProductsByCollection,
  getCollectionBySlug,
  getProductCollection,
} from '../../constants/collections'
import { fetchProducts } from '../../services/api'
import './Catalog.css'

function enrichProduct(product) {
  const coleccion = getProductCollection(product)
  return coleccion ? { ...product, coleccion } : product
}

function Catalog() {
  const location = useLocation()
  const { slug: slugParam } = useParams()
  const [searchParams] = useSearchParams()
  const coleccionSlug = slugParam || searchParams.get('coleccion') || ''
  const activeCollection = getCollectionBySlug(coleccionSlug)

  const [products, setProducts] = useState(catalogProducts.map(enrichProduct))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname, location.search, coleccionSlug])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchProducts()
      .then((data) => {
        if (!cancelled && data?.products?.length) {
          setProducts(data.products.map(enrichProduct))
        }
      })
      .catch(() => { /* fallback local */ })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const visibleProducts = useMemo(
    () => filterProductsByCollection(products, coleccionSlug || null),
    [products, coleccionSlug],
  )

  return (
    <>
      <Navbar />
      <main className="catalog">
        <header className="catalog__hero">
          <p className="page-eyebrow">
            {activeCollection ? 'Colección' : 'Catálogo'}
          </p>
          <h1 className="page-title">
            {activeCollection ? activeCollection.name : 'Bodys'}
          </h1>
          <p className="page-subtitle">
            {activeCollection
              ? `Explora los bodys de la colección ${activeCollection.name.toLowerCase()}.`
              : 'Segunda piel en telas premium. Siluetas esenciales para cada día.'}
          </p>
          {activeCollection && (
            <Link className="catalog__clear-filter" to="/catalogo">
              Ver todo el catálogo
            </Link>
          )}
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
            ) : visibleProducts.length === 0 ? (
              <p className="catalog__empty">
                No hay productos en esta colección por ahora.{' '}
                <Link to="/catalogo">Ver catálogo completo</Link>
              </p>
            ) : (
              <ul className="catalog__grid">
                {visibleProducts.map((product) => (
                  <li key={product.id}>
                    <ProductCard product={product} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="catalog__back">
          <Link className="btn btn--outline" to="/">Volver al inicio</Link>
        </div>
      </main>
      <Final />
    </>
  )
}

export default Catalog
