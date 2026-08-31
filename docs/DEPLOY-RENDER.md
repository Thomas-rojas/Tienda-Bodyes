# Desplegar backend CLIO en Render

El frontend ya está en **https://tiendaclio.netlify.app**.  
El backend debe vivir en Render (gratis) para login, productos, pagos y admin.

## Opción rápida (5 minutos)

1. Abre este enlace (logueado en Render con GitHub):
   **https://dashboard.render.com/blueprint/new?repo=https://github.com/Thomas-rojas/Tienda-Bodyes**

2. Render leerá `render.yaml` y creará el servicio **`clio-bodyes-api`**.

3. Cuando pida variables **sync: false**, copia los valores de `BACKEND_BODYES/.env`:

| Variable en Render | De dónde sacarla |
|--------------------|------------------|
| `BACKEND_URL` | `https://clio-bodyes-api.onrender.com` (ajusta si Render te da otra URL) |
| `SUPABASE_URL` | `.env` → SUPABASE_URL |
| `SUPABASE_SECRET_KEY` | `.env` → SUPABASE_SECRET_KEY |
| `SUPABASE_ANON_KEY` | `.env` → SUPABASE_ANON_KEY |
| `MERCADOPAGO_ACCESS_TOKEN` | `.env` |
| `MERCADOPAGO_PUBLIC_KEY` | `.env` |
| `ADMIN_EMAIL` | `admin@clio.com` |
| `ADMIN_PASSWORD` | `clioadmin123` |
| `STORE_EMAIL` | `.env` |
| `STORE_WHATSAPP` | `.env` |
| `SMTP_USER` / `SMTP_PASS` | `.env` (Gmail app password) |

4. **`FRONTEND_URL`** ya viene en el blueprint: `https://tiendaclio.netlify.app`

5. Pulsa **Apply** y espera el deploy (~3 min).

6. Cuando Render muestre la URL final (ej. `https://clio-bodyes-api.onrender.com`), verifica:
   ```
   https://clio-bodyes-api.onrender.com/api/health
   ```
   Debe responder `"service":"clio-backend"`.

7. En Netlify ya está configurado `VITE_API_URL=https://clio-bodyes-api.onrender.com`.  
   Si tu URL de Render es distinta, cámbiala en **Netlify → Environment variables** y vuelve a desplegar.

## Login admin en producción

- **Identificación:** `1000000001`
- **Contraseña:** `1000000001`

## Script local (frontend)

Desde la raíz del repo:

```powershell
.\scripts\deploy-production.ps1
```

Esto actualiza variables en Netlify y publica el frontend.
