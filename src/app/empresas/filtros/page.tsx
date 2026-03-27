"use client";

import { use, useState } from "react";
import { ErrorAlert } from "@/components/ErrorAlert";
import { useCostTracker } from "@/hooks/useCostTracker";
import { CompanyExportToolbar } from "@/components/CompanyExportToolbar";
import { ResultDisplay } from "@/components/ResultDisplay";
import type { CompanyDataset, CompanyFilterResponseDto } from "@/lib/types";

const SITUACAO_OPTIONS = ["ATIVA", "BAIXADA", "SUSPENSA", "INAPTA", "NULA"];
const UF_OPTIONS = ["SP", "RJ", "MG", "PR", "RS", "SC", "BA", "PE", "CE", "GO", "DF", "ES", "MT", "MS", "PA", "AM", "RO", "AC", "RR", "AP", "TO", "MA", "RN", "PB", "AL", "SE", "PI"];

const FILTER_DATASETS: { value: CompanyDataset; label: string }[] = [
  { value: "basic", label: "Básico" },
  { value: "complete", label: "Completo" },
  { value: "address", label: "Endereço" },
  { value: "online_presence", label: "Presença Online" },
  { value: "partners", label: "Sócios" },
  { value: "debts", label: "Dívida Ativa" },
];

const ALL_FILTER_DATASETS: CompanyDataset[] = ["basic", "complete", "address", "online_presence", "partners", "debts"];

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
  params?: Promise<Record<string, string>>;
};

export default function FiltrosPage({ searchParams, params }: PageProps) {
  use(searchParams ?? Promise.resolve({}));
  use(params ?? Promise.resolve({}));
  const [situacao, setSituacao] = useState("");
  const [uf, setUf] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const [datasets, setDatasets] = useState<CompanyDataset[]>(["basic", "complete"]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompanyFilterResponseDto | null>(null);
  const [error, setError] = useState<{ code?: string; message?: string } | null>(null);
  const { addCost } = useCostTracker();

  const toggleDataset = (d: CompanyDataset) => {
    setDatasets((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const selectAllDatasets = () => setDatasets(ALL_FILTER_DATASETS);
  const clearDatasets = () => setDatasets(["basic"]);

  const buildFilter = () => {
    const conditions: Record<string, unknown>[] = [];
    if (situacao) conditions.push({ situacao_cadastral: situacao });
    if (uf) conditions.push({ sigla_uf: uf });
    if (municipio) conditions.push({ municipio: municipio.toUpperCase().replace(/\s+/g, " ") });
    if (razaoSocial) conditions.push({ razao_social: { $fuzzy: razaoSocial.toUpperCase() } });
    if (conditions.length === 0) return {};
    return { $and: conditions };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/empresas/filtros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          $filter: buildFilter(),
          $page: page,
          $size: size,
          datasets: datasets.length ? datasets : ["basic"],
        }),
      });
      const data = (await res.json()) as CompanyFilterResponseDto & { error?: { code?: string; message?: string } };
      if (!res.ok) {
        setError(data.error ?? { message: "Erro na consulta" });
        return;
      }
      setResult(data);
      if (data.cost != null && data.cost > 0) {
        addCost("Busca avançada", data.cost, data.costFormatted, `${data.data?.length ?? 0} empresa(s)`);
      }
    } catch {
      setError({ message: "Erro ao conectar. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  const pagination = result?.pagination;
  const hasMore = pagination && pagination.total != null && (page + 1) * (pagination.size ?? size) < pagination.total;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-[#f1f1f1]">
        Busca Avançada de Empresas
      </h1>
      <p className="mt-2 text-[#f1f1f1]/70">
        Filtre empresas por situação, localização, CNAE e mais.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="situacao" className="block text-sm font-medium text-[#f1f1f1]/90">
              Situação Cadastral
            </label>
            <select
              id="situacao"
              value={situacao}
              onChange={(e) => setSituacao(e.target.value)}
              className="mt-1 w-full rounded-lg fenix-input border px-4 py-2 text-sm"
            >
              <option value="">Qualquer</option>
              {SITUACAO_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="uf" className="block text-sm font-medium text-[#f1f1f1]/90">
              UF
            </label>
            <select
              id="uf"
              value={uf}
              onChange={(e) => setUf(e.target.value)}
              className="mt-1 w-full rounded-lg fenix-input border px-4 py-2 text-sm"
            >
              <option value="">Qualquer</option>
              {UF_OPTIONS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="municipio" className="block text-sm font-medium text-[#f1f1f1]/90">
              Município
            </label>
            <input
              id="municipio"
              type="text"
              placeholder="SAO PAULO"
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
              className="mt-1 w-full rounded-lg fenix-input border px-4 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="razao" className="block text-sm font-medium text-[#f1f1f1]/90">
              Razão Social (fuzzy)
            </label>
            <input
              id="razao"
              type="text"
              placeholder="EMPRESA LTDA"
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              className="mt-1 w-full rounded-lg fenix-input border px-4 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <span className="block text-sm font-medium text-[#f1f1f1]/90">Datasets</span>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {FILTER_DATASETS.map(({ value, label }) => (
              <label key={value} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={datasets.includes(value)}
                  onChange={() => toggleDataset(value)}
                  className="rounded border-[#D5B170]/30 text-[#D5B170] focus:ring-[#D5B170]/50"
                />
                <span className="text-sm text-[#f1f1f1]">{label}</span>
              </label>
            ))}
            <button type="button" onClick={selectAllDatasets} className="text-xs text-[#D5B170] hover:underline">
              Todos
            </button>
            <button type="button" onClick={clearDatasets} className="text-xs text-[#f1f1f1]/60 hover:underline">
              Apenas básico
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label htmlFor="page" className="block text-sm font-medium text-[#f1f1f1]/90">
              Página
            </label>
            <input
              id="page"
              type="number"
              min={0}
              value={page}
              onChange={(e) => setPage(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="mt-1 w-20 rounded-lg fenix-input border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="size" className="block text-sm font-medium text-[#f1f1f1]/90">
              Por página (máx. 50)
            </label>
            <input
              id="size"
              type="number"
              min={1}
              max={50}
              value={size}
              onChange={(e) => setSize(Math.min(50, Math.max(1, parseInt(e.target.value, 10) || 5)))}
              className="mt-1 w-20 rounded-lg fenix-input border px-3 py-2 text-sm"
            />
          </div>
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

      {result?.success && result.data && result.data.length > 0 && (
        <div className="mt-8 space-y-6">
          {pagination && (
            <p className="text-sm text-[#f1f1f1]/70">
              {pagination.total ?? 0} resultado(s) · Custo: {result.costFormatted ?? "—"}
            </p>
          )}
          <CompanyExportToolbar
            items={result.data.map((c) => ({
              company: c,
              cnpjClean: String(c.cnpj ?? "")
                .replace(/\D/g, "")
                .padStart(14, "0")
                .slice(-14),
              processos: null,
            }))}
            datasets={(result.datasets?.length ? result.datasets : datasets) as CompanyDataset[]}
            fileNamePrefix={`busca_p${page}_n${result.data.length}_${new Date().toISOString().slice(0, 10)}`}
          />
          <ResultDisplay type="companies" data={result.data} />
          {pagination && (hasMore || page > 0) && (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="rounded-lg border border-[#D5B170]/30 px-4 py-2 text-sm font-medium text-[#f1f1f1] disabled:opacity-50 hover:bg-[#D5B170]/10"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore || loading}
                className="rounded-lg border border-[#D5B170]/30 px-4 py-2 text-sm font-medium text-[#f1f1f1] disabled:opacity-50 hover:bg-[#D5B170]/10"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      )}

      {result?.success && result.data?.length === 0 && (
        <p className="mt-8 text-[#f1f1f1]/70">
          Nenhuma empresa encontrada com os filtros informados.
        </p>
      )}
    </div>
  );
}
