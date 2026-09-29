# Barbería con reservas online (Noir Studio)

Web para barberías y salones de belleza donde los clientes reservan solos: eligen servicio, barbero y hora libre, y la cita queda en la agenda del dueño.

La demo es **Filo Barber Club**, una barbería ficticia en Bogotá.

## Qué incluye

**Web pública**
- Portada con foto, eslogan y botón "Reservar cita"
- Servicios y precios (cada servicio lleva directo a reservarlo)
- Equipo de barberos con foto, especialidad y estilo
- Galería estilo Instagram
- Reseñas de clientes
- Ubicación con mapa de Google, horario y botón "Cómo llegar"
- Botón flotante de WhatsApp

**Reservas** (`/reservar`)
1. El cliente elige el servicio.
2. Elige el barbero, o "el que esté disponible" (se asigna al que tenga menos citas ese día).
3. Ve un calendario que solo muestra días y horas libres (según horario, citas y bloqueos).
4. Pone nombre y celular, y recibe la confirmación con un código.
5. Desde la confirmación puede enviar la cita al WhatsApp de la barbería, agregarla a su calendario o cancelarla.

Dos personas no pueden reservar la misma hora: la reserva se hace dentro de una transacción con un candado por día.

**Panel del dueño** (`/admin`)
- Usuarios con contraseña: cada persona crea el suyo en `/admin/registro` con el código del negocio (`ADMIN_PASSWORD`). El primero queda como dueño y puede eliminar usuarios o nombrar a otro dueño. Cada uno cambia su contraseña en "Mi cuenta".
- Agenda del día (columnas por barbero) y de la semana
- Marcar citas como atendida, no asistió o cancelada, y escribirle al cliente por WhatsApp
- Bloquear horarios: almuerzos, días libres, vacaciones (por barbero o para toda la barbería)
- Crear, editar y ocultar servicios y precios
- Barberos: nombre, especialidad y celular de WhatsApp (para sus avisos)
- En cada cita, botones para recordarle por WhatsApp al cliente o al barbero, con el mensaje ya escrito
- Clientes con historial: visitas, total gastado, faltas y barbero habitual

## Correrlo en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Sin configurar nada, se usa una base de datos Postgres embebida (PGlite) en `.data/`, con barberos, servicios y citas de ejemplo. Para entrar al panel, crea tu usuario en http://localhost:3000/admin/registro con el código `demo`.

Para empezar de cero con los datos de ejemplo, detén el servidor y borra la carpeta `.data/`.

## Adaptarlo a otra barbería

| Qué | Dónde |
|---|---|
| Nombre, WhatsApp, dirección, zona horaria, moneda | `src/config/negocio.ts` |
| Horario de atención e intervalo de reservas | `src/config/negocio.ts` |
| Galería, reseñas y textos de beneficios | `src/config/contenido.ts` |
| Fotos | `public/img/` |
| Barberos y servicios iniciales | `src/db/seed.ts` (luego los servicios se editan desde el panel) |
| Colores y tipografía | `src/app/globals.css` y `src/app/layout.tsx` |

## Publicarlo (Vercel + Neon)

1. Crea una base de datos en [Neon](https://neon.tech) y copia la cadena de conexión.
2. En local, crea `.env` con `DATABASE_URL=...` y ejecuta:
   ```bash
   npm run db:migrate              # tablas + datos de ejemplo (demo)
   npm run db:migrate -- --sin-demo  # tablas + barberos y servicios, sin citas de ejemplo (cliente real)
   ```
3. Importa el repositorio en [Vercel](https://vercel.com) y define las variables `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET` y `CRON_SECRET`.

Ver `.env.example` para todas las variables.

## Avisos y recordatorios por WhatsApp

**Sin configurar nada**
- En la confirmación, el cliente toca "Enviar a la barbería" y se abre WhatsApp con los datos de la cita.
- En la agenda del panel, cada cita tiene botones para recordarle al cliente o al barbero, con el mensaje ya escrito.

**Automático** (API de WhatsApp Cloud de Meta, variables `WHATSAPP_TOKEN` y `WHATSAPP_PHONE_ID`)
- Al reservar: aviso al número del negocio y al celular del barbero asignado.
- 2 horas antes de cada cita: recordatorio al cliente y al barbero. Lo envía un cron de Vercel cada 10 minutos (`vercel.json`), protegido con `CRON_SECRET`. El tiempo se cambia en `reservas.recordatorioMin` de `src/config/negocio.ts`.

Meta solo entrega mensajes que inicia el negocio si usan **plantillas aprobadas**. Crea estas tres en el WhatsApp Manager (categoría "Utilidad") y pon sus nombres en las variables:

| Variable | Variables de la plantilla, en orden | Ejemplo de texto |
|---|---|---|
| `WHATSAPP_PLANTILLA` | cliente, teléfono, servicio, barbero, fecha y hora, código | Nueva cita: {{1}} ({{2}}), {{3}} con {{4}}, {{5}}. Código {{6}}. |
| `WHATSAPP_PLANTILLA_RECORDATORIO_CLIENTE` | nombre, servicio, barbero, hora, dirección | Hola {{1}}, te recordamos tu cita de {{2}} con {{3}} hoy a las {{4}} en {{5}}. |
| `WHATSAPP_PLANTILLA_RECORDATORIO_BARBERO` | barbero, cliente, servicio, hora, teléfono | Hola {{1}}, hoy a las {{4}} tienes {{3}} con {{2}} ({{5}}). |

Si falta una plantilla, se envía texto libre, que Meta solo entrega si esa persona escribió al negocio en las últimas 24 horas.

## Tecnología

Next.js 16 (App Router), Tailwind CSS 4, Motion, Drizzle ORM y Postgres (Neon en producción, PGlite en local).

## Mensaje de venta

> Hola 👋 Somos Noir Studio. Hicimos una web para barberías donde tus clientes reservan solos, eligen barbero y hora, y a ti te llega la cita directo al WhatsApp. Mira el demo: [link]. ¿Te lo muestro en 5 minutos?
