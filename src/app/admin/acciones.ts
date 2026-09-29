"use server";

import { and, count, eq, isNull, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { horarioPorDefecto, region, type Horario } from "@/config/region";
import { getDb } from "@/db";
import { SERVICIOS_INICIALES } from "@/db/seed";
import { barberias, barberos, bloqueos, citas, codigos, ESTADOS_CITA, galeria, resenas, servicios, usuarios } from "@/db/schema";
import { limitesPlan, nuevoVencimiento, slugDesde, slugValido } from "@/lib/barberias";
import { archivoDeImagen, guardarImagen } from "@/lib/imagenes";
import { borrarSesion, exigirDueno, exigirPanel, exigirUsuario, guardarSesion, hashClave, verificarClave } from "@/lib/sesion";
import { esFechaValida, horaAMinutos } from "@/lib/tiempo";

// valores: lo que escribió la persona, para no borrarlo si hay un error
export type EstadoFormulario = { error?: string; ok?: string; valores?: Record<string, string> };

const texto = (form: FormData, campo: string) => String(form.get(campo) ?? "").trim();
const soloDigitos = (t: string) => t.replace(/\D/g, "");

// Revalida la web pública de la barbería y todo el panel
function refrescar(slug: string) {
  revalidatePath(`/${slug}`, "layout");
  revalidatePath("/admin", "layout");
}

// ---------------------------------------------------------------------------
// Acceso
// ---------------------------------------------------------------------------

// Hash fijo para comparar aunque el usuario no exista y no revelar cuáles existen por el tiempo de respuesta
let hashFicticio: Promise<string> | null = null;

export async function iniciarSesion(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const usuario = texto(form, "usuario").toLowerCase();
  const clave = String(form.get("clave") ?? "");
  const db = await getDb();
  const [u] = await db.select().from(usuarios).where(eq(usuarios.usuario, usuario));
  hashFicticio ??= hashClave("clave-inexistente");
  const valida = await verificarClave(clave, u?.claveHash ?? (await hashFicticio));
  if (!u || !valida) return { error: "Usuario o contraseña incorrectos.", valores: { usuario } };
  await guardarSesion(u.id);
  redirect(u.rol === "noir" ? "/noir" : "/admin");
}

export async function cerrarSesion() {
  await borrarSesion();
  redirect("/admin/login");
}

const esquemaCuenta = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre").max(60),
  usuario: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,30}$/, "El usuario debe tener de 3 a 30 letras, números, punto, guion o guion bajo, sin espacios"),
  clave: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100),
});

// Busca un código de activación sin usar (se escribe sin importar mayúsculas ni guiones)
async function codigoDisponible(valor: string) {
  const limpio = valor.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const db = await getDb();
  const [c] = await db
    .select()
    .from(codigos)
    .where(and(sql`regexp_replace(upper(${codigos.codigo}), '[^A-Z0-9]', '', 'g') = ${limpio}`, isNull(codigos.usadoEn)));
  return c ?? null;
}

// Activación de una barbería nueva con el código que entrega Noir Studio
export async function activarBarberia(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const valores = {
    codigo: texto(form, "codigo"),
    barberia: texto(form, "barberia"),
    slug: slugDesde(texto(form, "slug") || texto(form, "barberia")),
    whatsapp: texto(form, "whatsapp"),
    nombre: texto(form, "nombre"),
    usuario: texto(form, "usuario"),
  };
  const error = (mensaje: string) => ({ error: mensaje, valores });

  const codigo = await codigoDisponible(valores.codigo);
  if (!codigo) return error("El código de activación no existe o ya fue usado.");
  if (valores.barberia.length < 2) return error("Escribe el nombre de la barbería.");
  const errorSlug = slugValido(valores.slug);
  if (errorSlug) return error(errorSlug);
  const whatsapp = soloDigitos(valores.whatsapp);
  if (whatsapp && (whatsapp.length < 10 || whatsapp.length > 15)) return error("Escribe el WhatsApp con indicativo. Ej: 573001234567");
  const cuenta = esquemaCuenta.safeParse({ nombre: valores.nombre, usuario: valores.usuario, clave: form.get("clave") });
  if (!cuenta.success) return error(cuenta.error.issues[0]?.message ?? "Revisa los datos");
  if (form.get("clave") !== form.get("clave2")) return error("Las contraseñas no coinciden.");

  const db = await getDb();
  const claveHash = await hashClave(cuenta.data.clave);
  const resultado = await db.transaction(async (tx) => {
    const [ocupado] = await tx.select({ id: barberias.id }).from(barberias).where(eq(barberias.slug, valores.slug));
    if (ocupado) return "Esa dirección ya la usa otra barbería. Elige otra.";
    const [repetido] = await tx.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.usuario, cuenta.data.usuario));
    if (repetido) return "Ese usuario ya existe. Elige otro.";

    const [nueva] = await tx
      .insert(barberias)
      .values({
        slug: valores.slug,
        nombre: valores.barberia,
        whatsapp: whatsapp.length === 10 ? `${region.indicativo}${whatsapp}` : whatsapp,
        horario: horarioPorDefecto,
        portada: "/img/hero.jpg",
        plan: codigo.plan,
        venceEn: nuevoVencimiento(null, codigo.dias),
      })
      .returning();
    // Marca el código solo si nadie lo usó en paralelo
    const usado = await tx
      .update(codigos)
      .set({ usadoEn: new Date(), barberiaId: nueva.id })
      .where(and(eq(codigos.id, codigo.id), isNull(codigos.usadoEn)))
      .returning({ id: codigos.id });
    if (usado.length === 0) throw new Error("codigo-usado");

    await tx.insert(servicios).values(SERVICIOS_INICIALES.map((s, i) => ({ ...s, barberiaId: nueva.id, orden: i })));
    await tx.insert(barberos).values({ barberiaId: nueva.id, nombre: cuenta.data.nombre, especialidad: "Barbero", orden: 0 });
    const [u] = await tx
      .insert(usuarios)
      .values({ barberiaId: nueva.id, nombre: cuenta.data.nombre, usuario: cuenta.data.usuario, claveHash, rol: "dueno" })
      .returning({ id: usuarios.id });
    return u.id;
  }).catch((e: Error) => (e.message === "codigo-usado" ? "El código de activación ya fue usado." : Promise.reject(e)));

  if (typeof resultado === "string") return error(resultado);
  await guardarSesion(resultado);
  redirect("/admin/barberia?bienvenida=1");
}

// Renovar o cambiar de plan con un código nuevo (se permite con la suscripción vencida)
export async function canjearCodigo(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const { barberia } = await exigirDueno({ permitirVencida: true });
  const codigo = await codigoDisponible(texto(form, "codigo"));
  if (!codigo) return { error: "El código no existe o ya fue usado." };
  const db = await getDb();
  const usado = await db
    .update(codigos)
    .set({ usadoEn: new Date(), barberiaId: barberia.id })
    .where(and(eq(codigos.id, codigo.id), isNull(codigos.usadoEn)))
    .returning({ id: codigos.id });
  if (usado.length === 0) return { error: "El código ya fue usado." };
  // Si cambia de plan, los días cuentan desde hoy; si renueva el mismo, se suman al vencimiento
  const venceEn = nuevoVencimiento(codigo.plan === barberia.plan ? barberia.venceEn : null, codigo.dias);
  await db.update(barberias).set({ plan: codigo.plan, venceEn }).where(eq(barberias.id, barberia.id));
  refrescar(barberia.slug);
  return { ok: "¡Listo! Tu suscripción quedó activa." };
}

export async function cambiarClave(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const yo = await exigirUsuario();
  if (!(await verificarClave(String(form.get("actual") ?? ""), yo.claveHash))) return { error: "La contraseña actual no es correcta." };
  const nueva = String(form.get("nueva") ?? "");
  if (nueva.length < 8) return { error: "La nueva contraseña debe tener al menos 8 caracteres." };
  if (nueva !== form.get("nueva2")) return { error: "Las contraseñas nuevas no coinciden." };
  const db = await getDb();
  await db.update(usuarios).set({ claveHash: await hashClave(nueva) }).where(eq(usuarios.id, yo.id));
  return { ok: "Contraseña actualizada." };
}

// El dueño crea las cuentas de su equipo
export async function crearUsuarioEquipo(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const { barberia } = await exigirDueno();
  const valores = { nombre: texto(form, "nombre"), usuario: texto(form, "usuario") };
  const cuenta = esquemaCuenta.safeParse({ ...valores, clave: form.get("clave") });
  if (!cuenta.success) return { error: cuenta.error.issues[0]?.message ?? "Revisa los datos", valores };
  const db = await getDb();
  const creado = await db
    .insert(usuarios)
    .values({
      barberiaId: barberia.id,
      nombre: cuenta.data.nombre,
      usuario: cuenta.data.usuario,
      claveHash: await hashClave(cuenta.data.clave),
      rol: form.get("rol") === "dueno" ? "dueno" : "equipo",
    })
    .onConflictDoNothing()
    .returning({ id: usuarios.id });
  if (creado.length === 0) return { error: "Ese usuario ya existe. Elige otro.", valores };
  revalidatePath("/admin/cuenta");
  return { ok: `Usuario creado. Entra con "${cuenta.data.usuario}" y la contraseña que pusiste.` };
}

export async function eliminarUsuario(id: number) {
  const { usuario: yo, barberia } = await exigirDueno();
  if (id === yo.id) return;
  const db = await getDb();
  await db.delete(usuarios).where(and(eq(usuarios.id, id), eq(usuarios.barberiaId, barberia.id), ne(usuarios.rol, "dueno")));
  revalidatePath("/admin/cuenta");
}

export async function hacerDueno(id: number) {
  const { barberia } = await exigirDueno();
  const db = await getDb();
  await db.update(usuarios).set({ rol: "dueno" }).where(and(eq(usuarios.id, id), eq(usuarios.barberiaId, barberia.id)));
  revalidatePath("/admin/cuenta");
}

// ---------------------------------------------------------------------------
// Datos de la barbería
// ---------------------------------------------------------------------------

export async function guardarBarberia(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const { barberia } = await exigirDueno();
  const nombre = texto(form, "nombre");
  if (nombre.length < 2 || nombre.length > 60) return { error: "El nombre debe tener entre 2 y 60 caracteres." };
  const slug = slugDesde(texto(form, "slug"));
  const errorSlug = slugValido(slug);
  if (errorSlug) return { error: errorSlug };
  const whatsapp = soloDigitos(texto(form, "whatsapp"));
  if (whatsapp && (whatsapp.length < 10 || whatsapp.length > 15)) return { error: "Escribe el WhatsApp con indicativo. Ej: 573001234567" };
  const instagram = texto(form, "instagram");
  if (instagram && !/^https?:\/\//.test(instagram)) return { error: "El Instagram debe ser un enlace completo, por ejemplo https://instagram.com/tubarberia" };

  // Horario: por cada día, cerrado o con hora de apertura y cierre
  const horario: Horario = {};
  for (let d = 0; d < 7; d++) {
    if (form.get(`cerrado-${d}`) === "on") {
      horario[d] = null;
      continue;
    }
    const abre = horaAMinutos(texto(form, `abre-${d}`));
    const cierra = horaAMinutos(texto(form, `cierra-${d}`));
    if (abre === null || cierra === null || cierra <= abre) return { error: "Revisa el horario: la hora de cierre debe ser después de la de apertura." };
    horario[d] = { abre, cierra };
  }

  const cambios: Partial<typeof barberias.$inferInsert> = {
    nombre,
    slug,
    eslogan: texto(form, "eslogan").slice(0, 80),
    descripcion: texto(form, "descripcion").slice(0, 240),
    whatsapp,
    instagram,
    direccion: texto(form, "direccion").slice(0, 120),
    horario,
  };
  for (const campo of ["logo", "portada"] as const) {
    const archivo = archivoDeImagen(form.get(campo));
    if (archivo) {
      const r = await guardarImagen(archivo, `${barberia.id}/${campo}`);
      if ("error" in r) return { error: r.error };
      cambios[campo] = r.url;
    } else if (form.get(`quitar-${campo}`) === "on") {
      cambios[campo] = null;
    }
  }

  const db = await getDb();
  if (slug !== barberia.slug) {
    const [ocupado] = await db.select({ id: barberias.id }).from(barberias).where(eq(barberias.slug, slug));
    if (ocupado) return { error: "Esa dirección ya la usa otra barbería." };
  }
  await db.update(barberias).set(cambios).where(eq(barberias.id, barberia.id));
  refrescar(barberia.slug);
  if (slug !== barberia.slug) refrescar(slug);
  return { ok: "Cambios guardados." };
}

// ---------------------------------------------------------------------------
// Agenda y bloqueos
// ---------------------------------------------------------------------------

export async function cambiarEstadoCita(id: number, estado: (typeof ESTADOS_CITA)[number]) {
  const { barberia } = await exigirPanel();
  if (!ESTADOS_CITA.includes(estado)) return;
  const db = await getDb();
  await db.update(citas).set({ estado }).where(and(eq(citas.id, id), eq(citas.barberiaId, barberia.id)));
  revalidatePath("/admin", "layout");
}

const esquemaBloqueo = z
  .object({
    barberoId: z.string().transform((v) => (v ? Number(v) : null)),
    desde: z.string().refine(esFechaValida, "Fecha de inicio inválida"),
    hasta: z.string().refine(esFechaValida, "Fecha final inválida"),
    diaCompleto: z.boolean(),
    horaInicio: z.string(),
    horaFin: z.string(),
    motivo: z.string().trim().max(80),
  })
  .refine((b) => b.hasta >= b.desde, { message: "La fecha final debe ser igual o posterior a la inicial" });

export async function crearBloqueo(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const { barberia } = await exigirPanel();
  const parsed = esquemaBloqueo.safeParse({
    barberoId: String(form.get("barberoId") ?? ""),
    desde: texto(form, "desde"),
    hasta: texto(form, "hasta") || texto(form, "desde"),
    diaCompleto: form.get("diaCompleto") === "on",
    horaInicio: texto(form, "horaInicio"),
    horaFin: texto(form, "horaFin"),
    motivo: texto(form, "motivo"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos" };
  const b = parsed.data;

  let inicioMin: number | null = null;
  let finMin: number | null = null;
  if (!b.diaCompleto) {
    inicioMin = horaAMinutos(b.horaInicio);
    finMin = horaAMinutos(b.horaFin);
    if (inicioMin === null || finMin === null || finMin <= inicioMin) {
      return { error: "Indica una hora de inicio y una hora final posterior." };
    }
  }

  const db = await getDb();
  if (b.barberoId !== null) {
    const [propio] = await db.select({ id: barberos.id }).from(barberos).where(and(eq(barberos.id, b.barberoId), eq(barberos.barberiaId, barberia.id)));
    if (!propio) return { error: "Ese barbero no existe." };
  }
  await db.insert(bloqueos).values({ barberiaId: barberia.id, barberoId: b.barberoId, desde: b.desde, hasta: b.hasta, inicioMin, finMin, motivo: b.motivo });
  revalidatePath("/admin", "layout");
  return { ok: "Horario bloqueado." };
}

export async function eliminarBloqueo(id: number) {
  const { barberia } = await exigirPanel();
  const db = await getDb();
  await db.delete(bloqueos).where(and(eq(bloqueos.id, id), eq(bloqueos.barberiaId, barberia.id)));
  revalidatePath("/admin", "layout");
}

// ---------------------------------------------------------------------------
// Servicios
// ---------------------------------------------------------------------------

const esquemaServicio = z.object({
  id: z.string().transform((v) => (v ? Number(v) : null)),
  nombre: z.string().trim().min(2, "El nombre es muy corto").max(60),
  descripcion: z.string().trim().max(160),
  duracionMin: z.coerce.number().int().min(5, "Duración mínima: 5 minutos").max(480),
  precio: z.coerce.number().int().min(0, "El precio no puede ser negativo"),
});

export async function guardarServicio(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const { barberia } = await exigirPanel();
  const parsed = esquemaServicio.safeParse({
    id: String(form.get("id") ?? ""),
    nombre: form.get("nombre"),
    descripcion: texto(form, "descripcion"),
    duracionMin: form.get("duracionMin"),
    precio: soloDigitos(String(form.get("precio") ?? "")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos" };
  const { id, ...datos } = parsed.data;

  const db = await getDb();
  if (id) {
    await db.update(servicios).set(datos).where(and(eq(servicios.id, id), eq(servicios.barberiaId, barberia.id)));
  } else {
    // Los servicios nuevos van al final de la lista
    const [{ maximo }] = await db
      .select({ maximo: sql<number>`coalesce(max(${servicios.orden}), 0)::int` })
      .from(servicios)
      .where(eq(servicios.barberiaId, barberia.id));
    await db.insert(servicios).values({ ...datos, barberiaId: barberia.id, orden: maximo + 1 });
  }
  refrescar(barberia.slug);
  return { ok: id ? "Servicio actualizado." : "Servicio creado." };
}

export async function alternarServicio(id: number, activo: boolean) {
  const { barberia } = await exigirPanel();
  const db = await getDb();
  await db.update(servicios).set({ activo }).where(and(eq(servicios.id, id), eq(servicios.barberiaId, barberia.id)));
  refrescar(barberia.slug);
}

// ---------------------------------------------------------------------------
// Barberos
// ---------------------------------------------------------------------------

const esquemaBarbero = z.object({
  nombre: z.string().trim().min(2, "El nombre es muy corto").max(60),
  especialidad: z.string().trim().min(2, "Escribe la especialidad").max(80),
  estilo: z.string().trim().max(120),
  telefono: z
    .string()
    .transform((t) => t.replace(/[^\d]/g, ""))
    .refine((t) => t === "" || (t.length >= 7 && t.length <= 15), "Escribe un celular válido o déjalo vacío"),
});

// ¿El plan permite otro barbero activo?
async function cupoBarberos(barberiaId: number, plan: Parameters<typeof limitesPlan>[0]) {
  const max = limitesPlan(plan).maxBarberos;
  if (max === null) return true;
  const db = await getDb();
  const [{ total }] = await db.select({ total: count() }).from(barberos).where(and(eq(barberos.barberiaId, barberiaId), eq(barberos.activo, true)));
  return total < max;
}

export async function guardarBarbero(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const { barberia } = await exigirPanel();
  const id = Number(form.get("id")) || null;
  const parsed = esquemaBarbero.safeParse({
    nombre: form.get("nombre"),
    especialidad: form.get("especialidad"),
    estilo: texto(form, "estilo"),
    telefono: String(form.get("telefono") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos" };
  const { telefono, ...datos } = parsed.data;
  const cambios: Partial<typeof barberos.$inferInsert> = { ...datos, telefono: telefono || null };

  const foto = archivoDeImagen(form.get("foto"));
  if (foto) {
    const r = await guardarImagen(foto, `${barberia.id}/barberos`);
    if ("error" in r) return { error: r.error };
    cambios.foto = r.url;
  }

  const db = await getDb();
  if (id) {
    await db.update(barberos).set(cambios).where(and(eq(barberos.id, id), eq(barberos.barberiaId, barberia.id)));
  } else {
    if (!(await cupoBarberos(barberia.id, barberia))) {
      return { error: `Tu plan permite hasta ${limitesPlan(barberia).maxBarberos} barberos activos. Pásate a Premium para agregar más.` };
    }
    const [{ maximo }] = await db
      .select({ maximo: sql<number>`coalesce(max(${barberos.orden}), 0)::int` })
      .from(barberos)
      .where(eq(barberos.barberiaId, barberia.id));
    await db.insert(barberos).values({ ...datos, ...cambios, barberiaId: barberia.id, orden: maximo + 1 });
  }
  refrescar(barberia.slug);
  return { ok: id ? "Guardado." : "Barbero agregado." };
}

export async function alternarBarbero(id: number, activo: boolean): Promise<EstadoFormulario> {
  const { barberia } = await exigirPanel();
  if (activo && !(await cupoBarberos(barberia.id, barberia))) {
    return { error: `Tu plan permite hasta ${limitesPlan(barberia).maxBarberos} barberos activos.` };
  }
  const db = await getDb();
  await db.update(barberos).set({ activo }).where(and(eq(barberos.id, id), eq(barberos.barberiaId, barberia.id)));
  refrescar(barberia.slug);
  return {};
}

// ---------------------------------------------------------------------------
// Galería y reseñas (planes que las incluyen)
// ---------------------------------------------------------------------------

async function exigirExtras() {
  const sesion = await exigirPanel();
  if (!limitesPlan(sesion.barberia).galeriaYResenas) redirect("/admin/suscripcion");
  return sesion;
}

// Una foto por llamada: el panel las reduce en el navegador y las sube de a una
export async function subirFotoGaleria(form: FormData): Promise<EstadoFormulario> {
  const { barberia } = await exigirExtras();
  const archivo = archivoDeImagen(form.get("foto"));
  if (!archivo) return { error: "Elige una foto." };
  const medida = (campo: string) => Math.min(Math.max(Number(form.get(campo)) || 900, 50), 6000);
  const r = await guardarImagen(archivo, `${barberia.id}/galeria`);
  if ("error" in r) return { error: r.error };
  const db = await getDb();
  const [{ maximo }] = await db
    .select({ maximo: sql<number>`coalesce(max(${galeria.orden}), 0)::int` })
    .from(galeria)
    .where(eq(galeria.barberiaId, barberia.id));
  await db.insert(galeria).values({ barberiaId: barberia.id, url: r.url, ancho: medida("ancho"), alto: medida("alto"), orden: maximo + 1 });
  refrescar(barberia.slug);
  return { ok: "Foto agregada." };
}

export async function eliminarFotoGaleria(id: number) {
  const { barberia } = await exigirExtras();
  const db = await getDb();
  await db.delete(galeria).where(and(eq(galeria.id, id), eq(galeria.barberiaId, barberia.id)));
  refrescar(barberia.slug);
}

export async function crearResena(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const { barberia } = await exigirExtras();
  const nombre = texto(form, "nombre");
  const textoResena = texto(form, "texto");
  if (nombre.length < 2) return { error: "Escribe el nombre del cliente." };
  if (textoResena.length < 5 || textoResena.length > 220) return { error: "La reseña debe tener entre 5 y 220 caracteres." };
  const db = await getDb();
  await db.insert(resenas).values({ barberiaId: barberia.id, nombre, detalle: texto(form, "detalle").slice(0, 60), texto: textoResena });
  refrescar(barberia.slug);
  return { ok: "Reseña agregada." };
}

export async function eliminarResena(id: number) {
  const { barberia } = await exigirExtras();
  const db = await getDb();
  await db.delete(resenas).where(and(eq(resenas.id, id), eq(resenas.barberiaId, barberia.id)));
  refrescar(barberia.slug);
}
