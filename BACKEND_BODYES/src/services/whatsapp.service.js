import { env } from '../config/env.js'
import {
  connectWhatsAppWeb,
  getWhatsAppWebStatus,
  sendWhatsAppWebText,
} from './whatsapp-web.session.js'

function digitsOnly(phone) {
  return String(phone || '').replace(/\D/g, '')
}

/** Normaliza a dígitos internacionales CO (57…) */
export function toWaMePhone(phone) {
  let digits = digitsOnly(phone)
  if (!digits) return ''
  if (digits.startsWith('57') && digits.length >= 12) return digits
  if (digits.length === 10) return `57${digits}`
  return digits
}

function summarizeProducts(order) {
  const items = order.items || []
  if (items.length === 0) return 'Pedido CLIO'
  return items.map((item) => `${item.name} x${item.quantity}`).join(', ')
}

function receiptUrl(order) {
  return `${env.frontendUrl}/comprobante/${encodeURIComponent(order.reference)}`
}

function buildWaMeUrl(phone, text) {
  const to = toWaMePhone(phone)
  if (!to) return null
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`
}

/** Texto al cliente (equivalente al correo de confirmación). */
export function buildCustomerMessage(order) {
  const name = order.customer?.name || 'Cliente'
  const reference = order.reference || ''
  const total = order.amountFormatted || ''
  const products = summarizeProducts(order)
  const link = receiptUrl(order)

  return [
    `Hola ${name}, te escribe CLIO.`,
    ``,
    `Tu compra ya está confirmada. El pago se recibió correctamente.`,
    `Referencia: ${reference}`,
    `Total: ${total}`,
    `Productos: ${products}`,
    `Comprobante: ${link}`,
    ``,
    `Envío: ${order.customer?.address || ''}, ${order.customer?.city || ''}, ${order.customer?.region || ''}`,
    ``,
    `Cualquier duda sobre tu pedido, responde este mensaje.`,
  ].join('\n')
}

/** Texto a la tienda (equivalente al correo de nueva venta). */
export function buildStoreMessage(order) {
  const name = order.customer?.name || 'Cliente'
  const reference = order.reference || ''
  const total = order.amountFormatted || ''
  const products = summarizeProducts(order)
  const link = receiptUrl(order)

  return [
    `CLIO · Nueva venta pagada`,
    ``,
    `Referencia: ${reference}`,
    `Cliente: ${name}`,
    `Correo: ${order.customer?.email || ''}`,
    `Teléfono: ${order.customer?.phone || ''}`,
    `Total: ${total}`,
    `Productos: ${products}`,
    `Envío: ${order.customer?.address || ''}, ${order.customer?.city || ''}, ${order.customer?.region || ''}`,
    `Comprobante: ${link}`,
  ].join('\n')
}

export function buildCustomerWhatsAppUrl(order) {
  const store = env.whatsapp.storePhone
  if (!store) return null
  const text = [
    `Hola CLIO, consulta sobre mi pedido.`,
    ``,
    `Referencia: ${order.reference || ''}`,
    `Nombre: ${order.customer?.name || ''}`,
  ].join('\n')
  return buildWaMeUrl(store, text)
}

export function buildStoreWhatsAppUrl(order) {
  const customerPhone = order.customer?.phone
  if (!customerPhone) return null
  return buildWaMeUrl(customerPhone, buildCustomerMessage(order))
}

export function getOrderWhatsAppLinks(order) {
  return {
    customerUrl: buildCustomerWhatsAppUrl(order),
    storeUrl: buildStoreWhatsAppUrl(order),
  }
}

/**
 * Envía WhatsApp automático (como el correo):
 * 1) Confirmación al cliente
 * 2) Aviso a la empresa (STORE_WHATSAPP)
 */
export async function sendOrderConfirmationWhatsApp(order) {
  const links = getOrderWhatsAppLinks(order)
  const status = getWhatsAppWebStatus()
  const customerPhone = toWaMePhone(order.customer?.phone)
  const storePhone = env.whatsapp.storePhone

  if (!status.connected && !status.hasAuth) {
    console.warn(
      '[whatsapp] Sin sesión WhatsApp Web. Ejecuta: npm run whatsapp:link',
      { reference: order.reference },
    )
    return {
      ok: false,
      mode: 'wa_web',
      simulated: true,
      detail: 'WhatsApp Web no vinculado. npm run whatsapp:link',
      ...links,
      customer: false,
      store: false,
    }
  }

  try {
    await connectWhatsAppWeb({ printQr: false })
  } catch (err) {
    console.error('[whatsapp] No se pudo abrir sesión', err.message)
    return {
      ok: false,
      mode: 'wa_web',
      simulated: false,
      detail: err.message,
      ...links,
      customer: false,
      store: false,
    }
  }

  let customerResult = { ok: false, skipped: !customerPhone }
  let storeResult = { ok: false, skipped: !storePhone }

  if (customerPhone) {
    try {
      await sendWhatsAppWebText(customerPhone, buildCustomerMessage(order))
      customerResult = { ok: true }
      console.info('[whatsapp] Confirmación enviada al cliente', {
        to: customerPhone,
        reference: order.reference,
      })
    } catch (err) {
      customerResult = { ok: false, detail: err.message }
      console.error('[whatsapp] Falló mensaje al cliente', err.message)
    }
  }

  if (storePhone) {
    try {
      await sendWhatsAppWebText(storePhone, buildStoreMessage(order))
      storeResult = { ok: true }
      console.info('[whatsapp] Aviso enviado a la tienda', {
        to: storePhone,
        reference: order.reference,
      })
    } catch (err) {
      storeResult = { ok: false, detail: err.message }
      console.error('[whatsapp] Falló mensaje a la tienda', err.message)
    }
  }

  const ok = Boolean(customerResult.ok || storeResult.ok)
  return {
    ok,
    mode: 'wa_web',
    simulated: false,
    customer: customerResult,
    store: storeResult,
    ...links,
  }
}
