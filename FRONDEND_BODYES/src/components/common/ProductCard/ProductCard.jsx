import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../../context/CartContext'
import './ProductCard.css'

function ProductCard({ product, badge }) {
  const { addItem } = useCart()
  const [adding, setAdding] = useState(false)
  const outOfStock = product.stock === 0

  const handleAdd = () => {
    if (outOfStock) return
    setAdding(true)
    addItem(product)
    setTimeout(() => setAdding(false), 600)
  }

  return (
    <article className="product-card">
      <Link className="product-card__media" to={`/producto/${product.id}`}>
        {badge && <span className={`product-card__badge product-card__badge--${badge}`}>{badge === 'new' ? 'Nuevo' : 'Más vendido'}</span>}
        <img src={product.image} alt={product.alt || product.name} loading="lazy" />
        <div className="product-card__overlay" aria-hidden="true" />
      </Link>
      <div className="product-card__body">
        <Link className="product-card__name" to={`/producto/${product.id}`}>
          {product.name}
        </Link>
        <p className="product-card__price">{product.price}</p>
        <button
          className={`product-card__add${adding ? ' is-adding' : ''}`}
          type="button"
          disabled={outOfStock}
          onClick={handleAdd}
        >
          <span className="product-card__add-text">
            {outOfStock ? 'Agotado' : adding ? 'Añadido ✓' : 'Agregar al carrito'}
          </span>
          {!outOfStock && (
            <svg className="product-card__add-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6h15l-1.5 9H7.5L6 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>
    </article>
  )
}

export default ProductCard
