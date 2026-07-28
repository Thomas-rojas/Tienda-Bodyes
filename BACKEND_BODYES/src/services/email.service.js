import nodemailer from 'nodemailer'
import { env } from '../config/env.js'
import { formatCop } from '../utils/validate.js'

function buildItemsHtml(order) {
  return order.items
    .map(
      (item) =>
        `<tr><td style="padding:8px 0">${item.name} × ${item.quantity}</td><td style="text-align:right">${item.lineTotalFormatted}</td></tr>`,
    )
    .join('')
}

function receiptUrl(order) {
  return `${env.frontendUrl}/comprobante/${encodeURIComponent(order.reference)}`
}

function hasResend() {
  return Boolean(env.email.resendApiKey)
}

function hasSmtp() {
  return Boolean(env.email.smtp.host && env.email.smtp.user && env.email.smtp.pass)
}

export function getEmailTransportStatus() {
  if (hasResend()) return { configured: true, provider: 'resend' }
  if (hasSmtp()) return { configured: true, provider: 'smtp' }
  return { configured: false, provider: null }
}

async function sendViaResend({ to, subject, html }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.email.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.email.from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    console.error('[email] Error Resend', detail)
    return { ok: false, provider: 'resend', detail }
  }

  return { ok: true, provider: 'resend' }
}

async function sendViaSmtp({ to, subject, html }) {
  const transporter = nodemailer.createTransport({
    host: env.email.smtp.host,
    port: env.email.smtp.port,
    secure: env.email.smtp.port === 465,
    auth: {
      user: env.email.smtp.user,
      pass: env.email.smtp.pass,
    },
  })

  try {
    await transporter.sendMail({
      from: env.email.from || env.email.smtp.user,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
    })
    return { ok: true, provider: 'smtp' }
  } catch (err) {
    console.error('[email] Error SMTP', err.message)
    return { ok: false, provider: 'smtp', detail: err.message }
  }
}

async function sendEmail(payload) {
  if (hasResend()) return sendViaResend(payload)
  if (hasSmtp()) return sendViaSmtp(payload)
  return { ok: false, simulated: true, detail: 'Sin RESEND_API_KEY ni SMTP configurado' }
}

/**
 * Solo se llama cuando el pago ya está confirmado (status paid).
 * Envía: A) confirmación al cliente  B) aviso interno a la empresa.
 */
export async function sendOrderConfirmationEmail(order) {
  const storeEmail = env.email.storeEmail
  const total = order.amountFormatted || formatCop(order.amountPesos)
  const itemsHtml = buildItemsHtml(order)
  const link = receiptUrl(order)
  const transport = getEmailTransportStatus()

  if (!transport.configured) {
    console.warn('[email] NO ENVIADO — configura RESEND_API_KEY o SMTP_USER/SMTP_PASS en .env', {
      customer: order.customer.email,
      store: storeEmail || null,
      reference: order.reference,
    })
    return {
      ok: false,
      simulated: true,
      customer: false,
      store: false,
      detail: 'Falta configurar correo (Resend o SMTP Gmail)',
    }
  }

  const customerHtml = `
    <div style="font-family:Georgia,serif;color:#3b2a24;max-width:560px;margin:0 auto">
      <p style="letter-spacing:.2em;text-transform:uppercase;color:#c4788c;font-size:12px">CLIO</p>
      <h1 style="font-weight:600">Confirmación de compra</h1>
      <p>Hola ${order.customer.name}, recibimos tu pago correctamente.</p>
      <p><strong>Referencia:</strong> ${order.reference}</p>
      <table style="width:100%;border-collapse:collapse;margin:24px 0">${itemsHtml}</table>
      <p style="font-size:18px"><strong>Total:</strong> ${total}</p>
      <p><a href="${link}">Ver comprobante</a></p>
      <p style="color:#7a5c52;font-size:13px">Envío a: ${order.customer.address}, ${order.customer.city}, ${order.customer.region}</p>
    </div>
  `

  const customerResult = await sendEmail({
    to: order.customer.email,
    subject: `CLIO · Pedido ${order.reference} confirmado`,
    html: customerHtml,
  })

  let storeResult = { ok: true, skipped: true }
  if (storeEmail) {
    const storeHtml = `
      <div style="font-family:Georgia,serif;color:#3b2a24;max-width:560px;margin:0 auto">
        <p style="letter-spacing:.2em;text-transform:uppercase;color:#c4788c;font-size:12px">CLIO · Venta</p>
        <h1 style="font-weight:600">Nueva compra pagada</h1>
        <p>Se recibió el dinero de un pedido.</p>
        <p><strong>Referencia:</strong> ${order.reference}</p>
        <p><strong>Cliente:</strong> ${order.customer.name}</p>
        <p><strong>Correo:</strong> ${order.customer.email}</p>
        <p><strong>Teléfono:</strong> ${order.customer.phone}</p>
        <p><strong>Documento:</strong> ${order.customer.documentType} ${order.customer.documentNumber}</p>
        <table style="width:100%;border-collapse:collapse;margin:24px 0">${itemsHtml}</table>
        <p style="font-size:18px"><strong>Total recibido:</strong> ${total}</p>
        <p><strong>Envío:</strong> ${order.customer.address}, ${order.customer.city}, ${order.customer.region}</p>
        <p><a href="${link}">Ver comprobante</a></p>
      </div>
    `

    storeResult = await sendEmail({
      to: storeEmail,
      subject: `CLIO · Nueva venta ${order.reference} · ${total}`,
      html: storeHtml,
    })
  } else {
    console.warn('[email] STORE_EMAIL vacío: no se avisó a la empresa')
  }

  const ok = Boolean(customerResult.ok || storeResult.ok)
  if (!customerResult.ok) {
    console.error('[email] Falló correo al cliente', customerResult.detail)
  }
  if (storeEmail && !storeResult.ok && !storeResult.skipped) {
    console.error('[email] Falló correo a la empresa', storeResult.detail)
  }

  return {
    ok,
    simulated: false,
    provider: transport.provider,
    customer: customerResult,
    store: storeResult,
  }
}
