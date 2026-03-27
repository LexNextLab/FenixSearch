"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useDashboardHistory } from "@/hooks/useDashboardHistory";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
  params?: Promise<Record<string, string>>;
};

const PRICING = [
  { endpoint: "Empresa por CNPJ", datasets: "basic, complete, address, etc.", preco: "Por dataset (R$ 0,02 a R$ 0,12 cada)" },
  { endpoint: "Busca avançada empresas", datasets: "Por empresa retornada", preco: "Por dataset" },
  { endpoint: "CPF", datasets: "basic, registration_status", preco: "~R$ 0,09 a R$ 0,19" },
  { endpoint: "Telefones", datasets: "—", preco: "Por telefone retornado" },
  { endpoint: "Emails gerados", datasets: "—", preco: "Por perfil LinkedIn usado" },
  { endpoint: "LinkedIn (empresa/pessoa)", datasets: "—", preco: "R$ 0,49 por consulta" },
  { endpoint: "Processos judiciais", datasets: "—", preco: "Consulte platform.kipflow.io" },
];

export default function DashboardPage({ searchParams, params }: PageProps) {
  use(searchParams ?? Promise.resolve({}));
  use(params ?? Promise.resolve({}));
  const { history, total, clear, authenticated, loading } = useDashboardHistory();
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = () => {
    if (confirmClear) {
      clear();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#f1f1f1]">
            Dashboard de Gastos
          </h1>
          <p className="mt-1 text-[#f1f1f1]/70">
            Acompanhe os custos das consultas realizadas nesta sessão.
          </p>
        </div>
        <Link
          href="https://platform.kipflow.io/pricing"
          target="_blank"
          rel="noopener noreferrer"
          className="fenix-btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
        >
          Ver preços no Kipflow
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="fenix-card-full rounded-xl border p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-[#f1f1f1]">
            {authenticated ? "Total gasto (histórico)" : "Total gasto (esta sessão)"}
          </h2>
          <p className="mt-2 text-3xl font-bold text-[#D5B170]">
            {loading ? "—" : `R$ ${total.toFixed(2).replace(".", ",")}`}
          </p>
          <p className="mt-1 text-sm text-[#f1f1f1]/60">
            {loading ? "Carregando…" : `${history.length} consulta(s) registrada(s)`}
          </p>
          {!authenticated && (
            <button
              type="button"
              onClick={handleClear}
              className={`mt-4 text-sm ${confirmClear ? "text-amber-400" : "text-[#f1f1f1]/60 hover:text-[#f1f1f1]"}`}
            >
              {confirmClear ? "Clique novamente para limpar" : "Limpar histórico local"}
            </button>
          )}
        </div>

        <div className="fenix-card-full rounded-xl border p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-[#f1f1f1]">
            Saldo real
          </h2>
          <p className="mt-2 text-[#f1f1f1]/80">
            O saldo de créditos e o histórico completo estão disponíveis no dashboard da Kipflow.
          </p>
          <Link
            href="https://platform.kipflow.io"
            target="_blank"
            rel="noopener noreferrer"
            className="fenix-link mt-3 inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            Abrir platform.kipflow.io
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="fenix-card-full mt-8 rounded-xl border shadow-sm">
        <div className="border-b border-[#D5B170]/20 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-[#f1f1f1]">
            Histórico de consultas
          </h2>
        </div>
        <div className="overflow-x-auto">
          {history.length === 0 ? (
            <div className="px-6 py-12 text-center text-[#f1f1f1]/60">
              {authenticated
                ? "Nenhuma consulta registrada. Faça login e realize buscas para ver o histórico."
                : "Nenhuma consulta registrada nesta sessão. Faça login para salvar o histórico permanentemente."}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#D5B170]/20 bg-[#101F2E]/50">
                  <th className="px-6 py-3 text-left font-medium text-[#f1f1f1]/90">Data/Hora</th>
                  <th className="px-6 py-3 text-left font-medium text-[#f1f1f1]/90">Tipo</th>
                  <th className="px-6 py-3 text-left font-medium text-[#f1f1f1]/90">Detalhe</th>
                  <th className="px-6 py-3 text-right font-medium text-[#f1f1f1]/90">Custo</th>
                </tr>
              </thead>
              <tbody>
                {[...history].map((e) => (
                  <tr key={e.id} className="border-b border-[#D5B170]/10">
                    <td className="px-6 py-3 text-[#f1f1f1]/80">
                      {new Date(e.data).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-3 text-[#f1f1f1]">{e.tipo}</td>
                    <td className="px-6 py-3 text-[#f1f1f1]/60">{e.detalhe ?? "—"}</td>
                    <td className="px-6 py-3 text-right font-medium text-[#D5B170]">{e.custoFormatado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="fenix-card-full mt-8 rounded-xl border shadow-sm">
        <div className="border-b border-[#D5B170]/20 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-[#f1f1f1]">
            Preços por consulta (referência)
          </h2>
          <p className="mt-1 text-sm text-[#f1f1f1]/60">
            Valores aproximados. Consulte{" "}
            <a href="https://platform.kipflow.io/pricing" target="_blank" rel="noopener noreferrer" className="fenix-link hover:underline">
              platform.kipflow.io/pricing
            </a>{" "}
            para valores atualizados e descontos por volume.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#D5B170]/20 bg-[#101F2E]/50">
                <th className="px-6 py-3 text-left font-medium text-[#f1f1f1]/90">Endpoint</th>
                <th className="px-6 py-3 text-left font-medium text-[#f1f1f1]/90">Datasets</th>
                <th className="px-6 py-3 text-right font-medium text-[#f1f1f1]/90">Preço</th>
              </tr>
            </thead>
            <tbody>
              {PRICING.map((p, i) => (
                <tr key={i} className="border-b border-[#D5B170]/10">
                  <td className="px-6 py-3 text-[#f1f1f1]">{p.endpoint}</td>
                  <td className="px-6 py-3 text-[#f1f1f1]/70">{p.datasets}</td>
                  <td className="px-6 py-3 text-right text-[#f1f1f1]">{p.preco}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
