import { test, expect, type Page } from "@playwright/test";
import { hojeSP } from "../../src/lib/promocao";

const futuro = hojeSP(Date.now() + 3 * 86_400_000);
const ontem = hojeSP(Date.now() - 86_400_000);

async function entrarDemo(page: Page) {
  await page.route(/googleapis\.com/, (r) => r.abort());
  await page.goto("/admin/");
  await page.getByRole("button", { name: "Entrar no modo demonstração" }).click();
  await expect(page.getByText("Modo demonstração")).toBeVisible();
}

const linha = (page: Page, nome: string) => page.getByRole("listitem").filter({ hasText: nome }).first();

test("gerente coloca um produto em promoção com data de fim", async ({ page }) => {
  await entrarDemo(page);
  await linha(page, "Clássico Brasa").getByRole("button", { name: "Editar" }).click();
  const form = page.getByRole("dialog", { name: "Editar produto" });
  await form.getByLabel("Em promoção").check();
  await form.getByLabel("Preço promocional").fill("24,00");
  await form.getByLabel("Válida até").fill(futuro);
  await form.getByRole("button", { name: "Salvar" }).click();
  await expect(linha(page, "Clássico Brasa")).toContainText("Promoção");
  await expect(linha(page, "Clássico Brasa")).toContainText("R$ 24,00");
});

test("promoção com preço maior que o normal ou data passada não salva", async ({ page }) => {
  await entrarDemo(page);
  await linha(page, "Clássico Brasa").getByRole("button", { name: "Editar" }).click();
  const form = page.getByRole("dialog", { name: "Editar produto" });
  await form.getByLabel("Em promoção").check();
  await form.getByLabel("Preço promocional").fill("30,00");
  await form.getByLabel("Válida até").fill(ontem);
  await form.getByRole("button", { name: "Salvar" }).click();
  await expect(form.getByRole("alert")).toContainText("menor que o preço normal");
  await expect(form.getByRole("alert")).toContainText("hoje ou depois");
});

test("gerente cria um kit promocional e ele aparece na lista", async ({ page }) => {
  await entrarDemo(page);
  await page.getByRole("tab", { name: "Promoções" }).click();
  await expect(linha(page, "Promo fim de semana")).toBeVisible();
  await page.getByRole("button", { name: "Nova promoção" }).click();
  const form = page.getByRole("dialog", { name: "Nova promoção" });
  await form.getByLabel("Nome da promoção").fill("Dupla Cheddar");
  await form.getByLabel("Produto 1").selectOption({ label: "Duplo Cheddar" });
  await form.getByLabel("Quantidade 1").fill("2");
  await form.getByRole("button", { name: "Adicionar item" }).click();
  await form.getByLabel("Produto 2").selectOption({ label: "Batata rústica" });
  await expect(form).toContainText("Separado sairia por");
  await form.getByLabel("Preço da promoção").fill("59,90");
  await form.getByLabel("Válida até").fill(futuro);
  await form.getByRole("button", { name: "Salvar" }).click();
  const nova = linha(page, "Dupla Cheddar");
  await expect(nova).toContainText("2x Duplo Cheddar + 1x Batata rústica");
  await expect(nova).toContainText("R$ 59,90");
  await expect(nova).toContainText("Ativa");
});

test("kit sem itens ou sem preço não salva; excluir pede confirmação", async ({ page }) => {
  await entrarDemo(page);
  await page.getByRole("tab", { name: "Promoções" }).click();
  await page.getByRole("button", { name: "Nova promoção" }).click();
  const form = page.getByRole("dialog", { name: "Nova promoção" });
  await form.getByLabel("Nome da promoção").fill("Vazia");
  await form.getByRole("button", { name: "Salvar" }).click();
  await expect(form.getByRole("alert")).toContainText("Escolha pelo menos um produto");
  await expect(form.getByRole("alert")).toContainText("preço válido");
  await form.getByRole("button", { name: "Cancelar" }).click();

  await linha(page, "Promo fim de semana").getByRole("button", { name: "Excluir" }).click();
  await linha(page, "Promo fim de semana").getByRole("button", { name: "Confirmar exclusão" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Promo fim de semana" })).toHaveCount(0);
});
