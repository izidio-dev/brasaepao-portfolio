// Testa as regras de segurança do Firestore no emulador local.
// Rodar: npm run test:regras
import { test, before, after, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";

let env;
const produto = { nome: "Clássico Brasa", descricao: "x", preco: 2890, categoria: "burgers", foto: "/fotos/classico.webp", disponivel: true, ordem: 1 };

before(async () => {
  // O UID real do gerente fica nas regras; no teste trocamos por "dono-teste".
  const regras = readFileSync("firebase/firestore.rules", "utf8").replace(/function donos\(\) \{\s*return \[[^\]]*\];/, "function donos() { return ['dono-teste'];");
  env = await initializeTestEnvironment({ projectId: "demo-brasa", firestore: { rules: regras, host: "127.0.0.1", port: 8085 } });
});
after(async () => env?.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), "lojas/brasa/produtos/classico"), produto));
});

const ref = (ctx, caminho = "lojas/brasa/produtos/classico") => doc(ctx.firestore(), caminho);

test("visitante anônimo lê o cardápio", async () => {
  await assertSucceeds(getDoc(ref(env.unauthenticatedContext())));
});

test("visitante anônimo não altera o cardápio", async () => {
  await assertFails(setDoc(ref(env.unauthenticatedContext()), { ...produto, preco: 1 }));
});

test("usuário logado que não é dono não altera", async () => {
  await assertFails(setDoc(ref(env.authenticatedContext("estranho")), { ...produto, preco: 1 }));
});

test("dono altera produto válido", async () => {
  await assertSucceeds(setDoc(ref(env.authenticatedContext("dono-teste")), { ...produto, preco: 3190 }));
});

test("dono não grava preço negativo nem produto sem nome", async () => {
  const dono = env.authenticatedContext("dono-teste");
  await assertFails(setDoc(ref(dono), { ...produto, preco: -5 }));
  await assertFails(setDoc(ref(dono), { ...produto, nome: "" }));
  await assertFails(setDoc(ref(dono), { ...produto, categoria: "pizza" }));
});

test("dono altera dados da loja; outras coleções ficam fechadas", async () => {
  const dono = env.authenticatedContext("dono-teste");
  await assertSucceeds(setDoc(ref(dono, "lojas/brasa"), { nome: "Brasa & Pão", whatsapp: "5511910006468", taxaEntrega: 500, tempoEntrega: "30–45 min" }));
  await assertFails(setDoc(ref(dono, "lojas/brasa"), { nome: "Brasa & Pão", whatsapp: "abc", taxaEntrega: 500, tempoEntrega: "x" }));
  await assertFails(setDoc(ref(dono, "outra/coisa"), { a: 1 }));
  await assertFails(getDoc(ref(env.unauthenticatedContext(), "outra/coisa")));
});

// ---------- Promoções ----------
const dono = () => env.authenticatedContext("dono-teste");
const kit = { nome: "Promo fim de semana", descricao: "", itens: [{ produtoId: "classico", quantidade: 1 }, { produtoId: "salada", quantidade: 1 }], preco: 4990, ate: "2026-11-30", ativo: true, ordem: 0 };
const refKit = (ctx) => doc(ctx.firestore(), "lojas/brasa/promocoes/fds");

test("produto com promoção válida e com promoção inválida", async () => {
  await assertSucceeds(setDoc(ref(dono()), { ...produto, promocao: { preco: 2400, ate: "2026-11-30" } }));
  await assertFails(setDoc(ref(dono()), { ...produto, promocao: { preco: 2890, ate: "2026-11-30" } })); // não é desconto
  await assertFails(setDoc(ref(dono()), { ...produto, promocao: { preco: 2400, ate: "30/11/2026" } }));
  await assertFails(setDoc(ref(dono()), { ...produto, promocao: { preco: 2400, ate: "2026-11-30", extra: 1 } }));
});

test("kit: visitante lê, só o dono grava e apaga", async () => {
  await assertFails(setDoc(refKit(env.unauthenticatedContext()), kit));
  await assertFails(setDoc(refKit(env.authenticatedContext("estranho")), kit));
  await assertSucceeds(setDoc(refKit(dono()), kit));
  await assertSucceeds(getDoc(refKit(env.unauthenticatedContext())));
  await assertFails(deleteDoc(refKit(env.unauthenticatedContext())));
  await assertSucceeds(deleteDoc(refKit(dono())));
});

test("kit inválido é recusado", async () => {
  await assertFails(setDoc(refKit(dono()), { ...kit, itens: [] }));
  await assertFails(setDoc(refKit(dono()), { ...kit, itens: [{ produtoId: "classico", quantidade: 0 }] }));
  await assertFails(setDoc(refKit(dono()), { ...kit, itens: Array(7).fill({ produtoId: "classico", quantidade: 1 }) }));
  await assertFails(setDoc(refKit(dono()), { ...kit, preco: -1 }));
  await assertFails(setDoc(refKit(dono()), { ...kit, nome: "" }));
  await assertFails(setDoc(refKit(dono()), { ...kit, ate: "amanhã" }));
  await assertFails(setDoc(refKit(dono()), { ...kit, campoEstranho: true }));
});

test("promoções não abrem outras áreas: Ateliê continua fechado para o gerente da Brasa sem regra", async () => {
  await assertFails(setDoc(doc(env.authenticatedContext("estranho").firestore(), "lojas/brasa/outra/x"), { a: 1 }));
});
