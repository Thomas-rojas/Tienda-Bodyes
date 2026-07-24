import 'dotenv/config'

export const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:4000',
  supabase: {
    url: process.env.SUPABASE_URL,
    secretKey: process.env.SUPABASE_SECRET_KEY,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },
  wompi: {
    env: process.env.WOMPI_ENV || 'sandbox',
    publicKey: process.env.WOMPI_PUBLIC_KEY || '',
    privateKey: process.env.WOMPI_PRIVATE_KEY || '',
    integritySecret: process.env.WOMPI_INTEGRITY_SECRET || '',
    eventsSecret: process.env.WOMPI_EVENTS_SECRET || '',
    checkoutUrl: process.env.WOMPI_CHECKOUT_URL || 'https://checkout.wompi.co/p/',
    apiBase:
      process.env.WOMPI_API_BASE ||
      (process.env.WOMPI_ENV === 'production'
        ? 'https://production.wompi.co/v1'
        : 'https://sandbox.wompi.co/v1'),
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || 'CLIO <onboarding@resend.dev>',
  },
  whatsapp: {
    token: process.env.WHATSAPP_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
  },
  /** Si true (o faltan claves Wompi en development), permite simular pago local */
  simulatePayments:
    process.env.SIMULATE_PAYMENTS === 'true' ||
    (process.env.NODE_ENV !== 'production' && !process.env.WOMPI_PUBLIC_KEY),
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
}
