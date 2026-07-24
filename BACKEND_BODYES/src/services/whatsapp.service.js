import { env } from '../config/env.js'

function toE164Colombia(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.startsWith('57') && digits.length === 12) return digits
  if (digits.length === 10) return `57${digits}`
  return digits
}

/**
 * Envía confirmación por WhatsApp Cloud API.
 * En producción Meta suele exigir un template aprobado; aquí usamos
 * mensaje de texto libre (válido en ventana de prueba / números de test).
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
  const receiptUrl = `${env.frontendUrl}/comprobante/${encodeURIComponent(order.reference)}`
  const body = [
    `CLIO · Pedido confirmado`,
    `Hola ${order.customer.name},`,
    `Referencia: ${order.reference}`,
    `Total: ${order.amountFormatted}`,
    `Comprobante: ${receiptUrl}`,
  ].join('\n')

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
      type: 'text',
      text: { preview_url: true, body },
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    console.error('[whatsapp] Error Cloud API', detail)
    return { ok: false, simulated: false, detail }
  }

  return { ok: true, simulated: false }
}
