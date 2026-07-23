import { useCart } from '../../context/CartContext'
import './Coleccion.css'

const products = [
  {
    id: 1,
    name: 'Clio Básico Essential',
    price: '$35.00',
    image: '/images/coleccion-1.jpg',
    alt: 'Clio Básico Essential negro',
  },
  {
    id: 2,
    name: 'Clio Encaje Elegance',
    price: '$48.00',
    image: '/images/coleccion-2.jpg',
    alt: 'Clio Encaje Elegance rosa',
  },
  {
    id: 3,
    name: 'Clio Rib Confort',
    price: '$32.00',
    image: '/images/coleccion-3.jpg',
    alt: 'Clio Rib Confort verde oliva',
  },
  {
    id: 4,
    name: 'Clio Cuello Alto Chic',
    price: '$42.00',
    image: '/images/coleccion-4.jpg',
    alt: 'Clio Cuello Alto Chic gris',
  },
]

function Coleccion() {
  const { addItem } = useCart()

  return (
    <section className="coleccion" aria-labelledby="coleccion-title">
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
          <a className="coleccion__link" href="/catalogo">
            EXPLORAR TODO
          </a>
        </header>

        <ul className="coleccion__grid">
          {products.map((product) => (
            <li key={product.id} className="coleccion__item">
              <article className="coleccion__card">
                <a className="coleccion__media" href={`/producto/${product.id}`}>
                  <img src={product.image} alt={product.alt} />
                </a>
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
