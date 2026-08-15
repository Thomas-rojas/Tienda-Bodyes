import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys'
import QRCode from 'qrcode'
import qrcodeTerminal from 'qrcode-terminal'
import pino from 'pino'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const WA_AUTH_DIR = path.resolve(__dirname, '../../whatsapp-auth')
export const WA_QR_PATH = path.join(WA_AUTH_DIR, 'qr.png')

const logger = pino({ level: 'silent' })

let sock = null
let connecting = null
let lastQr = null
let connectionStatus = 'disconnected'
let preferPrintQr = true

export function getWhatsAppWebStatus() {
  return {
    status: connectionStatus,
    connected: connectionStatus === 'open',
    hasAuth: fs.existsSync(path.join(WA_AUTH_DIR, 'creds.json')),
    qrPath: fs.existsSync(WA_QR_PATH) ? WA_QR_PATH : null,
    lastQr: Boolean(lastQr),
  }
}

export function getLastWhatsAppQr() {
  return lastQr
}

export function clearWhatsAppAuth() {
  if (!fs.existsSync(WA_AUTH_DIR)) return
  for (const name of fs.readdirSync(WA_AUTH_DIR)) {
    fs.rmSync(path.join(WA_AUTH_DIR, name), { recursive: true, force: true })
  }
}

async function saveQrImage(qr) {
  if (!fs.existsSync(WA_AUTH_DIR)) {
    fs.mkdirSync(WA_AUTH_DIR, { recursive: true })
  }
  await QRCode.toFile(WA_QR_PATH, qr, {
    type: 'png',
    width: 480,
    margin: 2,
    errorCorrectionLevel: 'M',
  })
}

/**
 * Conecta la sesión tipo WhatsApp Web.
 */
export async function connectWhatsAppWeb({ printQr = true } = {}) {
  preferPrintQr = printQr
  if (sock && connectionStatus === 'open') return sock
  if (connecting) return connecting

  connecting = (async () => {
    if (!fs.existsSync(WA_AUTH_DIR)) {
      fs.mkdirSync(WA_AUTH_DIR, { recursive: true })
    }

    const { state, saveCreds } = await useMultiFileAuthState(WA_AUTH_DIR)
    const { version } = await fetchLatestBaileysVersion()

    sock = makeWASocket({
      version,
      auth: state,
      logger,
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      connectTimeoutMs: 60_000,
      defaultQueryTimeoutMs: 60_000,
      keepAliveIntervalMs: 25_000,
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        lastQr = qr
        connectionStatus = 'qr'
        try {
          await saveQrImage(qr)
          console.log('\n[whatsapp-web] QR actualizado. Ábrelo y escanéalo:')
          console.log(`[whatsapp-web] ${WA_QR_PATH}`)
          console.log(
            '[whatsapp-web] Celular → WhatsApp → Dispositivos vinculados → Vincular dispositivo\n',
          )
          if (preferPrintQr) {
            qrcodeTerminal.generate(qr, { small: true })
          }
        } catch (err) {
          console.error('[whatsapp-web] No se pudo guardar QR:', err.message)
        }
      }

      if (connection === 'open') {
        connectionStatus = 'open'
        lastQr = null
        if (fs.existsSync(WA_QR_PATH)) {
          try {
            fs.unlinkSync(WA_QR_PATH)
          } catch {
            /* ignore */
          }
        }
        console.info('[whatsapp-web] Conectado. Los pedidos se avisarán como el correo.')
      }

      if (connection === 'close') {
        connectionStatus = 'disconnected'
        const code = lastDisconnect?.error?.output?.statusCode
        const loggedOut = code === DisconnectReason.loggedOut
        sock = null
        connecting = null

        if (loggedOut) {
          console.warn(
            '[whatsapp-web] Sesión cerrada en el celular. Ejecuta de nuevo: npm run whatsapp:link',
          )
          return
        }

        // 408 / timeout: regenerar QR (sigue en modo link)
        console.warn('[whatsapp-web] Conexión cerrada (%s). Generando QR nuevo…', code)
        setTimeout(() => {
          connectWhatsAppWeb({ printQr: preferPrintQr }).catch((err) => {
            console.error('[whatsapp-web] Reconexión falló', err.message)
          })
        }, 1500)
      }
    })

    return sock
  })()

  try {
    return await connecting
  } catch (err) {
    connecting = null
    throw err
  }
}

export async function ensureWhatsAppWeb() {
  if (sock && connectionStatus === 'open') return sock
  return connectWhatsAppWeb({ printQr: false })
}

export async function sendWhatsAppWebText(phoneDigits, text) {
  const to = String(phoneDigits || '').replace(/\D/g, '')
  if (!to) throw new Error('Teléfono WhatsApp vacío')
  if (!text) throw new Error('Mensaje vacío')

  const client = await ensureWhatsAppWeb()
  if (!client || connectionStatus !== 'open') {
    throw new Error(
      'WhatsApp Web no está vinculado. Ejecuta npm run whatsapp:link y escanea el QR.',
    )
  }

  const jid = `${to}@s.whatsapp.net`
  await client.sendMessage(jid, { text })
  return { ok: true, to }
}
