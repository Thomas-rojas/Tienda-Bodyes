import crypto from 'node:crypto'

export function createOrderReference() {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `CLIO-${stamp}-${rand}`
}
