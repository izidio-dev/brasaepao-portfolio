import { test, expect, type Page } from "@playwright/test";
import { cardapioReserva } from "../../src/lib/repositorio";
import { hojeSP } from "../../src/lib/promocao";

const futuro = hojeSP(Date.now() + 5 * 86_400_000);
const passado = hojeSP(Date.now() - 2 * 86_400_000);

/** Abre o cardápio com o banco bloqueado e um cardápio salvo no navegador (com promoções). */
async function abrir(page: Page, ate: string, carrinho?: unknown[]) {
  const c = cardapioReserva();
  c.produtos = c.produtos.map((p) => (p.id === "classico" ? { ...p, promocao: { preco: 2400, ate } } : p));
  c.kits = [{ id: "fds", nome: "Promo fim de semana", descricao: "Dois burgers para dividir.", itens: [{ produtoId: "classico", quantidade: 1 }, { produtoId: "salada", quantidade: 1 }], preco: 4990, ate, ativo: true, ordem: 0 }];
  await page.route(/googleapis\.com/, (r) => r.abort());
  await page.addInitScript(([cache, itens]) => {
    localStorage.setItem("brasa-cardapio-cache", cache as string);
    if (itens) localStorage.setItem("brasa-carrinho", itens as string);
  }, [JSON.stringify(c), carrinho ? JSON.stringify(carrinho) : null]);
  await page.goto("/");
}

test("produto em promoção mostra preço novo, antigo riscado e validade", async ({ page }) => {
  await abrir(page, futuro);
  const cartao = page.locator("#burgers").getByRole("article").filter({ hasText: "Clássico Brasa" });
  await expect(cartao).toContainText("R$ 24,00");
  await expect(cartao.locator("s")).toHaveText("R$ 28,90");
  await expect(cartao).toContainText(/até \w{3} \d{2}\/\d{2}/);
});

test("kit aparece em Promoções e entra no pedido como uma linha", async ({ page }) => {
  await abrir(page, futuro);
  const secao = page.getByRole("region", { name: "Promoções" });
  await expect(secao).toContainText("Promo fim de semana");
  await expect(secao).toContainText("1x Clássico Brasa + 1x Brasa Salada");
  await expect(secao).toContainText("R$ 49,90");
  await expect(secao.locator("s").first()).toHaveText("R$ 53,90"); // 24,00 (em promoção) + 29,90
  await secao.getByRole("button", { name: "Adicionar Promo fim de semana" }).click();
  await page.getByRole("button", { name: "Ver carrinho" }).click();
  const carrinho = page.getByRole("dialog");
  await expect(carrinho).toContainText("Promo fim de semana (1x Clássico Brasa + 1x Brasa Salada)");
  await expect(carrinho).toContainText("R$ 49,90");
});

test("promoção vencida volta ao preço normal e o kit some", async ({ page }) => {
  await abrir(page, passado);
  const cartao = page.locator("#burgers").getByRole("article").filter({ hasText: "Clássico Brasa" });
  await expect(cartao).toContainText("R$ 28,90");
  await expect(cartao.locator("s")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Promoções" })).toHaveCount(0);
});

test("kit vencido sai do carrinho salvo e produto volta ao preço normal", async ({ page }) => {
  const itens = [
    { chave: "kit:fds|||", produtoId: "kit:fds", nome: "Promo fim de semana (1x Clássico Brasa + 1x Brasa Salada)", precoBase: 4990, adicionais: [], quantidade: 1 },
    { chave: "classico||Ao ponto|", produtoId: "classico", nome: "Clássico Brasa", precoBase: 2400, adicionais: [], ponto: "Ao ponto", quantidade: 1 },
  ];
  await abrir(page, passado, itens);
  await page.getByRole("button", { name: "Ver carrinho" }).click();
  const carrinho = page.getByRole("dialog");
  await expect(carrinho).not.toContainText("Promo fim de semana");
  await expect(carrinho).toContainText("Clássico Brasa");
  await expect(carrinho).toContainText("R$ 28,90");
});
