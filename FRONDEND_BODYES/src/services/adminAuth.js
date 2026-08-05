const TOKEN_KEY = 'clio_admin_token'

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setAdminToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAdminAuthenticated() {
  return Boolean(getAdminToken())
}
