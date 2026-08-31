import crypto from 'node:crypto'
import { supabase } from '../config/database.js'
import { AppError } from '../middleware/errorHandler.js'
import { tablesReady } from './products.service.js'

const DEFAULT_COLLECTIONS = [
  {
    id: 'col-esenciales',
    slug: 'esenciales',
    name: 'Esenciales',
    image_path: '/images/coleccion-1.jpg',
    alt: 'Colección Esenciales CLIO',
    description: '',
    sort_order: 1,
    featured: true,
    active: true,
  },
  {
    id: 'col-encaje',
    slug: 'encaje',
    name: 'Encaje',
    image_path: '/images/coleccion-2.jpg',
    alt: 'Colección Encaje CLIO',
    description: '',
    sort_order: 2,
    featured: true,
    active: true,
  },
  {
    id: 'col-rib',
    slug: 'rib',
    name: 'Rib',
    image_path: '/images/coleccion-3.jpg',
    alt: 'Colección Rib CLIO',
    description: '',
    sort_order: 3,
    featured: true,
    active: true,
  },
  {
    id: 'col-cuello',
    slug: 'cuello-alto',
    name: 'Cuello Alto',
    image_path: '/images/coleccion-4.jpg',
    alt: 'Colección Cuello Alto CLIO',
    description: '',
    sort_order: 4,
    featured: true,
    active: true,
  },
]

const memoryCollections = DEFAULT_COLLECTIONS.map((row) => ({ ...row }))

function mapCollection(row) {
  if (!row) return null
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    image: row.image_path,
    imagePath: row.image_path,
    alt: row.alt || row.name,
    description: row.description || '',
    sortOrder: row.sort_order ?? 0,
    featured: row.featured !== false,
    active: row.active !== false,
  }
}

async function collectionsTableReady() {
  if (!(await tablesReady())) return false
  const { error } = await supabase.from('collections').select('id').limit(1)
  return !error
}

export async function listCollections({ activeOnly = true, featuredOnly = false } = {}) {
  if (!(await collectionsTableReady())) {
    let rows = memoryCollections.slice()
    if (activeOnly) rows = rows.filter((row) => row.active !== false)
    if (featuredOnly) rows = rows.filter((row) => row.featured !== false)
    return rows.sort((a, b) => a.sort_order - b.sort_order).map(mapCollection)
  }

  let query = supabase.from('collections').select('*').order('sort_order', { ascending: true })
  if (activeOnly) query = query.eq('active', true)
  if (featuredOnly) query = query.eq('featured', true)

  const { data, error } = await query
  if (error) throw new AppError(error.message, 502)
  return (data || []).map(mapCollection)
}

export async function getCollectionBySlug(slug) {
  const normalized = String(slug || '').trim()
  if (!normalized) return null

  if (!(await collectionsTableReady())) {
    const row = memoryCollections.find((item) => item.slug === normalized)
    return mapCollection(row)
  }

  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('slug', normalized)
    .maybeSingle()

  if (error) throw new AppError(error.message, 502)
  return mapCollection(data)
}

export async function createCollection(input = {}) {
  const name = String(input.name || '').trim()
  const slug = String(input.slug || name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (!name || !slug) throw new AppError('Nombre y slug son requeridos', 400)

  const row = {
    id: crypto.randomUUID(),
    slug,
    name,
    image_path: String(input.imagePath || input.image || '/images/coleccion-1.jpg').trim(),
    alt: String(input.alt || name).trim(),
    description: String(input.description || '').trim(),
    sort_order: Number(input.sortOrder ?? memoryCollections.length + 1),
    featured: input.featured !== false,
    active: input.active !== false,
  }

  if (!(await collectionsTableReady())) {
    if (memoryCollections.some((item) => item.slug === slug)) {
      throw new AppError('Ya existe una colección con ese slug', 409)
    }
    memoryCollections.push(row)
    return mapCollection(row)
  }

  const { data, error } = await supabase.from('collections').insert(row).select('*').single()
  if (error) {
    if (error.code === '23505') throw new AppError('Slug duplicado', 409)
    throw new AppError(error.message, 502)
  }
  return mapCollection(data)
}

export async function updateCollection(idOrSlug, patch = {}) {
  const updates = {}
  if (patch.name !== undefined) updates.name = String(patch.name).trim()
  if (patch.slug !== undefined) updates.slug = String(patch.slug).trim()
  if (patch.imagePath !== undefined || patch.image !== undefined) {
    updates.image_path = String(patch.imagePath || patch.image).trim()
  }
  if (patch.alt !== undefined) updates.alt = String(patch.alt).trim()
  if (patch.description !== undefined) updates.description = String(patch.description).trim()
  if (patch.sortOrder !== undefined) updates.sort_order = Number(patch.sortOrder)
  if (patch.featured !== undefined) updates.featured = Boolean(patch.featured)
  if (patch.active !== undefined) updates.active = Boolean(patch.active)

  if (!(await collectionsTableReady())) {
    const index = memoryCollections.findIndex(
      (item) => item.id === idOrSlug || item.slug === idOrSlug,
    )
    if (index < 0) throw new AppError('Colección no encontrada', 404)
    memoryCollections[index] = { ...memoryCollections[index], ...updates }
    return mapCollection(memoryCollections[index])
  }

  let query = supabase.from('collections').update(updates)
  query = String(idOrSlug).includes('-') && idOrSlug.length > 20
    ? query.eq('id', idOrSlug)
    : query.eq('slug', idOrSlug)

  const { data, error } = await query.select('*').single()
  if (error) throw new AppError(error.message, 502)
  return mapCollection(data)
}

export async function deleteCollection(idOrSlug) {
  if (!(await collectionsTableReady())) {
    const index = memoryCollections.findIndex(
      (item) => item.id === idOrSlug || item.slug === idOrSlug,
    )
    if (index < 0) throw new AppError('Colección no encontrada', 404)
    memoryCollections.splice(index, 1)
    return { ok: true }
  }

  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('slug', idOrSlug)

  if (error) throw new AppError(error.message, 502)
  return { ok: true }
}

export async function reorderCollections(order = []) {
  if (!(await collectionsTableReady())) {
    order.forEach(({ slug, sortOrder }) => {
      const row = memoryCollections.find((item) => item.slug === slug)
      if (row) row.sort_order = sortOrder
    })
    memoryCollections.sort((a, b) => a.sort_order - b.sort_order)
    return listCollections({ activeOnly: false })
  }

  for (const item of order) {
    await supabase
      .from('collections')
      .update({ sort_order: item.sortOrder })
      .eq('slug', item.slug)
  }

  return listCollections({ activeOnly: false })
}
