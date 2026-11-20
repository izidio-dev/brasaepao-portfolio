import { test } from "node:test";
import assert from "node:assert/strict";
import { comPromocao, descricaoKit, hojeSP, itemDoKit, kitsVigentes, promocaoVigente, rotuloAte } from "../../src/lib/promocao.ts";
import type { Kit } from "../../src/lib/promocao.ts";
import type { Produto } from "../../src/data/cardapio.ts";

const cheese: Produto = { id: "cheese", categoria: "burgers", nome: "Cheeseburger", descricao: "", preco: 2900, foto: "/a.webp", disponivel: true };
const salada: Produto = { id: "salada", categoria: "burgers", nome: "X-Salada", descricao: "", preco: 2600, foto: "/b.webp", disponivel: true };
const kit: Kit = { id: "fds", nome: "Promo fim de semana", descricao: "", itens: [{ produtoId: "cheese", quantidade: 1 }, { produtoId: "salada", quantidade: 1 }], preco: 4000, ate: "2026-11-22", ativo: true, ordem: 0 };

test("hoje em São Paulo vira o dia à meia-noite local", () => {
  assert.equal(hojeSP(Date.parse("2026-11-23T02:59:00Z")), "2026-11-22");
  assert.equal(hojeSP(Date.parse("2026-11-23T03:00:00Z")), "2026-11-23");
});

test("promoção de produto vale até o fim do dia 'até'", () => {
  const p = { ...cheese, promocao: { preco: 2400, ate: "2026-11-22" } };
  assert.equal(promocaoVigente(p, "2026-11-22"), true);
  assert.equal(promocaoVigente(p, "2026-11-23"), false);
  assert.deepEqual(comPromocao(p, "2026-11-22"), { ...p, preco: 2400, precoDe: 2900 });
  assert.deepEqual(comPromocao(p, "2026-11-23"), p);
  assert.deepEqual(comPromocao(cheese, "2026-11-22"), cheese);
});

test("promoção com preço maior ou igual ao normal é ignorada", () => {
  const p = { ...cheese, promocao: { preco: 2900, ate: "2030-01-01" } };
  assert.equal(promocaoVigente(p, "2026-11-22"), false);
});

test("kit vigente calcula o 'de' pela soma dos itens", () => {
  const [k] = kitsVigentes([kit], [cheese, salada], "2026-11-21");
  assert.equal(k.de, 5500);
  assert.equal(k.preco, 4000);
  assert.equal(descricaoKit(k), "1x Cheeseburger + 1x X-Salada");
  assert.equal(k.foto, "/a.webp");
});

test("kit vencido, inativo, com item esgotado ou excluído não aparece", () => {
  assert.equal(kitsVigentes([kit], [cheese, salada], "2026-11-23").length, 0);
  assert.equal(kitsVigentes([{ ...kit, ativo: false }], [cheese, salada], "2026-11-21").length, 0);
  assert.equal(kitsVigentes([kit], [cheese, { ...salada, disponivel: false }], "2026-11-21").length, 0);
  assert.equal(kitsVigentes([kit], [cheese], "2026-11-21").length, 0);
});

test("kit entra no carrinho como uma linha só", () => {
  const [k] = kitsVigentes([kit], [cheese, salada], "2026-11-21");
  const item = itemDoKit(k, 2);
  assert.equal(item.produtoId, "kit:fds");
  assert.equal(item.nome, "Promo fim de semana (1x Cheeseburger + 1x X-Salada)");
  assert.equal(item.precoBase, 4000);
  assert.equal(item.quantidade, 2);
  assert.deepEqual(item.adicionais, []);
});

test("rótulo da validade", () => {
  assert.equal(rotuloAte("2026-11-22"), "até dom 22/11");
});
