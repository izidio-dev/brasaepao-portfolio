"use client";

import { Minus, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { Produto } from "@/data/cardapio";
import { formatarPreco } from "@/lib/pedido";
import { centavosParaTexto, paraCentavos } from "@/lib/preco";
import { hojeSP, rotuloAte, type ItemKit, type Kit } from "@/lib/promocao";
import { Janela } from "../Janela";
import type { Executar } from "./Painel";

const MAX_ITENS = 6;

/** Nome dos itens do kit: "2x Duplo Cheddar + 1x Batata rústica" (item excluído aparece como tal). */
function resumoItens(itens: ItemKit[], produtos: Produto[]) {
  return itens.map((i) => `${i.quantidade}x ${produtos.find((p) => p.id === i.produtoId)?.nome ?? "item excluído"}`).join(" + ");
}

/** Soma dos preços normais dos itens: o "de" que o cliente vê riscado. */
function precoSeparado(itens: ItemKit[], produtos: Produto[]) {
  return itens.reduce((s, i) => s + (produtos.find((p) => p.id === i.produtoId)?.preco ?? 0) * i.quantidade, 0);
}

function situacao(k: Kit, produtos: Produto[], hoje: string): { texto: string; ativa: boolean } {
  if (!k.ativo) return { texto: "Pausada", ativa: false };
  if (hoje > k.ate) return { texto: "Encerrada", ativa: false };
  if (k.itens.some((i) => produtos.find((p) => p.id === i.produtoId)?.disponivel === false)) return { texto: "Item esgotado", ativa: false };
  if (k.itens.some((i) => !produtos.some((p) => p.id === i.produtoId))) return { texto: "Item excluído", ativa: false };
  return { texto: "Ativa", ativa: true };
}

/** Aba "Promoções": kits com vários itens por um preço e data de fim. */
export function AbaPromocoes({ kits, produtos, executar }: { kits: Kit[]; produtos: Produto[]; executar: Executar }) {
  const [editando, setEditando] = useState<Kit | "novo" | null>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const hoje = hojeSP();

  return (
    <section aria-label="Promoções">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-cinza">Junte itens num preço especial, com data para acabar. Aparece no topo do cardápio.</p>
        <button type="button" onClick={() => setEditando("novo")} className="flex items-center gap-2 rounded-full bg-brasa px-5 py-2.5 font-bold text-white">
          <Plus className="size-4" aria-hidden /> Nova promoção
        </button>
      </div>

      {kits.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-white p-6 text-cinza">Nenhuma promoção ainda. Crie a primeira, por exemplo “Promo fim de semana”.</p>
      ) : (
        <ul className="mt-6 divide-y divide-carvao/10 overflow-hidden rounded-2xl bg-white">
          {kits.map((k) => {
            const s = situacao(k, produtos, hoje);
            const de = precoSeparado(k.itens, produtos);
            return (
              <li key={k.id} className="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    {k.nome}
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${s.ativa ? "bg-mostarda text-carvao" : "bg-carvao/10 text-cinza"}`}>{s.texto}</span>
                  </p>
                  <p className="text-sm">{resumoItens(k.itens, produtos)}</p>
                  <p className="text-sm text-cinza">
                    {de > k.preco && <s className="mr-1 tabular-nums">{formatarPreco(de)}</s>}
                    <span className="font-semibold text-brasa tabular-nums">{formatarPreco(k.preco)}</span> · {rotuloAte(k.ate)}
                  </p>
                </div>
                {confirmando === k.id ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">Excluir de vez?</span>
                    <button
                      type="button"
                      onClick={async () => {
                        await executar((r) => r.excluirKit(k.id), `${k.nome} excluída`);
                        setConfirmando(null);
                      }}
                      className="rounded-full bg-brasa px-3 py-1.5 font-bold text-white"
                    >
                      Confirmar exclusão
                    </button>
                    <button type="button" onClick={() => setConfirmando(null)} className="rounded-full px-3 py-1.5 font-semibold">
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setEditando(k)} aria-label="Editar" className="grid size-10 place-items-center rounded-full hover:bg-papel">
                      <Pencil className="size-4" aria-hidden />
                    </button>
                    <button type="button" onClick={() => setConfirmando(k.id)} aria-label="Excluir" className="grid size-10 place-items-center rounded-full text-brasa hover:bg-brasa/10">
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {editando && (
        <FormKit
          kit={editando === "novo" ? null : editando}
          produtos={produtos}
          proximaOrdem={kits.length}
          aoFechar={() => setEditando(null)}
          aoSalvar={async (k) => {
            const ok = await executar((r) => r.salvarKit(k), `${k.nome} salva`);
            if (ok) setEditando(null);
            return ok;
          }}
        />
      )}
    </section>
  );
}

function gerarId(nome: string) {
  const base = nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${base || "promocao"}-${Math.random().toString(36).slice(2, 6)}`;
}

function FormKit({
  kit,
  produtos,
  proximaOrdem,
  aoFechar,
  aoSalvar,
}: {
  kit: Kit | null;
  produtos: Produto[];
  proximaOrdem: number;
  aoFechar: () => void;
  aoSalvar: (k: Kit) => Promise<boolean>;
}) {
  const titulo = kit ? "Editar promoção" : "Nova promoção";
  const [nome, setNome] = useState(kit?.nome ?? "");
  const [descricao, setDescricao] = useState(kit?.descricao ?? "");
  const [itens, setItens] = useState<{ produtoId: string; quantidade: string }[]>(
    kit?.itens.map((i) => ({ produtoId: i.produtoId, quantidade: String(i.quantidade) })) ?? [{ produtoId: "", quantidade: "1" }],
  );
  const [preco, setPreco] = useState(kit ? centavosParaTexto(kit.preco) : "");
  const [ate, setAte] = useState(kit?.ate ?? "");
  const [ativo, setAtivo] = useState(kit?.ativo ?? true);
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const validos = itens
    .map((i) => ({ produtoId: i.produtoId, quantidade: Number(i.quantidade) }))
    .filter((i) => i.produtoId && Number.isInteger(i.quantidade) && i.quantidade >= 1 && i.quantidade <= 10);
  const separado = precoSeparado(validos, produtos);

  const mudarItem = (n: number, campo: "produtoId" | "quantidade", valor: string) => setItens(itens.map((i, k) => (k === n ? { ...i, [campo]: valor } : i)));

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const centavos = paraCentavos(preco);
    const lista: string[] = [];
    if (!nome.trim()) lista.push("Dê um nome para a promoção.");
    if (validos.length === 0) lista.push("Escolha pelo menos um produto.");
    else if (validos.length !== itens.length) lista.push("Confira os itens: cada um precisa de um produto e quantidade de 1 a 10.");
    if (centavos === null || centavos <= 0) lista.push("Informe um preço válido, por exemplo 49,90.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ate)) lista.push("Escolha até quando a promoção vale.");
    else if (!kit && ate < hojeSP()) lista.push("A data da promoção precisa ser hoje ou depois.");
    setErros(lista);
    if (lista.length || centavos === null) return;
    setSalvando(true);
    await aoSalvar({ id: kit?.id ?? gerarId(nome), nome: nome.trim(), descricao: descricao.trim(), itens: validos, preco: centavos, ate, ativo, ordem: kit?.ordem ?? proximaOrdem });
    setSalvando(false);
  }

  const campo = "mt-1.5 w-full rounded-xl border-2 border-carvao/10 bg-white px-4 py-2.5 outline-none focus:border-brasa";
  const disponiveis = produtos.filter((p) => p.disponivel !== false);

  return (
    <Janela titulo={titulo} aoFechar={aoFechar}>
      <form onSubmit={salvar} noValidate className="flex max-h-[92dvh] flex-col">
        <header className="flex items-center justify-between border-b border-carvao/10 px-6 py-4">
          <h2 className="titulo text-3xl">{titulo}</h2>
          <button type="button" onClick={aoFechar} aria-label="Fechar" className="grid size-10 place-items-center rounded-full hover:bg-papel">
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <div className="space-y-4 overflow-y-auto px-6 py-5">
          <label className="block font-semibold">
            Nome da promoção
            <input id="nome-promocao" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} placeholder="Ex.: Promo fim de semana" className={campo} />
          </label>
          <label className="block font-semibold">
            Descrição <span className="font-normal text-cinza">(opcional)</span>
            <input id="descricao-promocao" value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={200} placeholder="Ex.: Para dividir com quem você gosta" className={campo} />
          </label>

          <fieldset>
            <legend className="font-semibold">Itens da promoção</legend>
            <ul className="mt-2 space-y-2">
              {itens.map((i, n) => (
                <li key={n} className="flex items-end gap-2">
                  <label className="min-w-0 flex-1 text-sm">
                    <span className="sr-only">Produto {n + 1}</span>
                    <select aria-label={`Produto ${n + 1}`} value={i.produtoId} onChange={(e) => mudarItem(n, "produtoId", e.target.value)} className={campo}>
                      <option value="">Escolha um produto…</option>
                      {disponiveis.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="w-20 text-sm">
                    <span className="sr-only">Quantidade {n + 1}</span>
                    <input aria-label={`Quantidade ${n + 1}`} type="number" min={1} max={10} value={i.quantidade} onChange={(e) => mudarItem(n, "quantidade", e.target.value)} className={`${campo} tabular-nums`} />
                  </label>
                  {itens.length > 1 && (
                    <button type="button" onClick={() => setItens(itens.filter((_, k) => k !== n))} aria-label={`Remover item ${n + 1}`} className="mb-1 grid size-10 place-items-center rounded-full text-brasa hover:bg-brasa/10">
                      <Minus className="size-4" aria-hidden />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {itens.length < MAX_ITENS && (
              <button type="button" onClick={() => setItens([...itens, { produtoId: "", quantidade: "1" }])} className="mt-2 flex items-center gap-1.5 rounded-full border-2 border-carvao/15 px-4 py-2 text-sm font-bold hover:border-carvao">
                <Plus className="size-4" aria-hidden /> Adicionar item
              </button>
            )}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block font-semibold">
              Preço da promoção
              <input id="preco-promocao" inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="49,90" className={campo} />
            </label>
            <label className="block font-semibold">
              Válida até
              <input id="ate-promocao" type="date" value={ate} min={hojeSP()} onChange={(e) => setAte(e.target.value)} className={campo} />
            </label>
          </div>
          {separado > 0 && (
            <p className="rounded-xl bg-papel p-3 text-sm">
              Separado sairia por <strong className="tabular-nums">{formatarPreco(separado)}</strong>
              {paraCentavos(preco) !== null && paraCentavos(preco)! < separado && <> · o cliente economiza <strong className="tabular-nums">{formatarPreco(separado - paraCentavos(preco)!)}</strong></>}
            </p>
          )}
          <label className="flex items-center gap-3 font-semibold">
            <input id="ativo-promocao" type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="size-5 accent-brasa" />
            Mostrar no cardápio
          </label>

          {erros.length > 0 && (
            <div role="alert" className="rounded-xl border-2 border-brasa/40 bg-brasa/10 p-3 text-sm">
              {erros.map((e) => (
                <p key={e}>{e}</p>
              ))}
            </div>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-carvao/10 bg-papel px-6 py-4">
          <button type="button" onClick={aoFechar} className="rounded-full px-5 py-2.5 font-semibold">
            Cancelar
          </button>
          <button type="submit" disabled={salvando} className="rounded-full bg-brasa px-6 py-2.5 font-bold text-white disabled:opacity-60">
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </footer>
      </form>
    </Janela>
  );
}
