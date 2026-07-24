import { env } from '../config/env.js'
import { formatCop } from '../utils/validate.js'

export async function sendOrderConfirmationEmail(order) {
  if (!env.email.resendApiKey) {
    console.info('[email] Simulado (sin RESEND_API_KEY)', {
      to: order.customer.email,
      reference: order.reference,
    })
    return { ok: true, simulated: true }
  }

  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr><td style="padding:8px 0">${item.name} × ${item.quantity}</td><td style="text-align:right">${item.lineTotalFormatted}</td></tr>`,
    )
    .join('')

  const receiptUrl = `${env.frontendUrl}/comprobante/${encodeURIComponent(order.reference)}`

  const html = `
    <div style="font-family:Georgia,serif;color:#3b2a24;max-width:560px;margin:0 auto">
      <p style="letter-spacing:.2em;text-transform:uppercase;color:#c4788c;font-size:12px">CLIO</p>
      <h1 style="font-weight:600">Confirmación de compra</h1>
      <p>Hola ${order.customer.name}, recibimos tu pago correctamente.</p>
      <p><strong>Referencia:</strong> ${order.reference}</p>
      <table style="width:100%;border-collapse:collapse;margin:24px 0">${itemsHtml}</table>
      <p style="font-size:18px"><strong>Total:</strong> ${order.amountFormatted || formatCop(order.amountPesos)}</p>
      <p><a href="${receiptUrl}">Ver comprobante</a></p>
      <p style="color:#7a5c52;font-size:13px">Envío a: ${order.customer.address}, ${order.customer.city}, ${order.customer.region}</p>
    </div>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.email.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.email.from,
      to: [order.customer.email],
      subject: `CLIO · Pedido ${order.reference} confirmado`,
      html,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    console.error('[email] Error Resend', detail)
    return { ok: false, simulated: false, detail }
  }

  return { ok: true, simulated: false }
}
