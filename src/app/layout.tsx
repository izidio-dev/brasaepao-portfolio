import type { Metadata } from "next";
import { Anton, Figtree } from "next/font/google";
import "./globals.css";

// Fontes Google (licença OFL). Anton = títulos estilo "letreiro"; Figtree = textos.
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

export const metadata: Metadata = {
  title: "Brasa & Pão — Hamburgueria",
  description: "Cardápio digital com pedido direto pelo WhatsApp. Projeto de demonstração.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${anton.variable} ${figtree.variable}`}>
      <body>{children}</body>
    </html>
  );
}
