import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { validateBody } from '../middleware/validateBody.js'
import { validateCheckoutPayload } from '../utils/validate.js'
import { createCheckoutSession } from '../controllers/checkout.controller.js'

const router = Router()

router.post(
  '/session',
  validateBody(validateCheckoutPayload),
  asyncHandler(createCheckoutSession),
)

export default router
