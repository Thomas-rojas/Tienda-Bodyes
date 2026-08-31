import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { AppError } from '../middleware/errorHandler.js'
import {
  findUserByDocument,
  findUserById,
  registerCliente,
  seedAdminIfEmpty,
  verifyPassword,
} from './users.service.js'

export function sanitizeAuthUser(user) {
  if (!user) return null
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    documentType: user.documentType,
    documentNumber: user.documentNumber,
    role: user.role,
    address: user.address || '',
    city: user.city || '',
    region: user.region || '',
  }
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn },
  )
}

function buildEnvAdminSession() {
  const user = {
    id: 'env-admin',
    email: env.admin.email,
    name: 'Administrador',
    phone: '',
    documentType: 'CC',
    documentNumber: env.admin.documentNumber,
    role: 'admin',
  }
  return { token: signToken(user), user: sanitizeAuthUser(user) }
}

export async function getUserFromTokenPayload(payload) {
  if (!payload?.sub) throw new AppError('Sesión inválida', 401)

  if (payload.sub === 'env-admin') {
    return buildEnvAdminSession().user
  }

  const user = await findUserById(payload.sub)
  if (!user) throw new AppError('Usuario no encontrado', 401)
  return sanitizeAuthUser(user)
}

function isAdminCredential(loginId, plainPassword) {
  const adminDoc = env.admin.documentNumber
  const isAdminDoc = loginId === adminDoc
  const isAdminEmail = loginId.includes('@') && loginId === env.admin.email
  const validPassword =
    plainPassword === plainPassword.trim() &&
    (plainPassword === adminDoc || plainPassword === env.admin.password)

  return (isAdminDoc || isAdminEmail) && validPassword
}

export async function loginUser({ identificacion, password, email }) {
  const loginId = String(identificacion || email || '').trim()
  const plainPassword = String(password || '')

  if (!loginId || !plainPassword) {
    throw new AppError('Identificación y contraseña son requeridos', 400)
  }

  const normalizedLogin = loginId.includes('@') ? loginId.toLowerCase() : loginId

  if (isAdminCredential(normalizedLogin, plainPassword)) {
    await seedAdminIfEmpty({
      email: env.admin.email,
      password: plainPassword === env.admin.documentNumber
        ? env.admin.documentNumber
        : env.admin.password,
      name: 'Administrador CLIO',
      documentNumber: env.admin.documentNumber,
    })

    if (normalizedLogin === env.admin.email) {
      return buildEnvAdminSession()
    }

    const row = await findUserByDocument(env.admin.documentNumber)
    if (row) {
      const user = sanitizeAuthUser(row)
      return { token: signToken(user), user }
    }

    return buildEnvAdminSession()
  }

  const row = await findUserByDocument(normalizedLogin)
  if (!row) {
    throw new AppError('Credenciales inválidas', 401)
  }

  const valid = await verifyPassword(row.passwordHash, plainPassword)
  if (!valid) {
    throw new AppError('Credenciales inválidas', 401)
  }

  const user = sanitizeAuthUser(row)
  return { token: signToken(user), user }
}

export async function registerUser(payload) {
  const user = await registerCliente({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    documentType: payload.documentType,
    documentNumber: payload.identificacion || payload.documentNumber,
    password: payload.identificacion || payload.documentNumber,
  })

  const safeUser = sanitizeAuthUser(user)
  return { token: signToken(safeUser), user: safeUser }
}

/** @deprecated Usar loginUser */
export async function loginAdmin(body) {
  return loginUser({ email: body.email, password: body.password })
}
