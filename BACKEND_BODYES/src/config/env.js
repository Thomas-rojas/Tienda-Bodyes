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
  mercadoPago: {
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || '',
    /** test | production */
    env: process.env.MERCADOPAGO_ENV || 'test',
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || 'CLIO <onboarding@resend.dev>',
    storeEmail: process.env.STORE_EMAIL || '',
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: Number(process.env.SMTP_PORT) || 587,
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },
  whatsapp: {
    /** Número de la empresa en WhatsApp (solo dígitos, con 57). Ej: 573001234567 */
    storePhone: String(process.env.STORE_WHATSAPP || '')
      .replace(/\D/g, '')
      .replace(/^0+/, ''),
    /** Legacy Cloud API — ya no se usa para envío automático */
    token: process.env.WHATSAPP_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
  },
  /**
   * Solo si SIMULATE_PAYMENTS=true (escape hatch).
   * Por defecto el backend exige Mercado Pago siempre activo.
   */
  simulatePayments: process.env.SIMULATE_PAYMENTS === 'true',
  jwt: {
    secret: process.env.JWT_SECRET || 'change_this_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  admin: {
    email: (process.env.ADMIN_EMAIL || 'admin@clio.com').toLowerCase().trim(),
    password: process.env.ADMIN_PASSWORD || 'clioadmin123',
    documentNumber: String(process.env.ADMIN_DOCUMENT_NUMBER || '1000000001').trim(),
  },
}
