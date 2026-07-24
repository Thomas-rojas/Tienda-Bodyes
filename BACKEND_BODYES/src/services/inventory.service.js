import { supabase } from '../config/database.js'
import { AppError } from '../middleware/errorHandler.js'
import { getMemoryStore, tablesReady } from './products.service.js'

/**
 * Descuenta inventario de forma idempotente tras pago APPROVED.
 */
export async function fulfillOrderInventory(reference) {
  const ready = await tablesReady()

  if (!ready) {
    const store = getMemoryStore()
    const order = store.orders.get(reference)
    if (!order) throw new AppError('Pedido no encontrado', 404)
    if (order.fulfilled) return { ok: true, alreadyFulfilled: true }

    const items = store.orderItems.get(reference) || []
    for (const item of items) {
      const product = store.products.find((p) => p.id === item.product_id)
      if (!product || product.stock < item.quantity) {
        throw new AppError(`Stock insuficiente para ${item.product_id}`, 409)
      }
    }
    for (const item of items) {
      const product = store.products.find((p) => p.id === item.product_id)
      product.stock -= item.quantity
    }
    order.fulfilled = true
    return { ok: true, alreadyFulfilled: false }
  }

  const { data, error } = await supabase.rpc('fulfill_paid_order', {
    p_reference: reference,
  })

  if (error) {
    // Si la RPC aún no existe, fallback manual
    if (error.message?.includes('fulfill_paid_order') || error.code === 'PGRST202') {
      return fulfillOrderManual(reference)
    }
    throw new AppError(error.message, 502)
  }

  if (data?.ok === false) {
    throw new AppError(data.error || 'No se pudo actualizar inventario', 409)
  }

  return {
    ok: true,
    alreadyFulfilled: Boolean(data?.already_fulfilled),
  }
}

async function fulfillOrderManual(reference) {
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('reference', reference)
    .maybeSingle()

  if (error) throw new AppError(error.message, 502)
  if (!order) throw new AppError('Pedido no encontrado', 404)
  if (order.fulfilled) return { ok: true, alreadyFulfilled: true }
  if (order.status !== 'paid') {
    throw new AppError('El pedido no está pagado', 409)
  }

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', order.id)

  if (itemsError) throw new AppError(itemsError.message, 502)

  for (const item of items || []) {
    const { data: product, error: pErr } = await supabase
      .from('products')
      .select('id, stock')
      .eq('id', item.product_id)
      .single()

    if (pErr) throw new AppError(pErr.message, 502)
    if (product.stock < item.quantity) {
      throw new AppError(`Stock insuficiente para ${item.product_id}`, 409)
    }

    const { error: uErr } = await supabase
      .from('products')
      .update({ stock: product.stock - item.quantity })
      .eq('id', item.product_id)
      .gte('stock', item.quantity)

    if (uErr) throw new AppError(uErr.message, 502)
  }

  const { error: markErr } = await supabase
    .from('orders')
    .update({ fulfilled: true })
    .eq('id', order.id)

  if (markErr) throw new AppError(markErr.message, 502)
  return { ok: true, alreadyFulfilled: false }
}
