import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import {
  mercadoPagoWebhook,
  simulatePayment,
  syncTransaction,
} from '../controllers/payments.controller.js'

const router = Router()

router.post('/mercadopago/webhook', asyncHandler(mercadoPagoWebhook))
router.get('/mercadopago/webhook', asyncHandler(mercadoPagoWebhook))
router.post('/simulate', asyncHandler(simulatePayment))
router.get('/sync', asyncHandler(syncTransaction))

export default router
