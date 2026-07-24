import { validateCheckoutPayload } from '../utils/validate.js'
import { AppError } from '../middleware/errorHandler.js'
import { createPendingOrder } from '../services/orders.service.js'
import { buildCheckoutPayload } from '../services/wompi.service.js'
import { env } from '../config/env.js'

export async function createCheckoutSession(req, res) {
  const validation = validateCheckoutPayload(req.body)
  if (!validation.ok) {
    throw new AppError('Datos de checkout inválidos', 400, validation.errors)
  }

  const { order } = await createPendingOrder(validation.data)
  const checkout = buildCheckoutPayload(order, validation.data.customer)

  res.status(201).json({
    ok: true,
    reference: order.reference,
    amountCents: order.amount_cents,
    mode: checkout.mode,
    checkoutUrl: checkout.checkoutUrl,
    wompi: {
      publicKey: checkout.publicKey,
      currency: checkout.currency,
      amountInCents: checkout.amountInCents,
      reference: checkout.reference,
      signatureIntegrity: checkout.signatureIntegrity,
      redirectUrl: checkout.redirectUrl,
    },
    simulatePayments: env.simulatePayments,
  })
}
