import {
  getOrderByReference,
  markNotificationsSent,
  updateOrderPayment,
} from './orders.service.js'
import { fulfillOrderInventory } from './inventory.service.js'
import { sendOrderConfirmationEmail } from './email.service.js'
import { sendOrderConfirmationWhatsApp } from './whatsapp.service.js'
import { mapProviderStatus } from './mercadopago.service.js'

/**
 * Procesa un estado final de pago (webhook MP, retorno o simulación).
 * Idempotente: no reenvía notificaciones ni descuenta stock dos veces.
 */
export async function processPaymentUpdate({
  reference,
  providerStatus,
  providerTransactionId,
  paymentMethodType,
}) {
  const status = mapProviderStatus(providerStatus)
  const { order: rawOrder, alreadyPaid } = await updateOrderPayment({
    reference,
    status,
    wompiTransactionId: providerTransactionId,
    paymentMethodType,
  })

  let notifications = { email: null, whatsapp: null, simulated: false }

  if (status === 'paid') {
    await fulfillOrderInventory(reference)

    const order = await getOrderByReference(reference)
    if (order && !order.notificationsSent && !alreadyPaid) {
      const email = await sendOrderConfirmationEmail(order)
      const whatsapp = await sendOrderConfirmationWhatsApp(order)
      notifications = {
        email,
        whatsapp,
        simulated: Boolean(email?.simulated || whatsapp?.simulated),
      }
      if (email?.ok || whatsapp?.ok) {
        await markNotificationsSent(reference)
      }
    } else if (alreadyPaid) {
      notifications = { skipped: true }
    }
  }

  const order = await getOrderByReference(reference)
  return { order, notifications, status }
}
