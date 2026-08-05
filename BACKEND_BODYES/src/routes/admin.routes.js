import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAdmin } from '../middleware/auth.js'
import { productImageUpload } from '../middleware/upload.js'
import {
  deleteAdminProduct,
  getAdminOrders,
  getAdminProducts,
  patchAdminProduct,
  postAdminProduct,
  uploadAdminProductImage,
} from '../controllers/admin.controller.js'

const router = Router()

router.use(requireAdmin)

router.get('/products', asyncHandler(getAdminProducts))
router.post(
  '/products',
  productImageUpload.single('image'),
  asyncHandler(postAdminProduct),
)
router.patch('/products/:id', asyncHandler(patchAdminProduct))
router.delete('/products/:id', asyncHandler(deleteAdminProduct))
router.post(
  '/products/:id/image',
  productImageUpload.single('image'),
  asyncHandler(uploadAdminProductImage),
)
router.get('/orders', asyncHandler(getAdminOrders))

export default router
