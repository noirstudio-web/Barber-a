import { horario } from "@/config/negocio";
import { ahoraLocal, diaSemana, sumarDias } from "@/lib/tiempo";
import type { Db } from "./index";
import { barberos, citas, clientes, servicios } from "./schema";

const BARBEROS = [
  { nombre: "Mateo Ríos", especialidad: "Fades y degradados", estilo: "Limpio, preciso, de líneas marcadas.", foto: "/img/barbero-mateo.jpg" },
  { nombre: "Julián Ospina", especialidad: "Barba y afeitado a navaja", estilo: "Toalla caliente y perfilado clásico.", foto: "/img/barbero-julian.jpg" },
  { nombre: "Andrés Cárdenas", especialidad: "Cortes clásicos y con tijera", estilo: "Texturas naturales que crecen bien.", foto: "/img/barbero-andres.jpg" },
  { nombre: "Valentina Mejía", especialidad: "Color, tinte y cejas", estilo: "Canas cubiertas sin que se note.", foto: "/img/barbero-valentina.jpg" },
];

const SERVICIOS = [
  { nombre: "Corte clásico", descripcion: "Tijera y máquina, lavado y peinado.", duracionMin: 45, precio: 35000 },
  { nombre: "Fade / degradado", descripcion: "Degradado a piel o bajo, con diseño de línea.", duracionMin: 45, precio: 40000 },
  { nombre: "Corte + barba", descripcion: "Corte completo y arreglo de barba con toalla caliente.", duracionMin: 75, precio: 60000 },
  { nombre: "Arreglo de barba", descripcion: "Perfilado, rebaje y aceite hidratante.", duracionMin: 30, precio: 25000 },
  { nombre: "Afeitado a navaja", descripcion: "Afeitado tradicional con toalla caliente y bálsamo.", duracionMin: 45, precio: 35000 },
  { nombre: "Cejas", descripcion: "Perfilado con cuchilla o hilo.", duracionMin: 15, precio: 12000 },
  { nombre: "Tinte / cubrir canas", descripcion: "Color para cabello o barba, tono natural.", duracionMin: 60, precio: 55000 },
  { nombre: "Corte niño", descripcion: "Hasta 12 años.", duracionMin: 30, precio: 28000 },
];

const NOMBRES = ["Santiago", "Camilo", "Daniel", "Felipe", "Nicolás", "Sebastián", "Juan Pablo", "Esteban", "Tomás", "Alejandro", "Laura", "David", "Mateo", "Andrés", "Samuel", "Diego", "Carolina", "Julián", "Miguel", "Simón"];
const APELLIDOS = ["Bernal", "Restrepo", "Guerrero", "Castaño", "Pardo", "Rojas", "Vélez", "Quintero", "Arango", "Mora", "Salazar", "Ocampo", "Duque", "Cárdenas", "Montoya"];

// Generador pseudoaleatorio con semilla, para que la demo sea siempre igual
function aleatorio(semilla: number) {
  let s = semilla;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function codigo(rand: () => number) {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => letras[Math.floor(rand() * letras.length)]).join("");
}

export async function sembrar(db: Db, { conCitasDemo = true } = {}) {
  const existentes = await db.select({ id: barberos.id }).from(barberos).limit(1);
  if (existentes.length > 0) return false;

  const bs = await db
    .insert(barberos)
    .values(BARBEROS.map((b, i) => ({ ...b, orden: i })))
    .returning();
  const ss = await db
    .insert(servicios)
    .values(SERVICIOS.map((s, i) => ({ ...s, orden: i })))
    .returning();

  if (!conCitasDemo) return true;

  // Citas de ejemplo: historial de las últimas semanas y agenda de los próximos días
  const rand = aleatorio(7);
  const cs = await db
    .insert(clientes)
    .values(
      Array.from({ length: 140 }, (_, i) => ({
        nombre: `${NOMBRES[i % NOMBRES.length]} ${APELLIDOS[(i * 7 + Math.floor(i / NOMBRES.length)) % APELLIDOS.length]}`,
        telefono: `3${String(Math.floor(rand() * 1e9)).padStart(9, "0")}`,
      })),
    )
    .onConflictDoNothing()
    .returning();
  const hoy = ahoraLocal().fecha;
  const filas: (typeof citas.$inferInsert)[] = [];

  for (let d = -21; d <= 6; d++) {
    const fecha = sumarDias(hoy, d);
    const h = horario[diaSemana(fecha)];
    if (!h) continue;
    for (const barbero of bs) {
      let cursor = h.abre + Math.floor(rand() * 4) * 30;
      const densidad = d < 0 ? 0.55 : d === 0 ? 0.6 : 0.4 - d * 0.04;
      while (cursor < h.cierra - 30) {
        const servicio = ss[Math.floor(rand() * ss.length)];
        if (cursor + servicio.duracionMin > h.cierra) break;
        if (rand() < densidad) {
          const cliente = cs[Math.floor(rand() * cs.length)];
          filas.push({
            codigo: codigo(rand),
            clienteId: cliente.id,
            barberoId: barbero.id,
            servicioId: servicio.id,
            fecha,
            inicioMin: cursor,
            finMin: cursor + servicio.duracionMin,
            precio: servicio.precio,
            estado: d < 0 ? (rand() < 0.04 ? "no_asistio" : "completada") : "confirmada",
          });
          cursor += servicio.duracionMin;
        } else {
          cursor += 30;
        }
      }
    }
  }

  for (let i = 0; i < filas.length; i += 100) {
    await db.insert(citas).values(filas.slice(i, i + 100));
  }
  return true;
}
