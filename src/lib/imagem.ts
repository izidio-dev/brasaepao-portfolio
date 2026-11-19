/**
 * Reduz a foto escolhida pelo gerente direto no navegador:
 * recorta em 4:3, redimensiona para 480×360 e converte em WebP.
 * Resultado: ~15–40 KB, salvo como texto (data URI) no próprio banco,
 * sem precisar do Cloud Storage (que exige plano pago).
 */
export const LIMITE_FOTO = 200_000; // caracteres; as regras do banco aceitam até 250 000

export async function reduzirImagem(arquivo: File): Promise<string> {
  if (!arquivo.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem (JPG, PNG ou WebP).");
  const bitmap = await createImageBitmap(arquivo);
  const L = 480, A = 360;
  const escala = Math.max(L / bitmap.width, A / bitmap.height);
  const w = bitmap.width * escala, h = bitmap.height * escala;
  const canvas = document.createElement("canvas");
  canvas.width = L;
  canvas.height = A;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não conseguiu processar a imagem.");
  ctx.drawImage(bitmap, (L - w) / 2, (A - h) / 2, w, h);
  bitmap.close();
  for (const qualidade of [0.78, 0.6, 0.45]) {
    const dataUri = canvas.toDataURL("image/webp", qualidade);
    if (dataUri.length <= LIMITE_FOTO) return dataUri;
  }
  throw new Error("A foto continua grande demais mesmo reduzida. Tente outra imagem.");
}
