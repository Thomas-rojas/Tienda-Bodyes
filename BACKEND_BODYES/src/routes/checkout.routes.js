import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { createCheckoutSession } from '../controllers/checkout.controller.js'

const router = Router()

router.post('/session', asyncHandler(createCheckoutSession))

export default router
