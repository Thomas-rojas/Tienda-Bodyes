import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/navbar/Navbar'
import { useCart } from '../../context/CartContext'
import { formatCop } from '../../constants/products'
import { createCheckoutSession } from '../../services/api'
import './Checkout.css'

const DOCUMENT_TYPES = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'NIT', label: 'NIT' },
  { value: 'PP', label: 'Pasaporte' },
  { value: 'TI', label: 'Tarjeta de identidad' },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.startsWith('57') && digits.length === 12) return digits.slice(2)
  return digits
}

function validateForm(form, hasItems) {
  const errors = {}
  if (!hasItems) errors.items = 'Tu carrito está vacío.'
  if (form.name.trim().length < 3) errors.name = 'Ingresa tu nombre completo.'
  if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Correo inválido.'
  if (!/^3\d{9}$/.test(normalizePhone(form.phone))) {
    errors.phone = 'Celular colombiano de 10 dígitos (ej. 3001234567).'
  }
  if (!form.documentType) errors.documentType = 'Selecciona el tipo de documento.'
  if (!/^[0-9A-Za-z.-]{5,20}$/.test(form.documentNumber.trim())) {
    errors.documentNumber = 'Número de documento inválido.'
  }
  if (form.address.trim().length < 5) errors.address = 'Ingresa la dirección de envío.'
  if (form.city.trim().length < 2) errors.city = 'Ingresa la ciudad.'
  if (form.region.trim().length < 2) errors.region = 'Ingresa el departamento.'
  return errors
}

function Checkout() {
  const navigate = useNavigate()
  const { items, totalItems, totalPrice } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    documentType: 'CC',
    documentNumber: '',
    address: '',
    city: '',
    region: '',
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const hasItems = items.length > 0

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    const errors = validateForm(form, hasItems)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setFormError('Revisa los campos marcados antes de continuar.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        customer: {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: normalizePhone(form.phone),
          documentType: form.documentType,
          documentNumber: form.documentNumber.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          region: form.region.trim(),
        },
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      }

      const data = await createCheckoutSession(payload)
      sessionStorage.setItem('clio_last_reference', data.reference)
      sessionStorage.setItem('clio_clear_cart_on_paid', '1')

      if (data.mode === 'simulate' || data.checkoutUrl.includes('/pago/simular')) {
        const url = new URL(data.checkoutUrl, window.location.origin)
        window.location.href = `${url.pathname}?${url.searchParams.toString()}`
        return
      }

      window.location.href = data.checkoutUrl
    } catch (err) {
      setFormError(err.message || 'No pudimos iniciar el pago. Intenta de nuevo.')
      if (err.details) setFieldErrors(err.details)
      setSubmitting(false)
    }
  }

  const securityNote = useMemo(
    () =>
      'En el siguiente paso eliges crédito, débito, PSE o Nequi. CLIO no guarda datos sensibles de tarjeta.',
    [],
  )

  if (!hasItems) {
    return (
      <>
        <Navbar />
        <main className="checkout-page">
          <div className="checkout-page__inner checkout-page__empty">
            <h1>No hay nada para pagar</h1>
            <p>Agrega un body y vuelve a intentar.</p>
            <Link className="checkout-page__cta" to="/catalogo">
              Ver colección
            </Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="checkout-page">
        <div className="checkout-page__inner">
          <header className="checkout-page__header">
            <p className="checkout-page__eyebrow">Checkout</p>
            <h1>Datos de envío</h1>
            <p>
              {totalItems} {totalItems === 1 ? 'pieza' : 'piezas'} · Total{' '}
              <strong>{formatCop(totalPrice)}</strong>
            </p>
          </header>

          <div className="checkout-page__layout">
            <form className="checkout-page__form" onSubmit={onSubmit} noValidate>
              <label>
                Nombre completo
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  autoComplete="name"
                  aria-invalid={Boolean(fieldErrors.name)}
                />
                {fieldErrors.name && (
                  <span className="checkout-page__field-error">{fieldErrors.name}</span>
                )}
              </label>

              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  autoComplete="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                />
                {fieldErrors.email && (
                  <span className="checkout-page__field-error">{fieldErrors.email}</span>
                )}
              </label>

              <label>
                Celular
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  placeholder="3001234567"
                  autoComplete="tel"
                  aria-invalid={Boolean(fieldErrors.phone)}
                />
                {fieldErrors.phone && (
                  <span className="checkout-page__field-error">{fieldErrors.phone}</span>
                )}
              </label>

              <div className="checkout-page__row">
                <label>
                  Tipo de documento
                  <select
                    name="documentType"
                    value={form.documentType}
                    onChange={onChange}
                    aria-invalid={Boolean(fieldErrors.documentType)}
                  >
                    {DOCUMENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.documentType && (
                    <span className="checkout-page__field-error">
                      {fieldErrors.documentType}
                    </span>
                  )}
                </label>

                <label>
                  Número de documento
                  <input
                    name="documentNumber"
                    value={form.documentNumber}
                    onChange={onChange}
                    autoComplete="off"
                    aria-invalid={Boolean(fieldErrors.documentNumber)}
                  />
                  {fieldErrors.documentNumber && (
                    <span className="checkout-page__field-error">
                      {fieldErrors.documentNumber}
                    </span>
                  )}
                </label>
              </div>

              <label>
                Dirección de envío
                <textarea
                  name="address"
                  value={form.address}
                  onChange={onChange}
                  rows={3}
                  autoComplete="street-address"
                  aria-invalid={Boolean(fieldErrors.address)}
                />
                {fieldErrors.address && (
                  <span className="checkout-page__field-error">{fieldErrors.address}</span>
                )}
              </label>

              <div className="checkout-page__row">
                <label>
                  Ciudad
                  <input
                    name="city"
                    value={form.city}
                    onChange={onChange}
                    autoComplete="address-level2"
                    aria-invalid={Boolean(fieldErrors.city)}
                  />
                  {fieldErrors.city && (
                    <span className="checkout-page__field-error">{fieldErrors.city}</span>
                  )}
                </label>
                <label>
                  Departamento
                  <input
                    name="region"
                    value={form.region}
                    onChange={onChange}
                    autoComplete="address-level1"
                    aria-invalid={Boolean(fieldErrors.region)}
                  />
                  {fieldErrors.region && (
                    <span className="checkout-page__field-error">{fieldErrors.region}</span>
                  )}
                </label>
              </div>

              {formError && (
                <p className="checkout-page__error" role="alert">
                  {formError}
                </p>
              )}

              <p className="checkout-page__security">{securityNote}</p>

              <button
                className="checkout-page__pay"
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Continuando…' : 'Pagar'}
              </button>
              <button
                className="checkout-page__back"
                type="button"
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                Volver
              </button>
            </form>

            <aside className="checkout-page__summary">
              <h2>Tu pedido</h2>
              <ul>
                {items.map((item) => (
                  <li key={item.id}>
                    <img src={item.image} alt={item.alt || item.name} />
                    <div>
                      <p>{item.name}</p>
                      <span>
                        {item.quantity} × {item.price}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="checkout-page__total">
                <span>Total</span>
                <strong>{formatCop(totalPrice)}</strong>
              </div>
              <p className="checkout-page__methods">
                En el siguiente paso: crédito, débito, PSE o Nequi.
              </p>
            </aside>
          </div>
        </div>
      </main>
    </>
  )
}

export default Checkout
