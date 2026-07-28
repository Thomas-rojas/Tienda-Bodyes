import { AppError } from '../middleware/errorHandler.js'
import { getOrderByReference } from '../services/orders.service.js'
import { processPaymentUpdate } from '../services/payments.service.js'
import {
  fetchMercadoPagoPayment,
  mapProviderStatus,
} from '../services/mercadopago.service.js'
import { env } from '../config/env.js'

/**
 * Webhook Mercado Pago (topic=payment o type=payment).
 * Query: ?topic=payment&id=123  Body también puede traer data.id
 */
export async function mercadoPagoWebhook(req, res) {
  const topic = req.query.topic || req.query.type || req.body?.type || req.body?.topic
  const paymentId =
    req.query.id ||
    req.query['data.id'] ||
    req.body?.data?.id ||
    req.body?.id

  // Responder rápido; procesar si es pago
  if (String(topic).toLowerCase().includes('payment') && paymentId) {
    const payment = await fetchMercadoPagoPayment(paymentId)
    if (payment?.external_reference) {
      await processPaymentUpdate({
        reference: payment.external_reference,
        providerStatus: payment.status,
        providerTransactionId: String(payment.id),
        paymentMethodType:
          payment.payment_method_id ||
          payment.payment_type_id ||
          'MERCADOPAGO',
      })
    }
  }

  res.status(200).json({ ok: true })
}

export async function simulatePayment(req, res) {
  if (env.nodeEnv === 'production' && !env.simulatePayments) {
    throw new AppError('Simulación no permitida en producción', 403)
  }

  const {
    reference,
    outcome = 'APPROVED',
    paymentMethodType = 'CARD',
  } = req.body || {}
  if (!reference) throw new AppError('reference es requerido', 400)

  const allowed = new Set(['APPROVED', 'DECLINED', 'ERROR', 'VOIDED'])
  const status = String(outcome).toUpperCase()
  if (!allowed.has(status)) throw new AppError('outcome inválido', 400)

  const methods = new Set([
    'CARD',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'PSE',
    'NEQUI',
    'SIMULATED',
    'MERCADOPAGO',
  ])
  const method = String(paymentMethodType || 'CREDIT_CARD').toUpperCase()
  if (!methods.has(method)) throw new AppError('Método de pago inválido', 400)

  const result = await processPaymentUpdate({
    reference,
    providerStatus: status,
    providerTransactionId: `sim_${Date.now()}`,
    paymentMethodType: method,
  })

  res.json({
    ok: true,
    order: result.order,
    notifications: result.notifications,
  })
}

export async function syncTransaction(req, res) {
  const {
    id,
    payment_id: paymentIdQuery,
    collection_id: collectionId,
    reference,
    external_reference: externalReference,
    status: queryStatus,
  } = req.query

  let ref = reference || externalReference
  const paymentId = id || paymentIdQuery || collectionId

  if (paymentId && env.mercadoPago.accessToken) {
    const payment = await fetchMercadoPagoPayment(paymentId)
    if (payment?.external_reference) {
      ref = payment.external_reference
      await processPaymentUpdate({
        reference: payment.external_reference,
        providerStatus: payment.status,
        providerTransactionId: String(payment.id),
        paymentMethodType:
          payment.payment_method_id ||
          payment.payment_type_id ||
          'MERCADOPAGO',
      })
    }
  } else if (ref && queryStatus) {
    // Retorno de MP con status en query (sin poder consultar API aún)
    await processPaymentUpdate({
      reference: ref,
      providerStatus: queryStatus,
      providerTransactionId: paymentId ? String(paymentId) : undefined,
      paymentMethodType: 'MERCADOPAGO',
    })
  }

  if (!ref) throw new AppError('Indica reference o payment_id', 400)

  const order = await getOrderByReference(ref)
  if (!order) throw new AppError('Pedido no encontrado', 404)

  res.json({
    ok: true,
    order,
    uiStatus: mapOrderUiStatus(order.status),
  })
}

function mapOrderUiStatus(status) {
  if (status === 'paid') return 'success'
  if (status === 'declined') return 'declined'
  if (status === 'error' || status === 'voided') return 'error'
  return 'pending'
}

export { mapProviderStatus }
