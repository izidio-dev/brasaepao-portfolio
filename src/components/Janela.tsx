"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Janela modal baseada no <dialog> nativo: já trata foco, tecla Esc e
 * acessibilidade. "lateral" = gaveta pela direita (usada no carrinho).
 */
export function Janela({
  titulo,
  aoFechar,
  lateral = false,
  children,
}: {
  titulo: string;
  aoFechar: () => void;
  lateral?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    document.body.style.overflow = "hidden"; // trava a rolagem do fundo
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const posicao = lateral
    ? "m-0 ml-auto h-dvh max-h-dvh w-full max-w-md"
    : "m-auto max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-lg rounded-3xl";

  return (
    <dialog
      ref={ref}
      aria-label={titulo}
      onCancel={(e) => {
        e.preventDefault();
        aoFechar();
      }}
      onClick={(e) => {
        if (e.target === ref.current) aoFechar(); // clique fora fecha
      }}
      className={`${posicao} overflow-hidden bg-creme p-0 shadow-2xl`}
    >
      {children}
    </dialog>
  );
}
