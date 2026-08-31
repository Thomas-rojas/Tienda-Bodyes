import { useEffect, useState } from 'react'
import { bodysCollections } from '../constants/collections'
import { fetchStoreCollections, fetchStoreContent } from '../services/api'

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

export function useSiteContent() {
  const [content, setContent] = useState(DEFAULT_CONTENT)

  useEffect(() => {
    fetchStoreContent()
      .then((data) => {
        if (data?.content) setContent({ ...DEFAULT_CONTENT, ...data.content })
      })
      .catch(() => {})
  }, [])

  return content
}

export function useStoreCollections() {
  const [collections, setCollections] = useState(bodysCollections)

  useEffect(() => {
    fetchStoreCollections({ featured: true })
      .then((data) => {
        if (data?.collections?.length) setCollections(data.collections)
      })
      .catch(() => {})
  }, [])

  return collections
}
