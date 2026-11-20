"use client";

import { LogOut, Store } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cardapioReserva, repositorioFirestore, repositorioMemoria, type Cardapio, type Repositorio } from "@/lib/repositorio";
import { AbaAdicionais } from "./AbaAdicionais";
import { AbaLoja } from "./AbaLoja";
import { AbaProdutos } from "./AbaProdutos";
import { AbaPromocoes } from "./AbaPromocoes";

type Modo = { tipo: "demo" } | { tipo: "real"; email: string };
type Aba = "produtos" | "promocoes" | "adicionais" | "loja";

/** Traduz erros do Firebase para mensagens que o gerente entende. */
export function mensagemErro(e: unknown): string {
  const codigo = (e as { code?: string })?.code ?? "";
  if (codigo.includes("permission-denied")) return "Sua conta não tem permissão para alterar este cardápio.";
  if (codigo.includes("invalid-credential") || codigo.includes("wrong-password") || codigo.includes("user-not-found"))
    return "E-mail ou senha incorretos.";
  if (codigo.includes("too-many-requests")) return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
  if (codigo.includes("unavailable") || codigo.includes("network")) return "Sem conexão com o servidor. Verifique a internet.";
  return e instanceof Error ? e.message : "Algo deu errado. Tente de novo.";
}

export function Painel() {
  const [modo, setModo] = useState<Modo | null>(null);
  const [verificando, setVerificando] = useState(true);
  const [repo, setRepo] = useState<Repositorio | null>(null);
  const [cardapio, setCardapio] = useState<Cardapio | null>(null);
  const [lojaInexistente, setLojaInexistente] = useState(false);
  const [aba, setAba] = useState<Aba>("produtos");
  const [aviso, setAviso] = useState("");
  const [erro, setErro] = useState("");

  // Se o gerente já estava logado neste aparelho, entra direto.
  useEffect(() => {
    let cancelar = () => {};
    import("@/lib/firebase")
      .then(async ({ auth }) => {
        const { onAuthStateChanged } = await import("firebase/auth");
        cancelar = onAuthStateChanged(auth, (usuario) => {
          if (usuario) {
            setModo((m) => (m?.tipo === "demo" ? m : { tipo: "real", email: usuario.email ?? "" }));
            setRepo((r) => r ?? repositorioFirestore());
          }
          setVerificando(false);
        });
      })
      .catch(() => setVerificando(false));
    return () => cancelar();
  }, []);

  const recarregar = useCallback(async (r: Repositorio) => {
    try {
      setCardapio(await r.carregar());
      setLojaInexistente(false);
    } catch (e) {
      if (e instanceof Error && e.message.includes("não cadastrada")) setLojaInexistente(true);
      else setErro(mensagemErro(e));
    }
  }, []);

  useEffect(() => {
    if (repo) recarregar(repo);
  }, [repo, recarregar]);

  function avisar(texto: string) {
    setAviso(texto);
    setTimeout(() => setAviso(""), 2500);
  }

  /** Executa uma alteração, recarrega a lista e mostra o resultado. */
  const executar = useCallback(
    async (acao: (r: Repositorio) => Promise<void>, sucesso: string) => {
      if (!repo) return false;
      try {
        await acao(repo);
        await recarregar(repo);
        avisar(sucesso);
        setErro("");
        return true;
      } catch (e) {
        setErro(mensagemErro(e));
        return false;
      }
    },
    [repo, recarregar],
  );

  async function importarInicial() {
    const inicial = cardapioReserva();
    await executar(async (r) => {
      await r.salvarLoja(inicial.loja);
      for (const a of inicial.adicionais) await r.salvarAdicional(a);
      for (const p of inicial.produtos) await r.salvarProduto(p);
    }, "Cardápio inicial publicado");
  }

  async function sair() {
    if (modo?.tipo === "real") {
      const { auth } = await import("@/lib/firebase");
      const { signOut } = await import("firebase/auth");
      await signOut(auth);
    }
    setModo(null);
    setRepo(null);
    setCardapio(null);
  }

  if (!modo) {
    return (
      <Login
        verificando={verificando}
        aoEntrarDemo={() => {
          setModo({ tipo: "demo" });
          setRepo(repositorioMemoria());
        }}
      />
    );
  }

  const abas: { id: Aba; nome: string }[] = [
    { id: "produtos", nome: "Produtos" },
    { id: "promocoes", nome: "Promoções" },
    { id: "adicionais", nome: "Adicionais" },
    { id: "loja", nome: "Loja" },
  ];

  return (
    <div className="min-h-dvh bg-creme">
      <header className="border-b border-carvao/10 bg-carvao text-creme">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Store className="size-5 text-mostarda" aria-hidden />
            <p className="titulo text-2xl">Painel · Brasa &amp; Pão</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {modo.tipo === "demo" ? (
              <span className="rounded-full bg-mostarda px-3 py-1 font-bold text-carvao">Modo demonstração</span>
            ) : (
              <span className="text-creme/70">{modo.email}</span>
            )}
            <button type="button" onClick={sair} className="flex items-center gap-1.5 rounded-full border border-creme/20 px-3 py-1.5 hover:bg-creme/10">
              <LogOut className="size-4" aria-hidden /> Sair
            </button>
          </div>
        </div>
      </header>

      {modo.tipo === "demo" && (
        <p className="bg-mostarda/25 px-4 py-2 text-center text-sm">
          Você está testando o painel. As alterações valem só nesta tela e não mudam o cardápio de verdade.
        </p>
      )}

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div role="tablist" aria-label="Seções do painel" className="flex gap-2 overflow-x-auto">
          {abas.map((a) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={aba === a.id}
              onClick={() => setAba(a.id)}
              className={`rounded-full px-4 py-2 text-sm font-bold ${aba === a.id ? "bg-carvao text-creme" : "bg-white text-carvao"}`}
            >
              {a.nome}
            </button>
          ))}
        </div>

        {erro && (
          <p role="alert" className="mt-4 rounded-xl border-2 border-brasa/40 bg-brasa/10 p-3 text-sm">
            {erro}
          </p>
        )}

        <div className="mt-6">
          {lojaInexistente ? (
            <div className="rounded-3xl bg-white p-6">
              <p className="titulo text-2xl">Cardápio ainda vazio</p>
              <p className="mt-2 text-cinza">O banco de dados ainda não tem o cardápio. Publique o cardápio inicial e depois ajuste o que quiser.</p>
              <button type="button" onClick={importarInicial} className="mt-4 rounded-full bg-brasa px-5 py-3 font-bold text-white">
                Publicar cardápio inicial
              </button>
            </div>
          ) : !cardapio ? (
            <p className="text-cinza">Carregando cardápio…</p>
          ) : aba === "produtos" ? (
            <AbaProdutos produtos={cardapio.produtos} executar={executar} />
          ) : aba === "promocoes" ? (
            <AbaPromocoes kits={cardapio.kits} produtos={cardapio.produtos} executar={executar} />
          ) : aba === "adicionais" ? (
            <AbaAdicionais adicionais={cardapio.adicionais} executar={executar} />
          ) : (
            <AbaLoja loja={cardapio.loja} executar={executar} />
          )}
        </div>
      </main>

      <p role="status" aria-live="polite" className={`fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-full bg-carvao px-4 py-2 text-sm text-creme shadow-lg transition-opacity ${aviso ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        {aviso}
      </p>
    </div>
  );
}

export type Executar = (acao: (r: Repositorio) => Promise<void>, sucesso: string) => Promise<boolean>;

function Login({ verificando, aoEntrarDemo }: { verificando: boolean; aoEntrarDemo: () => void }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const { auth } = await import("@/lib/firebase");
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      await signInWithEmailAndPassword(auth, email.trim(), senha);
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setEnviando(false);
    }
  }

  const campo = "mt-1.5 w-full rounded-xl border-2 border-carvao/10 bg-white px-4 py-3 outline-none focus:border-brasa";

  return (
    <main className="grid min-h-dvh place-items-center bg-carvao px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl bg-creme p-7 shadow-2xl">
        <p className="titulo text-4xl">
          Brasa <span className="text-brasa">&amp;</span> Pão
        </p>
        <h1 className="mt-1 font-bold text-cinza">Painel do gerente</h1>

        <form onSubmit={entrar} className="mt-6 space-y-4">
          <label className="block font-semibold">
            E-mail
            <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required className={campo} />
          </label>
          <label className="block font-semibold">
            Senha
            <input id="senha" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required className={campo} />
          </label>
          {erro && (
            <p role="alert" className="rounded-xl bg-brasa/10 p-3 text-sm">
              {erro}
            </p>
          )}
          <button type="submit" disabled={enviando || verificando} className="w-full rounded-full bg-brasa px-5 py-3.5 font-bold text-white disabled:opacity-60">
            {enviando ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <div className="mt-6 border-t border-carvao/10 pt-5">
          <p className="text-sm text-cinza">Quer só conhecer o painel?</p>
          <button type="button" onClick={aoEntrarDemo} className="mt-2 w-full rounded-full border-2 border-carvao px-5 py-3 font-bold">
            Entrar no modo demonstração
          </button>
        </div>
      </div>
    </main>
  );
}
