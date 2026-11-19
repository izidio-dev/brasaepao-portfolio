"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Adicional } from "@/data/cardapio";
import { centavosParaTexto, paraCentavos } from "@/lib/preco";
import type { Executar } from "./Painel";

/** Uma linha editável: nome + preço, salva ao clicar em "Salvar". */
function LinhaAdicional({ adicional, executar }: { adicional: Adicional; executar: Executar }) {
  const [nome, setNome] = useState(adicional.nome);
  const [preco, setPreco] = useState(centavosParaTexto(adicional.preco));
  const [erro, setErro] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const mudou = nome !== adicional.nome || preco !== centavosParaTexto(adicional.preco);

  async function salvar() {
    const centavos = paraCentavos(preco);
    if (!nome.trim() || centavos === null) {
      setErro("Preencha o nome e um preço válido.");
      return;
    }
    setErro("");
    await executar((r) => r.salvarAdicional({ ...adicional, nome: nome.trim(), preco: centavos }), "Adicional salvo");
  }

  const campo = "rounded-xl border-2 border-carvao/10 bg-white px-3 py-2 outline-none focus:border-brasa";

  return (
    <li className="flex flex-wrap items-center gap-2 p-3">
      <input aria-label="Nome do adicional" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={60} className={`${campo} min-w-0 flex-1`} />
      <span className="flex items-center gap-1">
        <span className="text-sm text-cinza">R$</span>
        <input aria-label="Preço do adicional" inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} className={`${campo} w-24 tabular-nums`} />
      </span>
      {mudou && (
        <button type="button" onClick={salvar} className="rounded-full bg-carvao px-4 py-2 text-sm font-bold text-creme">
          Salvar
        </button>
      )}
      {confirmando ? (
        <>
          <button type="button" onClick={() => executar((r) => r.excluirAdicional(adicional.id), "Adicional excluído")} className="rounded-full bg-brasa px-3 py-2 text-sm font-bold text-white">
            Confirmar exclusão
          </button>
          <button type="button" onClick={() => setConfirmando(false)} className="px-2 text-sm font-semibold">
            Cancelar
          </button>
        </>
      ) : (
        <button type="button" onClick={() => setConfirmando(true)} aria-label="Excluir" className="grid size-9 place-items-center rounded-full text-brasa hover:bg-brasa/10">
          <Trash2 className="size-4" aria-hidden />
        </button>
      )}
      {erro && (
        <p role="alert" className="w-full text-sm text-brasa">
          {erro}
        </p>
      )}
    </li>
  );
}

export function AbaAdicionais({ adicionais, executar }: { adicionais: Adicional[]; executar: Executar }) {
  return (
    <section aria-label="Adicionais">
      <p className="text-cinza">Extras que o cliente pode colocar nos burgers e combos.</p>
      <ul className="mt-4 divide-y divide-carvao/10 rounded-2xl bg-white">
        {adicionais.map((a) => (
          // A chave inclui nome e preço para o campo reiniciar após salvar.
          <LinhaAdicional key={`${a.id}-${a.nome}-${a.preco}`} adicional={a} executar={executar} />
        ))}
      </ul>
      <button
        type="button"
        onClick={() =>
          executar(
            (r) => r.salvarAdicional({ id: `adicional-${Math.random().toString(36).slice(2, 7)}`, nome: "Novo adicional", preco: 0, ordem: adicionais.length }),
            "Adicional criado: edite o nome e o preço",
          )
        }
        className="mt-4 flex items-center gap-2 rounded-full bg-brasa px-5 py-2.5 font-bold text-white"
      >
        <Plus className="size-4" aria-hidden /> Novo adicional
      </button>
    </section>
  );
}
