import { supabase } from '../config/database.js'
import { LOCAL_PRODUCTS } from '../data/localProducts.js'
import { mapProductRow } from '../utils/validate.js'
import { AppError } from '../middleware/errorHandler.js'

let memoryStore = null
let useMemory = null

function getMemoryStore() {
  if (!memoryStore) {
    memoryStore = {
      products: LOCAL_PRODUCTS.map((p) => ({ ...p })),
      orders: new Map(),
      orderItems: new Map(),
      payments: new Map(),
    }
  }
  return memoryStore
}

function shouldFallback(error) {
  if (!error) return false
  const msg = String(error.message || '')
  return (
    msg.includes('Could not find the table') ||
    msg.includes('Unregistered API key') ||
    msg.includes('Invalid API key') ||
    msg.includes('JWT') ||
    error.code === 'PGRST205' ||
    error.code === 'PGRST301' ||
    error.code === '42501'
  )
}

async function tablesReady() {
  if (useMemory === true) return false
  if (useMemory === false) return true

  try {
    const { error } = await supabase.from('products').select('id').limit(1)
    if (!error) {
      useMemory = false
      return true
    }
    if (shouldFallback(error)) {
      console.warn('[supabase] Usando catálogo en memoria:', error.message)
      useMemory = true
      return false
    }
    // Error desconocido: intentar memoria para no tumbar la tienda
    console.warn('[supabase] Error inesperado, fallback memoria:', error.message)
    useMemory = true
    return false
  } catch (err) {
    console.warn('[supabase] Sin conexión, fallback memoria:', err.message)
    useMemory = true
    return false
  }
}

export async function listProducts() {
  const ready = await tablesReady()
  if (!ready) {
    return getMemoryStore().products.filter((p) => p.active).map(mapProductRow)
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) {
    if (shouldFallback(error)) {
      useMemory = true
      return getMemoryStore().products.filter((p) => p.active).map(mapProductRow)
    }
    throw new AppError(error.message, 502)
  }
  return (data || []).map(mapProductRow)
}

export async function getProductById(id) {
  const ready = await tablesReady()
  if (!ready) {
    const row = getMemoryStore().products.find((p) => p.id === id && p.active)
    return mapProductRow(row)
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('active', true)
    .maybeSingle()

  if (error) {
    if (shouldFallback(error)) {
      useMemory = true
      const row = getMemoryStore().products.find((p) => p.id === id && p.active)
      return mapProductRow(row)
    }
    throw new AppError(error.message, 502)
  }
  return mapProductRow(data)
}

export async function getProductsByIds(ids) {
  const unique = [...new Set(ids)]
  const ready = await tablesReady()

  if (!ready) {
    return getMemoryStore().products.filter((p) => unique.includes(p.id))
  }

  const { data, error } = await supabase.from('products').select('*').in('id', unique)
  if (error) {
    if (shouldFallback(error)) {
      useMemory = true
      return getMemoryStore().products.filter((p) => unique.includes(p.id))
    }
    throw new AppError(error.message, 502)
  }
  return data || []
}

export async function listProductsAdmin() {
  const ready = await tablesReady()
  if (!ready) {
    return getMemoryStore()
      .products.slice()
      .sort((a, b) => String(a.name).localeCompare(String(b.name), 'es'))
      .map((row) => mapProductRow(row, { includeActive: true }))
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    if (shouldFallback(error)) {
      useMemory = true
      return getMemoryStore()
        .products.slice()
        .sort((a, b) => String(a.name).localeCompare(String(b.name), 'es'))
        .map((row) => mapProductRow(row, { includeActive: true }))
    }
    throw new AppError(error.message, 502)
  }

  return (data || []).map((row) => mapProductRow(row, { includeActive: true }))
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function buildProductId(name) {
  const base = slugify(name).replace(/-/g, '').slice(0, 12) || 'producto'
  return `${base}-${Date.now().toString(36)}`
}

function normalizeImagePath(value) {
  let image = String(value || '').trim()
  if (image.length < 2) return ''
  const uploadsMatch = image.match(/\/uploads\/[^/?#]+$/i)
  if (uploadsMatch) image = uploadsMatch[0]
  return image
}

export async function createProduct(input = {}) {
  const name = String(input.name || '').trim()
  if (name.length < 2) throw new AppError('Nombre inválido', 400)

  const pesos =
    input.pricePesos !== undefined
      ? Number(input.pricePesos)
      : Math.round(Number(input.priceCents || 0) / 100)
  if (!Number.isFinite(pesos) || pesos < 1000) {
    throw new AppError('Precio inválido (mínimo $1.000)', 400)
  }

  const stock = Number(input.stock ?? 0)
  if (!Number.isInteger(stock) || stock < 0) {
    throw new AppError('Stock inválido', 400)
  }

  const imagePath =
    normalizeImagePath(input.imagePath ?? input.image) ||
    '/images/catalog-mujer-1.jpg'

  const slugBase = slugify(input.slug || name) || 'producto-clio'
  const id = String(input.id || '').trim() || buildProductId(name)
  const now = new Date().toISOString()

  const row = {
    id,
    slug: `${slugBase}-${Date.now().toString(36)}`,
    name,
    category: String(input.category || 'mujeres').trim() || 'mujeres',
    price_cents: Math.round(pesos) * 100,
    stock,
    image_path: imagePath,
    alt: String(input.alt || name).trim(),
    color: String(input.color || '').trim(),
    material: String(input.material || '').trim(),
    fit: String(input.fit || '').trim(),
    size: String(input.size || 'Talla única').trim() || 'Talla única',
    description: String(input.description || '').trim(),
    active: input.active !== false && input.active !== 'false',
    created_at: now,
    updated_at: now,
  }

  const ready = await tablesReady()
  if (!ready) {
    const store = getMemoryStore()
    if (store.products.some((p) => p.id === row.id || p.slug === row.slug)) {
      throw new AppError('Ya existe un producto con ese id o slug', 409)
    }
    store.products.push(row)
    return mapProductRow(row, { includeActive: true })
  }

  const { data, error } = await supabase
    .from('products')
    .insert(row)
    .select('*')
    .maybeSingle()

  if (error) {
    if (shouldFallback(error)) {
      useMemory = true
      return createProduct(input)
    }
    if (error.code === '23505') {
      throw new AppError('Ya existe un producto con ese id o slug', 409)
    }
    throw new AppError(error.message, 502)
  }

  return mapProductRow(data, { includeActive: true })
}

export async function updateProduct(id, patch) {
  const productId = String(id || '')
  if (!productId) throw new AppError('Producto inválido', 400)

  const updates = {}
  if (patch.name !== undefined) {
    const name = String(patch.name || '').trim()
    if (name.length < 2) throw new AppError('Nombre inválido', 400)
    updates.name = name
  }
  if (patch.pricePesos !== undefined || patch.priceCents !== undefined) {
    const pesos =
      patch.pricePesos !== undefined
        ? Number(patch.pricePesos)
        : Math.round(Number(patch.priceCents) / 100)
    if (!Number.isFinite(pesos) || pesos < 1000) {
      throw new AppError('Precio inválido (mínimo $1.000)', 400)
    }
    updates.price_cents = Math.round(pesos) * 100
  }
  if (patch.stock !== undefined) {
    const stock = Number(patch.stock)
    if (!Number.isInteger(stock) || stock < 0) {
      throw new AppError('Stock inválido', 400)
    }
    updates.stock = stock
  }
  if (patch.active !== undefined) {
    updates.active = Boolean(patch.active)
  }
  if (patch.imagePath !== undefined || patch.image !== undefined) {
    const image = normalizeImagePath(patch.imagePath ?? patch.image)
    if (image.length < 2) throw new AppError('Ruta de imagen inválida', 400)
    updates.image_path = image
  }
  if (patch.description !== undefined) {
    updates.description = String(patch.description || '').trim()
  }
  if (patch.color !== undefined) updates.color = String(patch.color || '').trim()
  if (patch.material !== undefined) {
    updates.material = String(patch.material || '').trim()
  }
  if (patch.fit !== undefined) updates.fit = String(patch.fit || '').trim()
  if (patch.size !== undefined) updates.size = String(patch.size || '').trim()
  if (patch.alt !== undefined) updates.alt = String(patch.alt || '').trim()
  if (patch.category !== undefined) {
    updates.category = String(patch.category || '').trim() || 'mujeres'
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('No hay campos para actualizar', 400)
  }

  updates.updated_at = new Date().toISOString()

  const ready = await tablesReady()
  if (!ready) {
    const store = getMemoryStore()
    const index = store.products.findIndex((p) => p.id === productId)
    if (index < 0) throw new AppError('Producto no encontrado', 404)
    store.products[index] = { ...store.products[index], ...updates }
    return mapProductRow(store.products[index], { includeActive: true })
  }

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select('*')
    .maybeSingle()

  if (error) {
    if (shouldFallback(error)) {
      useMemory = true
      return updateProduct(productId, patch)
    }
    throw new AppError(error.message, 502)
  }
  if (!data) throw new AppError('Producto no encontrado', 404)
  return mapProductRow(data, { includeActive: true })
}

export async function deleteProduct(id) {
  const productId = String(id || '')
  if (!productId) throw new AppError('Producto inválido', 400)

  const ready = await tablesReady()
  if (!ready) {
    const store = getMemoryStore()
    const index = store.products.findIndex((p) => p.id === productId)
    if (index < 0) throw new AppError('Producto no encontrado', 404)
    store.products.splice(index, 1)
    return { id: productId, softDeleted: false }
  }

  const { data, error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .select('id')
    .maybeSingle()

  if (error) {
    if (shouldFallback(error)) {
      useMemory = true
      return deleteProduct(productId)
    }
    const isFk =
      error.code === '23503' ||
      /foreign key|violates foreign/i.test(String(error.message || ''))
    if (isFk) {
      // Tiene ventas: no se borra el historial; se oculta de la tienda.
      const hidden = await updateProduct(productId, { active: false })
      return { id: productId, softDeleted: true, product: hidden }
    }
    throw new AppError(error.message, 502)
  }
  if (!data) throw new AppError('Producto no encontrado', 404)
  return { id: productId, softDeleted: false }
}

export { getMemoryStore, tablesReady }
