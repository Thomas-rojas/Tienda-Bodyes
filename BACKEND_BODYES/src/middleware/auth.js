import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { AppError } from './errorHandler.js'
import { getUserFromTokenPayload } from '../services/auth.service.js'

function readBearerToken(req) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) return null
  return token
}

export async function requireAuth(req, _res, next) {
  try {
    const token = readBearerToken(req)
    if (!token) {
      return next(new AppError('No autorizado', 401))
    }

    const payload = jwt.verify(token, env.jwt.secret)
    req.user = await getUserFromTokenPayload(payload)
    return next()
  } catch (err) {
    if (err instanceof AppError) return next(err)
    return next(new AppError('Sesión inválida o expirada', 401))
  }
}

export async function requireAdmin(req, _res, next) {
  try {
    const token = readBearerToken(req)
    if (!token) {
      return next(new AppError('No autorizado', 401))
    }

    const payload = jwt.verify(token, env.jwt.secret)
    req.user = await getUserFromTokenPayload(payload)

    if (req.user?.role !== 'admin') {
      return next(new AppError('Acceso no autorizado', 403))
    }

    req.admin = { email: req.user.email, role: req.user.role }
    return next()
  } catch (err) {
    if (err instanceof AppError) return next(err)
    return next(new AppError('Sesión inválida o expirada', 401))
  }
}
