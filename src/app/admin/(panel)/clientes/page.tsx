import { DownloadSimpleIcon, MagnifyingGlassIcon, WhatsappLogoIcon } from "@phosphor-icons/react/ssr";
import { headers } from "next/headers";
import Link from "next/link";
import { limitesPlan } from "@/lib/barberias";
import { DIAS_SIN_VENIR, listarClientes } from "@/lib/clientes";
import { exigirPanel } from "@/lib/sesion";
import { fmtFecha, fmtPrecio } from "@/lib/tiempo";
import { enlaceWhatsApp, numeroInternacional } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function PaginaClientes({ searchParams }: PageProps<"/admin/clientes">) {
  const { q, vista } = await searchParams;
  const busqueda = typeof q === "string" ? q.trim() : "";
  const { barberia } = await exigirPanel();
  const premium = limitesPlan(barberia).herramientasPremium;
  const recuperar = premium && vista === "recuperar";
  const lista = await listarClientes(barberia.id, { busqueda, recuperar });

  // Enlace a la web para invitar a reservar
  const h = await headers();
  const webReservas = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}/${barberia.slug}/reservar`;
  const mensaje = (nombre: string) =>
    `Hola ${nombre.split(" ")[0]}, te extrañamos en ${barberia.nombre}. ¿Agendamos tu próximo corte? Reserva aquí en un minuto: ${webReservas}`;
  const corta = (f: string | null) => (f ? fmtFecha(f, { day: "numeric", month: "short" }) : "-");
  const pestana = (activa: boolean) => `rounded-full px-4 py-2 text-sm transition ${activa ? "bg-white/10 text-texto" : "text-tenue hover:text-texto"}`;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="mt-1 text-sm text-tenue">
            {recuperar ? `Vinieron antes, pero no vuelven hace más de ${DIAS_SIN_VENIR} días y no tienen cita. Escríbeles para que regresen.` : "Se agregan solos cuando alguien reserva."}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {premium && (
            // Es una descarga de archivo, no una página: enlace normal
            <a href="/admin/clientes/exportar" download className="inline-flex items-center gap-2 rounded-full border border-linea px-4 py-2.5 text-sm transition hover:bg-white/5">
              <DownloadSimpleIcon size={16} /> Exportar a Excel
            </a>
          )}
          <form className="relative w-full sm:w-64">
            {recuperar && <input type="hidden" name="vista" value="recuperar" />}
            <MagnifyingGlassIcon size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-tenue" />
            <input
              name="q"
              defaultValue={busqueda}
              placeholder="Buscar por nombre o celular"
              aria-label="Buscar clientes"
              className="w-full rounded-full border border-linea bg-superficie py-2.5 pl-10 pr-4 text-sm outline-none focus:border-cromo"
            />
          </form>
        </div>
      </div>

      <div className="mt-6 flex gap-1">
        <Link href="/admin/clientes" className={pestana(!recuperar)}>
          Todos
        </Link>
        {premium ? (
          <Link href="/admin/clientes?vista=recuperar" className={pestana(recuperar)}>
            Por recuperar
          </Link>
        ) : (
          <Link href="/admin/suscripcion" className={pestana(false)} title="Disponible en Premium">
            Por recuperar (Premium)
          </Link>
        )}
      </div>

      {lista.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-linea px-6 py-12 text-center text-sm text-tenue">
          {busqueda
            ? `Nadie coincide con “${busqueda}”.`
            : recuperar
              ? "¡Muy bien! Todos tus clientes han vuelto en el último mes o ya tienen cita."
              : "Todavía no hay clientes. Aparecerán con la primera reserva."}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-linea">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-tenue">
              <tr>
                <th className="px-4 py-3 font-normal">Cliente</th>
                <th className="px-4 py-3 font-normal">Celular</th>
                <th className="px-4 py-3 text-right font-normal">Visitas</th>
                <th className="px-4 py-3 font-normal">Última visita</th>
                <th className="px-4 py-3 font-normal">{recuperar ? "Invitar" : "Próxima cita"}</th>
                <th className="px-4 py-3 text-right font-normal">Total</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id} className="border-t border-linea transition hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/clientes/${c.id}`} className="font-semibold hover:underline">
                      {c.nombre}
                    </Link>
                    {c.faltas > 0 && <span className="ml-2 text-xs text-peligro">{c.faltas} {c.faltas === 1 ? "falta" : "faltas"}</span>}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-tenue">{c.telefono}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.visitas}</td>
                  <td className="px-4 py-3 text-tenue">{corta(c.ultima)}</td>
                  <td className="px-4 py-3">
                    {recuperar ? (
                      <a
                        href={enlaceWhatsApp(mensaje(c.nombre), numeroInternacional(c.telefono))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-[#0b1f12] transition hover:brightness-110"
                      >
                        <WhatsappLogoIcon size={14} weight="fill" /> Escribir
                      </a>
                    ) : (
                      corta(c.proxima)
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtPrecio(c.gastado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
