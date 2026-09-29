import { ArrowSquareOutIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { etiquetaEstado, fechaCorta, listarBarberias, type FilaBarberia } from "@/lib/noir";
import { exigirNoir } from "@/lib/sesion";

export const dynamic = "force-dynamic";

const FILTROS: { id: string; texto: string; cumple: (f: FilaBarberia) => boolean }[] = [
  { id: "todas", texto: "Todas", cumple: () => true },
  { id: "activas", texto: "Activas", cumple: (f) => f.estado.activa && f.b.plan !== "prueba" },
  { id: "prueba", texto: "En prueba", cumple: (f) => f.estado.activa && f.b.plan === "prueba" },
  { id: "por-vencer", texto: "Por vencer", cumple: (f) => f.porVencer },
  { id: "vencidas", texto: "Vencidas", cumple: (f) => f.estado.motivo === "vencida" },
  { id: "canceladas", texto: "Canceladas", cumple: (f) => f.estado.motivo === "cancelada" },
  { id: "suspendidas", texto: "Suspendidas", cumple: (f) => f.estado.motivo === "suspendida" },
];

export default async function BarberiasNoir({ searchParams }: PageProps<"/noir/barberias">) {
  await exigirNoir();
  const { filtro } = await searchParams;
  const activo = FILTROS.find((x) => x.id === filtro) ?? FILTROS[0];
  const todas = await listarBarberias();
  const lista = todas.filter(activo.cumple);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Barberías</h1>
      <div className="mt-6 flex flex-wrap gap-1">
        {FILTROS.map((x) => {
          const n = todas.filter(x.cumple).length;
          return (
            <Link
              key={x.id}
              href={x.id === "todas" ? "/noir/barberias" : `/noir/barberias?filtro=${x.id}`}
              className={`rounded-full px-3 py-1.5 text-sm transition ${x.id === activo.id ? "bg-white/10 text-texto" : "text-tenue hover:text-texto"}`}
            >
              {x.texto} <span className="tabular-nums text-tenue">{n}</span>
            </Link>
          );
        })}
      </div>

      {lista.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-linea px-6 py-12 text-center text-sm text-tenue">No hay barberías en este grupo.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-linea">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-left text-tenue">
              <tr>
                <th className="px-4 py-3 font-normal">Barbería</th>
                <th className="px-4 py-3 font-normal">Dueño</th>
                <th className="px-4 py-3 font-normal">Estado</th>
                <th className="px-4 py-3 font-normal">Vence</th>
                <th className="px-4 py-3 text-right font-normal">Citas 30 días</th>
                <th className="px-4 py-3 font-normal">Web</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((f) => {
                const e = etiquetaEstado(f);
                return (
                  <tr key={f.b.id} className="border-t border-linea transition hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <Link href={`/noir/barberias/${f.b.id}`} className="font-semibold hover:underline">
                        {f.b.nombre}
                      </Link>
                      {f.esDemo && <span className="ml-2 rounded-full border border-linea px-2 py-0.5 text-xs text-tenue">Demo</span>}
                    </td>
                    <td className="px-4 py-3 text-tenue">{f.dueno?.nombre ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${e.clase}`}>{e.texto}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-tenue">{fechaCorta(f.b.venceEn)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{f.citasMes}</td>
                    <td className="px-4 py-3">
                      <a href={`/${f.b.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-tenue hover:text-texto">
                        <ArrowSquareOutIcon size={14} /> /{f.b.slug}
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
