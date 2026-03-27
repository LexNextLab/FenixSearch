"use client";

import { use, useState } from "react";
import { ErrorAlert } from "@/components/ErrorAlert";
import { useCostTracker } from "@/hooks/useCostTracker";
import { ResultDisplay } from "@/components/ResultDisplay";

interface ContactResponse {
  success: boolean;
  data?: { phones?: Array<{ telefone_completo?: string; whatsapp?: boolean; fixo_movel?: string }> };
  error?: { code?: string; message?: string };
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
  params?: Promise<Record<string, string>>;
};

export default function TelefonesPage({ searchParams, params }: PageProps) {
  use(searchParams ?? Promise.resolve({}));
  use(params ?? Promise.resolve({}));
  const [cnpj, setCnpj] = useState("");
  const [domain, setDomain] = useState("");
  const [phoneLimit, setPhoneLimit] = useState(10);
  const [onlyWhatsapp, setOnlyWhatsapp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ContactResponse | null>(null);
  const [error, setError] = useState<{ code?: string; message?: string } | null>(null);
  const { addCost } = useCostTracker();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!cnpj.trim() && !domain.trim()) {
      setError({ code: "MISSING_PARAMETER", message: "Informe CNPJ ou domínio" });
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cnpj.trim()) params.set("cnpj", cnpj.replace(/\D/g, ""));
      if (domain.trim()) params.set("domain", domain.trim());
      params.set("phone_limit", String(phoneLimit));
      if (onlyWhatsapp) params.set("only_whatsapp", "true");
      const res = await fetch(`/api/contatos/telefones?${params.toString()}`);
      const data = (await res.json()) as ContactResponse;
      if (!res.ok) {
        setError(data.error ?? { message: "Erro na consulta" });
        return;
      }
      setResult(data);
      const phoneCount = data.data?.phones?.length ?? 0;
      if (phoneCount > 0 && (data as { cost?: number }).cost != null) {
        const cost = (data as { cost?: number; costFormatted?: string }).cost!;
        addCost("Telefones", cost, (data as { costFormatted?: string }).costFormatted, `${phoneCount} telefone(s)`);
      }
    } catch {
      setError({ message: "Erro ao conectar. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-[#f1f1f1]">
        Telefones de Empresa
      </h1>
      <p className="mt-2 text-[#f1f1f1]/70">
        Busque telefones por CNPJ ou domínio. Custo por telefone retornado.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cnpj" className="block text-sm font-medium text-[#f1f1f1]/90">
              CNPJ
            </label>
            <input
              id="cnpj"
              type="text"
              placeholder="00.000.000/0001-00"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              className="mt-1 w-full rounded-lg fenix-input border px-4 py-2 font-mono text-sm"
            />
          </div>
          <div>
            <label htmlFor="domain" className="block text-sm font-medium text-[#f1f1f1]/90">
              Domínio
            </label>
            <input
              id="domain"
              type="text"
              placeholder="empresa.com.br"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="mt-1 w-full rounded-lg fenix-input border px-4 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div>
            <label htmlFor="limit" className="block text-sm font-medium text-[#f1f1f1]/90">
              Máximo de telefones (1-50)
            </label>
            <input
              id="limit"
              type="number"
              min={1}
              max={50}
              value={phoneLimit}
              onChange={(e) => setPhoneLimit(Math.min(50, Math.max(1, parseInt(e.target.value, 10) || 10)))}
              className="mt-1 w-24 rounded-lg fenix-input border px-3 py-2 text-sm"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={onlyWhatsapp}
              onChange={(e) => setOnlyWhatsapp(e.target.checked)}
              className="rounded border-[#D5B170]/30 text-[#D5B170] focus:ring-[#D5B170]/50"
            />
            <span className="text-sm text-[#f1f1f1]">Apenas WhatsApp</span>
          </label>
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
          {loading ? "Buscando…" : "Buscar"}
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

      {result?.success && result.data?.phones && (
        <div className="mt-8">
          <ResultDisplay type="phones" data={result.data} />
        </div>
      )}

      {result?.success && (!result.data?.phones || result.data.phones.length === 0) && (
        <p className="mt-8 text-[#f1f1f1]/70">
          Nenhum telefone encontrado para esta empresa.
        </p>
      )}
    </div>
  );
}
