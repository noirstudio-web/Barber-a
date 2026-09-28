import { Navegacion } from "@/components/sitio/Navegacion";
import { Pie } from "@/components/sitio/Pie";
import { WhatsAppFlotante } from "@/components/sitio/WhatsAppFlotante";

export default function LayoutSitio({ children }: LayoutProps<"/">) {
  return (
    <>
      <Navegacion />
      <main>{children}</main>
      <Pie />
      <WhatsAppFlotante />
    </>
  );
}
