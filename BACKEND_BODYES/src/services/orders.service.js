import crypto from 'node:crypto'
import { supabase } from '../config/database.js'
import { AppError } from '../middleware/errorHandler.js'
import { createOrderReference } from '../utils/integrity.js'
import { formatCop } from '../utils/validate.js'
import {
  getMemoryStore,
  getProductsByIds,
  tablesReady,
} from './products.service.js'

export async function createPendingOrder({ customer, items }) {
  const productIds = items.map((i) => i.productId)
  const products = await getProductsByIds(productIds)
  const byId = new Map(products.map((p) => [p.id, p]))

  const lineItems = []
  let amountCents = 0

  for (const item of items) {
    const product = byId.get(item.productId)
    if (!product || product.active === false) {
      throw new AppError(`Producto no disponible: ${item.productId}`, 400)
    }
    if (product.stock < item.quantity) {
      throw new AppError(
        `Stock insuficiente para "${product.name}". Disponible: ${product.stock}.`,
        409,
      )
    }
    const lineTotal = product.price_cents * item.quantity
    amountCents += lineTotal
    lineItems.push({
      product_id: product.id,
      name: product.name,
      unit_price_cents: product.price_cents,
      quantity: item.quantity,
    })
  }

  const reference = createOrderReference()
  const ready = await tablesReady()

  if (!ready) {
    const store = getMemoryStore()
    const order = {
      id: crypto.randomUUID(),
      reference,
      status: 'pending',
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      document_type: customer.documentType,
      document_number: customer.documentNumber,
      address: customer.address,
      city: customer.city,
      region: customer.region,
      amount_cents: amountCents,
      currency: 'COP',
      wompi_transaction_id: null,
      payment_method_type: null,
      notifications_sent: false,
      fulfilled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    store.orders.set(reference, order)
    store.orderItems.set(
      reference,
      lineItems.map((li) => ({ ...li, id: crypto.randomUUID(), order_id: order.id })),
    )
    return { order, items: store.orderItems.get(reference) }
  }

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      reference,
      status: 'pending',
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      document_type: customer.documentType,
      document_number: customer.documentNumber,
      address: customer.address,
      city: customer.city,
      region: customer.region,
      amount_cents: amountCents,
      currency: 'COP',
    })
    .select('*')
    .single()

  if (error) throw new AppError(error.message, 502)

  const rows = lineItems.map((li) => ({ ...li, order_id: order.id }))
  const { data: insertedItems, error: itemsError } = await supabase
    .from('order_items')
    .insert(rows)
    .select('*')

  if (itemsError) {
    await supabase.from('orders').delete().eq('id', order.id)
    throw new AppError(itemsError.message, 502)
  }

  return { order, items: insertedItems }
}

export async function getOrderByReference(reference) {
  const ready = await tablesReady()

  if (!ready) {
    const store = getMemoryStore()
    const order = store.orders.get(reference)
    if (!order) return null
    const items = store.orderItems.get(reference) || []
    return serializeOrder(order, items)
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('reference', reference)
    .maybeSingle()

  if (error) throw new AppError(error.message, 502)
  if (!order) return null

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', order.id)

  if (itemsError) throw new AppError(itemsError.message, 502)
  return serializeOrder(order, items || [])
}

export async function updateOrderPayment({
  reference,
  status,
  wompiTransactionId,
  paymentMethodType,
}) {
  const ready = await tablesReady()

  if (!ready) {
    const store = getMemoryStore()
    const order = store.orders.get(reference)
    if (!order) throw new AppError('Pedido no encontrado', 404)
    if (order.status === 'paid' && status === 'paid') {
      return { order, alreadyPaid: true }
    }
    order.status = status
    order.wompi_transaction_id = wompiTransactionId || order.wompi_transaction_id
    order.payment_method_type = paymentMethodType || order.payment_method_type
    order.updated_at = new Date().toISOString()
    store.orders.set(reference, order)
    return { order, alreadyPaid: false }
  }

  const { data: existing, error: findError } = await supabase
    .from('orders')
    .select('*')
    .eq('reference', reference)
    .maybeSingle()

  if (findError) throw new AppError(findError.message, 502)
  if (!existing) throw new AppError('Pedido no encontrado', 404)

  if (existing.status === 'paid' && status === 'paid') {
    return { order: existing, alreadyPaid: true }
  }

  const { data: order, error } = await supabase
    .from('orders')
    .update({
      status,
      wompi_transaction_id: wompiTransactionId || existing.wompi_transaction_id,
      payment_method_type: paymentMethodType || existing.payment_method_type,
    })
    .eq('id', existing.id)
    .select('*')
    .single()

  if (error) throw new AppError(error.message, 502)
  return { order, alreadyPaid: false }
}

export async function markNotificationsSent(reference) {
  const ready = await tablesReady()
  if (!ready) {
    const order = getMemoryStore().orders.get(reference)
    if (order) order.notifications_sent = true
    return
  }
  await supabase.from('orders').update({ notifications_sent: true }).eq('reference', reference)
}

function serializeOrder(order, items) {
  const pesos = Math.round(order.amount_cents / 100)
  return {
    id: order.id,
    reference: order.reference,
    status: order.status,
    customer: {
      name: order.customer_name,
      email: order.customer_email,
      phone: order.customer_phone,
      documentType: order.document_type,
      documentNumber: order.document_number,
      address: order.address,
      city: order.city,
      region: order.region,
    },
    amountCents: order.amount_cents,
    amountPesos: pesos,
    amountFormatted: formatCop(pesos),
    currency: order.currency,
    paymentMethodType: order.payment_method_type,
    wompiTransactionId: order.wompi_transaction_id,
    notificationsSent: order.notifications_sent,
    fulfilled: order.fulfilled,
    createdAt: order.created_at,
    items: items.map((item) => {
      const unitPesos = Math.round(item.unit_price_cents / 100)
      return {
        productId: item.product_id,
        name: item.name,
        quantity: item.quantity,
        unitPriceCents: item.unit_price_cents,
        unitPriceFormatted: formatCop(unitPesos),
        lineTotalFormatted: formatCop(unitPesos * item.quantity),
      }
    }),
  }
}
