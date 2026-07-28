import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import {
  getOrderReceipt,
  getOrderStatus,
} from '../controllers/orders.controller.js'

const router = Router()

router.get('/by-reference/:reference', asyncHandler(getOrderReceipt))
router.get('/:id/status', asyncHandler(getOrderStatus))

export default router
