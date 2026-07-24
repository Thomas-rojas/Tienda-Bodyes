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

export { getMemoryStore, tablesReady }
