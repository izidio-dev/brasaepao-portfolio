"use client";

import { useState } from "react";
import type { DadosLoja } from "@/lib/repositorio";
import { centavosParaTexto, paraCentavos } from "@/lib/preco";
import type { Executar } from "./Painel";

export function AbaLoja({ loja, executar }: { loja: DadosLoja; executar: Executar }) {
  const [nome, setNome] = useState(loja.nome);
  const [whatsapp, setWhatsapp] = useState(loja.whatsapp);
  const [taxa, setTaxa] = useState(centavosParaTexto(loja.taxaEntrega));
  const [tempo, setTempo] = useState(loja.tempoEntrega);
  const [erros, setErros] = useState<string[]>([]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    // Aceita "(11) 91234-5678" e completa o 55 do Brasil.
    let numero = whatsapp.replace(/\D/g, "");
    if (numero.length === 10 || numero.length === 11) numero = "55" + numero;
    const centavos = paraCentavos(taxa);
    const lista: string[] = [];
    if (!nome.trim()) lista.push("Informe o nome da loja.");
    if (!/^55\d{10,11}$/.test(numero)) lista.push("Informe um WhatsApp válido com DDD, por exemplo (11) 91234-5678.");
    if (centavos === null) lista.push("Informe a taxa de entrega, por exemplo 5,00 (ou 0).");
    if (!tempo.trim()) lista.push("Informe o tempo de entrega.");
    setErros(lista);
    if (lista.length || centavos === null) return;
    await executar((r) => r.salvarLoja({ nome: nome.trim(), whatsapp: numero, taxaEntrega: centavos, tempoEntrega: tempo.trim() }), "Dados da loja salvos");
  }

  const campo = "mt-1.5 w-full rounded-xl border-2 border-carvao/10 bg-white px-4 py-2.5 outline-none focus:border-brasa";

  return (
    <form onSubmit={salvar} noValidate aria-label="Dados da loja" className="max-w-lg space-y-4 rounded-3xl bg-white p-6">
      <label className="block font-semibold">
        Nome da loja
        <input id="nome-loja" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} className={campo} />
      </label>
      <label className="block font-semibold">
        WhatsApp que recebe os pedidos
        <input id="whatsapp-loja" inputMode="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={campo} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block font-semibold">
          Taxa de entrega (R$)
          <input id="taxa-loja" inputMode="decimal" value={taxa} onChange={(e) => setTaxa(e.target.value)} className={campo} />
        </label>
        <label className="block font-semibold">
          Tempo de entrega
          <input id="tempo-loja" value={tempo} onChange={(e) => setTempo(e.target.value)} maxLength={40} placeholder="30–45 min" className={campo} />
        </label>
      </div>
      {erros.length > 0 && (
        <div role="alert" className="rounded-xl border-2 border-brasa/40 bg-brasa/10 p-3 text-sm">
          {erros.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}
      <button type="submit" className="rounded-full bg-brasa px-6 py-3 font-bold text-white">
        Salvar dados da loja
      </button>
    </form>
  );
}
