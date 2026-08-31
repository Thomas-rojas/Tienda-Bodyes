import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import app from './app.js'
import { verifyMercadoPagoCredentials } from './services/mercadopago.service.js'
import { seedAdminIfEmpty } from './services/users.service.js'
import { env } from './config/env.js'

const PORT = process.env.PORT || 4000
const HOST = process.env.HOST || '0.0.0.0'

async function start() {
  const mp = await verifyMercadoPagoCredentials()
  if (!mp.ok) {
    console.warn('[mercadopago] Arrancando sin verificación de Mercado Pago.')
    console.warn(`[mercadopago] ${mp.detail}`)
    console.warn(
      '[mercadopago] Admin y catálogo seguirán disponibles; revisa MERCADOPAGO_* en Render.',
    )
  } else {
    console.info(`[mercadopago] ${mp.detail}`)
    if (mp.mode === 'checkout_api') {
      console.info(
        `[mercadopago] Checkout API · entorno=${env.mercadoPago.env} · pk…${mp.publicKeySuffix || 'missing'}`,
      )
    }
  }

  try {
    const seeded = await seedAdminIfEmpty({
      email: env.admin.email,
      password: env.admin.documentNumber,
      name: 'Administrador CLIO',
      documentNumber: env.admin.documentNumber,
    })
    if (seeded) {
      console.info('[auth] Admin inicial creado en base de datos (rol admin).')
    }
  } catch (err) {
    console.warn('[auth] No se pudo crear admin seed:', err.message)
  }

  app.listen(PORT, HOST, () => {
    console.log(`Bodyes API running on http://${HOST}:${PORT}`)

    ;(async () => {
      try {
        const { WA_AUTH_DIR, connectWhatsAppWeb } = await import(
          './services/whatsapp-web.session.js'
        )
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
      } catch (err) {
        console.warn('[whatsapp-web] Módulo omitido en este entorno:', err.message)
      }
    })()
  })
}

start().catch((err) => {
  console.error('[server] Falló el arranque:', err)
  process.exit(1)
})
