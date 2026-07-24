import { AppError } from '../middleware/errorHandler.js'
import { getOrderByReference } from '../services/orders.service.js'
import { env } from '../config/env.js'

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
