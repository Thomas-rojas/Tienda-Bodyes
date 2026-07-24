import crypto from 'node:crypto'

/**
 * Firma de integridad Wompi Checkout Web:
 * SHA256(`${reference}${amountInCents}${currency}${integritySecret}`)
 */
export function buildIntegritySignature({
  reference,
  amountInCents,
  currency,
  integritySecret,
}) {
  const raw = `${reference}${amountInCents}${currency}${integritySecret}`
  return crypto.createHash('sha256').update(raw).digest('hex')
}

/**
 * Valida el checksum de un evento webhook de Wompi.
 * checksum = SHA256(`${properties.join('')}${timestamp}${eventsSecret}`)
 * donde properties son los valores de data.transaction en el orden de signature.properties
 */
export function verifyWompiEventChecksum(event, eventsSecret) {
  if (!eventsSecret) return false
  const signature = event?.signature
  if (!signature?.checksum || !Array.isArray(signature.properties) || !signature.timestamp) {
    return false
  }

  const tx = event?.data?.transaction
  if (!tx) return false

  const concat = signature.properties
    .map((path) => {
      // paths como "transaction.id", "transaction.status", "transaction.amount_in_cents"
      const key = String(path).replace(/^transaction\./, '')
      const value = tx[key]
      return value === undefined || value === null ? '' : String(value)
    })
    .join('')

  const raw = `${concat}${signature.timestamp}${eventsSecret}`
  const expected = crypto.createHash('sha256').update(raw).digest('hex')
  return expected === signature.checksum
}

export function createOrderReference() {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `CLIO-${stamp}-${rand}`
}
