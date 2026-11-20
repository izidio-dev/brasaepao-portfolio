import Image from "next/image";
import { Plus } from "lucide-react";
import type { Produto } from "@/data/cardapio";
import { formatarPreco } from "@/lib/pedido";
import { rotuloAte } from "@/lib/promocao";

export function CartaoProduto({ produto, aoEscolher }: { produto: Produto; aoEscolher: () => void }) {
  return (
    <article className="group flex gap-4 rounded-3xl bg-white p-3 shadow-[0_1px_0_rgb(30_26_23/.06)] transition-shadow hover:shadow-[0_10px_30px_-12px_rgb(30_26_23/.35)] sm:flex-col sm:gap-0 sm:p-0">
      <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-2xl sm:aspect-[4/3] sm:w-full sm:rounded-b-none sm:rounded-t-3xl">
        <Image src={produto.foto} alt={produto.nome} fill sizes="(min-width: 640px) 33vw, 112px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        {produto.precoDe && produto.promocao ? (
          <span className="absolute top-2 left-2 rounded-full bg-brasa px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-white uppercase">
            Promoção {rotuloAte(produto.promocao.ate)}
          </span>
        ) : produto.destaque && (
          <span className="absolute top-2 left-2 rounded-full bg-mostarda px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-carvao uppercase">
            {produto.destaque}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col sm:p-5">
        <h3 className="text-lg leading-tight font-extrabold">{produto.nome}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-cinza">{produto.descricao}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="leading-tight">
            {produto.precoDe && <s className="block text-xs text-cinza tabular-nums">{formatarPreco(produto.precoDe)}</s>}
            <span className="text-lg font-extrabold text-brasa tabular-nums">{formatarPreco(produto.preco)}</span>
          </span>
          <button
            type="button"
            onClick={aoEscolher}
            aria-label={`Adicionar ${produto.nome}`}
            className="grid size-10 place-items-center rounded-full bg-carvao text-creme transition-colors hover:bg-brasa"
          >
            <Plus className="size-5" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}
