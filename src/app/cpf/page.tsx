"use client";

import { use, useState } from "react";
import { ErrorAlert } from "@/components/ErrorAlert";
import { SaveSearchButton } from "@/components/SaveSearchButton";
import { useCostTracker } from "@/hooks/useCostTracker";
import { ResultDisplay } from "@/components/ResultDisplay";
import type { CpfResponseDto } from "@/lib/types";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
  params?: Promise<Record<string, string>>;
};

export default function CpfPage({ searchParams, params }: PageProps) {
  use(searchParams ?? Promise.resolve({}));
  use(params ?? Promise.resolve({}));
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CpfResponseDto | null>(null);
  const [error, setError] = useState<{ code?: string; message?: string } | null>(null);
  const { addCost } = useCostTracker();

  const formatCpf = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 11);
    setCpf(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (cpf.replace(/\D/g, "").length !== 11) {
      setError({ code: "INVALID_CPF", message: "CPF deve ter 11 dígitos" });
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ cpf: cpf.replace(/\D/g, "") });
      params.set("datasets", "basic,registration_status");
      const res = await fetch(`/api/cpf?${params.toString()}`);
      const data = (await res.json()) as CpfResponseDto & { error?: { code?: string; message?: string } };
      if (!res.ok) {
        setError(data.error ?? { message: "Erro na consulta" });
        return;
      }
      setResult(data);
      if (data.cost != null && data.cost > 0) {
        addCost("CPF", data.cost, data.costFormatted);
      }
    } catch {
      setError({ message: "Erro ao conectar. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#f1f1f1]">
            Consulta CPF
          </h1>
          <p className="mt-2 text-[#f1f1f1]/70">
            Consulte dados de pessoa física por CPF (apenas números).
          </p>
        </div>
        {cpf.replace(/\D/g, "").length === 11 && (
          <SaveSearchButton
            searchType="cpf"
            params={{ cpf: cpf.replace(/\D/g, ""), datasets: ["basic", "registration_status"] }}
          />
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label htmlFor="cpf" className="block text-sm font-medium text-[#f1f1f1]/90">
            CPF
          </label>
          <input
            id="cpf"
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={formatCpf(cpf)}
            onChange={handleCpfChange}
            maxLength={14}
            className="fenix-input mt-1 w-full max-w-xs rounded-lg border px-4 py-2 font-mono text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="fenix-btn-primary inline-flex items-center gap-2 rounded-lg px-6 py-2.5 font-medium transition disabled:opacity-50"
        >
          {loading && (
            <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {loading ? "Consultando…" : "Consultar"}
        </button>
      </form>

      {error && (
        <div className="mt-6">
          <ErrorAlert
            message={error.message ?? "Erro"}
            code={error.code}
            onDismiss={() => setError(null)}
          />
        </div>
      )}

      {result?.success && result.data && (
        <div className="mt-8">
          <ResultDisplay
            type="cpf"
            data={result.data}
            costFormatted={result.costFormatted}
          />
        </div>
      )}
    </div>
  );
}
