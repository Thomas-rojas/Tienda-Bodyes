import { AppError } from '../middleware/errorHandler.js'
import { getOrderByReference } from '../services/orders.service.js'
import { processPaymentUpdate } from '../services/payments.service.js'
import {
  assertValidWebhook,
  fetchWompiTransaction,
  mapWompiStatus,
} from '../services/wompi.service.js'
import { env } from '../config/env.js'

export async function wompiWebhook(req, res) {
  const event = req.body
  assertValidWebhook(event)

  const tx = event?.data?.transaction
  if (!tx?.reference) {
    throw new AppError('Evento sin referencia de transacción', 400)
  }

  const result = await processPaymentUpdate({
    reference: tx.reference,
    wompiStatus: tx.status,
    wompiTransactionId: tx.id,
    paymentMethodType: tx.payment_method_type || tx.payment_method?.type,
  })

  res.status(200).json({ ok: true, status: result.status })
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
  ])
  const method = String(paymentMethodType || 'CREDIT_CARD').toUpperCase()
  if (!methods.has(method)) throw new AppError('Método de pago inválido', 400)

  const result = await processPaymentUpdate({
    reference,
    wompiStatus: status,
    wompiTransactionId: `sim_${Date.now()}`,
    paymentMethodType: method,
  })

  res.json({
    ok: true,
    order: result.order,
    notifications: result.notifications,
  })
}

export async function syncTransaction(req, res) {
  const { id, reference } = req.query
  let ref = reference

  if (id && !ref) {
    const tx = await fetchWompiTransaction(id)
    if (tx) {
      ref = tx.reference
      await processPaymentUpdate({
        reference: tx.reference,
        wompiStatus: tx.status,
        wompiTransactionId: tx.id,
        paymentMethodType: tx.payment_method_type,
      })
    }
  }

  if (!ref) throw new AppError('Indica reference o id de transacción', 400)

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

export { mapWompiStatus }
