import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { featuredProducts } from '../../constants/products'
import './Coleccion.css'

function Coleccion() {
  const { addItem } = useCart()

  return (
    <section id="coleccion" className="coleccion" aria-labelledby="coleccion-title">
      <div className="coleccion__inner">
        <header className="coleccion__header">
          <div className="coleccion__intro">
            <h2 id="coleccion-title" className="coleccion__title">
              Colección Destacada
            </h2>
            <p className="coleccion__subtitle">
              Piezas esenciales para elevar tu estilo diario.
            </p>
          </div>
          <Link className="coleccion__link" to="/catalogo">
            EXPLORAR TODO
          </Link>
        </header>

        <ul className="coleccion__grid">
          {featuredProducts.map((product) => (
            <li key={product.id} className="coleccion__item">
              <article className="coleccion__card">
                <Link className="coleccion__media" to={`/producto/${product.id}`}>
                  <img src={product.image} alt={product.alt} />
                </Link>
                <div className="coleccion__info">
                  <div>
                    <h3 className="coleccion__name">{product.name}</h3>
                    <p className="coleccion__price">{product.price}</p>
                  </div>
                  <button
                    className="coleccion__add"
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
      </div>
    </section>
  )
}

export default Coleccion
