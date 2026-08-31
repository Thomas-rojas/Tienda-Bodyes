import {
  createCollection,
  deleteCollection,
  listCollections,
  reorderCollections,
  updateCollection,
} from '../services/collections.service.js'

export async function getCollections(req, res) {
  const featuredOnly = req.query.featured === 'true'
  const collections = await listCollections({
    activeOnly: req.query.all !== 'true',
    featuredOnly,
  })
  res.json({ ok: true, collections })
}

export async function postCollection(req, res) {
  const body = { ...(req.body || {}) }
  if (req.file?.filename) body.imagePath = `/uploads/${req.file.filename}`
  const collection = await createCollection(body)
  res.status(201).json({ ok: true, collection })
}

export async function patchCollection(req, res) {
  const body = { ...(req.body || {}) }
  if (req.file?.filename) body.imagePath = `/uploads/${req.file.filename}`
  const collection = await updateCollection(req.params.id, body)
  res.json({ ok: true, collection })
}

export async function removeCollection(req, res) {
  await deleteCollection(req.params.id)
  res.json({ ok: true })
}

export async function putCollectionOrder(req, res) {
  const collections = await reorderCollections(req.body?.order || [])
  res.json({ ok: true, collections })
}
