const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_CO_RE = /^3\d{9}$/
const DOC_RE = /^[0-9A-Za-z.-]{5,20}$/

const DOCUMENT_TYPES = new Set(['CC', 'CE', 'NIT', 'PP', 'TI'])

export function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.startsWith('57') && digits.length === 12) return digits.slice(2)
  if (digits.length === 10) return digits
  return digits
}

export function validateCheckoutPayload(body) {
  const errors = {}

  const customer = body?.customer || {}
  const items = body?.items

  const name = String(customer.name || '').trim()
  const email = String(customer.email || '').trim().toLowerCase()
  const phone = normalizePhone(customer.phone)
  const documentType = String(customer.documentType || '').trim().toUpperCase()
  const documentNumber = String(customer.documentNumber || '').trim()
  const address = String(customer.address || '').trim()
  const city = String(customer.city || '').trim()
  const region = String(customer.region || '').trim()

  if (name.length < 3) errors.name = 'Ingresa tu nombre completo.'
  if (!EMAIL_RE.test(email)) errors.email = 'Ingresa un correo válido.'
  if (!PHONE_CO_RE.test(phone)) {
    errors.phone = 'Celular colombiano de 10 dígitos (ej. 3001234567).'
  }
  if (!DOCUMENT_TYPES.has(documentType)) {
    errors.documentType = 'Tipo de documento inválido.'
  }
  if (!DOC_RE.test(documentNumber)) {
    errors.documentNumber = 'Número de documento inválido.'
  }
  if (address.length < 5) errors.address = 'Ingresa una dirección de envío.'
  if (city.length < 2) errors.city = 'Ingresa la ciudad.'
  if (region.length < 2) errors.region = 'Ingresa el departamento.'

  if (!Array.isArray(items) || items.length === 0) {
    errors.items = 'El carrito está vacío.'
  } else {
    items.forEach((item, index) => {
      if (!item?.productId) errors[`items.${index}.productId`] = 'Producto inválido.'
      if (!Number.isInteger(item?.quantity) || item.quantity < 1) {
        errors[`items.${index}.quantity`] = 'Cantidad inválida.'
      }
    })
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: {
      customer: {
        name,
        email,
        phone,
        documentType,
        documentNumber,
        address,
        city,
        region,
      },
      items: Array.isArray(items)
        ? items.map((item) => ({
            productId: String(item.productId),
            quantity: Number(item.quantity),
          }))
        : [],
    },
  }
}

function resolveImageUrl(imagePath) {
  if (!imagePath) return ''
  const value = String(imagePath)
  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith('/uploads/')) {
    const base = (process.env.BACKEND_URL || 'http://localhost:4000').replace(
      /\/$/,
      '',
    )
    return `${base}${value}`
  }
  return value
}

export function mapProductRow(row, { includeActive = false } = {}) {
  if (!row) return null
  const pesos = Math.round(Number(row.price_cents) / 100)
  const mapped = {
    id: row.id,
    slug: row.slug,
    category: row.category,
    coleccion: row.coleccion || null,
    name: row.name,
    priceCents: row.price_cents,
    pricePesos: pesos,
    price: formatCop(pesos),
    compareAtCents: row.compare_at_cents || null,
    compareAtPesos: row.compare_at_cents
      ? Math.round(Number(row.compare_at_cents) / 100)
      : null,
    compareAtPrice: row.compare_at_cents
      ? formatCop(Math.round(Number(row.compare_at_cents) / 100))
      : null,
    stock: row.stock,
    image: resolveImageUrl(row.image_path),
    imagePath: row.image_path,
    alt: row.alt,
    color: row.color,
    material: row.material,
    fit: row.fit,
    size: row.size,
    description: row.description,
    featured: row.featured === true,
  }
  if (includeActive) mapped.active = row.active !== false
  return mapped
}

export function formatCop(pesos) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(pesos)
}
