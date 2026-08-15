import { AppError } from '../middleware/errorHandler.js'
import { getOrderByReference } from '../services/orders.service.js'
import { processPaymentUpdate } from '../services/payments.service.js'
import {
  createMercadoPagoCardPayment,
  fetchMercadoPagoPayment,
  fetchMercadoPagoPaymentByReference,
  mapProviderStatus,
} from '../services/mercadopago.service.js'
import { env } from '../config/env.js'

/** Evita dos process concurrentes del mismo pedido (doble clic). */
const processingLocks = new Map()

/**
 * Webhook Mercado Pago (topic=payment o type=payment).
 */
export async function mercadoPagoWebhook(req, res) {
  const topic = req.query.topic || req.query.type || req.body?.type || req.body?.topic
  const action = req.body?.action || ''
  const paymentId =
    req.query.id ||
    req.query['data.id'] ||
    req.body?.data?.id ||
    req.body?.id

  const isPaymentEvent =
    String(topic || '').toLowerCase().includes('payment') ||
    String(action).toLowerCase().includes('payment')

  if (isPaymentEvent && paymentId) {
    try {
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
    } catch (err) {
      console.error('[mercadopago] Webhook error:', err.message)
    }
  }

  res.status(200).json({ ok: true })
}

/**
 * Checkout API: token del Card Payment Brick → POST /v1/payments
 */
export async function processCardPayment(req, res) {
  if (env.simulatePayments) {
    throw new AppError('Activa Mercado Pago real (quita SIMULATE_PAYMENTS).', 400)
  }

  const {
    reference,
    token,
    paymentMethodId,
    payment_method_id: paymentMethodIdAlt,
    installments,
    issuerId,
    issuer_id: issuerIdAlt,
    payer,
  } = req.body || {}

  if (!reference) throw new AppError('reference es requerido', 400)
  if (!token) throw new AppError('token de tarjeta es requerido', 400)

  if (processingLocks.has(reference)) {
    throw new AppError('Este pago ya se está procesando. Espera un momento.', 409)
  }
  processingLocks.set(reference, Date.now())

  try {
    const order = await getOrderByReference(reference)
    if (!order) throw new AppError('Pedido no encontrado', 404)

    if (order.status === 'paid') {
      return res.json({
        ok: true,
        alreadyPaid: true,
        payment: {
          id: order.wompiTransactionId,
          status: 'approved',
        },
        order,
        uiStatus: 'success',
      })
    }

    // Si ya hay un pago aprobado/pending en MP para este pedido, no crear otro.
    const existing = await fetchMercadoPagoPaymentByReference(reference)
    if (
      existing?.id &&
      ['approved', 'pending', 'in_process', 'authorized'].includes(
        String(existing.status || '').toLowerCase(),
      )
    ) {
      const result = await processPaymentUpdate({
        reference,
        providerStatus: existing.status,
        providerTransactionId: String(existing.id),
        paymentMethodType:
          existing.payment_method_id ||
          existing.payment_type_id ||
          'MERCADOPAGO',
      })
      return res.json({
        ok: true,
        alreadyPaid: Boolean(result.alreadyPaid),
        payment: {
          id: existing.id,
          status: existing.status,
          statusDetail: existing.status_detail,
        },
        order: result.order,
        notifications: result.notifications,
        uiStatus: mapOrderUiStatus(
          result.order?.status || mapProviderStatus(existing.status),
        ),
      })
    }

    const payment = await createMercadoPagoCardPayment({
      order: {
        id: order.id,
        reference: order.reference,
        amount_cents: order.amountCents,
        customer_email: order.customer?.email,
        document_type: order.customer?.documentType,
        document_number: order.customer?.documentNumber,
      },
      token,
      paymentMethodId: paymentMethodId || paymentMethodIdAlt,
      installments,
      issuerId: issuerId ?? issuerIdAlt,
      payer,
    })

    const result = await processPaymentUpdate({
      reference: order.reference,
      providerStatus: payment.status,
      providerTransactionId: String(payment.id),
      paymentMethodType:
        payment.payment_method_id || payment.payment_type_id || 'MERCADOPAGO',
    })

    res.json({
      ok: true,
      alreadyPaid: Boolean(result.alreadyPaid),
      payment: {
        id: payment.id,
        status: payment.status,
        statusDetail: payment.status_detail,
      },
      order: result.order,
      notifications: result.notifications,
      uiStatus: mapOrderUiStatus(
        result.order?.status || mapProviderStatus(payment.status),
      ),
    })
  } finally {
    processingLocks.delete(reference)
  }
}

export async function simulatePayment(req, res) {
  if (!env.simulatePayments) {
    throw new AppError(
      'Simulación desactivada. Los pagos van solo por Mercado Pago Checkout API.',
      403,
    )
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
  } else if (ref && env.mercadoPago.accessToken) {
    const payment = await fetchMercadoPagoPaymentByReference(ref)
    if (payment) {
      await processPaymentUpdate({
        reference: payment.external_reference || ref,
        providerStatus: payment.status,
        providerTransactionId: String(payment.id),
        paymentMethodType:
          payment.payment_method_id ||
          payment.payment_type_id ||
          'MERCADOPAGO',
      })
    } else if (queryStatus && String(queryStatus).toLowerCase() !== 'approved') {
      // No marcar paid solo porque el usuario "volvió" con approved en query.
      await processPaymentUpdate({
        reference: ref,
        providerStatus: queryStatus,
        providerTransactionId: paymentId ? String(paymentId) : undefined,
        paymentMethodType: 'MERCADOPAGO',
      })
    }
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
