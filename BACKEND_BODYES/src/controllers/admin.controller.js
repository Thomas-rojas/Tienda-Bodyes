import {
  createProduct,
  deleteProduct,
  duplicateProduct,
  listProductsAdmin,
  updateProduct,
} from '../services/products.service.js'
import {
  listOrders,
  ordersToCsv,
  updateOrderFulfillment,
} from '../services/orders.service.js'
import {
  createCoupon,
  deleteCoupon,
  getAdminAnalytics,
  getCustomerInsights,
  listCoupons,
  updateCoupon,
} from '../services/analytics.service.js'
import { listUsers, updateUserRole } from '../services/users.service.js'
import { AppError } from '../middleware/errorHandler.js'

export async function getAdminProducts(_req, res) {
  const products = await listProductsAdmin()
  res.json({ ok: true, products })
}

export async function postAdminProduct(req, res) {
  const body = req.body || {}
  if (req.file?.filename) body.imagePath = `/uploads/${req.file.filename}`
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

export async function postDuplicateProduct(req, res) {
  const product = await duplicateProduct(req.params.id)
  res.status(201).json({ ok: true, product })
}

export async function uploadAdminProductImage(req, res) {
  if (!req.file?.filename) throw new AppError('Selecciona una imagen', 400)
  const imagePath = `/uploads/${req.file.filename}`
  const product = await updateProduct(req.params.id, { imagePath })
  res.json({ ok: true, product, imagePath })
}

export async function getAdminOrders(req, res) {
  const status = req.query.status ? String(req.query.status) : 'paid'
  const orders = await listOrders({ status: status === 'all' ? null : status })
  res.json({ ok: true, orders })
}

export async function exportAdminOrders(req, res) {
  const orders = await listOrders({ status: null })
  const csv = ordersToCsv(orders)
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="pedidos-clio.csv"')
  res.send(`\uFEFF${csv}`)
}

export async function patchAdminOrderFulfillment(req, res) {
  const order = await updateOrderFulfillment(req.params.id, req.body || {})
  res.json({ ok: true, order })
}

export async function getAdminDashboard(req, res) {
  const dashboard = await getAdminAnalytics({
    days: Number(req.query.days) || 30,
  })
  res.json({ ok: true, dashboard })
}

export async function getAdminUsers(_req, res) {
  const users = await listUsers()
  res.json({ ok: true, users })
}

export async function patchAdminUserRole(req, res) {
  if (req.params.id === 'env-admin') {
    throw new AppError('No se puede modificar este usuario', 400)
  }
  const user = await updateUserRole(req.params.id, req.body?.role)
  res.json({ ok: true, user })
}

export async function getAdminCustomers(_req, res) {
  const customers = await getCustomerInsights()
  res.json({ ok: true, customers })
}

export async function getAdminCoupons(_req, res) {
  const coupons = await listCoupons()
  res.json({ ok: true, coupons })
}

export async function postAdminCoupon(req, res) {
  const coupon = await createCoupon(req.body || {})
  res.status(201).json({ ok: true, coupon })
}

export async function patchAdminCoupon(req, res) {
  const coupon = await updateCoupon(req.params.id, req.body || {})
  res.json({ ok: true, coupon })
}

export async function deleteAdminCoupon(req, res) {
  await deleteCoupon(req.params.id)
  res.json({ ok: true })
}
