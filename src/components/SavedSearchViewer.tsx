"use client";

import { useEffect, useState } from "react";
import { ResultDisplay } from "./ResultDisplay";
import { ProcessosCard } from "./ProcessosCard";
import { ErrorAlert } from "./ErrorAlert";

interface SavedSearchViewerProps {
  searchType: string;
  params: Record<string, unknown>;
  /** Se true, busca automaticamente ao montar */
  autoLoad?: boolean;
  /** Se true, não registra no histórico (visualização de dados já salvos) */
  skipHistory?: boolean;
  onLoad?: () => void;
}

function buildApiUrl(searchType: string, params: Record<string, unknown>, skipHistory?: boolean): string {
  const p = params ?? {};
  const searchParams = new URLSearchParams();
  if (searchType === "empresa_cnpj") {
    if (p.cnpj) searchParams.set("cnpj", String(p.cnpj).replace(/\D/g, ""));
    if (p.domain) searchParams.set("domain", String(p.domain));
    if (p.datasets) searchParams.set("datasets", Array.isArray(p.datasets) ? p.datasets.join(",") : String(p.datasets));
  } else if (searchType === "cpf") {
    if (p.cpf) searchParams.set("cpf", String(p.cpf).replace(/\D/g, ""));
    searchParams.set("datasets", Array.isArray(p.datasets) ? p.datasets.join(",") : (p.datasets ? String(p.datasets) : "basic,registration_status"));
  } else if (searchType === "telefones") {
    if (p.cnpj) searchParams.set("cnpj", String(p.cnpj).replace(/\D/g, ""));
    if (p.domain) searchParams.set("domain", String(p.domain));
    searchParams.set("phone_limit", String(p.phone_limit ?? 10));
  } else if (searchType === "emails") {
    if (p.cnpj) searchParams.set("cnpj", String(p.cnpj).replace(/\D/g, ""));
    if (p.domain) searchParams.set("domain", String(p.domain));
    searchParams.set("email_limit", String(p.email_limit ?? 10));
  } else if (searchType === "processos") {
    if (p.cnpj) searchParams.set("cnpj", String(p.cnpj).replace(/\D/g, ""));
    searchParams.set("limite", String(p.limite ?? 1000));
  } else {
    return "";
  }
  if (skipHistory) searchParams.set("skip_history", "1");
  const base = searchType === "empresa_cnpj" ? "/api/empresas" : searchType === "processos" ? "/api/empresas/processos" : searchType === "telefones" ? "/api/contatos/telefones" : searchType === "emails" ? "/api/contatos/emails" : "/api/cpf";
  return `${base}?${searchParams.toString()}`;
}

export function SavedSearchViewer({ searchType, params, autoLoad, skipHistory, onLoad }: SavedSearchViewerProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<{ code?: string; message?: string } | null>(null);

  const handleFetch = async () => {
    const url = buildApiUrl(searchType, params, skipHistory);
    if (!url) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        setError((data as { error?: { code?: string; message?: string } }).error ?? { message: "Erro na consulta" });
        return;
      }
      if ((data as { success?: boolean }).success === false && (data as { error?: unknown }).error) {
        setError((data as { error: { code?: string; message?: string } }).error);
        return;
      }
      setResult(data);
      onLoad?.();
    } catch {
      setError({ message: "Erro ao conectar. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad && searchType !== "processos" && buildApiUrl(searchType, params, skipHistory)) {
      handleFetch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- autoLoad initial only
  }, [autoLoad, searchType]);

  if (searchType === "processos") {
    const cnpj = params?.cnpj ? String(params.cnpj).replace(/\D/g, "").padStart(14, "0") : "";
    if (!cnpj || cnpj.length !== 14) return null;
    return (
      <div className="mt-4">
        <ProcessosCard cnpj={cnpj} autoFetch skipHistory={skipHistory} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-4 flex items-center gap-2 text-[#f1f1f1]/60">
        <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Carregando dados (do cache quando disponível)…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4">
        <ErrorAlert message={error.message ?? "Erro"} code={error.code} onDismiss={() => setError(null)} />
      </div>
    );
  }

  if (!result) {
    return (
      <button
        type="button"
        onClick={handleFetch}
        className="fenix-btn-primary mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
      >
        Ver dados
      </button>
    );
  }

  if (searchType === "empresa_cnpj") {
    const data = (result as { data?: unknown }).data;
    const costFormatted = (result as { costFormatted?: string }).costFormatted;
    const cnpj = data && typeof data === "object" && "cnpj" in data ? String((data as { cnpj?: string }).cnpj).padStart(14, "0") : "";
    return (
      <div className="mt-4 space-y-6">
        <ResultDisplay type="company" data={data} costFormatted={costFormatted} />
        {cnpj && cnpj.length === 14 && <ProcessosCard cnpj={cnpj} skipHistory={skipHistory} />}
      </div>
    );
  }

  if (searchType === "cpf") {
    const data = (result as { data?: unknown }).data ?? result;
    const costFormatted = (result as { costFormatted?: string }).costFormatted;
    return (
      <div className="mt-4">
        <ResultDisplay type="cpf" data={data} costFormatted={costFormatted} />
      </div>
    );
  }

  if (searchType === "telefones") {
    const data = (result as { data?: { phones?: unknown } }).data;
    const costFormatted = (result as { costFormatted?: string }).costFormatted;
    return (
      <div className="mt-4">
        <ResultDisplay type="phones" data={data} costFormatted={costFormatted} />
      </div>
    );
  }

  if (searchType === "emails") {
    const data = (result as { data?: unknown[] }).data ?? result;
    const costFormatted = (result as { costFormatted?: string }).costFormatted;
    return (
      <div className="mt-4">
        <ResultDisplay type="emails" data={data} costFormatted={costFormatted} />
      </div>
    );
  }

  return null;
}
