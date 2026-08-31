const TOKEN_KEY = 'clio_auth_token'

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('clio_admin_token') || ''
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.removeItem('clio_admin_token')
  } else {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('clio_admin_token')
  }
}

export function clearAuthToken() {
  setAuthToken('')
}

export function isAuthenticated() {
  return Boolean(getAuthToken())
}

/** @deprecated */
export const getAdminToken = getAuthToken
export const setAdminToken = setAuthToken
export const clearAdminToken = clearAuthToken
export const isAdminAuthenticated = isAuthenticated
