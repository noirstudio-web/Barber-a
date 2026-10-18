# Noir Studio: web con reservas para barberías

Plataforma de alquiler: cada barbería tiene su propia web con reservas online y su panel de administración. Noir Studio vende los planes por WhatsApp, entrega un código de activación y administra todas las suscripciones desde su propio panel.

## Rutas

| Ruta | Para quién | Qué es |
|---|---|---|
| `/` | Dueños de barberías | Página de venta de Noir Studio: planes y botones de compra por WhatsApp |
| `/<barberia>` | Clientes de la barbería | Web de cada barbería (ej. `/filo`, la demo) |
| `/<barberia>/reservar` | Clientes | Reserva: servicio, barbero, fecha y hora, datos |
| `/admin/registro` | Dueño nuevo | Activación con el código: crea la barbería y su usuario |
| `/admin` | Dueño y equipo | Panel de la barbería |
| `/noir` | Noir Studio | Panel de la plataforma: barberías, códigos y suscripciones |
| `/noir/registro` | Noir Studio | Crear una cuenta de Noir con el código maestro |

## Cómo se vende y se activa

**Con Mercado Pago (automático)**
1. En la página de venta el cliente elige un plan, deja su nombre, correo y WhatsApp, y paga en Mercado Pago (PSE, Nequi, tarjeta, Efecty).
2. Al aprobarse el pago se genera su licencia (código de activación) y la ve en pantalla con el botón "Activar mi barbería ahora".
3. Cada mes el dueño renueva desde **Suscripción** en su panel: paga con link o activa el **débito automático** con tarjeta, y el plan se renueva solo al aprobarse cada cobro.

**A mano (WhatsApp, Nequi, transferencia...)**
1. En `/noir/codigos` generas una licencia (plan y días), registras el pago y la envías con el botón de WhatsApp. El mensaje ya incluye el enlace de activación.
2. Para renovar le envías otra licencia o registras el pago en `/noir/pagos` con "Renovar la suscripción".

En ambos casos el cliente activa su barbería con el nombre, su usuario y contraseña; su web queda en línea al instante con servicios de ejemplo y él como primer barbero. Desde su panel edita todo: nombre, frase, descripción, WhatsApp, Instagram, dirección, horario, logo, portada, servicios y precios, barberos con foto, galería y reseñas, y los usuarios de su equipo. Desde `/noir` puedes extender días, cambiar el plan, suspender, cancelar o entrar a su panel.

Si la suscripción vence o la suspendes, su web muestra "no disponible" y el panel solo deja entrar a Suscripción. No se borra ningún dato.

## Planes

Se configuran en `src/config/planes.ts` (precio, días y límites):

| Plan | Precio | Incluye |
|---|---|---|
| Prueba gratis | 0, 7 días | Todo lo del Premium |
| Básico | 40.000 COP/mes | Web + reservas + panel, hasta 3 barberos, recordatorios manuales |
| Premium | 140.000 COP/mes | Barberos ilimitados, recordatorios automáticos por WhatsApp, estadísticas del negocio, clientes por recuperar con mensaje de WhatsApp, promoción destacada en la web, exportar clientes a Excel, galería y reseñas, y web sin la marca de Noir Studio |

## Correrlo en local

```bash
npm install
npm run dev
```

Sin configurar nada se usa una base de datos Postgres embebida (PGlite) en `.data/` y las fotos se guardan en `public/uploads/`.

- Demo: http://localhost:3000/filo
- Panel de la demo: usuario `demo`, contraseña `demo1234` (solo existe en local)
- Panel de Noir: crea tu cuenta en http://localhost:3000/noir/registro con el código maestro `demo`

Para empezar de cero, detén el servidor y borra `.data/` y `public/uploads/`.

## Publicarlo (Vercel)

Variables de entorno (ver `.env.example`):

| Variable | Para qué |
|---|---|
| `SUPABASE_POSTGRES_URL` y `SUPABASE_POSTGRES_URL_NON_POOLING` | Base de datos en Supabase. Las crea la integración de Supabase en Vercel (prefijo `SUPABASE_`). Si no existen se usa `DATABASE_URL` |
| `MP_ACCESS_TOKEN` | Access Token de tu aplicación de Mercado Pago (`TEST-...` en pruebas, `APP_USR-...` en real) |
| `MP_WEBHOOK_SECRET` | Clave secreta de los Webhooks de Mercado Pago |
| `BLOB_READ_WRITE_TOKEN` | Fotos que suben las barberías. Lo crea el almacenamiento Blob de Vercel |
| `ADMIN_PASSWORD` | Código maestro para crear cuentas de Noir en `/noir/registro` |
| `SESSION_SECRET` | Firma de las sesiones |
| `CRON_SECRET` | Protege el cron de recordatorios |
| `NEXT_PUBLIC_NOIR_WHATSAPP` | WhatsApp de ventas de Noir Studio (con indicativo, sin +) |

Cada publicación aplica las migraciones de la base de datos antes de compilar (`npm run vercel-build`). Las tablas tienen RLS activado para que la API pública de Supabase no exponga datos; la web se conecta directo a Postgres.

### Mercado Pago

1. En [Mercado Pago Developers](https://www.mercadopago.com.co/developers/panel/app) crea una aplicación (Pagos online, Checkout Pro y Suscripciones).
2. Copia el **Access Token** a `MP_ACCESS_TOKEN`.
3. En **Webhooks** configura la URL `https://<tu-dominio>/api/mercadopago/webhook` con los eventos **Pagos**, **Planes y suscripciones** (suscripción y pagos autorizados). Copia la clave secreta a `MP_WEBHOOK_SECRET`.

Sin `MP_ACCESS_TOKEN` todo funciona igual, pero los botones de compra vuelven a ser por WhatsApp.

### Pasar los datos de Neon a Supabase

```bash
ORIGEN_URL=<url de Neon> DESTINO_URL=<SUPABASE_POSTGRES_URL_NON_POOLING> npx tsx scripts/copiar-a-supabase.ts
```

Crea las tablas en Supabase, copia todas las filas conservando los ids y verifica que las cantidades coincidan. No borra nada de Neon.

## Avisos y recordatorios por WhatsApp

**Sin configurar nada**
- En la confirmación, el cliente toca "Enviar a la barbería" y se abre WhatsApp con los datos de la cita.
- En la agenda del panel, cada cita tiene botones para recordarle al cliente o al barbero, con el mensaje ya escrito.

**Automático** (API de WhatsApp Cloud de Meta, variables `WHATSAPP_TOKEN` y `WHATSAPP_PHONE_ID`). Un solo número de Noir Studio envía los mensajes de todas las barberías:
- Al reservar: aviso al WhatsApp de la barbería y al celular del barbero asignado.
- 2 horas antes de cada cita (solo planes con recordatorios automáticos): recordatorio al cliente y al barbero. Lo envía un cron de Vercel cada 10 minutos (`vercel.json`).

Meta solo entrega mensajes que inicia el negocio si usan **plantillas aprobadas**. Crea estas tres en el WhatsApp Manager (categoría "Utilidad") y pon sus nombres en las variables:

| Variable | Variables de la plantilla, en orden | Ejemplo de texto |
|---|---|---|
| `WHATSAPP_PLANTILLA` | cliente, teléfono, servicio, barbero, fecha y hora, código | Nueva cita: {{1}} ({{2}}), {{3}} con {{4}}, {{5}}. Código {{6}}. |
| `WHATSAPP_PLANTILLA_RECORDATORIO_CLIENTE` | nombre, servicio, barbero, hora, barbería y dirección | Hola {{1}}, te recordamos tu cita de {{2}} con {{3}} hoy a las {{4}} en {{5}}. |
| `WHATSAPP_PLANTILLA_RECORDATORIO_BARBERO` | barbero, cliente, servicio, hora, teléfono | Hola {{1}}, hoy a las {{4}} tienes {{3}} con {{2}} ({{5}}). |

## Tecnología

Next.js 16 (App Router), Tailwind CSS 4, Motion, Drizzle ORM, Postgres (Neon en producción, PGlite en local) y Vercel Blob para las fotos.
