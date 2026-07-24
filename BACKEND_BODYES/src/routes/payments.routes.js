import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import {
  simulatePayment,
  syncTransaction,
  wompiWebhook,
} from '../controllers/payments.controller.js'

const router = Router()

router.post('/wompi/webhook', asyncHandler(wompiWebhook))
router.post('/simulate', asyncHandler(simulatePayment))
router.get('/sync', asyncHandler(syncTransaction))

export default router
