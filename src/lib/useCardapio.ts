"use client";

import { useEffect, useState } from "react";
import type { Produto } from "@/data/cardapio";
import { cardapioReserva, repositorioFirestore, type Cardapio } from "./repositorio";

const CHAVE_CACHE = "brasa-cardapio-cache";
const TEMPO_LIMITE_MS = 4000;

/** Esgotados não aparecem para o cliente. */
export function produtosVisiveis(produtos: Produto[]): Produto[] {
  return produtos.filter((p) => p.disponivel !== false);
}

function lerCache(): Cardapio | null {
  try {
    const bruto = localStorage.getItem(CHAVE_CACHE);
    const dados = bruto ? JSON.parse(bruto) : null;
    return dados && Array.isArray(dados.produtos) && dados.loja ? { ...dados, kits: Array.isArray(dados.kits) ? dados.kits : [] } : null;
  } catch {
    return null;
  }
}

function gravarCache(c: Cardapio) {
  try {
    localStorage.setItem(CHAVE_CACHE, JSON.stringify(c));
  } catch {
    /* sem espaço ou bloqueado: segue sem cache */
  }
}

/**
 * Cardápio do site, em camadas — nunca deixa a tela vazia:
 * 1) mostra na hora o cardápio embutido no site;
 * 2) troca pela última cópia salva no navegador, se houver;
 * 3) busca o cardápio atual no banco (até 4 s) e salva a cópia.
 */
export function useCardapio() {
  const [cardapio, setCardapio] = useState<Cardapio>(cardapioReserva);
  const [origem, setOrigem] = useState<"reserva" | "cache" | "banco">("reserva");

  useEffect(() => {
    let ativo = true;
    const cache = lerCache();
    if (cache) {
      setCardapio(cache);
      setOrigem("cache");
    }
    const limite = new Promise<never>((_, rejeitar) => setTimeout(() => rejeitar(new Error("tempo esgotado")), TEMPO_LIMITE_MS));
    Promise.race([repositorioFirestore().carregar(), limite])
      .then((dados) => {
        if (!ativo) return;
        setCardapio(dados);
        setOrigem("banco");
        gravarCache(dados);
      })
      .catch(() => {
        /* banco indisponível: segue com reserva/cache */
      });
    return () => {
      ativo = false;
    };
  }, []);

  return { cardapio, origem };
}
