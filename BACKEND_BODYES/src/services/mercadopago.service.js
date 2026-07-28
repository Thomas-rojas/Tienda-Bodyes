import { env } from '../config/env.js'
import { AppError } from '../middleware/errorHandler.js'

const MP_API = 'https://api.mercadopago.com'

export function isMercadoPagoConfigured() {
  return Boolean(env.mercadoPago.accessToken && !env.simulatePayments)
}

/**
 * Mapea estados de Mercado Pago / simulación a estado interno de pedido.
 */
export function mapProviderStatus(status) {
  const value = String(status || '').toLowerCase()
  switch (value) {
    case 'approved':
      return 'paid'
    case 'rejected':
    case 'declined':
      return 'declined'
    case 'cancelled':
    case 'canceled':
    case 'refunded':
    case 'charged_back':
    case 'voided':
      return 'voided'
    case 'error':
      return 'error'
    case 'in_process':
    case 'in_mediation':
    case 'pending':
    case 'authorized':
    default:
      return 'pending'
  }
}

function splitName(fullName) {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
  if (parts.length === 0) return { name: 'Cliente', surname: 'CLIO' }
  if (parts.length === 1) return { name: parts[0], surname: parts[0] }
  return {
    name: parts[0],
    surname: parts.slice(1).join(' '),
  }
}

/**
 * Crea preferencia Checkout Pro o URL de simulación.
 * unit_price en COP = price_cents / 100 (price_cents = pesos × 100).
 */
export async function buildCheckoutPayload(order, items, customer) {
  const reference = order.reference
  const currency = order.currency || 'COP'
  const amountInCents = order.amount_cents

  if (env.simulatePayments || !isMercadoPagoConfigured()) {
    return {
      mode: 'simulate',
      reference,
      amountInCents,
      currency,
      publicKey: env.mercadoPago.publicKey || 'TEST-simulate',
      checkoutUrl: `${env.frontendUrl}/pago/simular?reference=${encodeURIComponent(reference)}`,
      preferenceId: null,
    }
  }

  const lineItems = (items || []).map((item) => ({
    id: String(item.product_id),
    title: String(item.name).slice(0, 250),
    quantity: Number(item.quantity),
    currency_id: 'COP',
    unit_price: Math.round(Number(item.unit_price_cents) / 100),
  }))

  if (lineItems.length === 0) {
    lineItems.push({
      id: reference,
      title: `Pedido CLIO ${reference}`,
      quantity: 1,
      currency_id: 'COP',
      unit_price: Math.round(amountInCents / 100),
    })
  }

  const { name, surname } = splitName(customer.name)
  const resultUrl = `${env.frontendUrl}/pago/resultado`
  const frontendIsHttps = String(env.frontendUrl).startsWith('https://')
  const backendIsHttps = String(env.backendUrl).startsWith('https://')

  const body = {
    items: lineItems,
    payer: {
      name,
      surname,
      email: customer.email,
      phone: {
        area_code: '57',
        number: String(customer.phone || '').replace(/\D/g, ''),
      },
      identification: {
        type: customer.documentType || 'CC',
        number: String(customer.documentNumber || ''),
      },
      address: {
        street_name: customer.address,
      },
    },
    external_reference: reference,
    statement_descriptor: 'CLIO',
    binary_mode: false,
    metadata: {
      clio_reference: reference,
    },
  }

  // MP bloquea back_urls / notification_url con http:// (incluye localhost).
  // En local omitimos retorno automático; en producción (https) sí se envían.
  if (frontendIsHttps) {
    body.auto_return = 'approved'
    body.back_urls = {
      success: `${resultUrl}?reference=${encodeURIComponent(reference)}`,
      failure: `${resultUrl}?reference=${encodeURIComponent(reference)}`,
      pending: `${resultUrl}?reference=${encodeURIComponent(reference)}`,
    }
  }

  if (backendIsHttps) {
    body.notification_url = `${env.backendUrl}/api/payments/mercadopago/webhook`
  }

  const response = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.mercadoPago.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const detail = await response.text()
    console.error('[mercadopago] Error creando preferencia', detail)
    let hint = 'No se pudo iniciar el pago con Mercado Pago.'
    if (/invalid_back_urls|back_url/i.test(detail)) {
      hint =
        'Mercado Pago rechazó las URLs de retorno (deben ser HTTPS, no localhost).'
    } else if (/unauthorized|invalid.?access.?token|401/i.test(detail)) {
      hint = 'Clave de Mercado Pago inválida. Revisa MERCADOPAGO_ACCESS_TOKEN.'
    }
    throw new AppError(hint, 502, { detail })
  }

  const preference = await response.json()
  const useSandbox = env.mercadoPago.env !== 'production'
  const checkoutUrl = useSandbox
    ? preference.sandbox_init_point || preference.init_point
    : preference.init_point || preference.sandbox_init_point

  if (!checkoutUrl) {
    throw new AppError('Mercado Pago no devolvió URL de checkout', 502)
  }

  return {
    mode: 'mercadopago',
    reference,
    amountInCents,
    currency,
    publicKey: env.mercadoPago.publicKey,
    preferenceId: preference.id,
    checkoutUrl,
  }
}

export async function fetchMercadoPagoPayment(paymentId) {
  if (!paymentId || !env.mercadoPago.accessToken) return null

  const response = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${env.mercadoPago.accessToken}`,
    },
  })

  if (!response.ok) {
    const detail = await response.text()
    console.error('[mercadopago] Error consultando pago', detail)
    return null
  }

  return response.json()
}
