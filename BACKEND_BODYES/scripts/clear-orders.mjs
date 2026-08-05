import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY

if (!url || !key) {
  console.error('Falta SUPABASE_URL o SUPABASE_SECRET_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)

const { data: before, error: countError } = await supabase
  .from('orders')
  .select('id', { count: 'exact' })

if (countError) {
  console.error('No se pudo listar pedidos:', countError.message)
  process.exit(1)
}

const total = before?.length ?? 0
console.log(`Pedidos encontrados: ${total}`)

if (total === 0) {
  console.log('No hay ventas que borrar.')
  process.exit(0)
}

const { error } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')

if (error) {
  console.error('Error al borrar pedidos:', error.message)
  process.exit(1)
}

const { count } = await supabase
  .from('orders')
  .select('*', { count: 'exact', head: true })

console.log(`Pedidos restantes: ${count ?? 0}`)
console.log('Ventas de prueba eliminadas (order_items y payments en cascada).')
