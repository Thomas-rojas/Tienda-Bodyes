import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { getOrderReceipt } from '../controllers/orders.controller.js'

const router = Router()

router.get('/by-reference/:reference', asyncHandler(getOrderReceipt))

export default router
