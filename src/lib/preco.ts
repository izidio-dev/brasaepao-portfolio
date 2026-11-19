/**
 * Converte o que o gerente digita ("28,90", "R$ 31,90", "1.234,56", "7")
 * em centavos (2890). Retorna null se o valor não for um preço válido.
 */
export function paraCentavos(texto: string): number | null {
  const limpo = texto.replace(/R\$|\s/g, "").replace(/\./g, "");
  if (!/^\d+(,\d{1,2})?$/.test(limpo)) return null;
  const [reais, centavos = "0"] = limpo.split(",");
  return Number(reais) * 100 + Number(centavos.padEnd(2, "0"));
}

/** 2890 → "28,90" (formato para preencher campos de edição). */
export function centavosParaTexto(centavos: number): string {
  return (centavos / 100).toFixed(2).replace(".", ",");
}
