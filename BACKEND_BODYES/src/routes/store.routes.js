import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { getCollections } from '../controllers/collections.controller.js'
import { getContent, postNewsletter } from '../controllers/content.controller.js'

const router = Router()

router.get('/collections', asyncHandler(getCollections))
router.get('/content', asyncHandler(getContent))
router.post('/newsletter', asyncHandler(postNewsletter))

export default router
