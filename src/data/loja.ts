/** Dados da loja (fictícia). Em um cliente real, troque tudo aqui. */
export const loja = {
  nome: "Brasa & Pão",
  slogan: "Hambúrguer na brasa, do jeito que tem que ser.",
  // Demonstração: o pedido vai para o WhatsApp do desenvolvedor.
  whatsapp: "5511910006468",
  endereco: "Endereço fictício — São Paulo, SP",
  taxaEntrega: 500, // em centavos
  tempoEntrega: "30–45 min",
  // Horário de funcionamento: dia da semana (0 = domingo) → [abre, fecha] em minutos do dia.
  horarios: {
    0: [18 * 60, 23 * 60 + 30],
    2: [18 * 60, 23 * 60 + 30],
    3: [18 * 60, 23 * 60 + 30],
    4: [18 * 60, 23 * 60 + 30],
    5: [18 * 60, 24 * 60],
    6: [18 * 60, 24 * 60],
  } as Record<number, [number, number]>,
};
