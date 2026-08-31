# Desplegar CLIO en Netlify

Netlify hospeda **solo el frontend** (`FRONDEND_BODYES`).  
El **backend** (Express, Mercado Pago, WhatsApp, emails) debe estar en otro servicio con URL HTTPS (Render, Railway, Fly.io, etc.).

## 1. Subir el frontend a Netlify

### Opción A — Git (recomendada)

1. Sube el repo a GitHub (si aún no está).
2. En [Netlify](https://app.netlify.com) → **Add new site** → **Import an existing project**.
3. Elige el repositorio. Netlify detectará `netlify.toml` en la raíz:
   - **Base directory:** `FRONDEND_BODYES` (ya viene en `netlify.toml`)
   - **Build command:** `npm ci && npm run build`
   - **Publish directory:** `dist`
4. En **Site configuration → Environment variables**, agrega:

| Variable | Valor |
|----------|--------|
| `VITE_API_URL` | URL HTTPS de tu backend, ej. `https://clio-api.onrender.com` |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon / publishable key de Supabase |

5. **Deploy site**.

### Opción B — Arrastrar carpeta (prueba rápida)

```bash
cd FRONDEND_BODYES
npm ci
npm run build
```

Arrastra la carpeta `FRONDEND_BODYES/dist` a [Netlify Drop](https://app.netlify.com/drop).  
Las variables `VITE_*` deben estar definidas **antes** del build (en local exporta en `.env` y vuelve a `npm run build`).

## 2. Backend en producción (obligatorio)

Sin backend desplegado, la tienda carga pero **no hay productos, pagos ni admin**.

En el servicio del backend configura (ejemplo Render):

```env
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://tu-sitio.netlify.app
BACKEND_URL=https://clio-api.onrender.com

SUPABASE_URL=...
SUPABASE_SECRET_KEY=...
SUPABASE_ANON_KEY=...

MERCADOPAGO_ENV=production
MERCADOPAGO_ACCESS_TOKEN=...
MERCADOPAGO_PUBLIC_KEY=...

STORE_EMAIL=...
SMTP_* o RESEND_API_KEY=...
STORE_WHATSAPP=57...

JWT_SECRET=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
```

Importante:

- `FRONTEND_URL` = URL exacta de Netlify (CORS).
- `BACKEND_URL` = HTTPS (webhook Mercado Pago).
- WhatsApp Web (`npm run whatsapp:link`) solo funciona en un servidor persistente, no en Netlify.

## 3. Mercado Pago en producción

1. Credenciales de **producción** en el backend.
2. `MERCADOPAGO_ENV=production`
3. Webhook en el panel MP:

```text
https://clio-api.onrender.com/api/payments/mercadopago/webhook
```

## 4. Comprobar

1. Abre `https://tu-sitio.netlify.app`
2. Catálogo carga productos → `VITE_API_URL` correcto.
3. Checkout con tarjeta de prueba (TEST) o real (PROD).
4. Admin: `https://tu-sitio.netlify.app/admin`

Health del backend: `https://tu-api.com/api/health`

## 5. Dominio propio (opcional)

Netlify → **Domain management** → añade tu dominio y actualiza `FRONTEND_URL` en el backend.
