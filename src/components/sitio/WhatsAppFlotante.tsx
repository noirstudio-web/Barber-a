import { WhatsappLogoIcon } from "@phosphor-icons/react/ssr";
import { enlaceWhatsApp } from "@/lib/whatsapp";

export function WhatsAppFlotante({ numero, texto }: { numero: string; texto: string }) {
  if (!numero) return null;
  return (
    <a
      href={enlaceWhatsApp(texto, numero)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      className="fixed bottom-5 right-5 z-30 grid size-14 place-items-center rounded-full bg-[#25D366] text-[#0b1f12] shadow-[0_12px_40px_rgb(37_211_102/0.25)] transition hover:scale-105 active:scale-95"
    >
      <WhatsappLogoIcon size={28} weight="fill" />
    </a>
  );
}
