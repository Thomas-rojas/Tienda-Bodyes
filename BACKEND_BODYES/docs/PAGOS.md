# Pagos CLIO · Wompi (Colombia)

## Resumen

La tienda usa **Wompi Checkout Web**: el cliente elige tarjeta, PSE, Nequi u otros métodos **en el dominio de Wompi**. CLIO **nunca** recibe ni almacena números de tarjeta, CVV ni fechas.

Flujo:

1. Frontend valida el formulario y llama `POST /api/checkout/session`.
2. Backend crea un pedido `pending` en Supabase (o memoria si aún no hay tablas) y firma `signature:integrity`.
3. El usuario es redirigido a Wompi (o a `/pago/simular` en modo prueba).
4. Wompi notifica `POST /api/payments/wompi/webhook` y/o el usuario vuelve a `/pago/resultado`.
5. Si el pago es `APPROVED`: se marca el pedido, se descuenta inventario, se envía correo (Resend) y WhatsApp (Cloud API).

## Dónde van las claves

| Clave | Archivo | ¿Pública? |
|-------|---------|-----------|
| `WOMPI_PUBLIC_KEY` (`pub_test_` / `pub_prod_`) | `BACKEND_BODYES/.env` (+ opcional `VITE_WOMPI_PUBLIC_KEY`) | Sí (cliente) |
| `WOMPI_PRIVATE_KEY` (`prv_test_` / `prv_prod_`) | **Solo** backend `.env` | No |
| `WOMPI_INTEGRITY_SECRET` | **Solo** backend `.env` | No |
| `WOMPI_EVENTS_SECRET` | **Solo** backend `.env` | No |
| `SUPABASE_SECRET_KEY` | **Solo** backend `.env` | No |
| `RESEND_API_KEY` | **Solo** backend `.env` | No |
| `WHATSAPP_TOKEN` | **Solo** backend `.env` | No |

Nunca subas `.env` a Git. Usa `.env.example` como plantilla.

## Configurar ambiente de pruebas (sandbox)

1. Crea / entra a tu comercio en [comercios.wompi.co](https://comercios.wompi.co).
2. Activa el **ambiente de pruebas** y copia:
   - Llave pública
   - Llave privada
   - Secreto de integridad
   - Secreto de eventos
3. Pégalas en `BACKEND_BODYES/.env`:

```env
WOMPI_ENV=sandbox
WOMPI_PUBLIC_KEY=pub_test_...
WOMPI_PRIVATE_KEY=prv_test_...
WOMPI_INTEGRITY_SECRET=...
WOMPI_EVENTS_SECRET=...
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:4000
```

4. En el dashboard Wompi, configura la URL de eventos:

```text
https://<tu-tunnel>/api/payments/wompi/webhook
```

En local usa [ngrok](https://ngrok.com) o Cloudflare Tunnel apuntando al puerto `4000`.

5. Aplica el schema SQL de [`supabase/schema.sql`](../supabase/schema.sql) en el **SQL Editor** de Supabase (crea `products`, `orders`, `order_items` y la función `fulfill_paid_order`).

6. Reinicia el backend (`npm run dev` en `BACKEND_BODYES`) y el frontend.

7. Prueba un pago con las [tarjetas / métodos de prueba de Wompi](https://docs.wompi.co/docs/colombia/datos-de-prueba-en-sandbox/).

### Sin claves Wompi (desarrollo rápido)

Si `WOMPI_PUBLIC_KEY` está vacío en `development`, el backend activa **simulación**:
tras el checkout redirige a `/pago/simular` donde puedes forzar éxito, rechazo o error.
Las notificaciones se registran en la consola del servidor si faltan Resend/WhatsApp.

## Pasar a producción

1. Completa KYC / activación del comercio en Wompi.
2. Cambia a llaves `pub_prod_` / `prv_prod_` y secretos de producción.
3. `WOMPI_ENV=production`
4. `FRONTEND_URL` y `BACKEND_URL` con HTTPS reales.
5. Webhook HTTPS público (sin tunnel).
6. Dominio verificado en Resend; template de WhatsApp aprobado en Meta si aplica.
7. `SIMULATE_PAYMENTS` no debe estar en `true`.
8. Rota cualquier secreto que se haya expuesto en chats o commits.

## Endpoints útiles

- `GET /api/health` — estado Supabase + modo de pagos
- `GET /api/products` — catálogo con stock
- `POST /api/checkout/session` — inicia pago
- `POST /api/payments/wompi/webhook` — eventos Wompi
- `GET /api/payments/sync?reference=...` — estado para la UI
- `GET /api/orders/by-reference/:reference` — comprobante
- `POST /api/payments/simulate` — solo desarrollo / simulación

## Seguridad

- No pidas datos de tarjeta en formularios propios.
- Valida el checksum del webhook antes de mutar pedidos.
- CORS limitado a `FRONTEND_URL`.
- Inventario se actualiza de forma idempotente (`fulfilled` + RPC).
