export class AppError extends Error {
  constructor(message, status = 400, details = null) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.details = details
  }
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500
  const payload = {
    ok: false,
    error: err.message || 'Error interno del servidor',
  }
  if (err.details) payload.details = err.details
  if (status >= 500) {
    console.error('[api]', err)
  }
  res.status(status).json(payload)
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
