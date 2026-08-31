import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAdmin } from '../middleware/auth.js'
import { productImageUpload } from '../middleware/upload.js'
import { getContent, patchContent } from '../controllers/content.controller.js'
import {
  getCollections,
  patchCollection,
  postCollection,
  putCollectionOrder,
  removeCollection,
} from '../controllers/collections.controller.js'
import {
  deleteAdminCoupon,
  deleteAdminProduct,
  exportAdminOrders,
  getAdminCoupons,
  getAdminCustomers,
  getAdminDashboard,
  getAdminOrders,
  getAdminProducts,
  getAdminUsers,
  patchAdminCoupon,
  patchAdminOrderFulfillment,
  patchAdminProduct,
  patchAdminUserRole,
  postAdminCoupon,
  postAdminProduct,
  postDuplicateProduct,
  uploadAdminProductImage,
} from '../controllers/admin.controller.js'

const router = Router()

router.use(asyncHandler(requireAdmin))

router.get('/dashboard', asyncHandler(getAdminDashboard))

router.get('/products', asyncHandler(getAdminProducts))
router.post('/products', productImageUpload.single('image'), asyncHandler(postAdminProduct))
router.patch('/products/:id', asyncHandler(patchAdminProduct))
router.delete('/products/:id', asyncHandler(deleteAdminProduct))
router.post('/products/:id/duplicate', asyncHandler(postDuplicateProduct))
router.post(
  '/products/:id/image',
  productImageUpload.single('image'),
  asyncHandler(uploadAdminProductImage),
)

router.get('/collections', asyncHandler(getCollections))
router.post('/collections', productImageUpload.single('image'), asyncHandler(postCollection))
router.patch('/collections/:id', productImageUpload.single('image'), asyncHandler(patchCollection))
router.delete('/collections/:id', asyncHandler(removeCollection))
router.put('/collections/reorder', asyncHandler(putCollectionOrder))

router.get('/orders', asyncHandler(getAdminOrders))
router.get('/orders/export/csv', asyncHandler(exportAdminOrders))
router.patch('/orders/:id/fulfillment', asyncHandler(patchAdminOrderFulfillment))

router.get('/customers', asyncHandler(getAdminCustomers))
router.get('/users', asyncHandler(getAdminUsers))
router.patch('/users/:id/role', asyncHandler(patchAdminUserRole))

router.get('/coupons', asyncHandler(getAdminCoupons))
router.post('/coupons', asyncHandler(postAdminCoupon))
router.patch('/coupons/:id', asyncHandler(patchAdminCoupon))
router.delete('/coupons/:id', asyncHandler(deleteAdminCoupon))

router.get('/content', asyncHandler(getContent))
router.patch('/content', asyncHandler(patchContent))

export default router
