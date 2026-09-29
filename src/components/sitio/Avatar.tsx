// Iniciales sobre fondo oscuro, para barberos sin foto
export function Avatar({ nombre, className = "" }: { nombre: string; className?: string }) {
  const iniciales = nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <div aria-hidden className={`display grid place-items-center bg-[radial-gradient(circle_at_30%_20%,#2a2a30,#111114)] font-semibold ${className}`}>
      <span className="cromado">{iniciales}</span>
    </div>
  );
}
