import { test, expect, type Page } from "@playwright/test";

async function entrarDemo(page: Page) {
  await page.route(/googleapis\.com/, (r) => r.abort());
  await page.goto("/admin/");
  await page.getByRole("button", { name: "Entrar no modo demonstração" }).click();
  await expect(page.getByText("Modo demonstração")).toBeVisible();
}

const linha = (page: Page, nome: string) => page.getByRole("listitem").filter({ hasText: nome }).first();

test("editar preço atualiza a lista", async ({ page }) => {
  await entrarDemo(page);
  await linha(page, "Clássico Brasa").getByRole("button", { name: "Editar" }).click();
  const form = page.getByRole("dialog", { name: "Editar produto" });
  await form.getByLabel("Preço").fill("31,90");
  await form.getByRole("button", { name: "Salvar" }).click();
  await expect(linha(page, "Clássico Brasa")).toContainText("R$ 31,90");
});

test("marcar como esgotado mostra o selo", async ({ page }) => {
  await entrarDemo(page);
  await linha(page, "Duplo Cheddar").getByRole("button", { name: "Marcar como esgotado" }).click();
  await expect(linha(page, "Duplo Cheddar")).toContainText("Esgotado");
});

test("preço vazio bloqueia salvar", async ({ page }) => {
  await entrarDemo(page);
  await linha(page, "Clássico Brasa").getByRole("button", { name: "Editar" }).click();
  const form = page.getByRole("dialog", { name: "Editar produto" });
  await form.getByLabel("Preço").fill("");
  await form.getByRole("button", { name: "Salvar" }).click();
  await expect(form.getByRole("alert")).toContainText("preço");
});

test("novo produto aparece na lista", async ({ page }) => {
  await entrarDemo(page);
  await page.getByRole("button", { name: "Novo produto" }).click();
  const form = page.getByRole("dialog", { name: "Novo produto" });
  await form.getByLabel("Nome").fill("X-Teste");
  await form.getByLabel("Preço").fill("25");
  await form.getByLabel("Categoria").selectOption("burgers");
  await form.getByRole("button", { name: "Salvar" }).click();
  await expect(linha(page, "X-Teste")).toContainText("R$ 25,00");
});

test("excluir pede confirmação na própria página", async ({ page }) => {
  await entrarDemo(page);
  await linha(page, "Suco de laranja").getByRole("button", { name: "Excluir" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Suco de laranja" })).toHaveCount(1);
  await linha(page, "Suco de laranja").getByRole("button", { name: "Confirmar exclusão" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Suco de laranja" })).toHaveCount(0);
});

test("dados da loja: WhatsApp inválido é recusado", async ({ page }) => {
  await entrarDemo(page);
  await page.getByRole("tab", { name: "Loja" }).click();
  await page.getByLabel("WhatsApp que recebe os pedidos").fill("123");
  await page.getByRole("button", { name: "Salvar dados da loja" }).click();
  await expect(page.getByRole("form", { name: "Dados da loja" }).getByRole("alert")).toContainText("WhatsApp");
});
