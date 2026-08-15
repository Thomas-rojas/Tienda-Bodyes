/**
 * Prueba de envío WhatsApp Web.
 * Uso: node scripts/whatsapp-test.mjs
 */
import 'dotenv/config'
import {
  connectWhatsAppWeb,
  getWhatsAppWebStatus,
  sendWhatsAppWebText,
} from '../src/services/whatsapp-web.session.js'

const phone = String(process.env.STORE_WHATSAPP || '')
  .replace(/\D/g, '')
  .replace(/^0+/, '')

if (!phone) {
  console.error('Falta STORE_WHATSAPP en .env')
  process.exit(1)
}

console.log('Conectando sesión WhatsApp…')
await connectWhatsAppWeb({ printQr: true })

await new Promise((resolve, reject) => {
  const started = Date.now()
  const timer = setInterval(() => {
    const status = getWhatsAppWebStatus()
    if (status.connected) {
      clearInterval(timer)
      resolve()
    } else if (Date.now() - started > 60_000) {
      clearInterval(timer)
      reject(new Error('Timeout esperando conexión WhatsApp'))
    }
  }, 500)
})

const text = [
  'CLIO · Prueba de WhatsApp',
  '',
  'Si ves este mensaje, la vinculación funciona.',
  `Fecha: ${new Date().toLocaleString('es-CO')}`,
].join('\n')

console.log(`Enviando prueba a ${phone}…`)
await sendWhatsAppWebText(phone, text)
console.log('Mensaje de prueba enviado. Revisa WhatsApp en el celular.')
process.exit(0)
