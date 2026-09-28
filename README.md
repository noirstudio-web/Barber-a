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
- Agenda del día (columnas por barbero) y de la semana
- Marcar citas como atendida, no asistió o cancelada, y escribirle al cliente por WhatsApp
- Bloquear horarios: almuerzos, días libres, vacaciones (por barbero o para toda la barbería)
- Crear, editar y ocultar servicios y precios
- Clientes con historial: visitas, total gastado, faltas y barbero habitual

## Correrlo en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Sin configurar nada, se usa una base de datos Postgres embebida (PGlite) en `.data/`, con barberos, servicios y citas de ejemplo. La clave del panel en local es `demo`.

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
3. Importa el repositorio en [Vercel](https://vercel.com) y define las variables `DATABASE_URL` y `ADMIN_PASSWORD`.

Ver `.env.example` para todas las variables.

## Avisos por WhatsApp

- **Sin configurar nada:** en la confirmación, el cliente toca "Enviar a la barbería" y se abre WhatsApp con los datos de la cita, dirigido al número del negocio.
- **Automático:** con `WHATSAPP_TOKEN` y `WHATSAPP_PHONE_ID` (API de WhatsApp Cloud de Meta), cada reserva envía el aviso al número del negocio. Para que Meta lo entregue siempre, crea una plantilla aprobada con 6 variables (cliente, teléfono, servicio, barbero, fecha y hora, código) y pon su nombre en `WHATSAPP_PLANTILLA`.

## Tecnología

Next.js 16 (App Router), Tailwind CSS 4, Motion, Drizzle ORM y Postgres (Neon en producción, PGlite en local).

## Mensaje de venta

> Hola 👋 Somos Noir Studio. Hicimos una web para barberías donde tus clientes reservan solos, eligen barbero y hora, y a ti te llega la cita directo al WhatsApp. Mira el demo: [link]. ¿Te lo muestro en 5 minutos?
