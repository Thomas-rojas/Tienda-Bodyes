import { AppError } from '../middleware/errorHandler.js'
import { getOrderByReference } from '../services/orders.service.js'
import { env } from '../config/env.js'

function mapOrderUiStatus(status) {
  if (status === 'paid') return 'success'
  if (status === 'declined') return 'declined'
  if (status === 'error' || status === 'voided') return 'error'
  return 'pending'
}

export async function getOrderReceipt(req, res) {
  const order = await getOrderByReference(req.params.reference)
  if (!order) throw new AppError('Pedido no encontrado', 404)

  res.json({
    ok: true,
    order,
    notifications: {
      simulated:
        (!env.email.resendApiKey || !env.whatsapp.token) &&
        order.status === 'paid',
    },
  })
}

/** Polling opcional mientras llega el webhook de Mercado Pago. */
export async function getOrderStatus(req, res) {
  const byIdOrRef = req.params.id
  const order = await getOrderByReference(byIdOrRef)
  if (!order) throw new AppError('Pedido no encontrado', 404)

  res.json({
    ok: true,
    reference: order.reference,
    status: order.status,
    uiStatus: mapOrderUiStatus(order.status),
    fulfilled: order.fulfilled,
    paymentMethodType: order.paymentMethodType,
    amountFormatted: order.amountFormatted,
  })
}
