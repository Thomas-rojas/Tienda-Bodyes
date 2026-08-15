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
import { getOrderWhatsAppLinks } from './whatsapp.service.js'

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
      customer_id: crypto.randomUUID(),
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
    store.payments.set(reference, {
      id: crypto.randomUUID(),
      order_id: order.id,
      provider: 'mercadopago',
      status: 'pending',
      amount_cents: amountCents,
      currency: 'COP',
    })
    return { order, items: store.orderItems.get(reference) }
  }

  const customerRow = await upsertCustomer(customer)

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      reference,
      status: 'pending',
      customer_id: customerRow?.id ?? null,
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

  const { error: paymentError } = await supabase.from('payments').insert({
    order_id: order.id,
    provider: 'mercadopago',
    status: 'pending',
    amount_cents: amountCents,
    currency: 'COP',
  })

  if (paymentError) {
    // Si aún no existe la tabla payments, el pedido sigue válido
    const missing =
      paymentError.message?.includes('Could not find the table') ||
      paymentError.code === 'PGRST205'
    if (!missing) {
      await supabase.from('orders').delete().eq('id', order.id)
      throw new AppError(paymentError.message, 502)
    }
    console.warn('[payments] Tabla payments no disponible:', paymentError.message)
  }

  return { order, items: insertedItems }
}

async function upsertCustomer(customer) {
  try {
    const { data, error } = await supabase.rpc('upsert_customer', {
      p_email: customer.email,
      p_name: customer.name,
      p_phone: customer.phone,
      p_document_type: customer.documentType,
      p_document_number: customer.documentNumber,
      p_address: customer.address,
      p_city: customer.city,
      p_region: customer.region,
    })

    if (!error) return data
    if (
      error.message?.includes('Could not find the function') ||
      error.message?.includes('Could not find the table') ||
      error.code === 'PGRST202' ||
      error.code === 'PGRST205'
    ) {
      // Continúa al fallback o null
    } else {
      console.warn('[customers] upsert_customer:', error.message)
    }
  } catch (err) {
    console.warn('[customers] RPC falló:', err.message)
  }

  // Fallback si el RPC aún no existe: inserta/actualiza por email
  const payload = {
    email: String(customer.email).trim().toLowerCase(),
    name: customer.name,
    phone: customer.phone,
    document_type: customer.documentType,
    document_number: customer.documentNumber,
    address: customer.address,
    city: customer.city,
    region: customer.region,
  }

  try {
    const { data: existing, error: findError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', payload.email)
      .maybeSingle()

    if (findError) {
      if (
        findError.message?.includes('Could not find the table') ||
        findError.code === 'PGRST205'
      ) {
        return null
      }
      throw new AppError(findError.message, 502)
    }

    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from('customers')
        .update(payload)
        .eq('id', existing.id)
        .select('*')
        .single()
      if (updateError) throw new AppError(updateError.message, 502)
      return updated
    }

    const { data: created, error: createError } = await supabase
      .from('customers')
      .insert(payload)
      .select('*')
      .single()

    if (createError) throw new AppError(createError.message, 502)
    return created
  } catch (err) {
    if (err instanceof AppError) throw err
    console.warn('[customers] No se pudo guardar cliente:', err.message)
    return null
  }
}

export async function getOrderByReference(referenceOrId) {
  const ready = await tablesReady()
  const key = String(referenceOrId || '')

  if (!ready) {
    const store = getMemoryStore()
    let order = store.orders.get(key)
    if (!order) {
      order = [...store.orders.values()].find((row) => row.id === key) || null
    }
    if (!order) return null
    const items = store.orderItems.get(order.reference) || []
    return serializeOrder(order, items)
  }

  let { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('reference', key)
    .maybeSingle()

  if (error) throw new AppError(error.message, 502)

  if (!order) {
    const byId = await supabase.from('orders').select('*').eq('id', key).maybeSingle()
    if (byId.error) throw new AppError(byId.error.message, 502)
    order = byId.data
  }

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

    const payment = store.payments.get(reference)
    if (payment) {
      payment.status = status
      payment.provider_transaction_id =
        wompiTransactionId || payment.provider_transaction_id
      payment.payment_method_type =
        paymentMethodType || payment.payment_method_type
    }

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

  await supabase
    .from('payments')
    .update({
      status,
      provider_transaction_id:
        wompiTransactionId || existing.wompi_transaction_id,
      payment_method_type:
        paymentMethodType || existing.payment_method_type,
    })
    .eq('order_id', existing.id)
    .eq('status', 'pending')

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

export async function listOrders({ status = 'paid' } = {}) {
  const ready = await tablesReady()

  if (!ready) {
    const store = getMemoryStore()
    let orders = [...store.orders.values()]
    if (status) {
      orders = orders.filter((order) => order.status === status)
    }
    orders.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    return orders.map((order) => {
      const items = store.orderItems.get(order.reference) || []
      return serializeOrder(order, items)
    })
  }

  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data: orders, error } = await query
  if (error) throw new AppError(error.message, 502)
  if (!orders?.length) return []

  const ids = orders.map((order) => order.id)
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', ids)

  if (itemsError) throw new AppError(itemsError.message, 502)

  const byOrderId = new Map()
  for (const item of items || []) {
    const list = byOrderId.get(item.order_id) || []
    list.push(item)
    byOrderId.set(item.order_id, list)
  }

  return orders.map((order) => serializeOrder(order, byOrderId.get(order.id) || []))
}

function serializeOrder(order, items) {
  const pesos = Math.round(order.amount_cents / 100)
  const mapped = {
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

  const wa = getOrderWhatsAppLinks(mapped)
  mapped.whatsappUrl = wa.customerUrl
  mapped.whatsappStoreUrl = wa.storeUrl
  return mapped
}
