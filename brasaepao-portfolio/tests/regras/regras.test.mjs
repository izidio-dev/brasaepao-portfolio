// Testa as regras de segurança do Firestore no emulador local.
// Rodar: npm run test:regras
import { test, before, after, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";

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
