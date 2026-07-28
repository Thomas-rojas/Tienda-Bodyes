import { AppError } from './errorHandler.js'

/**
 * Middleware genérico: ejecuta un validador (payload) => { ok, errors, data }
 * y adjunta req.validated = data.
 */
export function validateBody(validator) {
  return (req, _res, next) => {
    try {
      const result = validator(req.body)
      if (!result?.ok) {
        return next(
          new AppError('Datos inválidos', 400, result?.errors || null),
        )
      }
      req.validated = result.data
      return next()
    } catch (err) {
      return next(err)
    }
  }
}
