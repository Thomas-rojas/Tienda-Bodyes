export function formatCop(pesos) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(pesos)
}

/** Precios en pesos COP (en API/BD: centavos = pesos * 100). */
export const catalogProducts = [
  {
    id: 'm1',
    category: 'mujeres',
    name: 'Clio Básico Essential Nude',
    priceCents: 14000000,
    pricePesos: 140000,
    price: formatCop(140000),
    image: '/images/catalog-mujer-1.jpg',
    alt: 'Clio Básico Essential Nude para mujeres',
    color: 'Nude beige',
    material: 'Tela premium stretch, transpirable',
    fit: 'Ajuste moldeador suave',
    size: 'Talla única',
    description:
      'Body básico esencial en tono nude que se siente como una segunda piel. Ideal para usar solo o como base de cualquier outfit.',
    stock: 20,
  },
  {
    id: 'm2',
    category: 'mujeres',
    name: 'Clio Básico Terracota Soft',
    priceCents: 16800000,
    pricePesos: 168000,
    price: formatCop(168000),
    image: '/images/catalog-mujer-2.jpg',
    alt: 'Clio Básico Terracota Soft para mujeres',
    color: 'Terracota',
    material: 'Algodón suave con elastano',
    fit: 'Manga larga, silueta definida',
    size: 'Talla única',
    description:
      'Pieza básica cálida en terracota con manga larga. Combina comodidad diaria con un acabado elegante y conscious.',
    stock: 20,
  },
  {
    id: 'm3',
    category: 'mujeres',
    name: 'Clio Básico Rib Verde',
    priceCents: 12800000,
    pricePesos: 128000,
    price: formatCop(128000),
    image: '/images/catalog-mujer-3.jpg',
    alt: 'Clio Básico Rib Verde para mujeres',
    color: 'Verde oliva',
    material: 'Rib stretch ligero',
    fit: 'Sin mangas, corte confort',
    size: 'Talla única',
    description:
      'Body básico rib en verde oliva, fresco y versátil. Perfecto para el día a día sin sacrificar estilo.',
    stock: 20,
  },
  {
    id: 'm4',
    category: 'mujeres',
    name: 'Clio Básico Cuello Alto',
    priceCents: 18000000,
    pricePesos: 180000,
    price: formatCop(180000),
    image: '/images/catalog-mujer-4.jpg',
    alt: 'Clio Básico Cuello Alto para mujeres',
    color: 'Carbón',
    material: 'Punto suave de alta recuperación',
    fit: 'Cuello alto, manga larga',
    size: 'Talla única',
    description:
      'Básico chic con cuello alto. Una base sofisticada para looks de oficina o noche.',
    stock: 20,
  },
  {
    id: 'm5',
    category: 'mujeres',
    name: 'Clio Básico Essential',
    priceCents: 14000000,
    pricePesos: 140000,
    price: formatCop(140000),
    image: '/images/coleccion-1.jpg',
    alt: 'Clio Básico Essential negro',
    color: 'Negro',
    material: 'Tela premium stretch',
    fit: 'Manga corta, corte clásico',
    size: 'Talla única',
    description:
      'El básico que no puede faltar. Negro elegante, ajuste cómodo y sensación second-skin.',
    stock: 20,
  },
  {
    id: 'm6',
    category: 'mujeres',
    name: 'Clio Básico Encaje Elegance',
    priceCents: 19200000,
    pricePesos: 192000,
    price: formatCop(192000),
    image: '/images/coleccion-2.jpg',
    alt: 'Clio Básico Encaje Elegance rosa',
    color: 'Rosa dusty',
    material: 'Encaje suave forrado',
    fit: 'Manga larga, silueta femenina',
    size: 'Talla única',
    description:
      'Básico con detalle de encaje y acabado delicado. Diseñado para momentos especiales sin perder comodidad.',
    stock: 20,
  },
  {
    id: 'm7',
    category: 'mujeres',
    name: 'Clio Básico Rib Confort',
    priceCents: 12800000,
    pricePesos: 128000,
    price: formatCop(128000),
    image: '/images/coleccion-3.jpg',
    alt: 'Clio Básico Rib Confort verde oliva',
    color: 'Verde oliva',
    material: 'Rib stretch',
    fit: 'Sin mangas, confort total',
    size: 'Talla única',
    description:
      'Básico con textura rib y libertad de movimiento. Ideal para looks casuales con presencia.',
    stock: 20,
  },
  {
    id: 'm8',
    category: 'mujeres',
    name: 'Clio Básico Cuello Alto Chic',
    priceCents: 16800000,
    pricePesos: 168000,
    price: formatCop(168000),
    image: '/images/coleccion-4.jpg',
    alt: 'Clio Básico Cuello Alto Chic gris',
    color: 'Gris oscuro',
    material: 'Punto suave',
    fit: 'Cuello alto, manga larga',
    size: 'Talla única',
    description:
      'Versión básica chic en gris. Un body minimalista para elevar cualquier conjunto.',
    stock: 20,
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
