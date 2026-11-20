import Image from "next/image";
import { Plus } from "lucide-react";
import { formatarPreco } from "@/lib/pedido";
import { descricaoKit, rotuloAte, type KitVigente } from "@/lib/promocao";

/** Kit promocional: vários itens por um preço só. */
export function CartaoKit({ kit, aoAdicionar }: { kit: KitVigente; aoAdicionar: () => void }) {
  const economia = kit.de - kit.preco;
  return (
    <article className="relative flex gap-4 overflow-hidden rounded-3xl border-2 border-dashed border-brasa/40 bg-white p-3 sm:p-4">
      <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-2xl sm:w-36">
        <Image src={kit.foto} alt="" fill sizes="144px" className="object-cover" />
        {economia > 0 && (
          <span className="absolute top-2 left-2 rounded-full bg-mostarda px-2.5 py-1 text-[11px] font-extrabold text-carvao uppercase">
            Economize {formatarPreco(economia)}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs font-bold tracking-wide text-brasa uppercase">{rotuloAte(kit.ate)}</span>
        <h3 className="text-lg leading-tight font-extrabold">{kit.nome}</h3>
        <p className="mt-1 text-sm font-semibold">{descricaoKit(kit)}</p>
        {kit.descricao && <p className="mt-1 line-clamp-2 text-sm text-cinza">{kit.descricao}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <p className="leading-tight">
            {kit.de > kit.preco && <s className="block text-sm text-cinza tabular-nums">{formatarPreco(kit.de)}</s>}
            <span className="text-xl font-extrabold text-brasa tabular-nums">{formatarPreco(kit.preco)}</span>
          </p>
          <button
            type="button"
            onClick={aoAdicionar}
            aria-label={`Adicionar ${kit.nome}`}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-brasa text-white transition-colors hover:bg-brasa-escura"
          >
            <Plus className="size-5" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}
