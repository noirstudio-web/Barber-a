import { WhatsappLogoIcon } from "@phosphor-icons/react/ssr";
import { negocio } from "@/config/negocio";
import { enlaceWhatsApp } from "@/lib/whatsapp";

export function WhatsAppFlotante() {
  return (
    <a
      href={enlaceWhatsApp(`Hola ${negocio.nombre}, tengo una pregunta.`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      className="fixed bottom-5 right-5 z-30 grid size-14 place-items-center rounded-full bg-[#25D366] text-[#0b1f12] shadow-[0_12px_40px_rgb(37_211_102/0.25)] transition hover:scale-105 active:scale-95"
    >
      <WhatsappLogoIcon size={28} weight="fill" />
    </a>
  );
}
