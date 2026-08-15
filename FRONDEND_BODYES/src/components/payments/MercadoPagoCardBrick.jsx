import { useEffect, useMemo, useRef, useState } from 'react'
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react'
import { processMercadoPagoCardPayment } from '../../services/api'
import './MercadoPagoCardBrick.css'

/**
 * Card Payment Brick (Checkout API).
 * Public Key solo en frontend; el Access Token nunca sale del backend.
 */
function MercadoPagoCardBrick({
  publicKey,
  amount,
  payerEmail,
  payerIdentification,
  reference,
  onSuccess,
  onError,
}) {
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState('')
  const submittingRef = useRef(false)

  useEffect(() => {
    if (!publicKey) return
    initMercadoPago(publicKey, { locale: 'es-CO' })
    setReady(true)
  }, [publicKey])

  const initialization = useMemo(
    () => ({
      amount: Number(amount),
      payer: {
        email: payerEmail || undefined,
        identification: payerIdentification?.number
          ? {
              type: payerIdentification.type || 'CC',
              number: String(payerIdentification.number),
            }
          : undefined,
      },
    }),
    [amount, payerEmail, payerIdentification],
  )

  const customization = useMemo(
    () => ({
      visual: {
        style: {
          theme: 'default',
        },
      },
      paymentMethods: {
        maxInstallments: 12,
      },
    }),
    [],
  )

  if (!publicKey || !amount) {
    return (
      <p className="mp-brick__error" role="alert">
        Falta configuración de Mercado Pago para el pago.
      </p>
    )
  }

  if (!ready) {
    return <p className="mp-brick__loading">Cargando formulario de pago…</p>
  }

  return (
    <div className={`mp-brick ${busy ? 'mp-brick--busy' : ''}`}>
      {busy && (
        <p className="mp-brick__loading" role="status">
          Procesando tu pago… no cierres esta ventana.
        </p>
      )}
      {localError && (
        <p className="mp-brick__error" role="alert">
          {localError}
        </p>
      )}
      <CardPayment
        initialization={initialization}
        customization={customization}
        onSubmit={async (formData) => {
          if (submittingRef.current) return
          submittingRef.current = true
          setBusy(true)
          setLocalError('')
          try {
            const result = await processMercadoPagoCardPayment({
              reference,
              token: formData.token,
              paymentMethodId: formData.payment_method_id,
              installments: formData.installments,
              issuerId: formData.issuer_id,
              payer: formData.payer,
            })
            onSuccess?.(result)
          } catch (err) {
            const message =
              err.message || 'No pudimos procesar el pago. Intenta de nuevo.'
            setLocalError(message)
            onError?.(err)
            submittingRef.current = false
            setBusy(false)
            // No re-lanzar: el Brick deja de quedar en loading infinito.
          }
        }}
        onError={(error) => {
          const message =
            error?.message || 'Error en el formulario de Mercado Pago.'
          setLocalError(message)
          onError?.(error)
          submittingRef.current = false
          setBusy(false)
        }}
        onReady={() => {
          if (!submittingRef.current) setLocalError('')
        }}
      />
    </div>
  )
}

export default MercadoPagoCardBrick
