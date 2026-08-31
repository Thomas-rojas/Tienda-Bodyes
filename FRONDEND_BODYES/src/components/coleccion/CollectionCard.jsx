import { Link } from 'react-router-dom'
import './CollectionCard.css'

function CollectionCard({ collection }) {
  return (
    <article className="collection-card">
      <Link
        className="collection-card__media"
        to={`/coleccion/${collection.slug}`}
      >
        <img src={collection.image} alt={collection.alt || collection.name} loading="lazy" />
      </Link>
      <Link className="collection-card__name" to={`/coleccion/${collection.slug}`}>
        <span className="collection-card__name-text">{collection.name}</span>
        <span className="collection-card__name-line" aria-hidden="true" />
      </Link>
    </article>
  )
}

export default CollectionCard
