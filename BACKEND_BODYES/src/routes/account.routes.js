import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { getMyOrderByReference, getMyOrders } from '../controllers/account.controller.js'

const router = Router()

router.use(asyncHandler(requireAuth))

router.get('/orders', asyncHandler(getMyOrders))
router.get('/orders/:reference', asyncHandler(getMyOrderByReference))

export default router
