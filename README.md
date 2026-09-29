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

1. El cliente escribe por WhatsApp desde la página de venta y elige un plan.
2. En `/noir/codigos` generas un código (plan y días) y lo envías con el botón de WhatsApp. El mensaje ya incluye el enlace de activación.
3. El cliente abre el enlace, pone el nombre de su barbería, su usuario y contraseña. Su web queda en línea al instante con servicios de ejemplo y él como primer barbero.
4. Desde su panel edita todo: nombre, frase, descripción, WhatsApp, Instagram, dirección, horario, logo, portada, servicios y precios, barberos con foto, galería y reseñas. También crea los usuarios de su equipo.
5. Para renovar o cambiar de plan le envías otro código y lo pone en **Suscripción**. También puedes extender días, cambiar el plan o suspender desde `/noir`.

Si la suscripción vence o la suspendes, su web muestra "no disponible" y el panel solo deja entrar a Suscripción. No se borra ningún dato.

## Planes

Se configuran en `src/config/planes.ts` (precio, días y límites):

| Plan | Precio | Incluye |
|---|---|---|
| Prueba gratis | 0, 7 días | Todo lo del Premium |
| Básico | 10 USD/mes | Web + reservas + panel, hasta 3 barberos, recordatorios manuales |
| Premium | 35 USD/mes | Barberos ilimitados, recordatorios automáticos por WhatsApp, galería y reseñas |

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
| `DATABASE_URL` | Postgres (Neon). Lo crea la integración de Neon en Vercel |
| `BLOB_READ_WRITE_TOKEN` | Fotos que suben las barberías. Lo crea el almacenamiento Blob de Vercel |
| `ADMIN_PASSWORD` | Código maestro para crear cuentas de Noir en `/noir/registro` |
| `SESSION_SECRET` | Firma de las sesiones |
| `CRON_SECRET` | Protege el cron de recordatorios |
| `NEXT_PUBLIC_NOIR_WHATSAPP` | WhatsApp de ventas de Noir Studio (con indicativo, sin +) |

Cada publicación aplica las migraciones de la base de datos antes de compilar (`npm run vercel-build`).

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
