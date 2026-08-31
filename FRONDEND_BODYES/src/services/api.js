const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const error = new Error(data?.error || 'Error de servidor')
    error.status = response.status
    error.details = data?.details || null
    throw error
  }

  return data
}

function getStoredToken() {
  return localStorage.getItem('clio_auth_token') || localStorage.getItem('clio_admin_token') || ''
}

function authRequest(path, options = {}) {
  const token = getStoredToken()
  return request(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}

export function fetchProducts() {
  return request('/api/products')
}

export function fetchProduct(id) {
  return request(`/api/products/${encodeURIComponent(id)}`)
}

export function createCheckoutSession(payload) {
  return request('/api/checkout/session', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function processMercadoPagoCardPayment(payload) {
  return request('/api/payments/mercadopago/process', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchOrderByReference(reference) {
  return request(`/api/orders/by-reference/${encodeURIComponent(reference)}`)
}

export function syncPayment({
  id,
  payment_id,
  collection_id,
  reference,
  external_reference,
  status,
}) {
  const params = new URLSearchParams()
  if (id) params.set('id', id)
  if (payment_id) params.set('payment_id', payment_id)
  if (collection_id) params.set('collection_id', collection_id)
  if (reference) params.set('reference', reference)
  if (external_reference) params.set('external_reference', external_reference)
  if (status) params.set('status', status)
  return request(`/api/payments/sync?${params.toString()}`)
}

export function simulatePayment(
  reference,
  outcome = 'APPROVED',
  paymentMethodType = 'CREDIT_CARD',
) {
  return request('/api/payments/simulate', {
    method: 'POST',
    body: JSON.stringify({ reference, outcome, paymentMethodType }),
  })
}

export function login(identificacion, password) {
  const loginId = String(identificacion || '').trim()
  const body = loginId.includes('@')
    ? { email: loginId.toLowerCase(), password }
    : { identificacion: loginId, password }

  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function register(payload) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchMe() {
  return authRequest('/api/auth/me')
}

export function updateProfile(patch) {
  return authRequest('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export function fetchMyOrders() {
  return authRequest('/api/account/orders')
}

/** @deprecated Usar login() con identificación */
export function adminLogin(email, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function fetchAdminDashboard(days = 30) {
  return authRequest(`/api/admin/dashboard?days=${days}`)
}

export function fetchAdminUsers() {
  return authRequest('/api/admin/users')
}

export function updateAdminUserRole(id, role) {
  return authRequest(`/api/admin/users/${encodeURIComponent(id)}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
}

export function fetchAdminProducts() {
  return authRequest('/api/admin/products')
}

export function updateAdminProduct(id, patch) {
  return authRequest(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export function deleteAdminProduct(id) {
  return authRequest(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function createAdminProduct(fields, file) {
  const token = getStoredToken()
  const formData = new FormData()

  Object.entries(fields || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    formData.append(key, String(value))
  })
  if (file) formData.append('image', file)

  const response = await fetch(`${API_URL}/api/admin/products`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(data?.error || 'No se pudo crear el producto')
  }

  return data
}

export async function uploadAdminProductImage(id, file) {
  const token = getStoredToken()
  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch(
    `${API_URL}/api/admin/products/${encodeURIComponent(id)}/image`,
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    },
  )

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(data?.error || 'No se pudo subir la imagen')
  }

  return data
}

export function fetchAdminOrders(status = 'paid') {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  return authRequest(`/api/admin/orders?${params.toString()}`)
}

export function updateAdminOrderFulfillment(id, payload) {
  return authRequest(`/api/admin/orders/${encodeURIComponent(id)}/fulfillment`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function exportAdminOrdersCsv() {
  const token = getStoredToken()
  return fetch(`${API_URL}/api/admin/orders/export/csv`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

export function duplicateAdminProduct(id) {
  return authRequest(`/api/admin/products/${encodeURIComponent(id)}/duplicate`, {
    method: 'POST',
  })
}

export function fetchStoreContent() {
  return request('/api/store/content')
}

export function fetchStoreCollections({ featured = false } = {}) {
  const params = new URLSearchParams()
  if (featured) params.set('featured', 'true')
  const query = params.toString()
  return request(`/api/store/collections${query ? `?${query}` : ''}`)
}

export function fetchAdminCollections() {
  return authRequest('/api/admin/collections?all=true')
}

export function createAdminCollection(fields, file) {
  const token = getStoredToken()
  const formData = new FormData()
  Object.entries(fields || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    formData.append(key, String(value))
  })
  if (file) formData.append('image', file)
  return fetch(`${API_URL}/api/admin/collections`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  }).then(async (response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data?.error || 'Error al crear colección')
    return data
  })
}

export function updateAdminCollection(id, fields, file) {
  const token = getStoredToken()
  const formData = new FormData()
  Object.entries(fields || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    formData.append(key, String(value))
  })
  if (file) formData.append('image', file)
  return fetch(`${API_URL}/api/admin/collections/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  }).then(async (response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data?.error || 'Error al guardar colección')
    return data
  })
}

export function deleteAdminCollection(id) {
  return authRequest(`/api/admin/collections/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function fetchAdminContent() {
  return authRequest('/api/admin/content')
}

export function updateAdminContent(key, value) {
  return authRequest('/api/admin/content', {
    method: 'PATCH',
    body: JSON.stringify({ key, value }),
  })
}

export function fetchAdminCustomers() {
  return authRequest('/api/admin/customers')
}

export function fetchAdminCoupons() {
  return authRequest('/api/admin/coupons')
}

export function createAdminCoupon(payload) {
  return authRequest('/api/admin/coupons', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateAdminCoupon(id, payload) {
  return authRequest(`/api/admin/coupons/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteAdminCoupon(id) {
  return authRequest(`/api/admin/coupons/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function subscribeNewsletter(email) {
  return request('/api/store/newsletter', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export { API_URL }
