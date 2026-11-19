/**
 * Camada de dados do cardápio. Duas implementações com a MESMA interface:
 * - firestore: dados reais (usada pelo site e pelo gerente logado);
 * - memoria: cópia local para o "modo demonstração" do painel (não grava nada).
 */
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { adicionais as adicionaisPadrao, categoriasPersonalizaveis, produtos as produtosPadrao, type Adicional, type Produto } from "@/data/cardapio";
import { loja as lojaPadrao } from "@/data/loja";

export const LOJA_ID = "brasa";

export type DadosLoja = { nome: string; whatsapp: string; taxaEntrega: number; tempoEntrega: string };

export type Cardapio = { loja: DadosLoja; produtos: Produto[]; adicionais: Adicional[] };

export interface Repositorio {
  carregar(): Promise<Cardapio>;
  salvarProduto(p: Produto): Promise<void>;
  excluirProduto(id: string): Promise<void>;
  salvarAdicional(a: Adicional): Promise<void>;
  excluirAdicional(id: string): Promise<void>;
  salvarLoja(l: DadosLoja): Promise<void>;
}

/** Cardápio embutido no site: reserva quando o banco não responde. */
export function cardapioReserva(): Cardapio {
  return {
    loja: { nome: lojaPadrao.nome, whatsapp: lojaPadrao.whatsapp, taxaEntrega: lojaPadrao.taxaEntrega, tempoEntrega: lojaPadrao.tempoEntrega },
    produtos: produtosPadrao.map((p, i) => ({ ...p, disponivel: p.disponivel ?? true, ordem: p.ordem ?? i })),
    adicionais: adicionaisPadrao.map((a, i) => ({ ...a, ordem: a.ordem ?? i })),
  };
}

const porOrdem = <T extends { ordem?: number }>(a: T, b: T) => (a.ordem ?? 0) - (b.ordem ?? 0);

/** Normaliza o produto vindo do banco (campos que o site deriva sozinho). */
function normalizarProduto(p: Produto): Produto {
  return { ...p, personalizavel: categoriasPersonalizaveis.includes(p.categoria), disponivel: p.disponivel !== false };
}

/** Só os campos que vão para o banco (as regras recusam campos inválidos). */
function produtoParaBanco(p: Produto) {
  return { nome: p.nome, descricao: p.descricao, preco: p.preco, categoria: p.categoria, foto: p.foto, disponivel: p.disponivel !== false, ordem: p.ordem ?? 0, ...(p.destaque ? { destaque: p.destaque } : {}) };
}

export function repositorioFirestore(): Repositorio {
  // Importação tardia: só carrega o SDK do Firebase quando for usado.
  const banco = async () => (await import("./firebase")).db;
  return {
    async carregar() {
      const db = await banco();
      const [lojaDoc, prods, adics] = await Promise.all([
        getDoc(doc(db, "lojas", LOJA_ID)),
        getDocs(collection(db, "lojas", LOJA_ID, "produtos")),
        getDocs(collection(db, "lojas", LOJA_ID, "adicionais")),
      ]);
      if (!lojaDoc.exists()) throw new Error("Loja ainda não cadastrada no banco");
      return {
        loja: lojaDoc.data() as DadosLoja,
        produtos: prods.docs.map((d) => normalizarProduto({ ...(d.data() as Produto), id: d.id })).sort(porOrdem),
        adicionais: adics.docs.map((d) => ({ ...(d.data() as Adicional), id: d.id })).sort(porOrdem),
      };
    },
    async salvarProduto(p) {
      await setDoc(doc(await banco(), "lojas", LOJA_ID, "produtos", p.id), produtoParaBanco(p));
    },
    async excluirProduto(id) {
      await deleteDoc(doc(await banco(), "lojas", LOJA_ID, "produtos", id));
    },
    async salvarAdicional(a) {
      await setDoc(doc(await banco(), "lojas", LOJA_ID, "adicionais", a.id), { nome: a.nome, preco: a.preco, ordem: a.ordem ?? 0 });
    },
    async excluirAdicional(id) {
      await deleteDoc(doc(await banco(), "lojas", LOJA_ID, "adicionais", id));
    },
    async salvarLoja(l) {
      await setDoc(doc(await banco(), "lojas", LOJA_ID), l);
    },
  };
}

export function repositorioMemoria(inicial: Cardapio = cardapioReserva()): Repositorio {
  let dados = structuredClone(inicial);
  return {
    async carregar() {
      return structuredClone({ ...dados, produtos: dados.produtos.map(normalizarProduto).sort(porOrdem), adicionais: [...dados.adicionais].sort(porOrdem) });
    },
    async salvarProduto(p) {
      dados.produtos = [...dados.produtos.filter((x) => x.id !== p.id), p];
    },
    async excluirProduto(id) {
      dados.produtos = dados.produtos.filter((x) => x.id !== id);
    },
    async salvarAdicional(a) {
      dados.adicionais = [...dados.adicionais.filter((x) => x.id !== a.id), a];
    },
    async excluirAdicional(id) {
      dados.adicionais = dados.adicionais.filter((x) => x.id !== id);
    },
    async salvarLoja(l) {
      dados = { ...dados, loja: l };
    },
  };
}
