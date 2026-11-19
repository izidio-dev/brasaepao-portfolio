# Brasa & Pão — cardápio digital com painel do gerente

Projeto de demonstração (empresa fictícia) para portfólio.

**Ver ao vivo:** https://brasaepao-portfolio.pages.dev

**Painel do gerente:** https://brasaepao-portfolio.pages.dev/admin/ (use "Entrar no modo demonstração")

- **Site público:** cardápio com fotos, adicionais, ponto da carne, carrinho e pedido
  enviado formatado pelo WhatsApp. Funciona mesmo se o banco cair (usa a cópia embutida).
- **Painel do gerente (`/admin`):** login, criar/editar/excluir produtos, marcar como
  esgotado, adicionais e dados da loja. Tem um **modo demonstração** que não grava nada.
## Tecnologias

Next.js (exportação estática) · React · TypeScript · Tailwind CSS · Firebase
(Authentication + Firestore) · Playwright · Cloudflare Pages.

## Como rodar

```bash
npm install
npm run dev        # http://localhost:3000
```

## Testes

```bash
npm run build && npm run test:tela   # testes de tela e das regras de preço/pedido
npm run test:regras                  # regras de segurança do Firestore (emulador; precisa de Java)
```

## Como funciona

| Arquivo | O que faz |
|---|---|
| `src/data/cardapio.ts` | Cardápio embutido (reserva se o banco não responder) |
| `src/lib/pedido.ts` | Contas do pedido em centavos e a mensagem do WhatsApp |
| `src/lib/repositorio.ts` | Leitura e gravação no Firestore (e versão em memória para o modo demonstração) |
| `src/lib/useCardapio.ts` | Cardápio do site: reserva → cache do navegador → banco (até 4 s) |
| `src/lib/imagem.ts` | Reduz a foto no navegador e salva no banco (sem Cloud Storage) |
| `firebase/firestore.rules` | Quem pode ler (todos) e quem pode alterar (só o gerente) |

## Pastas

```
src/        código do site e do painel
public/     fotos e cabeçalhos de segurança (_headers)
firebase/   regras de segurança do banco e configuração do emulador
tests/      tela/ (Playwright) e regras/ (emulador do Firestore)
```

Os arquivos soltos na raiz (`package.json`, `next.config.ts`, `tsconfig.json`,
`eslint.config.mjs`, `postcss.config.mjs`, `playwright.config.ts`) precisam ficar ali:
as ferramentas procuram por eles na raiz.

## Publicação

Cloudflare Pages conectado a este repositório: comando de build `npm run build`,
pasta de saída `out`.

Fotos: Unsplash (licença Unsplash).
