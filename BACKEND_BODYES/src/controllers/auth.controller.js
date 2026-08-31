import {
  loginUser,
  registerUser,
  sanitizeAuthUser,
} from '../services/auth.service.js'
import { updateUserProfile } from '../services/users.service.js'
import { AppError } from '../middleware/errorHandler.js'

export async function login(req, res) {
  const body = req.body || {}
  const result = await loginUser({
    identificacion: body.identificacion,
    password: body.password,
    email: body.email,
  })
  res.json({ ok: true, ...result })
}

export async function register(req, res) {
  const result = await registerUser(req.body || {})
  res.status(201).json({ ok: true, ...result })
}

export async function me(req, res) {
  res.json({ ok: true, user: sanitizeAuthUser(req.user) })
}

export async function updateProfile(req, res) {
  if (!req.user?.id || req.user.id === 'env-admin') {
    throw new AppError('Este perfil no se puede editar aquí', 400)
  }

  const user = await updateUserProfile(req.user.id, req.body || {})
  res.json({ ok: true, user: sanitizeAuthUser(user) })
}
