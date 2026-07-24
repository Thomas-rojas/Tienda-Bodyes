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

export function fetchOrderByReference(reference) {
  return request(`/api/orders/by-reference/${encodeURIComponent(reference)}`)
}

export function syncPayment({ id, reference }) {
  const params = new URLSearchParams()
  if (id) params.set('id', id)
  if (reference) params.set('reference', reference)
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

export { API_URL }
