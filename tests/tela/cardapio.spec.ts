import { test, expect } from "@playwright/test";
import { produtosVisiveis } from "../../src/lib/useCardapio";
import { cardapioReserva } from "../../src/lib/repositorio";

test("produto esgotado não aparece no cardápio público", () => {
  const { produtos } = cardapioReserva();
  produtos[0].disponivel = false;
  const visiveis = produtosVisiveis(produtos);
  expect(visiveis.map((p) => p.id)).not.toContain(produtos[0].id);
  expect(visiveis).toHaveLength(produtos.length - 1);
});
