"use client";

import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import { useState } from "react";
import { pontos, type Adicional, type Produto } from "@/data/cardapio";
import { chaveItem, formatarPreco, type ItemCarrinho } from "@/lib/pedido";
import { Janela } from "./Janela";

/** Janela do produto: adicionais, ponto da carne, observação e quantidade. */
export function ModalProduto({
  produto,
  adicionais,
  aoFechar,
  aoAdicionar,
}: {
  produto: Produto;
  adicionais: Adicional[];
  aoFechar: () => void;
  aoAdicionar: (item: ItemCarrinho) => void;
}) {
  const [escolhidos, setEscolhidos] = useState<string[]>([]);
  const [ponto, setPonto] = useState<string>("Ao ponto");
  const [observacao, setObservacao] = useState("");
  const [quantidade, setQuantidade] = useState(1);

  const extras = adicionais.filter((a) => escolhidos.includes(a.id));
  const total = (produto.preco + extras.reduce((s, a) => s + a.preco, 0)) * quantidade;

  function alternar(id: string) {
    setEscolhidos((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
  }

  function confirmar() {
    const pontoFinal = produto.personalizavel ? ponto : undefined;
    aoAdicionar({
      chave: chaveItem(produto.id, escolhidos, pontoFinal, observacao),
      produtoId: produto.id,
      nome: produto.nome,
      precoBase: produto.preco,
      adicionais: extras,
      ponto: pontoFinal,
      observacao: observacao.trim() || undefined,
      quantidade,
    });
  }

  return (
    <Janela titulo={produto.nome} aoFechar={aoFechar}>
      <div className="flex max-h-[92dvh] flex-col">
        <div className="relative aspect-[16/10] shrink-0">
          <Image src={produto.foto} alt="" fill className="object-cover" sizes="512px" />
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-creme/95 shadow"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="overflow-y-auto px-6 pt-5 pb-4">
          <h2 className="titulo text-4xl">{produto.nome}</h2>
          <p className="mt-2 text-cinza">{produto.descricao}</p>

          {produto.personalizavel && (
            <>
              <fieldset className="mt-6">
                <legend className="titulo text-xl">Ponto da carne</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {pontos.map((p) => (
                    <label key={p} className="relative cursor-pointer rounded-full border-2 border-carvao/15 px-4 py-2 text-sm font-semibold has-checked:border-brasa has-checked:bg-brasa has-checked:text-white">
                      <input type="radio" name="ponto" value={p} checked={ponto === p} onChange={() => setPonto(p)} className="absolute inset-0 cursor-pointer appearance-none rounded-full" />
                      {p}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-6">
                <legend className="titulo text-xl">Turbine seu lanche</legend>
                <ul className="mt-3 divide-y divide-carvao/10 rounded-2xl bg-white">
                  {adicionais.map((a) => (
                    <li key={a.id}>
                      <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
                        <input type="checkbox" checked={escolhidos.includes(a.id)} onChange={() => alternar(a.id)} className="size-5 accent-brasa" />
                        <span className="flex-1">{a.nome}</span>
                        <span className="text-sm font-semibold text-cinza">+ {formatarPreco(a.preco)}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            </>
          )}

          <label className="mt-6 block">
            <span className="titulo text-xl">Alguma observação?</span>
            <textarea
              id="observacao-produto"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              maxLength={140}
              rows={2}
              placeholder="Ex.: sem cebola, molho à parte"
              className="mt-3 w-full resize-none rounded-2xl border-2 border-carvao/10 bg-white px-4 py-3 outline-none focus:border-brasa"
            />
          </label>
        </div>

        {/* Rodapé fixo da janela: quantidade + botão de adicionar */}
        <div className="flex shrink-0 items-center gap-3 border-t border-carvao/10 bg-papel px-6 py-4">
          <div className="flex items-center rounded-full bg-white">
            <button type="button" aria-label="Diminuir quantidade" onClick={() => setQuantidade((q) => Math.max(1, q - 1))} className="grid size-11 place-items-center">
              <Minus className="size-4" aria-hidden />
            </button>
            <span className="w-6 text-center font-bold tabular-nums" aria-live="polite">{quantidade}</span>
            <button type="button" aria-label="Aumentar quantidade" onClick={() => setQuantidade((q) => Math.min(20, q + 1))} className="grid size-11 place-items-center">
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
          <button type="button" onClick={confirmar} className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-full bg-brasa px-4 py-3 text-sm font-bold whitespace-nowrap text-white sm:px-5 sm:text-base transition-colors hover:bg-brasa-escura">
            <span>Adicionar ao pedido</span>
            <span className="tabular-nums">{formatarPreco(total)}</span>
          </button>
        </div>
      </div>
    </Janela>
  );
}
