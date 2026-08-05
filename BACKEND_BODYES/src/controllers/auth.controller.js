import { loginAdmin } from '../services/auth.service.js'

export async function login(req, res) {
  const result = loginAdmin(req.body || {})
  res.json({ ok: true, ...result })
}
