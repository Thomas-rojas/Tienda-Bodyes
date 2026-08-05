import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { AppError } from '../middleware/errorHandler.js'

export function loginAdmin({ email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const normalizedPassword = String(password || '')

  if (!normalizedEmail || !normalizedPassword) {
    throw new AppError('Correo y contraseña son requeridos', 400)
  }

  if (
    normalizedEmail !== env.admin.email ||
    normalizedPassword !== env.admin.password
  ) {
    throw new AppError('Credenciales inválidas', 401)
  }

  const token = jwt.sign(
    { email: env.admin.email, role: 'admin' },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn },
  )

  return {
    token,
    admin: { email: env.admin.email, role: 'admin' },
  }
}
