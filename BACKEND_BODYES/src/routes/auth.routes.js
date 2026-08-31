import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { login, me, register, updateProfile } from '../controllers/auth.controller.js'

const router = Router()

router.post('/login', asyncHandler(login))
router.post('/register', asyncHandler(register))
router.get('/me', asyncHandler(requireAuth), asyncHandler(me))
router.patch('/profile', asyncHandler(requireAuth), asyncHandler(updateProfile))

export default router
