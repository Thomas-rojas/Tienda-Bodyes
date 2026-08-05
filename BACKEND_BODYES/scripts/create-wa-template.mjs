import 'dotenv/config'

const token = process.env.WHATSAPP_TOKEN
const ver = process.env.WHATSAPP_API_VERSION || 'v21.0'
const waba = '1757002482102450'
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
}

const body = {
  name: 'clio_confirmacion_compra',
  language: 'es',
  category: 'UTILITY',
  components: [
    {
      type: 'HEADER',
      format: 'TEXT',
      text: 'CLIO · Compra confirmada',
    },
    {
      type: 'BODY',
      text: 'Hola {{1}}, gracias por tu compra en CLIO. Recibimos tu pago correctamente. Referencia: {{2}}. Total: {{3}}. Productos: {{4}}. Comprobante: {{5}}. Gracias por elegir CLIO.',
      example: {
        body_text: [
          [
            'Ana',
            'CLIO-ABC123',
            '$140.000',
            'Clio Basico Essential Nude x1',
            'https://example.com/comprobante/CLIO-ABC123',
          ],
        ],
      },
    },
  ],
}

const create = await fetch(
  `https://graph.facebook.com/${ver}/${waba}/message_templates`,
  { method: 'POST', headers, body: JSON.stringify(body) },
)
const created = await create.text()
console.log('create', create.status, created)

const list = await fetch(
  `https://graph.facebook.com/${ver}/${waba}/message_templates?name=clio_confirmacion_compra`,
  { headers: { Authorization: `Bearer ${token}` } },
)
console.log('list', list.status, (await list.text()).slice(0, 800))
