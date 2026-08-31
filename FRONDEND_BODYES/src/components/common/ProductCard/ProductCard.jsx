import { Link } from 'react-router-dom'
import { formatCop } from '../../../constants/products'
import './ProductCard.css'

const HOVER_IMAGES = {
  m1: '/images/catalog-mujer-2.jpg',
  m2: '/images/catalog-mujer-3.jpg',
  m3: '/images/catalog-mujer-4.jpg',
  m4: '/images/catalog-mujer-1.jpg',
  m5: '/images/catalog-mujer-2.jpg',
  n1: '/images/catalog-nina-2.jpg',
  n2: '/images/catalog-nina-3.jpg',
  n3: '/images/catalog-nina-4.jpg',
  n4: '/images/catalog-nina-1.jpg',
}

function ProductCard({ product, isNew = false }) {
  const hoverSrc = product.imageHover || HOVER_IMAGES[product.id] || product.image
  const outOfStock = product.stock === 0
  const hasSale =
    typeof product.pricePesos === 'number' &&
    typeof product.compareAtPesos === 'number' &&
    product.compareAtPesos > product.pricePesos

  return (
    <article className={`product-card${outOfStock ? ' is-sold-out' : ''}`}>
      <Link className="product-card__media" to={`/producto/${product.id}`}>
        <img
          className="product-card__img product-card__img--primary"
          src={product.image}
          alt={product.alt || product.name}
          loading="lazy"
        />
        <img
          className="product-card__img product-card__img--hover"
          src={hoverSrc}
          alt=""
          loading="lazy"
          aria-hidden="true"
        />
      </Link>
      <div className="product-card__info">
        {(isNew || product.isNew) && (
          <span className="product-card__tag">Nuevo</span>
        )}
        <Link className="product-card__name" to={`/producto/${product.id}`}>
          <span className="product-card__name-text">{product.name}</span>
          <span className="product-card__name-line" aria-hidden="true" />
        </Link>
        <div className="product-card__prices">
          {hasSale ? (
            <>
              <span className="product-card__price product-card__price--was">
                {formatCop(product.compareAtPesos)}
              </span>
              <span className="product-card__price product-card__price--sale">
                {product.price}
              </span>
            </>
          ) : (
            <span className="product-card__price">{product.price}</span>
          )}
        </div>
        {outOfStock && <p className="product-card__status">Agotado</p>}
      </div>
    </article>
  )
}

export default ProductCard
