/**
 * Cardápio da hamburgueria. Preços em CENTAVOS (2890 = R$ 28,90),
 * assim as contas nunca têm erro de arredondamento.
 * Fotos: Unsplash (licença Unsplash, uso comercial permitido).
 */

export type Categoria = "burgers" | "combos" | "acompanhamentos" | "bebidas";

export type Adicional = { id: string; nome: string; preco: number; ordem?: number };

export type Produto = {
  id: string;
  categoria: Categoria;
  nome: string;
  descricao: string;
  preco: number;
  foto: string;
  destaque?: string;
  /** Lanches deixam escolher o ponto da carne e adicionais. */
  personalizavel?: boolean;
  /** false = "Esgotado": some do cardápio público, continua no painel. */
  disponivel?: boolean;
  /** Posição na lista (menor aparece primeiro). */
  ordem?: number;
};

/** Burgers e combos sempre permitem ponto da carne e adicionais. */
export const categoriasPersonalizaveis: Categoria[] = ["burgers", "combos"];

export const categorias: { id: Categoria; nome: string }[] = [
  { id: "burgers", nome: "Burgers" },
  { id: "combos", nome: "Combos" },
  { id: "acompanhamentos", nome: "Acompanhamentos" },
  { id: "bebidas", nome: "Bebidas" },
];

export const adicionais: Adicional[] = [
  { id: "bacon", nome: "Bacon crocante", preco: 400 },
  { id: "cheddar", nome: "Cheddar extra", preco: 300 },
  { id: "ovo", nome: "Ovo na chapa", preco: 250 },
  { id: "carne", nome: "Carne extra 150 g", preco: 900 },
  { id: "cebola", nome: "Cebola caramelizada", preco: 300 },
];

export const pontos = ["Mal passado", "Ao ponto", "Bem passado"] as const;

export const produtos: Produto[] = [
  { id: "classico", categoria: "burgers", nome: "Clássico Brasa", descricao: "Blend 160 g na brasa, queijo prato, alface, tomate, cebola roxa e maionese da casa no pão brioche.", preco: 2890, foto: "/fotos/classico.webp", destaque: "Mais pedido", personalizavel: true },
  { id: "duplo-cheddar", categoria: "burgers", nome: "Duplo Cheddar", descricao: "Dois blends de 120 g, cheddar derretido em dobro, picles e molho especial.", preco: 3490, foto: "/fotos/duplo-cheddar.webp", personalizavel: true },
  { id: "salada", categoria: "burgers", nome: "Brasa Salada", descricao: "Blend 160 g, queijo, alface americana, tomate, cebola e maionese verde.", preco: 2990, foto: "/fotos/salada.webp", personalizavel: true },
  { id: "bacon", categoria: "burgers", nome: "Bacon Supremo", descricao: "Blend 180 g, cheddar, fatias generosas de bacon, alface, tomate e barbecue defumado.", preco: 3690, foto: "/fotos/bacon.webp", destaque: "Novo", personalizavel: true },
  { id: "pastrami", categoria: "burgers", nome: "Torre Pastrami", descricao: "Dois blends de 150 g, pastrami da casa, queijo suíço e mostarda escura.", preco: 3990, foto: "/fotos/pastrami.webp", personalizavel: true },
  { id: "combo-classico", categoria: "combos", nome: "Combo Clássico", descricao: "Clássico Brasa + batata palito média + bebida à escolha (informe na observação).", preco: 3990, foto: "/fotos/combo.webp", destaque: "Economize R$ 9", personalizavel: true },
  { id: "batata-palito", categoria: "acompanhamentos", nome: "Batata palito", descricao: "Porção individual, sequinha e crocante.", preco: 1490, foto: "/fotos/batata-palito.webp" },
  { id: "batata-rustica", categoria: "acompanhamentos", nome: "Batata rústica", descricao: "Com casca, alecrim e páprica defumada.", preco: 1690, foto: "/fotos/batata-rustica.webp" },
  { id: "batata-parmesao", categoria: "acompanhamentos", nome: "Batata com parmesão", descricao: "Palito com parmesão ralado e salsinha.", preco: 1990, foto: "/fotos/batata-parmesao.webp" },
  { id: "aneis", categoria: "acompanhamentos", nome: "Anéis de cebola", descricao: "Empanados na hora, com molho barbecue.", preco: 1890, foto: "/fotos/aneis.webp" },
  { id: "shake", categoria: "bebidas", nome: "Shake de morango", descricao: "500 ml, feito com sorvete e morangos frescos.", preco: 1790, foto: "/fotos/shake.webp" },
  { id: "limonada", categoria: "bebidas", nome: "Limonada com hortelã", descricao: "500 ml, limão espremido na hora.", preco: 1190, foto: "/fotos/limonada.webp" },
  { id: "soda", categoria: "bebidas", nome: "Soda de frutas vermelhas", descricao: "400 ml, gaseificada com xarope da casa.", preco: 1290, foto: "/fotos/soda.webp" },
  { id: "suco", categoria: "bebidas", nome: "Suco de laranja", descricao: "400 ml, natural.", preco: 990, foto: "/fotos/suco.webp" },
];
