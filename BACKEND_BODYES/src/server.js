import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import app from './app.js'
import {
  WA_AUTH_DIR,
  connectWhatsAppWeb,
} from './services/whatsapp-web.session.js'
import { verifyMercadoPagoCredentials } from './services/mercadopago.service.js'
import { env } from './config/env.js'

const PORT = process.env.PORT || 4000

async function start() {
  const mp = await verifyMercadoPagoCredentials()
  if (!mp.ok) {
    console.error('[mercadopago] El backend no arranca sin Mercado Pago activo.')
    console.error(`[mercadopago] ${mp.detail}`)
    console.error(
      '[mercadopago] Configura MERCADOPAGO_ACCESS_TOKEN en .env (o SIMULATE_PAYMENTS=true solo en emergencia).',
    )
    process.exit(1)
  }

  console.info(`[mercadopago] ${mp.detail}`)
  if (mp.mode === 'checkout_api') {
    console.info(
      `[mercadopago] Checkout API · entorno=${env.mercadoPago.env} · pk…${mp.publicKeySuffix || 'missing'}`,
    )
  }

  app.listen(PORT, () => {
    console.log(`Bodyes API running on http://localhost:${PORT}`)

    const hasAuth = fs.existsSync(path.join(WA_AUTH_DIR, 'creds.json'))
    if (hasAuth) {
      connectWhatsAppWeb({ printQr: false }).catch((err) => {
        console.warn('[whatsapp-web] No se reconectó al arrancar:', err.message)
        console.warn('[whatsapp-web] Ejecuta: npm run whatsapp:link')
      })
    } else {
      console.info(
        '[whatsapp-web] Sin vincular. Para avisos automáticos: npm run whatsapp:link',
      )
    }
  })
}

start().catch((err) => {
  console.error('[server] Falló el arranque:', err)
  process.exit(1)
})
