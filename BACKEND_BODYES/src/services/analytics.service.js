import crypto from 'node:crypto'
import { supabase } from '../config/database.js'
import { AppError } from '../middleware/errorHandler.js'
import { listOrders } from './orders.service.js'
import { listProductsAdmin } from './products.service.js'
import { listUsers } from './users.service.js'
import { tablesReady } from './products.service.js'

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return startOfDay(d)
}

function inRange(dateStr, from, to) {
  const t = new Date(dateStr).getTime()
  return t >= from.getTime() && t <= to.getTime()
}

export async function getAdminAnalytics({ days = 30 } = {}) {
  const periodDays = Number(days) || 30
  const now = new Date()
  const currentFrom = daysAgo(periodDays)
  const previousFrom = daysAgo(periodDays * 2)
  const previousTo = daysAgo(periodDays)

  const [orders, products, users] = await Promise.all([
    listOrders({ status: null }),
    listProductsAdmin(),
    listUsers({ role: 'cliente' }).catch(() => []),
  ])

  const paidOrders = orders.filter((order) => order.status === 'paid')
  const currentPaid = paidOrders.filter((order) =>
    inRange(order.createdAt, currentFrom, now),
  )
  const previousPaid = paidOrders.filter((order) =>
    inRange(order.createdAt, previousFrom, previousTo),
  )

  const sumPesos = (list) => list.reduce((acc, order) => acc + order.amountPesos, 0)
  const currentSales = sumPesos(currentPaid)
  const previousSales = sumPesos(previousPaid)
  const salesChange =
    previousSales > 0
      ? Math.round(((currentSales - previousSales) / previousSales) * 100)
      : currentSales > 0
        ? 100
        : 0

  const productSales = new Map()
  for (const order of paidOrders) {
    if (!inRange(order.createdAt, currentFrom, now)) continue
    for (const item of order.items || []) {
      const key = item.productId || item.name
      const prev = productSales.get(key) || { name: item.name, qty: 0, revenue: 0 }
      prev.qty += item.quantity
      prev.revenue += Math.round((item.unitPriceCents / 100) * item.quantity)
      productSales.set(key, prev)
    }
  }

  const topProducts = [...productSales.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8)

  const collectionSales = new Map()
  for (const order of currentPaid) {
    for (const item of order.items || []) {
      const product = products.find((p) => p.id === item.productId)
      const slug = product?.coleccion || 'sin-coleccion'
      const prev = collectionSales.get(slug) || { slug, revenue: 0, qty: 0 }
      prev.qty += item.quantity
      prev.revenue += Math.round((item.unitPriceCents / 100) * item.quantity)
      collectionSales.set(slug, prev)
    }
  }

  const fulfillmentCounts = {}
  for (const order of orders) {
    const key = order.fulfillmentStatus || 'pendiente'
    fulfillmentCounts[key] = (fulfillmentCounts[key] || 0) + 1
  }

  const salesByDay = []
  for (let i = periodDays - 1; i >= 0; i -= 1) {
    const dayStart = daysAgo(i)
    const dayEnd = new Date(dayStart)
    dayEnd.setHours(23, 59, 59, 999)
    const dayOrders = paidOrders.filter((order) =>
      inRange(order.createdAt, dayStart, dayEnd),
    )
    salesByDay.push({
      date: dayStart.toISOString().slice(0, 10),
      salesPesos: sumPesos(dayOrders),
      orders: dayOrders.length,
    })
  }

  const lowStockProducts = products
    .filter((product) => product.active !== false && Number(product.stock) <= 5)
    .slice(0, 10)

  const newClients = users.filter((user) => {
    if (!user.createdAt) return false
    return inRange(user.createdAt, currentFrom, now)
  }).length

  const avgTicket =
    currentPaid.length > 0 ? Math.round(currentSales / currentPaid.length) : 0

  return {
    totalSalesPesos: currentSales,
    salesChangePercent: salesChange,
    paidOrdersCount: currentPaid.length,
    pendingOrdersCount: orders.filter((o) => o.status === 'pending').length,
    avgTicketPesos: avgTicket,
    newClientsCount: newClients,
    lowStockCount: lowStockProducts.length,
    lowStockProducts,
    recentOrders: orders.slice(0, 8),
    topProducts,
    topCollections: [...collectionSales.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6),
    fulfillmentCounts,
    salesByDay,
  }
}

export async function getCustomerInsights() {
  const [orders, users] = await Promise.all([
    listOrders({ status: 'paid' }),
    listUsers({ role: 'cliente' }).catch(() => []),
  ])

  const spendByDoc = new Map()
  for (const order of orders) {
    const doc = order.customer?.documentNumber
    if (!doc) continue
    const prev = spendByDoc.get(doc) || { totalPesos: 0, orders: 0 }
    prev.totalPesos += order.amountPesos
    prev.orders += 1
    spendByDoc.set(doc, prev)
  }

  return users.map((user) => {
    const stats = spendByDoc.get(user.documentNumber) || { totalPesos: 0, orders: 0 }
    return {
      ...user,
      totalSpentPesos: stats.totalPesos,
      ordersCount: stats.orders,
    }
  })
}

export async function couponsTableReady() {
  if (!(await tablesReady())) return false
  const { error } = await supabase.from('coupons').select('id').limit(1)
  return !error
}

const memoryCoupons = []

function mapCoupon(row) {
  return {
    id: row.id,
    code: row.code,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    minOrderCents: row.min_order_cents || 0,
    maxUses: row.max_uses,
    usesCount: row.uses_count || 0,
    collectionSlug: row.collection_slug,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    active: row.active !== false,
  }
}

export async function listCoupons() {
  if (!(await couponsTableReady())) {
    return memoryCoupons.map(mapCoupon)
  }
  const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
  if (error) throw new AppError(error.message, 502)
  return (data || []).map(mapCoupon)
}

export async function createCoupon(input) {
  const code = String(input.code || '').trim().toUpperCase()
  if (!code) throw new AppError('Código requerido', 400)

  const row = {
    id: crypto.randomUUID(),
    code,
    discount_type: input.discountType === 'fixed' ? 'fixed' : 'percent',
    discount_value: Number(input.discountValue),
    min_order_cents: Number(input.minOrderCents || 0),
    max_uses: input.maxUses ? Number(input.maxUses) : null,
    uses_count: 0,
    collection_slug: input.collectionSlug || null,
    valid_from: input.validFrom || null,
    valid_until: input.validUntil || null,
    active: input.active !== false,
  }

  if (!(await couponsTableReady())) {
    memoryCoupons.unshift(row)
    return mapCoupon(row)
  }

  const { data, error } = await supabase.from('coupons').insert(row).select('*').single()
  if (error) throw new AppError(error.message, 502)
  return mapCoupon(data)
}

export async function updateCoupon(id, patch) {
  const updates = {}
  if (patch.active !== undefined) updates.active = Boolean(patch.active)
  if (patch.discountValue !== undefined) updates.discount_value = Number(patch.discountValue)
  if (patch.maxUses !== undefined) updates.max_uses = patch.maxUses ? Number(patch.maxUses) : null
  if (patch.validUntil !== undefined) updates.valid_until = patch.validUntil

  if (!(await couponsTableReady())) {
    const index = memoryCoupons.findIndex((row) => row.id === id)
    if (index < 0) throw new AppError('Cupón no encontrado', 404)
    memoryCoupons[index] = { ...memoryCoupons[index], ...updates }
    return mapCoupon(memoryCoupons[index])
  }

  const { data, error } = await supabase.from('coupons').update(updates).eq('id', id).select('*').single()
  if (error) throw new AppError(error.message, 502)
  return mapCoupon(data)
}

export async function deleteCoupon(id) {
  if (!(await couponsTableReady())) {
    const index = memoryCoupons.findIndex((row) => row.id === id)
    if (index < 0) throw new AppError('Cupón no encontrado', 404)
    memoryCoupons.splice(index, 1)
    return { ok: true }
  }
  const { error } = await supabase.from('coupons').delete().eq('id', id)
  if (error) throw new AppError(error.message, 502)
  return { ok: true }
}
