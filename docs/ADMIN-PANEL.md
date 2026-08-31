# Guía del panel de administración CLIO

Esta guía está pensada para administrar la tienda **sin tocar código**.

## Cómo entrar

1. Ve a `/login`
2. Inicia sesión con tu cuenta de administrador
3. Serás redirigido al **Dashboard** (`/admin/dashboard`)

## Secciones del panel

### Dashboard
- Ventas del período, pedidos pagados, ticket promedio, nuevos clientes
- Gráfico de ventas por día
- Productos más vendidos y pedidos recientes
- Cambia el período (7 / 30 / 90 días) arriba

### Productos
- Crear, editar, ocultar o eliminar bodys
- Subir imagen por producto
- Editar precio, stock, descripción, color, material
- Asignar **colección** a cada producto
- Productos con stock bajo aparecen en el dashboard

### Colecciones
- Crear y editar colecciones (Esenciales, Encaje, Rib, etc.)
- Subir la imagen que aparece en el home
- Activar/desactivar y marcar **“Mostrar en home”**
- El slug define la URL: `/coleccion/nombre-del-slug`

### Pedidos
- Ver todos los pedidos y filtrar por estado de pago
- Cambiar estado logístico: Pendiente → En proceso → Enviado → Entregado
- Agregar **número de guía** de envío
- **Exportar CSV** para contabilidad (botón arriba)

### Clientes
- Lista de clientes registrados
- Total gastado y cantidad de pedidos por persona
- Buscar por nombre, email o identificación

### Contenido del sitio
Edita textos e imágenes del sitio público:
- **Hero:** título, subtítulo, botón, video e imagen poster
- **Barra superior:** texto promocional y enlace
- **Footer:** redes sociales y copyright

Los cambios se ven en la tienda al recargar la página.

### Cupones
- Crear códigos de descuento (% o monto fijo)
- Activar/desactivar cupones
- Ver cuántas veces se usó cada uno

### Configuración
- Nombre de la marca, WhatsApp y email de soporte

### Usuarios
- Ver cuentas registradas
- Cambiar rol entre **Cliente** y **Admin**

## Base de datos (una sola vez)

Para persistir cambios en producción, ejecuta en Supabase SQL Editor (en orden):

1. `BACKEND_BODYES/supabase/schema.sql`
2. `BACKEND_BODYES/supabase/migration_users.sql`
3. `BACKEND_BODYES/supabase/migration_cms.sql`

## Consejos

- Siempre verás **“Cambios guardados correctamente”** en verde cuando algo se guardó bien
- Antes de eliminar productos o colecciones, el sistema pedirá confirmación
- Si Supabase no está conectado, los cambios viven en memoria del servidor y se pierden al reiniciarlo

## Soporte técnico

Solo necesitas un programador si quieres:
- Nuevas funciones que no existen en el panel
- Integraciones avanzadas (email automático al enviar pedido, etc.)
- Cambios de diseño estructural del sitio

Para el día a día del negocio, este panel es suficiente.
