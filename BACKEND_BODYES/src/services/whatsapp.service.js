import { env } from '../config/env.js'

function toE164Colombia(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.startsWith('57') && digits.length === 12) return `+${digits}`
  if (digits.length === 10) return `+57${digits}`
  if (String(phone || '').trim().startsWith('+')) {
    return `+${digits}`
  }
  return digits ? `+${digits}` : digits
}

function summarizeProducts(order) {
  const items = order.items || []
  if (items.length === 0) return 'Pedido CLIO'
  return items
    .map((item) => `${item.name} x${item.quantity}`)
    .join(', ')
    .slice(0, 200)
}

async function sendWhatsAppPayload(to, payload) {
  const url = `https://graph.facebook.com/${env.whatsapp.apiVersion}/${env.whatsapp.phoneNumberId}/messages`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.whatsapp.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      ...payload,
    }),
  })
  const detail = await response.text()
  let json = null
  try {
    json = JSON.parse(detail)
  } catch {
    json = null
  }
  return { ok: response.ok, status: response.status, detail, json }
}

/**
 * Confirmación de compra CLIO por WhatsApp (solo paid).
 *
 * Importante: en el número de prueba Meta, el texto libre NO se entrega al celular
 * (solo queda accepted). Hay que usar plantillas APPROVED.
 */
export async function sendOrderConfirmationWhatsApp(order) {
  if (!env.whatsapp.token || !env.whatsapp.phoneNumberId) {
    console.info('[whatsapp] Simulado (sin WHATSAPP_TOKEN / PHONE_NUMBER_ID)', {
      to: order.customer.phone,
      reference: order.reference,
    })
    return { ok: true, simulated: true }
  }

  const to = toE164Colombia(order.customer.phone)
  const name = String(order.customer.name || 'Cliente').slice(0, 60)
  const reference = String(order.reference || '').slice(0, 60)
  const total = String(order.amountFormatted || '').slice(0, 60)
  const products = summarizeProducts(order)
  const receiptUrl = `${env.frontendUrl}/comprobante/${encodeURIComponent(order.reference)}`.slice(
    0,
    200,
  )

  // 1) Plantilla completa CLIO
  let result = await sendWhatsAppPayload(to, {
    type: 'template',
    template: {
      name: 'clio_confirmacion_compra',
      language: { code: 'es' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: name },
            { type: 'text', text: reference },
            { type: 'text', text: total },
            { type: 'text', text: products },
            { type: 'text', text: receiptUrl },
          ],
        },
      ],
    },
  })

  // 2) Plantilla corta CLIO
  if (!result.ok) {
    console.warn('[whatsapp] clio_confirmacion_compra no disponible, intento clio_pedido_pagado', result.detail)
    result = await sendWhatsAppPayload(to, {
      type: 'template',
      template: {
        name: 'clio_pedido_pagado',
        language: { code: 'es' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: name },
              { type: 'text', text: reference },
              { type: 'text', text: total },
            ],
          },
        ],
      },
    })
  }

  if (!result.ok) {
    console.error(
      '[whatsapp] Plantillas CLIO pendientes/rechazadas. Aprueba clio_confirmacion_compra o clio_pedido_pagado en Meta.',
      result.detail,
    )
    return { ok: false, simulated: false, detail: result.detail }
  }

  console.info('[whatsapp] Confirmación CLIO (plantilla) aceptada', {
    to,
    reference,
    messageId: result.json?.messages?.[0]?.id,
  })

  return {
    ok: true,
    simulated: false,
    messageId: result.json?.messages?.[0]?.id,
  }
}
