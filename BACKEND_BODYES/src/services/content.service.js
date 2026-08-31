import { supabase } from '../config/database.js'
import { AppError } from '../middleware/errorHandler.js'
import { tablesReady } from './products.service.js'

const DEFAULT_CONTENT = {
  hero: {
    season: 'Moda consciente · Cruelty free',
    titleLine1: 'Belleza',
    titleLine2: 'con compasión',
    tagline:
      'Bodys premium hechos con amor — nunca a costa de quienes nos inspiran.',
    ctaText: 'Explorar la colección',
    ctaLink: '/catalogo',
    videoMp4: '/video/hero-bodys.mp4',
    videoWebm: '/video/hero-bodys.webm',
    poster: '/images/hero.jpg',
  },
  navbar: {
    promoText: 'Nueva colección — Descubrir bodys',
    promoLink: '/catalogo',
  },
  footer: {
    instagram:
      'https://www.instagram.com/clioofficial.co?igsh=eTJib3kxdWo2ZjZ3',
    tiktok:
      'https://www.tiktok.com/@cliooficial.co?_r=1&_t=ZS-98I5UabDAAP',
    copyright: 'CLIO · Bodys & lencería · Colombia',
  },
  store: {
    name: 'CLIO',
    whatsapp: '573001234567',
    supportEmail: 'hola@clio.com',
  },
}

const memoryContent = { ...DEFAULT_CONTENT }

async function contentTableReady() {
  if (!(await tablesReady())) return false
  const { error } = await supabase.from('site_content').select('key').limit(1)
  return !error
}

export async function getPublicContent() {
  if (!(await contentTableReady())) {
    return { ...memoryContent }
  }

  const { data, error } = await supabase.from('site_content').select('key, value')
  if (error) throw new AppError(error.message, 502)

  const merged = { ...DEFAULT_CONTENT }
  for (const row of data || []) {
    merged[row.key] = { ...DEFAULT_CONTENT[row.key], ...row.value }
  }
  return merged
}

export async function updateContentSection(key, value = {}) {
  const sectionKey = String(key || '').trim()
  if (!DEFAULT_CONTENT[sectionKey]) {
    throw new AppError('Sección de contenido inválida', 400)
  }

  const merged = { ...DEFAULT_CONTENT[sectionKey], ...value }

  if (!(await contentTableReady())) {
    memoryContent[sectionKey] = merged
    return merged
  }

  const { data, error } = await supabase
    .from('site_content')
    .upsert({ key: sectionKey, value: merged })
    .select('value')
    .single()

  if (error) throw new AppError(error.message, 502)
  return data.value
}

export async function subscribeNewsletter(email) {
  const normalized = String(email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new AppError('Email inválido', 400)
  }

  if (!(await contentTableReady())) {
    return { ok: true, email: normalized }
  }

  const { error } = await supabase
    .from('newsletter_subscribers')
    .upsert({ email: normalized }, { onConflict: 'email' })

  if (error) throw new AppError(error.message, 502)
  return { ok: true, email: normalized }
}
