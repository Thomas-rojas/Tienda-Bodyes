# Pagos CLIO · Mercado Pago (Colombia)

## Resumen

La tienda usa **Mercado Pago Checkout Pro**: el cliente paga con tarjeta, PSE, Nequi u otros métodos **en el dominio de Mercado Pago**. CLIO **nunca** recibe ni almacena números de tarjeta, CVV ni fechas.

Flujo:

1. El cliente completa envío en `/pagar`.
2. El backend crea el pedido y una **preferencia** MP (`POST /checkout/preferences`).
3. El usuario es redirigido a Mercado Pago (o a `/pago/simular` en modo prueba).
4. MP notifica `POST /api/payments/mercadopago/webhook` (en producción con HTTPS) y/o el usuario vuelve a `/pago/resultado`.
5. El backend marca el pedido como `paid` y envía correo / WhatsApp.

## Claves

| Variable | Dónde | Secreta |
|----------|--------|---------|
| `MERCADOPAGO_ACCESS_TOKEN` (`TEST-...` / `APP_USR-...`) | **Solo** `BACKEND_BODYES/.env` | Sí |
| `MERCADOPAGO_PUBLIC_KEY` (`TEST-...` / `APP_USR-...`) | Backend (opcional en front) | No |
| `MERCADOPAGO_ENV` (`test` / `production`) | Backend | — |

Dashboard: [https://www.mercadopago.com.co/developers/panel](https://www.mercadopago.com.co/developers/panel)

## Configuración local

1. Crea una aplicación en el panel de desarrolladores de Mercado Pago.
2. Copia **Access Token** y **Public Key** de prueba.
3. En `BACKEND_BODYES/.env`:

```env
MERCADOPAGO_ENV=test
MERCADOPAGO_ACCESS_TOKEN=TEST-...
MERCADOPAGO_PUBLIC_KEY=TEST-...
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:4000
```

4. Reinicia el backend. `GET /api/health` debe mostrar `payments.mode: "mercadopago"`.
5. En checkout serás redirigido a `sandbox_init_point` (ambiente de prueba).

### Sin claves (desarrollo rápido)

Si `MERCADOPAGO_ACCESS_TOKEN` está vacío en `development`, el backend activa **simulación**:

- Redirect a `/pago/simular`
- `POST /api/payments/simulate` marca el pedido como pagado

### Producción

1. Completa la activación de la cuenta en Mercado Pago (persona natural con cédula está bien).
2. Usa Access Token / Public Key de **producción**.
3. `MERCADOPAGO_ENV=production`
4. `BACKEND_URL` debe ser **HTTPS** (el webhook `notification_url` exige HTTPS).
5. Configura en el panel (opcional) la URL de notificaciones:

```text
https://tu-dominio.com/api/payments/mercadopago/webhook
```

## Endpoints

- `POST /api/checkout/session` — crea pedido + preferencia MP
- `POST|GET /api/payments/mercadopago/webhook` — notificaciones MP
- `GET /api/payments/sync` — sincroniza por `payment_id` / `reference` / `external_reference`
- `POST /api/payments/simulate` — solo desarrollo / simulación

## Precios

En BD los precios siguen en `price_cents` (= pesos × 100). Al crear la preferencia, MP recibe `unit_price` en **pesos** (`price_cents / 100`).
