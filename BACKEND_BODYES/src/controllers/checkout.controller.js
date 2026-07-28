import { env } from '../config/env.js'
import { createPendingOrder } from '../services/orders.service.js'
import { buildCheckoutPayload } from '../services/mercadopago.service.js'

export async function createCheckoutSession(req, res) {
  const data = req.validated
  const { order, items } = await createPendingOrder(data)
  const checkout = await buildCheckoutPayload(order, items, data.customer)

  res.status(201).json({
    ok: true,
    reference: order.reference,
    amountCents: order.amount_cents,
    mode: checkout.mode,
    checkoutUrl: checkout.checkoutUrl,
    mercadopago: {
      publicKey: checkout.publicKey,
      preferenceId: checkout.preferenceId,
      currency: checkout.currency,
      amountInCents: checkout.amountInCents,
      reference: checkout.reference,
    },
    simulatePayments: env.simulatePayments,
  })
}
