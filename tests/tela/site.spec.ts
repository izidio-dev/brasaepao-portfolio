import { test, expect, type Page } from "@playwright/test";

async function adicionarClassicoComBacon(page: Page) {
  await page.getByRole("button", { name: "Adicionar Clássico Brasa" }).click();
  const dialogo = page.getByRole("dialog", { name: "Clássico Brasa" });
  await dialogo.getByLabel(/Bacon crocante/).check();
  await dialogo.getByRole("button", { name: /Adicionar ao pedido/ }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("adicionar item atualiza o contador do carrinho", async ({ page }) => {
  await adicionarClassicoComBacon(page);
  await expect(page.getByTestId("contador-carrinho")).toHaveText("1");
});

test("carrinho mostra total com taxa de entrega e retirada esconde endereço", async ({ page }) => {
  await adicionarClassicoComBacon(page);
  await page.getByRole("button", { name: /Ver carrinho/ }).click();
  const carrinho = page.getByRole("dialog", { name: "Seu pedido" });
  await expect(carrinho.getByTestId("total")).toHaveText("R$ 37,90");
  await expect(carrinho.getByLabel("Endereço de entrega")).toBeVisible();
  await carrinho.getByLabel("Retirar no balcão").check();
  await expect(carrinho.getByTestId("total")).toHaveText("R$ 32,90");
  await expect(carrinho.getByLabel("Endereço de entrega")).toHaveCount(0);
});

test("troco menor que o total bloqueia o envio", async ({ page }) => {
  await adicionarClassicoComBacon(page);
  await page.getByRole("button", { name: /Ver carrinho/ }).click();
  const carrinho = page.getByRole("dialog", { name: "Seu pedido" });
  await carrinho.getByLabel("Seu nome").fill("Ana");
  await carrinho.getByLabel("Endereço de entrega").fill("Rua A, 1");
  await carrinho.getByLabel("Dinheiro").check();
  await carrinho.getByLabel("Troco para quanto?").fill("20");
  await carrinho.getByRole("button", { name: "Revisar pedido" }).click();
  await expect(carrinho.getByRole("alert")).toContainText("troco");
});

test("pedido completo gera link do WhatsApp com a mensagem", async ({ page }) => {
  await adicionarClassicoComBacon(page);
  await page.getByRole("button", { name: /Ver carrinho/ }).click();
  const carrinho = page.getByRole("dialog", { name: "Seu pedido" });
  await carrinho.getByLabel("Seu nome").fill("Ana");
  await carrinho.getByLabel("Endereço de entrega").fill("Rua A, 1");
  await carrinho.getByLabel("Pix").check();
  await carrinho.getByRole("button", { name: "Revisar pedido" }).click();
  const enviar = carrinho.getByRole("link", { name: /Enviar pelo WhatsApp/ });
  await expect(enviar).toHaveAttribute("href", /^https:\/\/wa\.me\/5511910006468\?text=.*Cl%C3%A1ssico%20Brasa/);
});

test("carrinho corrompido no navegador não quebra o site", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem("brasa-carrinho", "{isso não é json"));
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByTestId("contador-carrinho")).toHaveCount(0);
});

test("no celular (360px) não há rolagem lateral", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test("com o banco fora do ar, o cardápio de reserva aparece", async ({ page }) => {
  await page.route(/googleapis\.com/, (r) => r.abort());
  await page.reload();
  await expect(page.getByRole("button", { name: "Adicionar Clássico Brasa" })).toBeVisible();
});
