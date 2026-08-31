# CLIO · Tienda Bodyes

Frontend: `FRONDEND_BODYES` (Vite + React)  
Backend: `BACKEND_BODYES` (Express + Supabase + Mercado Pago)

## Producción

- **Frontend → Netlify:** [`docs/DEPLOY-NETLIFY.md`](docs/DEPLOY-NETLIFY.md)
- **Backend → Render/Railway:** `BACKEND_BODYES/render.yaml` (ejemplo Render)

## Arranque rápido

```bash
# Terminal 1
cd BACKEND_BODYES
cp .env.example .env   # completa claves
npm install
npm run dev

# Terminal 2
cd FRONDEND_BODYES
cp .env.example .env
npm install
npm run dev
```

1. Aplica el SQL de [`BACKEND_BODYES/supabase/schema.sql`](BACKEND_BODYES/supabase/schema.sql) en el SQL Editor de Supabase.
2. Configura Mercado Pago / correo / WhatsApp según [`BACKEND_BODYES/docs/PAGOS.md`](BACKEND_BODYES/docs/PAGOS.md).

Sin `MERCADOPAGO_ACCESS_TOKEN` en development, el checkout usa **modo simulación** (`/pago/simular`).

## Seguridad de pagos

El Access Token de Mercado Pago y las llaves de Supabase van **solo** en `BACKEND_BODYES/.env`. Nunca en el frontend ni en Git.
