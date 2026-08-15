import {
  getOrderByReference,
  markNotificationsSent,
  updateOrderPayment,
} from './orders.service.js'
import { fulfillOrderInventory } from './inventory.service.js'
import { sendOrderConfirmationEmail } from './email.service.js'
import { sendOrderConfirmationWhatsApp } from './whatsapp.service.js'
import { mapProviderStatus } from './mercadopago.service.js'

async function sendPaidNotifications(reference) {
  try {
    const order = await getOrderByReference(reference)
    if (!order || order.notificationsSent) return

    const email = await sendOrderConfirmationEmail(order)
    const whatsapp = await sendOrderConfirmationWhatsApp(order)
    if (email?.ok || whatsapp?.ok) {
      await markNotificationsSent(reference)
    }
  } catch (err) {
    console.error('[payments] Notificaciones fallaron:', err.message)
  }
}

/**
 * Procesa un estado final de pago (Checkout API, webhook o sync).
 * Idempotente. Las notificaciones NO bloquean la respuesta al cliente.
 */
export async function processPaymentUpdate({
  reference,
  providerStatus,
  providerTransactionId,
  paymentMethodType,
}) {
  const status = mapProviderStatus(providerStatus)
  const { alreadyPaid } = await updateOrderPayment({
    reference,
    status,
    wompiTransactionId: providerTransactionId,
    paymentMethodType,
  })

  let notifications = {
    email: null,
    whatsapp: null,
    simulated: false,
    queued: false,
  }

  if (status === 'paid') {
    await fulfillOrderInventory(reference)

    const order = await getOrderByReference(reference)
    if (order && !order.notificationsSent && !alreadyPaid) {
      notifications = { queued: true }
      // No esperar WhatsApp/correo: evita que el Brick se quede “procesando…”
      setImmediate(() => {
        sendPaidNotifications(reference)
      })
    } else if (alreadyPaid) {
      notifications = { skipped: true }
    }
  }

  const order = await getOrderByReference(reference)
  return { order, notifications, status, alreadyPaid }
}
