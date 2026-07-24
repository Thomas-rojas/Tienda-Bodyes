# CLIO · Tienda Bodyes

Frontend: `FRONDEND_BODYES` (Vite + React)  
Backend: `BACKEND_BODYES` (Express + Supabase + Wompi)

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
2. Configura Wompi / Resend / WhatsApp según [`BACKEND_BODYES/docs/PAGOS.md`](BACKEND_BODYES/docs/PAGOS.md).

Sin claves Wompi en development, el checkout usa **modo simulación** (`/pago/simular`).

## Seguridad de pagos

Las llaves privadas de Wompi y Supabase van **solo** en `BACKEND_BODYES/.env`. Nunca en el frontend ni en Git.
