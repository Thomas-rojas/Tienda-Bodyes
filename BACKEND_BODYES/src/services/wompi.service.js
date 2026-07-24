import { env } from '../config/env.js'
import {
  buildIntegritySignature,
  verifyWompiEventChecksum,
} from '../utils/integrity.js'
import { AppError } from '../middleware/errorHandler.js'

export function isWompiConfigured() {
  return Boolean(
    env.wompi.publicKey &&
      env.wompi.integritySecret &&
      !env.simulatePayments,
  )
}

export function buildCheckoutPayload(order, customer) {
  const amountInCents = order.amount_cents
  const currency = order.currency || 'COP'
  const reference = order.reference
  const redirectUrl = `${env.frontendUrl}/pago/resultado`

  if (env.simulatePayments || !isWompiConfigured()) {
    const simulateUrl = `${env.frontendUrl}/pago/simular?reference=${encodeURIComponent(reference)}`
    return {
      mode: 'simulate',
      reference,
      amountInCents,
      currency,
      publicKey: env.wompi.publicKey || 'pub_test_simulate',
      signatureIntegrity: 'simulate',
      redirectUrl,
      checkoutUrl: simulateUrl,
    }
  }

  const signatureIntegrity = buildIntegritySignature({
    reference,
    amountInCents,
    currency,
    integritySecret: env.wompi.integritySecret,
  })

  const params = new URLSearchParams({
    'public-key': env.wompi.publicKey,
    currency,
    'amount-in-cents': String(amountInCents),
    reference,
    'signature:integrity': signatureIntegrity,
    'redirect-url': redirectUrl,
    'customer-data:email': customer.email,
    'customer-data:full-name': customer.name,
    'customer-data:phone-number': customer.phone,
    'customer-data:legal-id': customer.documentNumber,
    'customer-data:legal-id-type': customer.documentType,
    'shipping-address:address-line-1': customer.address,
    'shipping-address:country': 'CO',
    'shipping-address:phone-number': customer.phone,
    'shipping-address:city': customer.city,
    'shipping-address:region': customer.region,
  })

  return {
    mode: 'wompi',
    reference,
    amountInCents,
    currency,
    publicKey: env.wompi.publicKey,
    signatureIntegrity,
    redirectUrl,
    checkoutUrl: `${env.wompi.checkoutUrl}?${params.toString()}`,
  }
}

export function assertValidWebhook(event) {
  if (env.simulatePayments && event?.simulated) return true
  if (!env.wompi.eventsSecret) {
    if (env.nodeEnv === 'production') {
      throw new AppError('WOMPI_EVENTS_SECRET no configurado', 500)
    }
    console.warn('[wompi] Webhook sin events secret — se acepta solo en development')
    return true
  }
  const valid = verifyWompiEventChecksum(event, env.wompi.eventsSecret)
  if (!valid) throw new AppError('Checksum de evento Wompi inválido', 401)
  return true
}

export async function fetchWompiTransaction(transactionId) {
  if (!transactionId) return null
  if (env.simulatePayments || !env.wompi.privateKey) return null

  const response = await fetch(`${env.wompi.apiBase}/transactions/${transactionId}`, {
    headers: {
      Authorization: `Bearer ${env.wompi.privateKey}`,
    },
  })

  if (!response.ok) {
    const detail = await response.text()
    console.error('[wompi] Error consultando transacción', detail)
    return null
  }

  const json = await response.json()
  return json?.data || null
}

export function mapWompiStatus(status) {
  switch (String(status || '').toUpperCase()) {
    case 'APPROVED':
      return 'paid'
    case 'DECLINED':
      return 'declined'
    case 'VOIDED':
      return 'voided'
    case 'ERROR':
      return 'error'
    default:
      return 'pending'
  }
}
