# Pagos CLIO · Mercado Pago Checkout API (Colombia)

## Resumen

La tienda usa **Mercado Pago Checkout API** con **Card Payment Brick**:

1. El cliente completa envío en `/pagar`.
2. El backend crea el pedido `pending` en Supabase y devuelve `publicKey` + monto + `reference`.
3. El frontend muestra el Brick (tokeniza la tarjeta en el browser).
4. El frontend envía el `token` a `POST /api/payments/mercadopago/process`.
5. El backend crea el pago con Access Token (`POST /v1/payments`) y actualiza el pedido.
6. Webhook (HTTPS) y/o sync por `reference` confirman el estado.

**No** se usa Checkout Pro, `init_point` ni preferencias de redirección.

## Variables

| Variable | Dónde | Secreta |
|----------|--------|---------|
| `MERCADOPAGO_ACCESS_TOKEN` | Solo backend `.env` | Sí |
| `MERCADOPAGO_PUBLIC_KEY` | Backend (se expone al front vía API de sesión) | No |
| `MERCADOPAGO_ENV` (`test` / `production`) | Backend | — |
| `VITE_API_URL` | Frontend | No |

Opcional en frontend: `VITE_MERCADOPAGO_PUBLIC_KEY` (no requerida; la sesión ya envía la Public Key).

## Local TEST

```env
MERCADOPAGO_ENV=test
MERCADOPAGO_ACCESS_TOKEN=TEST-...   # Access Token de prueba (NO la Public Key)
MERCADOPAGO_PUBLIC_KEY=TEST-538403dc-933b-4bbe-b2d3-40a5187e41bc
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:4000
```

Tarjetas de prueba CO: titular `APRO` aprueba, `OTHE` rechaza.

## Endpoints

- `POST /api/checkout/session` — crea pedido pending + datos Brick
- `POST /api/payments/mercadopago/process` — crea pago Checkout API
- `POST|GET /api/payments/mercadopago/webhook` — notificaciones MP (HTTPS)
- `GET /api/payments/sync` — sincroniza por `payment_id` / `reference`

## Idempotencia

- Un checkout crea **un** pedido `pending`.
- Si el pedido ya está `paid`, `process` no crea otro cobro.
- Webhook + process usan `processPaymentUpdate` (no reenvía notificaciones dos veces).
