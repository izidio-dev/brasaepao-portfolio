"use client";

import { useEffect, useState } from "react";
import { loja } from "@/data/loja";

/** "Aberto agora" ou "Fechado", calculado no navegador pelo horário local. */
export function StatusLoja() {
  const [aberto, setAberto] = useState<boolean | null>(null);

  useEffect(() => {
    function calcular() {
      const agora = new Date();
      const faixa = loja.horarios[agora.getDay()];
      const minutos = agora.getHours() * 60 + agora.getMinutes();
      setAberto(Boolean(faixa && minutos >= faixa[0] && minutos < faixa[1]));
    }
    calcular();
    const id = setInterval(calcular, 60_000);
    return () => clearInterval(id);
  }, []);

  if (aberto === null) return null;
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold">
      <span className={`size-2 rounded-full ${aberto ? "bg-[#1f9e55]" : "bg-brasa"}`} aria-hidden />
      {aberto ? "Aberto agora" : "Fechado · abre às 18h (ter a dom)"}
    </span>
  );
}
