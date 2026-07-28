import express from 'express'
import cors from 'cors'
import { checkSupabaseConnection } from './config/database.js'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { getEmailTransportStatus } from './services/email.service.js'
import productsRoutes from './routes/products.routes.js'
import checkoutRoutes from './routes/checkout.routes.js'
import paymentsRoutes from './routes/payments.routes.js'
import ordersRoutes from './routes/orders.routes.js'

const app = express()

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use('/uploads', express.static('uploads'))

app.get('/api/health', async (_req, res) => {
  const supabase = await checkSupabaseConnection()
  const email = getEmailTransportStatus()
  res.json({
    ok: true,
    service: 'clio-backend',
    supabase,
    payments: {
      mode: env.simulatePayments ? 'simulate' : 'mercadopago',
      mercadoPagoEnv: env.mercadoPago.env,
      configured: Boolean(env.mercadoPago.accessToken),
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

app.use(errorHandler)

export default app
