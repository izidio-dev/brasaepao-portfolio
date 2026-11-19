"use client";

import { ArrowLeft, Minus, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { useState } from "react";
import {
  formatarPreco,
  linkWhatsApp,
  mensagemPedido,
  subtotalItem,
  totais,
  type ItemCarrinho,
  type Modo,
  type Pagamento,
} from "@/lib/pedido";
import type { DadosLoja } from "@/lib/repositorio";
import { Janela } from "./Janela";

const pagamentos: Pagamento[] = ["Pix", "Cartão na entrega", "Dinheiro"];

/** Gaveta do carrinho: itens → dados do pedido → revisão → WhatsApp. */
export function Carrinho({
  itens,
  loja,
  aoFechar,
  aoMudarQuantidade,
  aoLimpar,
}: {
  itens: ItemCarrinho[];
  loja: DadosLoja;
  aoFechar: () => void;
  aoMudarQuantidade: (chave: string, quantidade: number) => void;
  aoLimpar: () => void;
}) {
  const [modo, setModo] = useState<Modo>("entrega");
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [pagamento, setPagamento] = useState<Pagamento | "">("");
  const [troco, setTroco] = useState("");
  const [erros, setErros] = useState<string[]>([]);
  const [revisando, setRevisando] = useState(false);

  const { subtotal, taxa, total } = totais(itens, modo, loja.taxaEntrega);
  const trocoCentavos = Math.round(parseFloat(troco.replace(",", ".")) * 100) || 0;

  function revisar() {
    const lista: string[] = [];
    if (!nome.trim()) lista.push("Informe seu nome.");
    if (modo === "entrega" && !endereco.trim()) lista.push("Informe o endereço de entrega.");
    if (!pagamento) lista.push("Escolha a forma de pagamento.");
    if (pagamento === "Dinheiro" && troco && trocoCentavos < total)
      lista.push(`O valor para troco precisa ser maior que o total (${formatarPreco(total)}).`);
    setErros(lista);
    if (lista.length === 0) setRevisando(true);
  }

  const mensagem =
    revisando && pagamento
      ? mensagemPedido({
          itens,
          modo,
          nome: nome.trim(),
          endereco: endereco.trim(),
          pagamento,
          trocoPara: pagamento === "Dinheiro" && trocoCentavos ? trocoCentavos : undefined,
          taxaEntrega: loja.taxaEntrega,
        })
      : "";

  const campo = "mt-1.5 w-full rounded-xl border-2 border-carvao/10 bg-white px-4 py-3 outline-none focus:border-brasa";
  const pilula =
    "relative cursor-pointer rounded-full border-2 border-carvao/15 px-4 py-2 text-sm font-semibold has-checked:border-carvao has-checked:bg-carvao has-checked:text-creme";

  return (
    <Janela titulo="Seu pedido" aoFechar={aoFechar} lateral>
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-carvao/10 px-5 py-4">
          {revisando ? (
            <button type="button" onClick={() => setRevisando(false)} className="flex items-center gap-2 font-semibold">
              <ArrowLeft className="size-5" aria-hidden /> Voltar
            </button>
          ) : (
            <h2 className="titulo text-3xl">Seu pedido</h2>
          )}
          <button type="button" onClick={aoFechar} aria-label="Fechar carrinho" className="grid size-10 place-items-center rounded-full hover:bg-papel">
            <X className="size-5" aria-hidden />
          </button>
        </header>

        {itens.length === 0 ? (
          <div className="grid flex-1 place-items-center p-8 text-center">
            <div>
              <p className="titulo text-3xl">Carrinho vazio</p>
              <p className="mt-2 text-cinza">Escolha um lanche no cardápio para começar.</p>
            </div>
          </div>
        ) : revisando ? (
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <p className="font-semibold">Confira como o pedido chega para a loja:</p>
            <pre className="mt-3 rounded-2xl bg-white p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap">{mensagem}</pre>
            <p className="mt-4 rounded-xl bg-mostarda/25 p-3 text-sm">
              <strong>Demonstração:</strong> esta loja é fictícia. O botão abaixo envia o pedido para o WhatsApp do desenvolvedor do site, só para mostrar como funciona.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <ul className="divide-y divide-carvao/10">
              {itens.map((item) => (
                <li key={item.chave} className="py-4">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold">{item.nome}</p>
                      {item.adicionais.length > 0 && <p className="text-sm text-cinza">+ {item.adicionais.map((a) => a.nome).join(", ")}</p>}
                      {item.ponto && <p className="text-sm text-cinza">{item.ponto}</p>}
                      {item.observacao && <p className="text-sm text-cinza italic">“{item.observacao}”</p>}
                    </div>
                    <p className="shrink-0 font-bold tabular-nums">{formatarPreco(subtotalItem(item))}</p>
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <button type="button" aria-label={`Diminuir ${item.nome}`} onClick={() => aoMudarQuantidade(item.chave, item.quantidade - 1)} className="grid size-9 place-items-center rounded-full bg-white">
                      {item.quantidade === 1 ? <Trash2 className="size-4 text-brasa" aria-hidden /> : <Minus className="size-4" aria-hidden />}
                    </button>
                    <span className="w-7 text-center font-semibold tabular-nums">{item.quantidade}</span>
                    <button type="button" aria-label={`Aumentar ${item.nome}`} onClick={() => aoMudarQuantidade(item.chave, item.quantidade + 1)} className="grid size-9 place-items-center rounded-full bg-white">
                      <Plus className="size-4" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <button type="button" onClick={aoLimpar} className="text-sm font-semibold text-brasa underline-offset-4 hover:underline">
              Esvaziar carrinho
            </button>

            <form
              className="mt-6 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                revisar();
              }}
              noValidate
            >
              <fieldset>
                <legend className="titulo text-xl">Como quer receber?</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  <label className={pilula}>
                    <input type="radio" name="modo" className="absolute inset-0 cursor-pointer appearance-none rounded-full" checked={modo === "entrega"} onChange={() => setModo("entrega")} />
                    Entregar no endereço
                  </label>
                  <label className={pilula}>
                    <input type="radio" name="modo" className="absolute inset-0 cursor-pointer appearance-none rounded-full" checked={modo === "retirada"} onChange={() => setModo("retirada")} />
                    Retirar no balcão
                  </label>
                </div>
              </fieldset>

              <label className="block font-semibold">
                Seu nome
                <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="given-name" className={campo} />
              </label>

              {modo === "entrega" && (
                <label className="block font-semibold">
                  Endereço de entrega
                  <input id="endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} autoComplete="street-address" placeholder="Rua, número, bairro e complemento" className={campo} />
                </label>
              )}

              <fieldset>
                <legend className="titulo text-xl">Pagamento</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {pagamentos.map((p) => (
                    <label key={p} className={pilula}>
                      <input type="radio" name="pagamento" className="absolute inset-0 cursor-pointer appearance-none rounded-full" checked={pagamento === p} onChange={() => setPagamento(p)} />
                      {p}
                    </label>
                  ))}
                </div>
              </fieldset>

              {pagamento === "Dinheiro" && (
                <label className="block font-semibold">
                  Troco para quanto?
                  <input id="troco" inputMode="decimal" value={troco} onChange={(e) => setTroco(e.target.value)} placeholder="Deixe vazio se não precisar" className={campo} />
                </label>
              )}

              {erros.length > 0 && (
                <div role="alert" className="rounded-xl border-2 border-brasa/40 bg-brasa/10 p-3 text-sm">
                  {erros.map((e) => (
                    <p key={e}>{e}</p>
                  ))}
                </div>
              )}

              <p className="flex gap-2 text-xs text-cinza">
                <ShieldCheck className="size-4 shrink-0" aria-hidden />
                Seus dados são usados só para montar a mensagem do pedido. Nada fica salvo em servidor.
              </p>
            </form>
          </div>
        )}

        {itens.length > 0 && (
          <footer className="border-t border-carvao/10 bg-papel px-5 py-4">
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{formatarPreco(subtotal)}</dd></div>
              <div className="flex justify-between"><dt>{modo === "entrega" ? "Entrega" : "Retirada"}</dt><dd className="tabular-nums">{taxa ? formatarPreco(taxa) : "Grátis"}</dd></div>
              <div className="flex justify-between text-lg font-bold"><dt>Total</dt><dd data-testid="total" className="tabular-nums">{formatarPreco(total)}</dd></div>
            </dl>
            {revisando ? (
              <a
                href={linkWhatsApp(loja.whatsapp, mensagem)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block rounded-full bg-[#1f9e55] px-5 py-3.5 text-center font-bold text-white hover:bg-[#178246]"
              >
                Enviar pelo WhatsApp (demonstração)
              </a>
            ) : (
              <button type="button" onClick={revisar} className="mt-3 w-full rounded-full bg-brasa px-5 py-3.5 font-bold text-white hover:bg-brasa-escura">
                Revisar pedido
              </button>
            )}
          </footer>
        )}
      </div>
    </Janela>
  );
}
