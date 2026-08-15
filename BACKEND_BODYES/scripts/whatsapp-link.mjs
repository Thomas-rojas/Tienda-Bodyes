/**
 * Vincula el WhatsApp de la empresa (como WhatsApp Web).
 * Uso: npm run whatsapp:link
 *
 * 1) Se limpia sesión vieja rota
 * 2) Se genera QR en whatsapp-auth/qr.png (más fácil de escanear)
 * 3) Escanea con el celular de CLIO
 */
import 'dotenv/config'
import { exec } from 'node:child_process'
import path from 'node:path'
import {
  WA_QR_PATH,
  clearWhatsAppAuth,
  connectWhatsAppWeb,
  getWhatsAppWebStatus,
} from '../src/services/whatsapp-web.session.js'

function openQrWhenReady() {
  const timer = setInterval(() => {
    const status = getWhatsAppWebStatus()
    if (status.qrPath) {
      clearInterval(timer)
      const file = path.resolve(status.qrPath)
      console.log(`\nAbriendo imagen del QR:\n${file}\n`)
      // Windows
      exec(`start "" "${file}"`)
    }
  }, 500)

  setTimeout(() => clearInterval(timer), 20_000)
}

console.log('CLIO · Vincular WhatsApp Web')
console.log('1. Cierra otras ventanas de whatsapp:link si las hay.')
console.log('2. En el celular: WhatsApp → Dispositivos vinculados → Vincular dispositivo')
console.log('3. Escanea el QR de la imagen (se abrirá sola).\n')

clearWhatsAppAuth()
openQrWhenReady()

await connectWhatsAppWeb({ printQr: true })

await new Promise((resolve) => {
  const timer = setInterval(() => {
    if (getWhatsAppWebStatus().connected) {
      clearInterval(timer)
      resolve()
    }
  }, 800)
})

console.log('\nListo. WhatsApp vinculado.')
console.log('Ahora deja el backend con: npm run dev')
console.log('Los pedidos pagados enviarán WhatsApp al cliente y a la tienda.\n')
process.exit(0)
