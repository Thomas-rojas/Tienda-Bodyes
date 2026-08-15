import { env } from '../config/env.js'
import { AppError } from '../middleware/errorHandler.js'

const MP_API = 'https://api.mercadopago.com'

export function isMercadoPagoConfigured() {
  return Boolean(env.mercadoPago.accessToken)
}

/**
 * Valida el Access Token contra la API de Mercado Pago.
 */
export async function verifyMercadoPagoCredentials() {
  if (env.simulatePayments) {
    return {
      ok: true,
      mode: 'simulate',
      detail: 'SIMULATE_PAYMENTS=true (Mercado Pago omitido a propósito)',
    }
  }

  if (!env.mercadoPago.accessToken) {
    return {
      ok: false,
      mode: 'checkout_api',
      detail:
        'Falta MERCADOPAGO_ACCESS_TOKEN. Sin eso el backend no puede cobrar.',
    }
  }

  if (!env.mercadoPago.publicKey) {
    return {
      ok: false,
      mode: 'checkout_api',
      detail:
        'Falta MERCADOPAGO_PUBLIC_KEY (TEST-… / APP_USR-…). Se usa en el frontend vía respuesta del backend.',
    }
  }

  try {
    const response = await fetch(`${MP_API}/users/me`, {
      headers: {
        Authorization: `Bearer ${env.mercadoPago.accessToken}`,
      },
    })
    if (!response.ok) {
      const detail = await response.text()
      return {
        ok: false,
        mode: 'checkout_api',
        detail: `Token de Mercado Pago inválido (${response.status}). ${detail.slice(0, 180)}`,
      }
    }
    const me = await response.json()
    const publicKey = String(env.mercadoPago.publicKey || '')
    return {
      ok: true,
      mode: 'checkout_api',
      detail: `Conectado a Mercado Pago Checkout API (${me.nickname || me.id || 'ok'})`,
      siteId: me.site_id || null,
      collectorId: me.id || null,
      testUser: Boolean(me.tags?.includes('test_user') || me.test_data?.test_user),
      publicKeyConfigured: Boolean(publicKey),
      publicKeySuffix: publicKey ? publicKey.slice(-12) : null,
      env: env.mercadoPago.env,
    }
  } catch (err) {
    return {
      ok: false,
      mode: 'checkout_api',
      detail: `No se pudo contactar Mercado Pago: ${err.message}`,
    }
  }
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

/**
 * Datos de sesión para Checkout API (sin preferencias / sin init_point).
 */
export function buildCheckoutApiSession(order) {
  const reference = order.reference
  const currency = order.currency || 'COP'
  const amountInCents = order.amount_cents
  const amount = Math.round(Number(amountInCents) / 100)

  if (!amount || amount <= 0) {
    throw new AppError('El monto del pedido es inválido para Mercado Pago.', 400)
  }

  if (env.simulatePayments) {
    return {
      mode: 'simulate',
      reference,
      amountInCents,
      amount,
      currency,
      publicKey: env.mercadoPago.publicKey || 'TEST-simulate',
      checkoutUrl: `${env.frontendUrl}/pago/simular?reference=${encodeURIComponent(reference)}`,
    }
  }

  if (!isMercadoPagoConfigured() || !env.mercadoPago.publicKey) {
    throw new AppError(
      'Mercado Pago Checkout API no está configurado. Revisa MERCADOPAGO_ACCESS_TOKEN y MERCADOPAGO_PUBLIC_KEY.',
      503,
    )
  }

  return {
    mode: 'checkout_api',
    reference,
    amountInCents,
    amount,
    currency,
    publicKey: env.mercadoPago.publicKey,
    /** Paso de pago dentro de la tienda (no redirige a MP Checkout Pro). */
    checkoutUrl: `${env.frontendUrl}/pagar?reference=${encodeURIComponent(reference)}&step=pay`,
  }
}

/**
 * Crea un pago con token de tarjeta (Checkout API / Card Payment Brick).
 * Access Token solo server-side.
 */
export async function createMercadoPagoCardPayment({
  order,
  token,
  paymentMethodId,
  installments,
  issuerId,
  payer,
}) {
  if (!isMercadoPagoConfigured()) {
    throw new AppError('Mercado Pago no está configurado.', 503)
  }

  const amount = Math.round(Number(order.amount_cents) / 100)
  if (!amount || amount <= 0) {
    throw new AppError('Monto de pedido inválido.', 400)
  }

  if (!token) {
    throw new AppError('Falta el token de la tarjeta.', 400)
  }

  const body = {
    transaction_amount: amount,
    token: String(token),
    description: `Pedido CLIO ${order.reference}`.slice(0, 255),
    installments: Number(installments) || 1,
    payment_method_id: String(paymentMethodId || '').toLowerCase(),
    payer: {
      email: String(payer?.email || order.customer_email || '').toLowerCase(),
    },
    external_reference: order.reference,
    metadata: {
      clio_reference: order.reference,
      order_id: order.id,
    },
  }

  if (issuerId !== undefined && issuerId !== null && String(issuerId).trim() !== '') {
    const parsedIssuer = Number(issuerId)
    if (Number.isFinite(parsedIssuer) && parsedIssuer > 0) {
      body.issuer_id = parsedIssuer
    }
  }

  const identificationType = payer?.identification?.type || order.document_type
  const identificationNumber = String(
    payer?.identification?.number || order.document_number || '',
  ).replace(/\D/g, '')

  if (identificationType && identificationNumber) {
    body.payer.identification = {
      type: String(identificationType).toUpperCase(),
      number: identificationNumber,
    }
  }

  const backendIsHttps = String(env.backendUrl).startsWith('https://')
  if (backendIsHttps) {
    body.notification_url = `${env.backendUrl}/api/payments/mercadopago/webhook`
  }

  // Misma tarjeta/token = mismo cobro (evita doble clic). Nuevo token = nuevo intento.
  const idempotencyKey = `clio-${order.reference}-${String(token).slice(0, 32)}`

  const response = await fetch(`${MP_API}/v1/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.mercadoPago.accessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(body),
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    console.error('[mercadopago] Error creando pago Checkout API', payload)
    const existing = await fetchMercadoPagoPaymentByReference(order.reference)
    if (
      existing?.id &&
      ['approved', 'pending', 'in_process', 'authorized'].includes(
        String(existing.status || '').toLowerCase(),
      )
    ) {
      console.warn('[mercadopago] Reutilizando pago existente', {
        id: existing.id,
        status: existing.status,
        reference: order.reference,
      })
      return existing
    }
    const message =
      payload?.message === 'internal_error'
        ? 'Mercado Pago tuvo un error temporal. Espera unos segundos e intenta de nuevo.'
        : payload?.message ||
          payload?.cause?.[0]?.description ||
          'No se pudo procesar el pago con Mercado Pago.'
    throw new AppError(message, 502, { detail: payload })
  }

  console.info('[mercadopago] Pago Checkout API', {
    id: payload.id,
    status: payload.status,
    statusDetail: payload.status_detail,
    reference: order.reference,
  })

  return payload
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

/** Busca el pago más reciente por external_reference. */
export async function fetchMercadoPagoPaymentByReference(reference) {
  if (!reference || !env.mercadoPago.accessToken) return null

  const url = new URL(`${MP_API}/v1/payments/search`)
  url.searchParams.set('external_reference', String(reference))
  url.searchParams.set('sort', 'date_created')
  url.searchParams.set('criteria', 'desc')

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.mercadoPago.accessToken}`,
    },
  })

  if (!response.ok) {
    const detail = await response.text()
    console.error('[mercadopago] Error buscando pago por reference', detail)
    return null
  }

  const data = await response.json()
  const results = Array.isArray(data?.results) ? data.results : []
  return results[0] || null
}
