/** Colecciones de bodys CLIO (home + filtro de catálogo). */
export const bodysCollections = [
  {
    slug: 'esenciales',
    name: 'Esenciales',
    image: '/images/coleccion-1.jpg',
    alt: 'Colección Esenciales CLIO',
  },
  {
    slug: 'encaje',
    name: 'Encaje',
    image: '/images/coleccion-2.jpg',
    alt: 'Colección Encaje CLIO',
  },
  {
    slug: 'rib',
    name: 'Rib',
    image: '/images/coleccion-3.jpg',
    alt: 'Colección Rib CLIO',
  },
  {
    slug: 'cuello-alto',
    name: 'Cuello Alto',
    image: '/images/coleccion-4.jpg',
    alt: 'Colección Cuello Alto CLIO',
  },
]

const coleccionByProductId = {
  m1: 'esenciales',
  m2: 'esenciales',
  m5: 'esenciales',
  m6: 'encaje',
  m3: 'rib',
  m7: 'rib',
  m4: 'cuello-alto',
  m8: 'cuello-alto',
}

export function getCollectionBySlug(slug) {
  if (!slug) return null
  return bodysCollections.find((collection) => collection.slug === slug) || null
}

export function getProductCollection(product) {
  if (!product) return null
  if (product.coleccion) return product.coleccion
  return coleccionByProductId[product.id] || null
}

export function filterProductsByCollection(products, slug) {
  if (!slug) return products
  return products.filter((product) => getProductCollection(product) === slug)
}
