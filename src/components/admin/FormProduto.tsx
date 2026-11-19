"use client";

import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { useState } from "react";
import { categorias, type Categoria, type Produto } from "@/data/cardapio";
import { reduzirImagem } from "@/lib/imagem";
import { centavosParaTexto, paraCentavos } from "@/lib/preco";
import { Janela } from "../Janela";

/** Cria um id legível a partir do nome: "X-Tudo Duplo" → "x-tudo-duplo-k3f9". */
function gerarId(nome: string) {
  const base = nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${base || "produto"}-${Math.random().toString(36).slice(2, 6)}`;
}

export function FormProduto({
  produto,
  proximaOrdem,
  aoFechar,
  aoSalvar,
}: {
  produto: Produto | null;
  proximaOrdem: number;
  aoFechar: () => void;
  aoSalvar: (p: Produto) => Promise<boolean>;
}) {
  const titulo = produto ? "Editar produto" : "Novo produto";
  const [nome, setNome] = useState(produto?.nome ?? "");
  const [descricao, setDescricao] = useState(produto?.descricao ?? "");
  const [preco, setPreco] = useState(produto ? centavosParaTexto(produto.preco) : "");
  const [categoria, setCategoria] = useState<Categoria | "">(produto?.categoria ?? "");
  const [destaque, setDestaque] = useState(produto?.destaque ?? "");
  const [foto, setFoto] = useState(produto?.foto ?? "");
  const [disponivel, setDisponivel] = useState(produto?.disponivel !== false);
  const [erros, setErros] = useState<string[]>([]);
  const [processandoFoto, setProcessandoFoto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function escolherFoto(arquivo?: File) {
    if (!arquivo) return;
    setProcessandoFoto(true);
    try {
      setFoto(await reduzirImagem(arquivo));
      setErros([]);
    } catch (e) {
      setErros([e instanceof Error ? e.message : "Não foi possível usar essa foto."]);
    } finally {
      setProcessandoFoto(false);
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const centavos = paraCentavos(preco);
    const lista: string[] = [];
    if (!nome.trim()) lista.push("Informe o nome do produto.");
    if (centavos === null) lista.push("Informe um preço válido, por exemplo 28,90.");
    if (!categoria) lista.push("Escolha a categoria.");
    setErros(lista);
    if (lista.length || centavos === null || !categoria) return;

    setSalvando(true);
    await aoSalvar({
      id: produto?.id ?? gerarId(nome),
      nome: nome.trim(),
      descricao: descricao.trim(),
      preco: centavos,
      categoria,
      destaque: destaque.trim() || undefined,
      foto: foto || "/fotos/classico.webp",
      disponivel,
      ordem: produto?.ordem ?? proximaOrdem,
    });
    setSalvando(false);
  }

  const campo = "mt-1.5 w-full rounded-xl border-2 border-carvao/10 bg-white px-4 py-2.5 outline-none focus:border-brasa";

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
          <div className="flex items-center gap-4">
            <div className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-papel">
              {foto ? <Image src={foto} alt="Foto do produto" fill sizes="96px" className="object-cover" /> : <ImagePlus className="size-6 text-cinza" aria-hidden />}
            </div>
            <label className="cursor-pointer rounded-full border-2 border-carvao/15 px-4 py-2 text-sm font-bold hover:border-carvao">
              {processandoFoto ? "Reduzindo foto…" : foto ? "Trocar foto" : "Escolher foto"}
              <input id="foto" type="file" accept="image/*" className="sr-only" onChange={(e) => escolherFoto(e.target.files?.[0])} />
            </label>
          </div>

          <label className="block font-semibold">
            Nome
            <input id="nome-produto" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} className={campo} />
          </label>
          <label className="block font-semibold">
            Descrição
            <textarea id="descricao-produto" value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={300} rows={3} className={`${campo} resize-none`} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block font-semibold">
              Preço
              <input id="preco-produto" inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="28,90" className={campo} />
            </label>
            <label className="block font-semibold">
              Categoria
              <select id="categoria-produto" value={categoria} onChange={(e) => setCategoria(e.target.value as Categoria)} className={campo}>
                <option value="">Escolha…</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block font-semibold">
            Selo de destaque <span className="font-normal text-cinza">(opcional)</span>
            <input id="destaque-produto" value={destaque} onChange={(e) => setDestaque(e.target.value)} maxLength={24} placeholder="Ex.: Novo, Mais pedido" className={campo} />
          </label>
          <label className="flex items-center gap-3 font-semibold">
            <input id="disponivel-produto" type="checkbox" checked={disponivel} onChange={(e) => setDisponivel(e.target.checked)} className="size-5 accent-brasa" />
            Disponível no cardápio
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
          <button type="submit" disabled={salvando || processandoFoto} className="rounded-full bg-brasa px-6 py-2.5 font-bold text-white disabled:opacity-60">
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </footer>
      </form>
    </Janela>
  );
}
