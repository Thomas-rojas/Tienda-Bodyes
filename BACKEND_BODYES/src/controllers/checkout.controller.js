import { env } from '../config/env.js'
import { createPendingOrder } from '../services/orders.service.js'
import { buildCheckoutApiSession } from '../services/mercadopago.service.js'

export async function createCheckoutSession(req, res) {
  const data = req.validated
  const { order } = await createPendingOrder(data)
  const checkout = buildCheckoutApiSession(order)

  res.status(201).json({
    ok: true,
    reference: order.reference,
    amountCents: order.amount_cents,
    amount: checkout.amount,
    currency: checkout.currency,
    mode: checkout.mode,
    /** Solo para modo simulate; Checkout API paga dentro de la tienda. */
    checkoutUrl: checkout.checkoutUrl || null,
    mercadopago: {
      publicKey: checkout.publicKey,
      currency: checkout.currency,
      amount: checkout.amount,
      amountInCents: checkout.amountInCents,
      reference: checkout.reference,
      integration: 'checkout_api',
    },
    simulatePayments: env.simulatePayments || checkout.mode === 'simulate',
    mercadoPagoEnv: env.mercadoPago.env,
  })
}
