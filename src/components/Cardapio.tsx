"use client";

import Image from "next/image";
import { Bike, Clock, ShoppingBag, Store } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { categorias, type Produto } from "@/data/cardapio";
import { useCardapio, produtosVisiveis } from "@/lib/useCardapio";
import { loja as dadosFixos } from "@/data/loja";

const enderecoLoja = dadosFixos.endereco;
import { formatarPreco, totais, type ItemCarrinho } from "@/lib/pedido";
import { comPromocao, hojeSP, itemDoKit, kitsVigentes } from "@/lib/promocao";
import { CartaoKit } from "./CartaoKit";
import { CartaoProduto } from "./CartaoProduto";
import { Carrinho } from "./Carrinho";
import { ModalProduto } from "./ModalProduto";
import { StatusLoja } from "./StatusLoja";

const CHAVE = "brasa-carrinho";

/** Lê o carrinho salvo; se estiver ausente ou corrompido, começa vazio. */
function carregarCarrinho(): ItemCarrinho[] {
  try {
    const bruto = localStorage.getItem(CHAVE);
    const dados = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(dados) ? dados.filter((i) => i && typeof i.chave === "string" && i.quantidade > 0) : [];
  } catch {
    return [];
  }
}

export function Cardapio() {
  const { cardapio, origem } = useCardapio();
  const { loja } = cardapio;
  // A data só é lida no navegador (o site é gerado antes, sem saber o dia de hoje).
  const [hoje, setHoje] = useState<string | null>(null);
  useEffect(() => setHoje(hojeSP()), []);
  const produtos = useMemo(() => produtosVisiveis(cardapio.produtos).map((p) => (hoje ? comPromocao(p, hoje) : p)), [cardapio.produtos, hoje]);
  const kits = useMemo(() => (hoje ? kitsVigentes(cardapio.kits ?? [], produtos, hoje) : []), [cardapio.kits, produtos, hoje]);
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [produtoAberto, setProdutoAberto] = useState<Produto | null>(null);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    setItens(carregarCarrinho());
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (!carregado) return;
    try {
      localStorage.setItem(CHAVE, JSON.stringify(itens));
    } catch {
      /* navegador sem armazenamento: o carrinho só vale nesta visita */
    }
  }, [itens, carregado]);

  // Carrinho salvo de outra visita: tira kits que acabaram e atualiza preços que mudaram
  // (ex.: promoção que venceu). Só depois de ter o cardápio real (do navegador ou do banco).
  useEffect(() => {
    if (!carregado || !hoje || origem === "reserva") return;
    setItens((atual) => {
      const novos = atual
        .filter((i) => !i.produtoId.startsWith("kit:") || kits.some((k) => `kit:${k.id}` === i.produtoId))
        .map((i) => {
          if (i.produtoId.startsWith("kit:")) return { ...i, precoBase: kits.find((k) => `kit:${k.id}` === i.produtoId)!.preco };
          const p = produtos.find((x) => x.id === i.produtoId);
          return p ? { ...i, precoBase: p.preco } : i;
        });
      return JSON.stringify(novos) === JSON.stringify(atual) ? atual : novos;
    });
  }, [carregado, hoje, origem, kits, produtos]);

  const quantidadeTotal = itens.reduce((s, i) => s + i.quantidade, 0);
  const { subtotal } = totais(itens, "retirada", 0);

  function adicionar(item: ItemCarrinho) {
    setItens((atual) => {
      const existente = atual.find((i) => i.chave === item.chave);
      if (existente) return atual.map((i) => (i.chave === item.chave ? { ...i, quantidade: i.quantidade + item.quantidade } : i));
      return [...atual, item];
    });
    setProdutoAberto(null);
    setAviso(`${item.quantidade}x ${item.nome} adicionado ao pedido`);
    setTimeout(() => setAviso(""), 2500);
  }

  function mudarQuantidade(chave: string, quantidade: number) {
    setItens((atual) => (quantidade <= 0 ? atual.filter((i) => i.chave !== chave) : atual.map((i) => (i.chave === chave ? { ...i, quantidade } : i))));
  }

  const destaque = produtos.find((p) => p.categoria === "burgers") ?? produtos[0];

  return (
    <>
      {/* Faixa de demonstração */}
      <p className="bg-carvao px-4 py-1.5 text-center text-xs text-creme/80">
        Projeto de demonstração · empresa fictícia criada para portfólio
      </p>

      <header className="sticky top-0 z-30 border-b border-carvao/10 bg-creme/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <a href="#topo" className="titulo text-2xl sm:text-3xl">
            Brasa <span className="text-brasa">&amp;</span> Pão
          </a>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block"><StatusLoja /></span>
            <button
              type="button"
              onClick={() => setCarrinhoAberto(true)}
              aria-label="Ver carrinho"
              className="relative grid size-11 place-items-center rounded-full bg-carvao text-creme"
            >
              <ShoppingBag className="size-5" aria-hidden />
              {quantidadeTotal > 0 && (
                <span data-testid="contador-carrinho" className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-brasa px-1 text-[11px] font-bold">
                  {quantidadeTotal}
                </span>
              )}
            </button>
          </div>
        </div>
        <nav aria-label="Categorias" className="mx-auto max-w-6xl overflow-x-auto px-4 pb-3">
          <ul className="flex gap-2">
            {kits.length > 0 && (
              <li>
                <a href="#promocoes" className="block rounded-full border-2 border-brasa bg-brasa px-4 py-1.5 text-sm font-bold whitespace-nowrap text-white">
                  Promoções
                </a>
              </li>
            )}
            {categorias.map((c) => (
              <li key={c.id}>
                <a href={`#${c.id}`} className="block rounded-full border-2 border-carvao/15 px-4 py-1.5 text-sm font-bold whitespace-nowrap hover:border-carvao">
                  {c.nome}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="topo">
        {/* Destaque */}
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pt-8 pb-12 md:grid-cols-[1.1fr_1fr] md:pt-14">
          <div>
            <span className="sm:hidden"><StatusLoja /></span>
            <h1 className="titulo mt-3 text-[clamp(3.2rem,9vw,6.5rem)]">
              Hambúrguer na <span className="text-brasa">brasa</span>, do jeito que tem que ser.
            </h1>
            <p className="mt-5 max-w-md text-lg text-cinza">
              Blend artesanal, pão brioche e batata feita na hora. Monte seu pedido aqui e ele chega pronto no nosso WhatsApp.
            </p>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
              <li className="flex items-center gap-2"><Clock className="size-4 text-brasa" aria-hidden />{loja.tempoEntrega}</li>
              <li className="flex items-center gap-2"><Bike className="size-4 text-brasa" aria-hidden />Entrega {formatarPreco(loja.taxaEntrega)}</li>
              <li className="flex items-center gap-2"><Store className="size-4 text-brasa" aria-hidden />Retirada grátis</li>
            </ul>
            <a href="#burgers" className="mt-8 inline-block rounded-full bg-brasa px-7 py-3.5 font-bold text-white hover:bg-brasa-escura">
              Ver cardápio
            </a>
          </div>
          {destaque && <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] rotate-1">
              <Image src={destaque.foto} alt={destaque.nome} fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            </div>
            <button
              type="button"
              onClick={() => setProdutoAberto(destaque)}
              className="absolute -bottom-5 left-4 grid size-28 -rotate-12 place-items-center rounded-full bg-mostarda text-center shadow-lg transition-transform hover:rotate-0 sm:size-32"
            >
              <span className="titulo text-lg leading-none">
                {destaque.nome.split(" ")[0]}
                <br />
                <span className="text-2xl">{formatarPreco(destaque.preco)}</span>
              </span>
            </button>
          </div>}
        </section>

        {/* Promoções (kits) */}
        {kits.length > 0 && (
          <section id="promocoes" aria-labelledby="t-promocoes" className="mx-auto max-w-6xl px-4 py-10">
            <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b-2 border-dashed border-brasa/30 pb-3">
              <h2 id="t-promocoes" className="titulo text-4xl text-brasa sm:text-5xl">Promoções</h2>
              <span className="text-sm font-semibold text-cinza">por tempo limitado</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {kits.map((k) => (
                <CartaoKit key={k.id} kit={k} aoAdicionar={() => adicionar(itemDoKit(k, 1))} />
              ))}
            </div>
          </section>
        )}

        {/* Categorias */}
        {categorias.map((c) => {
          const lista = produtos.filter((p) => p.categoria === c.id);
          if (lista.length === 0) return null;
          return (
            <section key={c.id} id={c.id} aria-labelledby={`t-${c.id}`} className="mx-auto max-w-6xl px-4 py-10">
              <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b-2 border-dashed border-carvao/20 pb-3">
                <h2 id={`t-${c.id}`} className="titulo text-4xl break-words sm:text-5xl">{c.nome}</h2>
                <span className="text-sm font-semibold text-cinza">{lista.length} opções</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {lista.map((p) => (
                  <CartaoProduto key={p.id} produto={p} aoEscolher={() => setProdutoAberto(p)} />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      <footer className="mt-10 bg-carvao text-creme/80">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm sm:grid-cols-3">
          <div>
            <p className="titulo text-3xl text-creme">Brasa &amp; Pão</p>
            <p className="mt-2">{enderecoLoja}</p>
          </div>
          <div>
            <p className="font-bold text-creme">Horário</p>
            <p className="mt-2">Terça a quinta e domingo: 18h às 23h30<br />Sexta e sábado: 18h à meia-noite</p>
          </div>
          <div>
            <p className="font-bold text-creme">Privacidade</p>
            <p className="mt-2">Usamos seu nome e endereço só para montar a mensagem do pedido. Nenhum dado fica salvo em servidor.</p>
          </div>
        </div>
        <p className="border-t border-creme/10 px-4 py-4 text-center text-xs">
          Empresa fictícia para demonstração · Fotos: Unsplash
        </p>
      </footer>

      {/* Barra inferior no celular */}
      {quantidadeTotal > 0 && !carrinhoAberto && (
        <button
          type="button"
          onClick={() => setCarrinhoAberto(true)}
          className="fixed inset-x-4 bottom-4 z-20 flex items-center justify-between rounded-full bg-brasa px-5 py-3.5 font-bold text-white shadow-xl sm:hidden"
        >
          <span>Ver pedido · {quantidadeTotal} {quantidadeTotal === 1 ? "item" : "itens"}</span>
          <span className="tabular-nums">{formatarPreco(subtotal)}</span>
        </button>
      )}

      <p role="status" aria-live="polite" className={`fixed top-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-carvao px-4 py-2 text-sm text-creme shadow-lg transition-opacity ${aviso ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        {aviso}
      </p>

      {produtoAberto && <ModalProduto produto={produtoAberto} adicionais={cardapio.adicionais} aoFechar={() => setProdutoAberto(null)} aoAdicionar={adicionar} />}
      {carrinhoAberto && (
        <Carrinho itens={itens} loja={loja} aoFechar={() => setCarrinhoAberto(false)} aoMudarQuantidade={mudarQuantidade} aoLimpar={() => setItens([])} />
      )}
    </>
  );
}
