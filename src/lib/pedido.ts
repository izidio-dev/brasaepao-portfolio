import { loja } from "@/data/loja";

/** Uma linha do carrinho: um produto com as escolhas do cliente. */
export type ItemCarrinho = {
  /** Identifica a combinação produto + adicionais + ponto (ver chaveItem). */
  chave: string;
  produtoId: string;
  nome: string;
  precoBase: number;
  adicionais: { id: string; nome: string; preco: number }[];
  ponto?: string;
  observacao?: string;
  quantidade: number;
};

export type Modo = "entrega" | "retirada";
export type Pagamento = "Pix" | "Cartão na entrega" | "Dinheiro";

export type Pedido = {
  itens: ItemCarrinho[];
  modo: Modo;
  nome: string;
  endereco?: string;
  pagamento: Pagamento;
  trocoPara?: number;
  /** Taxa de entrega atual (vem do painel); padrão = dados embutidos. */
  taxaEntrega?: number;
};

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** 7080 → "R$ 70,80" (troca o espaço especial do Intl por espaço comum). */
export function formatarPreco(centavos: number): string {
  return moeda.format(centavos / 100).replace(/ /g, " ");
}

/**
 * Mesmo lanche com escolhas diferentes vira linhas diferentes no carrinho.
 * A ordem dos adicionais não importa.
 */
export function chaveItem(produtoId: string, adicionaisIds: string[], ponto?: string, observacao?: string): string {
  return [produtoId, [...adicionaisIds].sort().join("+"), ponto ?? "", (observacao ?? "").trim()].join("|");
}

export function subtotalItem(item: ItemCarrinho): number {
  const extras = item.adicionais.reduce((soma, a) => soma + a.preco, 0);
  return (item.precoBase + extras) * item.quantidade;
}

export function totais(itens: ItemCarrinho[], modo: Modo, taxaEntrega: number = loja.taxaEntrega) {
  const subtotal = itens.reduce((soma, i) => soma + subtotalItem(i), 0);
  const taxa = modo === "entrega" && itens.length > 0 ? taxaEntrega : 0;
  return { subtotal, taxa, total: subtotal + taxa };
}

/** Texto do pedido no formato do WhatsApp (*negrito*). */
export function mensagemPedido(p: Pedido): string {
  const { subtotal, taxa, total } = totais(p.itens, p.modo, p.taxaEntrega);
  const linhas: string[] = [`*Pedido — ${loja.nome}*`, "", `Cliente: ${p.nome}`, ""];

  for (const item of p.itens) {
    linhas.push(`${item.quantidade}x ${item.nome} — ${formatarPreco(subtotalItem(item))}`);
    for (const a of item.adicionais) linhas.push(`   + ${a.nome}`);
    if (item.ponto) linhas.push(`   Ponto: ${item.ponto}`);
    if (item.observacao?.trim()) linhas.push(`   Obs.: ${item.observacao.trim()}`);
  }

  linhas.push("", `Subtotal: ${formatarPreco(subtotal)}`);
  if (p.modo === "entrega") {
    linhas.push(`Entrega: ${formatarPreco(taxa)}`, `Endereço: ${p.endereco ?? ""}`);
  } else {
    linhas.push("Retirada no balcão");
  }
  linhas.push(`Pagamento: ${p.pagamento}`);
  if (p.pagamento === "Dinheiro" && p.trocoPara) linhas.push(`Troco para ${formatarPreco(p.trocoPara)}`);
  linhas.push("", `*Total: ${formatarPreco(total)}*`);
  return linhas.join("\n");
}

export function linkWhatsApp(numero: string, texto: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}
