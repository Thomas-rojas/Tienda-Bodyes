import express from 'express'
import cors from 'cors'
import { checkSupabaseConnection } from './config/database.js'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { getEmailTransportStatus } from './services/email.service.js'
import { verifyMercadoPagoCredentials } from './services/mercadopago.service.js'
import { uploadsDir } from './middleware/upload.js'
import productsRoutes from './routes/products.routes.js'
import checkoutRoutes from './routes/checkout.routes.js'
import paymentsRoutes from './routes/payments.routes.js'
import ordersRoutes from './routes/orders.routes.js'
import authRoutes from './routes/auth.routes.js'
import adminRoutes from './routes/admin.routes.js'

const app = express()

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use('/uploads', express.static(uploadsDir))

app.get('/api/health', async (_req, res) => {
  const supabase = await checkSupabaseConnection()
  const email = getEmailTransportStatus()
  const mpReady = env.simulatePayments
    ? { ok: true, mode: 'simulate' }
    : await verifyMercadoPagoCredentials()

  res.json({
    ok: Boolean(mpReady.ok),
    service: 'clio-backend',
    supabase,
    payments: {
      mode: env.simulatePayments ? 'simulate' : 'checkout_api',
      integration: 'checkout_api',
      mercadoPagoEnv: env.mercadoPago.env,
      configured: Boolean(env.mercadoPago.accessToken && env.mercadoPago.publicKey),
      ready: Boolean(mpReady.ok),
      detail: mpReady.detail || null,
      siteId: mpReady.siteId || null,
      collectorId: mpReady.collectorId || null,
      testUser: Boolean(mpReady.testUser),
      publicKeyConfigured: Boolean(mpReady.publicKeyConfigured ?? env.mercadoPago.publicKey),
      publicKeySuffix: mpReady.publicKeySuffix ||
        (env.mercadoPago.publicKey
          ? String(env.mercadoPago.publicKey).slice(-12)
          : null),
      credentialsKind: String(env.mercadoPago.accessToken || '').startsWith('TEST-')
        ? 'TEST'
        : String(env.mercadoPago.accessToken || '').startsWith('APP_USR-')
          ? 'APP_USR'
          : 'NONE',
    },
    email: {
      ...email,
      storeEmailConfigured: Boolean(env.email.storeEmail),
    },
  })
})

app.use('/api/products', productsRoutes)
app.use('/api/checkout', checkoutRoutes)
app.use('/api/payments', paymentsRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)

app.use(errorHandler)

export default app
