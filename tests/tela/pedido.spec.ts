import { test, expect } from "@playwright/test";
import { chaveItem, formatarPreco, mensagemPedido, subtotalItem, totais } from "../../src/lib/pedido";
import type { ItemCarrinho } from "../../src/lib/pedido";

const classicoComBacon: ItemCarrinho = {
  chave: chaveItem("classico", ["bacon"], "Ao ponto"),
  produtoId: "classico",
  nome: "Clássico Brasa",
  precoBase: 2890,
  adicionais: [{ id: "bacon", nome: "Bacon crocante", preco: 400 }],
  ponto: "Ao ponto",
  observacao: "sem cebola",
  quantidade: 2,
};

test("subtotal soma adicionais e multiplica pela quantidade", () => {
  expect(subtotalItem(classicoComBacon)).toBe(6580);
});

test("retirada não cobra taxa; entrega cobra R$ 5", () => {
  expect(totais([classicoComBacon], "retirada")).toEqual({ subtotal: 6580, taxa: 0, total: 6580 });
  expect(totais([classicoComBacon], "entrega")).toEqual({ subtotal: 6580, taxa: 500, total: 7080 });
});

test("formata em reais", () => {
  expect(formatarPreco(7080)).toBe("R$ 70,80");
});

test("mesmo lanche com adicionais diferentes gera chaves diferentes", () => {
  expect(chaveItem("classico", ["bacon"], "Ao ponto")).not.toBe(chaveItem("classico", ["cheddar"], "Ao ponto"));
  expect(chaveItem("classico", ["bacon", "ovo"])).toBe(chaveItem("classico", ["ovo", "bacon"]));
});

test("mensagem de entrega traz itens, endereço, pagamento e total", () => {
  const msg = mensagemPedido({
    itens: [classicoComBacon],
    modo: "entrega",
    nome: "Ana",
    endereco: "Rua das Flores, 10 — Pirituba",
    pagamento: "Dinheiro",
    trocoPara: 10000,
  });
  expect(msg).toContain("*Pedido — Brasa & Pão*");
  expect(msg).toContain("2x Clássico Brasa");
  expect(msg).toContain("+ Bacon crocante");
  expect(msg).toContain("Ponto: Ao ponto");
  expect(msg).toContain("Obs.: sem cebola");
  expect(msg).toContain("Rua das Flores, 10 — Pirituba");
  expect(msg).toContain("Troco para R$ 100,00");
  expect(msg).toContain("*Total: R$ 70,80*");
});

test("mensagem de retirada não fala de endereço", () => {
  const msg = mensagemPedido({ itens: [classicoComBacon], modo: "retirada", nome: "Ana", pagamento: "Pix" });
  expect(msg).toContain("Retirada no balcão");
  expect(msg).not.toContain("Endereço");
});
