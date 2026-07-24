import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

if (!env.supabase.url || !env.supabase.secretKey) {
  console.warn(
    '[supabase] Falta SUPABASE_URL o SUPABASE_SECRET_KEY en .env',
  )
}

export const supabase = createClient(
  env.supabase.url || '',
  env.supabase.secretKey || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
)

export async function checkSupabaseConnection() {
  try {
    const { error } = await supabase.from('products').select('id').limit(1)
    if (!error) return { ok: true, detail: 'Conectado a Supabase' }
    if (error.message?.includes('Could not find the table')) {
      return {
        ok: true,
        detail: 'API conectada (aplica supabase/schema.sql)',
      }
    }
    if (
      error.message?.includes('Unregistered API key') ||
      error.message?.includes('Invalid API key')
    ) {
      return {
        ok: false,
        detail:
          'API key inválida. Usa la service_role de Project Settings → API en Supabase.',
      }
    }
    return { ok: false, detail: error.message }
  } catch (err) {
    return { ok: false, detail: err.message }
  }
}
