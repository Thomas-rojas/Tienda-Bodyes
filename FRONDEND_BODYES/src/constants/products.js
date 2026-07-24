export const catalogProducts = [
  {
    id: 'm1',
    category: 'mujeres',
    name: 'Clio Essential Nude',
    price: '$35.00',
    image: '/images/catalog-mujer-1.jpg',
    alt: 'Clio Essential Nude para mujeres',
    color: 'Nude beige',
    material: 'Tela premium stretch, transpirable',
    fit: 'Ajuste moldeador suave',
    size: 'Talla \u00fanica',
    description:
      'Body esencial en tono nude que se siente como una segunda piel. Ideal para usar solo o como base de cualquier outfit.',
  },
  {
    id: 'm2',
    category: 'mujeres',
    name: 'Clio Terracota Soft',
    price: '$42.00',
    image: '/images/catalog-mujer-2.jpg',
    alt: 'Clio Terracota Soft para mujeres',
    color: 'Terracota',
    material: 'Algod\u00f3n suave con elastano',
    fit: 'Manga larga, silueta definida',
    size: 'Talla \u00fanica',
    description:
      'Pieza c\u00e1lida en terracota con manga larga. Combina comodidad diaria con un acabado elegante y conscious.',
  },
  {
    id: 'm3',
    category: 'mujeres',
    name: 'Clio Rib Verde',
    price: '$32.00',
    image: '/images/catalog-mujer-3.jpg',
    alt: 'Clio Rib Verde para mujeres',
    color: 'Verde oliva',
    material: 'Rib stretch ligero',
    fit: 'Sin mangas, corte confort',
    size: 'Talla \u00fanica',
    description:
      'Body rib en verde oliva, fresco y vers\u00e1til. Perfecto para el d\u00eda a d\u00eda sin sacrificar estilo.',
  },
  {
    id: 'm4',
    category: 'mujeres',
    name: 'Clio Cuello Alto',
    price: '$45.00',
    image: '/images/catalog-mujer-4.jpg',
    alt: 'Clio Cuello Alto para mujeres',
    color: 'Carb\u00f3n',
    material: 'Punto suave de alta recuperaci\u00f3n',
    fit: 'Cuello alto, manga larga',
    size: 'Talla \u00fanica',
    description:
      'Silueta chic con cuello alto. Una base sofisticada para looks de oficina o noche.',
  },
  {
    id: 'm5',
    category: 'mujeres',
    name: 'Clio B\u00e1sico Essential',
    price: '$35.00',
    image: '/images/coleccion-1.jpg',
    alt: 'Clio B\u00e1sico Essential negro',
    color: 'Negro',
    material: 'Tela premium stretch',
    fit: 'Manga corta, corte cl\u00e1sico',
    size: 'Talla \u00fanica',
    description:
      'El b\u00e1sico que no puede faltar. Negro elegante, ajuste c\u00f3modo y sensaci\u00f3n second-skin.',
  },
  {
    id: 'm6',
    category: 'mujeres',
    name: 'Clio Encaje Elegance',
    price: '$48.00',
    image: '/images/coleccion-2.jpg',
    alt: 'Clio Encaje Elegance rosa',
    color: 'Rosa dusty',
    material: 'Encaje suave forrado',
    fit: 'Manga larga, silueta femenina',
    size: 'Talla \u00fanica',
    description:
      'Detalle de encaje con acabado delicado. Dise\u00f1ado para momentos especiales sin perder comodidad.',
  },
  {
    id: 'm7',
    category: 'mujeres',
    name: 'Clio Rib Confort',
    price: '$32.00',
    image: '/images/coleccion-3.jpg',
    alt: 'Clio Rib Confort verde oliva',
    color: 'Verde oliva',
    material: 'Rib stretch',
    fit: 'Sin mangas, confort total',
    size: 'Talla \u00fanica',
    description:
      'Textura rib y libertad de movimiento. Ideal para looks casuales con presencia.',
  },
  {
    id: 'm8',
    category: 'mujeres',
    name: 'Clio Cuello Alto Chic',
    price: '$42.00',
    image: '/images/coleccion-4.jpg',
    alt: 'Clio Cuello Alto Chic gris',
    color: 'Gris oscuro',
    material: 'Punto suave',
    fit: 'Cuello alto, manga larga',
    size: 'Talla \u00fanica',
    description:
      'Versi\u00f3n chic en gris. Un body minimalista para elevar cualquier conjunto.',
  },
]

export const featuredProducts = [
  catalogProducts.find((p) => p.id === 'm5'),
  catalogProducts.find((p) => p.id === 'm6'),
  catalogProducts.find((p) => p.id === 'm7'),
  catalogProducts.find((p) => p.id === 'm8'),
].filter(Boolean)

export const mujeresProducts = catalogProducts

export function getProductById(id) {
  return catalogProducts.find((product) => String(product.id) === String(id))
}
