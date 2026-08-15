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

function adminRequest(path, options = {}) {
  const token = localStorage.getItem('clio_admin_token') || ''
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

export function adminLogin(email, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function fetchAdminProducts() {
  return adminRequest('/api/admin/products')
}

export function updateAdminProduct(id, patch) {
  return adminRequest(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export function deleteAdminProduct(id) {
  return adminRequest(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function createAdminProduct(fields, file) {
  const token = localStorage.getItem('clio_admin_token') || ''
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
  const token = localStorage.getItem('clio_admin_token') || ''
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
  return adminRequest(`/api/admin/orders?${params.toString()}`)
}

export { API_URL }
