import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../../components/navbar/Navbar'
import { useCart } from '../../context/CartContext'
import { getProductById } from '../../constants/products'
import './Product.css'

function Product() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const product = getProductById(id)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  if (!product) {
    return (
      <>
        <Navbar />
        <main className="product-page">
          <div className="product-page__inner product-page__missing">
            <h1>Producto no encontrado</h1>
            <Link to="/catalogo">Volver al catálogo</Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="product-page">
        <div className="product-page__inner">
          <button
            className="product-page__back"
            type="button"
            onClick={() => navigate(-1)}
          >
            ← Volver
          </button>

          <div className="product-page__layout">
            <div className="product-page__media">
              <img src={product.image} alt={product.alt} />
            </div>

            <div className="product-page__info">
              <p className="product-page__eyebrow">Body CLIO</p>
              <h1 className="product-page__title">{product.name}</h1>
              <p className="product-page__price">{product.price}</p>
              <p className="product-page__description">{product.description}</p>

              <dl className="product-page__meta">
                <div>
                  <dt>Color</dt>
                  <dd>{product.color}</dd>
                </div>
                <div>
                  <dt>Material</dt>
                  <dd>{product.material}</dd>
                </div>
                <div>
                  <dt>Fit</dt>
                  <dd>{product.fit}</dd>
                </div>
                <div>
                  <dt>Talla</dt>
                  <dd>{product.size || 'Talla única'}</dd>
                </div>
              </dl>

              <div className="product-page__actions">
                <button
                  className="product-page__add"
                  type="button"
                  onClick={() => addItem(product)}
                >
                  Añadir a carrito
                </button>
                <button
                  className="product-page__pay"
                  type="button"
                  onClick={() => {
                    addItem(product)
                    navigate('/pagar')
                  }}
                >
                  Ir a pagar
                </button>
              </div>

              <p className="product-page__note">
                Soft · Cruelty free · Conscious
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default Product
