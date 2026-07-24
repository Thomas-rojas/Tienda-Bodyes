import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { getProduct, getProducts } from '../controllers/products.controller.js'

const router = Router()

router.get('/', asyncHandler(getProducts))
router.get('/:id', asyncHandler(getProduct))

export default router
