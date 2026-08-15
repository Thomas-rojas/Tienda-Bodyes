import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/navbar/Navbar'
import { simulatePayment } from '../../services/api'
import './PaymentSimulate.css'

const METHODS = [
  {
    id: 'CREDIT_CARD',
    title: 'Tarjeta de crédito',
    brands: ['visa', 'mastercard', 'amex'],
  },
  {
    id: 'DEBIT_CARD',
    title: 'Tarjeta débito',
    brands: ['visa', 'mastercard'],
  },
  {
    id: 'PSE',
    title: 'PSE',
    brands: ['pse'],
  },
  {
    id: 'NEQUI',
    title: 'Nequi',
    brands: ['nequi'],
  },
]

const PSE_BANKS = [
  { code: '1007', name: 'Bancolombia' },
  { code: '1051', name: 'Davivienda' },
  { code: '1001', name: 'Banco de Bogotá' },
  { code: '1023', name: 'Banco de Occidente' },
  { code: '1062', name: 'Banco Falabella' },
  { code: '1040', name: 'Banco Agrario' },
  { code: '1013', name: 'BBVA Colombia' },
  { code: '1032', name: 'Banco Caja Social' },
  { code: '1002', name: 'Banco Popular' },
  { code: '1066', name: 'Banco Cooperativo Coopcentral' },
]

function BrandIcons({ brands }) {
  return (
    <span className="nike-pay__brands" aria-hidden="true">
      {brands.includes('visa') && (
        <span className="nike-pay__brand nike-pay__brand--visa">VISA</span>
      )}
      {brands.includes('mastercard') && (
        <span className="nike-pay__brand nike-pay__brand--mc">
          <i />
          <i />
        </span>
      )}
      {brands.includes('amex') && (
        <span className="nike-pay__brand nike-pay__brand--amex">AMEX</span>
      )}
      {brands.includes('pse') && (
        <span className="nike-pay__brand nike-pay__brand--pse">PSE</span>
      )}
      {brands.includes('nequi') && (
        <span className="nike-pay__brand nike-pay__brand--nequi">
          <img src="/images/nequi-logo.png" alt="" width="40" height="40" />
        </span>
      )}
    </span>
  )
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

function formatCardNumber(value) {
  return onlyDigits(value)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .trim()
}

function resolveSimulateOutcome(method, fields) {
  // Igual que sandbox MP: el nombre del titular decide el resultado.
  if (method === 'CREDIT_CARD' || method === 'DEBIT_CARD') {
    const code = String(fields.cardName || '')
      .trim()
      .toUpperCase()
      .split(/\s+/)[0]

    if (code === 'APRO') return 'APPROVED'
    if (
      [
        'OTHE',
        'FUND',
        'SECU',
        'EXPI',
        'FORM',
        'CARD',
        'INST',
        'DUPL',
        'LOCK',
        'CTNA',
        'ATTE',
        'BLAC',
        'CALL',
        'UNSU',
        'TEST',
      ].includes(code)
    ) {
      return 'DECLINED'
    }
    // Si escriben un nombre real u otro texto, se aprueba (prueba local cómoda).
    return 'APPROVED'
  }

  // PSE / Nequi: por defecto aprueba; usa "rechazar" en el banco/doc para fallar.
  if (method === 'PSE') {
    const doc = String(fields.pseDocument || '').trim().toUpperCase()
    if (doc === 'OTHE' || doc === 'REJECT' || doc === 'DECLINED') return 'DECLINED'
  }
  if (method === 'NEQUI') {
    const phone = onlyDigits(fields.nequiPhone)
    if (phone.endsWith('0000')) return 'DECLINED'
  }
  return 'APPROVED'
}

function validatePaymentFields(method, fields) {
  const errors = {}

  if (method === 'CREDIT_CARD' || method === 'DEBIT_CARD') {
    const number = onlyDigits(fields.cardNumber)
    if (number.length < 15 || number.length > 16) {
      errors.cardNumber = 'Ingresa un número de tarjeta válido.'
    }
    if (!/^\d{2}\/\d{2}$/.test(fields.cardExpiry.trim())) {
      errors.cardExpiry = 'Usa el formato MM/AA.'
    } else {
      const [mm, yy] = fields.cardExpiry.split('/').map(Number)
      if (mm < 1 || mm > 12) errors.cardExpiry = 'Mes inválido.'
      const now = new Date()
      const exp = new Date(2000 + yy, mm)
      if (exp < new Date(now.getFullYear(), now.getMonth())) {
        errors.cardExpiry = 'La tarjeta está vencida.'
      }
    }
    if (!/^\d{3,4}$/.test(fields.cardCvv.trim())) {
      errors.cardCvv = 'CVV inválido.'
    }
    if (fields.cardName.trim().length < 3) {
      errors.cardName = 'Nombre del titular requerido.'
    }
  }

  if (method === 'PSE') {
    if (!fields.pseBank) errors.pseBank = 'Selecciona tu banco.'
    if (!fields.psePersonType) errors.psePersonType = 'Selecciona el tipo de persona.'
    if (!/^[0-9A-Za-z.-]{5,20}$/.test(fields.pseDocument.trim())) {
      errors.pseDocument = 'Documento inválido.'
    }
  }

  if (method === 'NEQUI') {
    const phone = onlyDigits(fields.nequiPhone)
    const normalized =
      phone.startsWith('57') && phone.length === 12 ? phone.slice(2) : phone
    if (!/^3\d{9}$/.test(normalized)) {
      errors.nequiPhone = 'Celular Nequi de 10 dígitos (ej. 3001234567).'
    }
  }

  return errors
}

function CardFields({ fields, fieldErrors, onFieldChange, label }) {
  return (
    <div className="nike-pay__panel">
      <p className="nike-pay__panel-label">{label}</p>
      <div className="nike-pay__field">
        <input
          name="cardNumber"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="Número de tarjeta*"
          value={fields.cardNumber}
          onChange={onFieldChange}
          aria-invalid={Boolean(fieldErrors.cardNumber)}
        />
        {fieldErrors.cardNumber && (
          <span className="nike-pay__error">{fieldErrors.cardNumber}</span>
        )}
      </div>
      <div className="nike-pay__field-row">
        <div className="nike-pay__field">
          <input
            name="cardExpiry"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/AA*"
            value={fields.cardExpiry}
            onChange={onFieldChange}
            aria-invalid={Boolean(fieldErrors.cardExpiry)}
          />
          {fieldErrors.cardExpiry && (
            <span className="nike-pay__error">{fieldErrors.cardExpiry}</span>
          )}
        </div>
        <div className="nike-pay__field">
          <input
            name="cardCvv"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="CVV*"
            value={fields.cardCvv}
            onChange={onFieldChange}
            aria-invalid={Boolean(fieldErrors.cardCvv)}
          />
          {fieldErrors.cardCvv && (
            <span className="nike-pay__error">{fieldErrors.cardCvv}</span>
          )}
        </div>
      </div>
      <div className="nike-pay__field">
        <input
          name="cardName"
          autoComplete="cc-name"
          placeholder="Nombre en la tarjeta*"
          value={fields.cardName}
          onChange={onFieldChange}
          aria-invalid={Boolean(fieldErrors.cardName)}
        />
        {fieldErrors.cardName && (
          <span className="nike-pay__error">{fieldErrors.cardName}</span>
        )}
      </div>
    </div>
  )
}

function PaymentSimulate() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const reference = params.get('reference') || ''
  const [method, setMethod] = useState('CREDIT_CARD')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [fields, setFields] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardName: '',
    pseBank: '',
    psePersonType: '0',
    pseDocument: '',
    nequiPhone: '',
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const onFieldChange = (event) => {
    const { name, value } = event.target
    let next = value
    if (name === 'cardNumber') next = formatCardNumber(value)
    if (name === 'cardExpiry') {
      const digits = onlyDigits(value).slice(0, 4)
      next = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
    }
    if (name === 'cardCvv') next = onlyDigits(value).slice(0, 4)
    if (name === 'nequiPhone') next = onlyDigits(value).slice(0, 10)

    setFields((current) => ({ ...current, [name]: next }))
    setFieldErrors((current) => {
      if (!current[name]) return current
      const copy = { ...current }
      delete copy[name]
      return copy
    })
  }

  const selectMethod = (id) => {
    setMethod(id)
    setError('')
    setFieldErrors({})
  }

  const onPay = async (event) => {
    event.preventDefault()
    if (!reference) {
      setError('Falta la referencia del pedido.')
      return
    }

    const errors = validatePaymentFields(method, fields)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setError('Revisa los datos de tu método de pago.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const outcome = resolveSimulateOutcome(method, fields)
      sessionStorage.setItem('clio_pay_method', method)
      await simulatePayment(reference, outcome, method)
      setFields((current) => ({
        ...current,
        cardNumber: '',
        cardExpiry: '',
        cardCvv: '',
      }))
      navigate(`/pago/resultado?reference=${encodeURIComponent(reference)}`)
    } catch (err) {
      setError(err.message || 'No se pudo completar el pago.')
      setBusy(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="nike-pay">
        <div className="nike-pay__shell">
          <header className="nike-pay__header">
            <p className="nike-pay__step">Paso 2 de 2 · Simulador local</p>
            <h1>¿Cómo quieres pagar?</h1>
            <p className="nike-pay__ref">Pedido {reference || '—'}</p>
            <p className="nike-pay__hint">
              Prueba resultados con el <strong>nombre del titular</strong>:{' '}
              <code>APRO</code> aprueba · <code>OTHE</code> / <code>FUND</code> rechaza.
              Tarjeta de prueba: 5254 1336 7440 3564 · CVV 123 · 11/30
            </p>
          </header>

          <form className="nike-pay__form" onSubmit={onPay} noValidate>
            <div className="nike-pay__accordion" role="radiogroup" aria-label="Método de pago">
              {METHODS.map((item) => {
                const open = method === item.id
                return (
                  <div
                    key={item.id}
                    className={`nike-pay__item${open ? ' is-open' : ''}`}
                  >
                    <button
                      type="button"
                      className="nike-pay__trigger"
                      role="radio"
                      aria-checked={open}
                      disabled={busy}
                      onClick={() => selectMethod(item.id)}
                    >
                      <span className="nike-pay__radio" aria-hidden="true" />
                      <span className="nike-pay__title">{item.title}</span>
                      <BrandIcons brands={item.brands} />
                    </button>

                    {open && item.id === 'CREDIT_CARD' && (
                      <CardFields
                        fields={fields}
                        fieldErrors={fieldErrors}
                        onFieldChange={onFieldChange}
                        label="Ingresa los datos de tu tarjeta de crédito"
                      />
                    )}

                    {open && item.id === 'DEBIT_CARD' && (
                      <CardFields
                        fields={fields}
                        fieldErrors={fieldErrors}
                        onFieldChange={onFieldChange}
                        label="Ingresa los datos de tu tarjeta débito"
                      />
                    )}

                    {open && item.id === 'PSE' && (
                      <div className="nike-pay__panel">
                        <p className="nike-pay__panel-label">
                          Elige tu banco para pagar con PSE
                        </p>
                        <div className="nike-pay__field">
                          <select
                            name="pseBank"
                            value={fields.pseBank}
                            onChange={onFieldChange}
                            aria-invalid={Boolean(fieldErrors.pseBank)}
                          >
                            <option value="">Banco*</option>
                            {PSE_BANKS.map((bank) => (
                              <option key={bank.code} value={bank.code}>
                                {bank.name}
                              </option>
                            ))}
                          </select>
                          {fieldErrors.pseBank && (
                            <span className="nike-pay__error">{fieldErrors.pseBank}</span>
                          )}
                        </div>
                        <div className="nike-pay__field-row">
                          <div className="nike-pay__field">
                            <select
                              name="psePersonType"
                              value={fields.psePersonType}
                              onChange={onFieldChange}
                            >
                              <option value="0">Persona natural</option>
                              <option value="1">Persona jurídica</option>
                            </select>
                          </div>
                          <div className="nike-pay__field">
                            <input
                              name="pseDocument"
                              placeholder="Documento*"
                              value={fields.pseDocument}
                              onChange={onFieldChange}
                              aria-invalid={Boolean(fieldErrors.pseDocument)}
                            />
                            {fieldErrors.pseDocument && (
                              <span className="nike-pay__error">
                                {fieldErrors.pseDocument}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {open && item.id === 'NEQUI' && (
                      <div className="nike-pay__panel">
                        <p className="nike-pay__panel-label">
                          Te enviaremos una notificación a Nequi
                        </p>
                        <div className="nike-pay__field">
                          <input
                            name="nequiPhone"
                            type="tel"
                            inputMode="numeric"
                            placeholder="Celular Nequi*"
                            value={fields.nequiPhone}
                            onChange={onFieldChange}
                            aria-invalid={Boolean(fieldErrors.nequiPhone)}
                          />
                          {fieldErrors.nequiPhone && (
                            <span className="nike-pay__error">
                              {fieldErrors.nequiPhone}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {error && (
              <p className="nike-pay__banner" role="alert">
                {error}
              </p>
            )}

            <button className="nike-pay__cta" type="submit" disabled={busy}>
              {busy ? 'Procesando…' : 'Pagar'}
            </button>

            <p className="nike-pay__secure">
              Pago seguro. CLIO no almacena los datos de tu tarjeta.
            </p>

            <Link className="nike-pay__back" to="/pagar">
              Volver a datos de envío
            </Link>
          </form>
        </div>
      </main>
    </>
  )
}

export default PaymentSimulate
