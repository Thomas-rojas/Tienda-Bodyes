import { getPublicContent, subscribeNewsletter, updateContentSection } from '../services/content.service.js'
import { AppError } from '../middleware/errorHandler.js'

export async function getContent(_req, res) {
  const content = await getPublicContent()
  res.json({ ok: true, content })
}

export async function patchContent(req, res) {
  const { key, value } = req.body || {}
  if (!key) throw new AppError('Sección requerida', 400)
  const section = await updateContentSection(key, value || {})
  res.json({ ok: true, section })
}

export async function postNewsletter(req, res) {
  const result = await subscribeNewsletter(req.body?.email)
  res.json({ ok: true, ...result })
}
