/**
 * Promoções da Brasa & Pão: preço promocional de um produto e kits (vários itens por um preço).
 * Tudo com data de fim: a promoção vale até o fim do dia "ate", no horário de São Paulo.
 * Módulo puro (sem banco, sem tela), para ser testado direto.
 */
import type { Produto } from "../data/cardapio.ts";
import type { ItemCarrinho } from "./pedido.ts";

export type ItemKit = { produtoId: string; quantidade: number };

export type Kit = {
  id: string;
  nome: string;
  descricao: string;
  itens: ItemKit[];
  /** Preço do kit, em centavos. */
  preco: number;
  /** Último dia da promoção (AAAA-MM-DD). */
  ate: string;
  ativo: boolean;
  ordem: number;
};

/** Kit pronto para mostrar: com o "de" (soma dos preços normais), nomes dos itens e foto. */
export type KitVigente = Kit & { de: number; nomes: { nome: string; quantidade: number }[]; foto: string };

/** Data de hoje (AAAA-MM-DD) em São Paulo. */
export function hojeSP(agoraMs: number = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(agoraMs));
}

export function promocaoVigente(p: Produto, hoje: string): boolean {
  return !!p.promocao && p.promocao.preco < p.preco && hoje <= p.promocao.ate;
}

/** Produto como o cliente vê: com a promoção aplicada (preço novo e o antigo em precoDe). */
export function comPromocao(p: Produto, hoje: string): Produto {
  return promocaoVigente(p, hoje) ? { ...p, preco: p.promocao!.preco, precoDe: p.preco } : p;
}

/** Kits que o cliente pode pedir hoje. Some se vencido, inativo ou com algum item esgotado/excluído. */
export function kitsVigentes(kits: Kit[], produtos: Produto[], hoje: string): KitVigente[] {
  const porId = new Map(produtos.map((p) => [p.id, p]));
  const out: KitVigente[] = [];
  for (const k of [...kits].sort((a, b) => a.ordem - b.ordem)) {
    if (!k.ativo || hoje > k.ate || k.itens.length === 0) continue;
    const itens = k.itens.map((i) => ({ ...i, produto: porId.get(i.produtoId) }));
    if (itens.some((i) => !i.produto || i.produto.disponivel === false)) continue;
    const de = itens.reduce((s, i) => s + i.produto!.preco * i.quantidade, 0);
    out.push({ ...k, de, nomes: itens.map((i) => ({ nome: i.produto!.nome, quantidade: i.quantidade })), foto: itens[0].produto!.foto });
  }
  return out;
}

/** "1x Cheeseburger + 1x X-Salada". */
export function descricaoKit(k: Pick<KitVigente, "nomes">): string {
  return k.nomes.map((n) => `${n.quantidade}x ${n.nome}`).join(" + ");
}

/** O kit entra no pedido como uma linha só, sem adicionais. */
export function itemDoKit(k: KitVigente, quantidade: number): ItemCarrinho {
  const produtoId = `kit:${k.id}`;
  return {
    chave: `${produtoId}|||`,
    produtoId,
    nome: `${k.nome} (${descricaoKit(k)})`,
    precoBase: k.preco,
    adicionais: [],
    quantidade,
  };
}

const SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/** "2026-11-22" → "até dom 22/11". */
export function rotuloAte(ate: string): string {
  const d = new Date(`${ate}T12:00:00Z`);
  return `até ${SEMANA[d.getUTCDay()]} ${ate.slice(8, 10)}/${ate.slice(5, 7)}`;
}
