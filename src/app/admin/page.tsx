import type { Metadata } from "next";
import { Painel } from "@/components/admin/Painel";

export const metadata: Metadata = {
  title: "Painel do gerente — Brasa & Pão",
  robots: { index: false, follow: false }, // não aparece no Google
};

export default function PaginaAdmin() {
  return <Painel />;
}
