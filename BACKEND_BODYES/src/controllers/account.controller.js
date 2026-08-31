import { listOrdersByDocument } from '../services/orders.service.js'
import { AppError } from '../middleware/errorHandler.js'

export async function getMyOrders(req, res) {
  if (!req.user?.documentNumber) {
    res.json({ ok: true, orders: [] })
    return
  }

  const orders = await listOrdersByDocument(req.user.documentNumber)
  res.json({ ok: true, orders })
}

export async function getMyOrderByReference(req, res) {
  if (!req.user?.documentNumber) {
    throw new AppError('No autorizado', 403)
  }

  const orders = await listOrdersByDocument(req.user.documentNumber)
  const order = orders.find((row) => row.reference === req.params.reference)
  if (!order) {
    throw new AppError('Pedido no encontrado', 404)
  }

  res.json({ ok: true, order })
}
