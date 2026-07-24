import { listProducts, getProductById } from '../services/products.service.js'
import { AppError } from '../middleware/errorHandler.js'

export async function getProducts(_req, res) {
  const products = await listProducts()
  res.json({ ok: true, products })
}

export async function getProduct(req, res) {
  const product = await getProductById(req.params.id)
  if (!product) throw new AppError('Producto no encontrado', 404)
  res.json({ ok: true, product })
}
