import { test, expect } from "@playwright/test";
import { paraCentavos, centavosParaTexto } from "../../src/lib/preco";

test("converte texto digitado em centavos", () => {
  expect(paraCentavos("12,5")).toBe(1250);
  expect(paraCentavos("28,90")).toBe(2890);
  expect(paraCentavos("R$ 31,90")).toBe(3190);
  expect(paraCentavos("1.234,56")).toBe(123456);
  expect(paraCentavos("7")).toBe(700);
});

test("rejeita valores inválidos", () => {
  expect(paraCentavos("")).toBeNull();
  expect(paraCentavos("abc")).toBeNull();
  expect(paraCentavos("-3")).toBeNull();
  expect(paraCentavos("12,345")).toBeNull();
});

test("mostra centavos no campo de edição", () => {
  expect(centavosParaTexto(2890)).toBe("28,90");
  expect(centavosParaTexto(500)).toBe("5,00");
});
