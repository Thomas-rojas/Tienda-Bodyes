import {
  createProduct,
  deleteProduct,
  listProductsAdmin,
  updateProduct,
} from '../services/products.service.js'
import { listOrders } from '../services/orders.service.js'
import { AppError } from '../middleware/errorHandler.js'

export async function getAdminProducts(_req, res) {
  const products = await listProductsAdmin()
  res.json({ ok: true, products })
}

export async function postAdminProduct(req, res) {
  const body = req.body || {}
  if (req.file?.filename) {
    body.imagePath = `/uploads/${req.file.filename}`
  }
  const product = await createProduct(body)
  res.status(201).json({ ok: true, product })
}

export async function patchAdminProduct(req, res) {
  const product = await updateProduct(req.params.id, req.body || {})
  res.json({ ok: true, product })
}

export async function deleteAdminProduct(req, res) {
  const result = await deleteProduct(req.params.id)
  res.json({ ok: true, ...result })
}

export async function uploadAdminProductImage(req, res) {
  if (!req.file?.filename) {
    throw new AppError('Selecciona una imagen', 400)
  }
  const imagePath = `/uploads/${req.file.filename}`
  const product = await updateProduct(req.params.id, { imagePath })
  res.json({ ok: true, product, imagePath })
}

export async function getAdminOrders(req, res) {
  const status = req.query.status ? String(req.query.status) : 'paid'
  const orders = await listOrders({ status: status === 'all' ? null : status })
  res.json({ ok: true, orders })
}
