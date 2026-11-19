"use client";

import Image from "next/image";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { categorias, type Produto } from "@/data/cardapio";
import { formatarPreco } from "@/lib/pedido";
import type { Executar } from "./Painel";
import { FormProduto } from "./FormProduto";

export function AbaProdutos({ produtos, executar }: { produtos: Produto[]; executar: Executar }) {
  const [editando, setEditando] = useState<Produto | "novo" | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<string | null>(null);

  return (
    <section aria-label="Produtos">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-cinza">{produtos.length} produtos no cardápio</p>
        <button type="button" onClick={() => setEditando("novo")} className="flex items-center gap-2 rounded-full bg-brasa px-5 py-2.5 font-bold text-white">
          <Plus className="size-4" aria-hidden /> Novo produto
        </button>
      </div>

      {categorias.map((c) => {
        const lista = produtos.filter((p) => p.categoria === c.id);
        if (lista.length === 0) return null;
        return (
          <div key={c.id} className="mt-8">
            <h2 className="titulo text-3xl">{c.nome}</h2>
            <ul className="mt-3 divide-y divide-carvao/10 overflow-hidden rounded-2xl bg-white">
              {lista.map((p) => {
                const esgotado = p.disponivel === false;
                const confirmando = confirmandoExclusao === p.id;
                return (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
                    <div className={`relative size-14 shrink-0 overflow-hidden rounded-xl ${esgotado ? "opacity-40 grayscale" : ""}`}>
                      <Image src={p.foto} alt="" fill sizes="56px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">
                        {p.nome}
                        {esgotado && <span className="ml-2 rounded-full bg-carvao px-2 py-0.5 text-[11px] font-bold text-creme uppercase">Esgotado</span>}
                      </p>
                      <p className="text-sm font-semibold text-brasa tabular-nums">{formatarPreco(p.preco)}</p>
                    </div>
                    {confirmando ? (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold">Excluir de vez?</span>
                        <button
                          type="button"
                          onClick={async () => {
                            await executar((r) => r.excluirProduto(p.id), `${p.nome} excluído`);
                            setConfirmandoExclusao(null);
                          }}
                          className="rounded-full bg-brasa px-3 py-1.5 font-bold text-white"
                        >
                          Confirmar exclusão
                        </button>
                        <button type="button" onClick={() => setConfirmandoExclusao(null)} className="rounded-full px-3 py-1.5 font-semibold">
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => executar((r) => r.salvarProduto({ ...p, disponivel: esgotado }), esgotado ? `${p.nome} voltou ao cardápio` : `${p.nome} marcado como esgotado`)}
                          className={`rounded-full px-3 py-1.5 text-sm font-bold ${esgotado ? "bg-[#1f9e55] text-white" : "bg-papel"}`}
                        >
                          {esgotado ? "Marcar como disponível" : "Marcar como esgotado"}
                        </button>
                        <button type="button" onClick={() => setEditando(p)} aria-label="Editar" title="Editar" className="grid size-9 place-items-center rounded-full hover:bg-papel">
                          <Pencil className="size-4" aria-hidden />
                        </button>
                        <button type="button" onClick={() => setConfirmandoExclusao(p.id)} aria-label="Excluir" title="Excluir" className="grid size-9 place-items-center rounded-full text-brasa hover:bg-brasa/10">
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      {editando && (
        <FormProduto
          produto={editando === "novo" ? null : editando}
          proximaOrdem={produtos.length}
          aoFechar={() => setEditando(null)}
          aoSalvar={async (p) => {
            const ok = await executar((r) => r.salvarProduto(p), `${p.nome} salvo`);
            if (ok) setEditando(null);
            return ok;
          }}
        />
      )}
    </section>
  );
}
