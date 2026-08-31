import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { supabase } from '../config/database.js'
import { env } from '../config/env.js'
import { AppError } from '../middleware/errorHandler.js'
import { tablesReady } from './products.service.js'

const memoryUsers = new Map()

function sanitizeUser(row) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    documentType: row.document_type,
    documentNumber: row.document_number,
    role: row.role,
    address: row.address || '',
    city: row.city || '',
    region: row.region || '',
    createdAt: row.created_at,
  }
}

export async function usersTableReady() {
  if (!supabase) return false
  const ready = await tablesReady()
  if (!ready) return false
  const { error } = await supabase.from('users').select('id').limit(1)
  return !error
}

export async function findUserByDocument(documentNumber) {
  const doc = String(documentNumber || '').trim()
  if (!doc) return null

  if (!(await usersTableReady())) {
    for (const user of memoryUsers.values()) {
      if (user.document_number === doc) return { ...sanitizeUser(user), passwordHash: user.password_hash }
    }
    return null
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('document_number', doc)
    .maybeSingle()

  if (error) throw new AppError(error.message, 502)
  if (!data) return null
  return { ...sanitizeUser(data), passwordHash: data.password_hash }
}

export async function findUserById(id) {
  if (!(await usersTableReady())) {
    const row = memoryUsers.get(id)
    return sanitizeUser(row)
  }

  const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle()
  if (error) throw new AppError(error.message, 502)
  return sanitizeUser(data)
}

export async function verifyPassword(passwordHash, password) {
  if (!passwordHash) return false
  return bcrypt.compare(String(password || ''), passwordHash)
}

export async function registerCliente({
  name,
  email,
  phone,
  documentType,
  documentNumber,
  password,
}) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const doc = String(documentNumber || '').trim()
  const docType = String(documentType || 'CC').trim()
  const plainPassword = String(password || doc)

  if (!name?.trim() || !normalizedEmail || !phone?.trim() || !doc) {
    throw new AppError('Completa todos los campos obligatorios', 400)
  }

  const existing = await findUserByDocument(doc)
  if (existing) {
    throw new AppError('Ya existe una cuenta con esta identificación', 409)
  }

  const passwordHash = await bcrypt.hash(plainPassword, 10)
  const row = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    name: name.trim(),
    phone: phone.trim(),
    document_type: docType,
    document_number: doc,
    password_hash: passwordHash,
    role: 'cliente',
    address: null,
    city: null,
    region: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (!(await usersTableReady())) {
    memoryUsers.set(row.id, row)
    return sanitizeUser(row)
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      email: row.email,
      name: row.name,
      phone: row.phone,
      document_type: row.document_type,
      document_number: row.document_number,
      password_hash: row.password_hash,
      role: 'cliente',
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new AppError('Ya existe una cuenta con este email o identificación', 409)
    }
    throw new AppError(error.message, 502)
  }

  return sanitizeUser(data)
}

export async function updateUserProfile(userId, patch) {
  const payload = {}
  if (patch.name !== undefined) payload.name = String(patch.name).trim()
  if (patch.phone !== undefined) payload.phone = String(patch.phone).trim()
  if (patch.address !== undefined) payload.address = String(patch.address).trim()
  if (patch.city !== undefined) payload.city = String(patch.city).trim()
  if (patch.region !== undefined) payload.region = String(patch.region).trim()

  if (!(await usersTableReady())) {
    const row = memoryUsers.get(userId)
    if (!row) throw new AppError('Usuario no encontrado', 404)
    Object.assign(row, {
      ...payload,
      name: payload.name ?? row.name,
      phone: payload.phone ?? row.phone,
      address: payload.address ?? row.address,
      city: payload.city ?? row.city,
      region: payload.region ?? row.region,
      updated_at: new Date().toISOString(),
    })
    return sanitizeUser(row)
  }

  const { data, error } = await supabase
    .from('users')
    .update(payload)
    .eq('id', userId)
    .select('*')
    .single()

  if (error) throw new AppError(error.message, 502)
  return sanitizeUser(data)
}

export async function listUsers({ role } = {}) {
  if (!(await usersTableReady())) {
    return [...memoryUsers.values()]
      .filter((u) => !role || u.role === role)
      .map(sanitizeUser)
  }

  let query = supabase.from('users').select('*').order('created_at', { ascending: false })
  if (role) query = query.eq('role', role)

  const { data, error } = await query
  if (error) throw new AppError(error.message, 502)
  return (data || []).map(sanitizeUser)
}

export async function updateUserRole(userId, role) {
  if (!['admin', 'cliente'].includes(role)) {
    throw new AppError('Rol inválido', 400)
  }

  if (!(await usersTableReady())) {
    const row = memoryUsers.get(userId)
    if (!row) throw new AppError('Usuario no encontrado', 404)
    row.role = role
    row.updated_at = new Date().toISOString()
    return sanitizeUser(row)
  }

  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)
    .select('*')
    .single()

  if (error) throw new AppError(error.message, 502)
  return sanitizeUser(data)
}

export async function seedAdminIfEmpty({ email, password, name, documentNumber }) {
  const doc = String(documentNumber || env.admin.documentNumber).trim()
  const passwordToHash = String(password || doc)

  if (!(await usersTableReady())) {
    const hasAdmin = [...memoryUsers.values()].some((user) => user.role === 'admin')
    if (hasAdmin) return null

    const passwordHash = await bcrypt.hash(passwordToHash, 10)
    const row = {
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      name,
      phone: '0000000000',
      document_type: 'CC',
      document_number: doc,
      password_hash: passwordHash,
      role: 'admin',
      address: null,
      city: null,
      region: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    memoryUsers.set(row.id, row)
    return sanitizeUser(row)
  }

  const { count, error: countError } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin')

  if (countError) return null
  if (count > 0) return null

  const passwordHash = await bcrypt.hash(passwordToHash, 10)
  const { data, error } = await supabase
    .from('users')
    .insert({
      email: email.toLowerCase(),
      name,
      phone: '0000000000',
      document_type: 'CC',
      document_number: doc,
      password_hash: passwordHash,
      role: 'admin',
    })
    .select('*')
    .single()

  if (error) return null
  return sanitizeUser(data)
}
