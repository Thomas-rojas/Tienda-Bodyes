import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { AppError } from './errorHandler.js'

export function requireAdmin(req, _res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('No autorizado', 401))
  }

  try {
    const payload = jwt.verify(token, env.jwt.secret)
    if (payload?.role !== 'admin') {
      return next(new AppError('No autorizado', 401))
    }
    req.admin = { email: payload.email, role: payload.role }
    return next()
  } catch {
    return next(new AppError('Sesión inválida o expirada', 401))
  }
}
