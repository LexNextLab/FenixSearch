"use client";

import { use, useMemo, useState } from "react";
import { ErrorAlert } from "@/components/ErrorAlert";
import { SaveSearchButton } from "@/components/SaveSearchButton";
import { CompanyExportToolbar, type CompanyExportItem } from "@/components/CompanyExportToolbar";
import { CnpjChipsField } from "@/components/CnpjChipsField";
import { DatasetOptionCard } from "@/components/DatasetOptionCard";
import { ProcessosCard } from "@/components/ProcessosCard";
import { ResultDisplay } from "@/components/ResultDisplay";
import { useCostTracker } from "@/hooks/useCostTracker";
import { formatCnpjBr } from "@/lib/cnpj-format";
import {
  EMPRESA_DATASET_ALL_IDS,
  EMPRESA_DATASET_OPTIONS,
  type EmpresaDatasetOptionId,
  companyDatasetsFromSelection,
} from "@/lib/empresa-dataset-options";
import type { LegalProcessoItem } from "@/lib/kipflow";
import {
  formatBrlEstimate,
  KIPFLOW_PROCESSOS_CONSULTA_ESTIMATE_BRL,
} from "@/lib/kipflow-company-dataset-prices";
import type { CompanyDataset, CompanyDto, CompanySearchResponseDto } from "@/lib/types";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
  params?: Promise<Record<string, string>>;
};

function normCnpj14(c: string): string {
  return c.replace(/\D/g, "").padStart(14, "0").slice(-14);
}

type SearchResultRow = {
  cnpjClean: string;
  ok: boolean;
  data?: CompanyDto;
  error?: { code?: string; message?: string };
  costFormatted?: string;
  processosOnly?: boolean;
};

export default function EmpresasPage({ searchParams, params }: PageProps) {
  use(searchParams ?? Promise.resolve({}));
  use(params ?? Promise.resolve({}));
  const [cnpjList, setCnpjList] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<EmpresaDatasetOptionId>>(
    () =>
      new Set<EmpresaDatasetOptionId>([
        "basic",
        "complete",
        "address",
        "partners",
        "debts",
        "online_presence",
      ])
  );
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<SearchResultRow[]>([]);
  const [error, setError] = useState<{ code?: string; message?: string } | null>(null);
  const [processosByCnpj, setProcessosByCnpj] = useState<Record<string, LegalProcessoItem[]>>({});
  const { addCost } = useCostTracker();

  const hasChips = cnpjList.length > 0;

  const companyDatasets = useMemo(
    () => companyDatasetsFromSelection(selected),
    [selected]
  );
  const includeProcessos = selected.has("processos");

  const isPresetCompleto = useMemo(
    () =>
      selected.size === EMPRESA_DATASET_ALL_IDS.length &&
      EMPRESA_DATASET_ALL_IDS.every((id) => selected.has(id)),
    [selected]
  );
  const isPresetBasico = useMemo(
    () => selected.size === 1 && selected.has("basic"),
    [selected]
  );
  const isPresetProcessos = useMemo(
    () => selected.size === 1 && selected.has("processos"),
    [selected]
  );

  const applyPreset = (preset: "completo" | "basico" | "processos") => {
    if (preset === "completo") {
      setSelected(new Set(EMPRESA_DATASET_ALL_IDS));
    } else if (preset === "basico") {
      setSelected(new Set<EmpresaDatasetOptionId>(["basic"]));
    } else {
      setSelected(new Set<EmpresaDatasetOptionId>(["processos"]));
    }
  };

  const toggleOption = (id: EmpresaDatasetOptionId) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRows([]);
    setProcessosByCnpj({});

    if (!hasChips) {
      setError({ code: "MISSING_PARAMETER", message: "Informe ao menos um CNPJ" });
      return;
    }

    if (companyDatasets.length === 0 && !includeProcessos) {
      setError({
        code: "MISSING_SELECTION",
        message: "Ative ao menos um dataset ou processos judiciais.",
      });
      return;
    }

    setLoading(true);
    try {
      const nextRows: SearchResultRow[] = [];

      if (companyDatasets.length === 0 && includeProcessos && hasChips) {
        for (const c of cnpjList) {
          nextRows.push({ cnpjClean: normCnpj14(c), ok: true, processosOnly: true });
        }
        setRows(nextRows);
        return;
      }

      if (companyDatasets.length > 0 && hasChips) {
        const results = await Promise.all(
          cnpjList.map(async (c) => {
            const sp = new URLSearchParams();
            sp.set("cnpj", c);
            sp.set("datasets", companyDatasets.join(","));
            const res = await fetch(`/api/empresas?${sp.toString()}`);
            const data = (await res.json()) as CompanySearchResponseDto;
            return { cnpjClean: c, res, data };
          })
        );

        for (const { cnpjClean, res, data } of results) {
          const ok = res.ok && data.success === true && !!data.data;
          nextRows.push({
            cnpjClean,
            ok,
            data: data.data,
            error: ok ? undefined : data.error ?? { message: res.ok ? "Sem dados" : "Erro na consulta" },
            costFormatted: data.costFormatted,
          });
          if (ok && data.cost != null && data.cost > 0) {
            addCost("Consulta Fenix Search", data.cost, data.costFormatted, data.datasets?.join(", "));
          }
        }
      }

      setRows(nextRows);

      if (companyDatasets.length > 0 && nextRows.length === 0) {
        setError({ message: "Nenhum resultado retornado." });
      }
    } catch {
      setError({ message: "Erro ao conectar. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  const exportDatasets = (companyDatasets.length ? companyDatasets : []) as CompanyDataset[];

  const exportItems: CompanyExportItem[] = useMemo(() => {
    return rows
      .filter((r) => r.ok && r.data && !r.processosOnly)
      .map((r) => {
        const key = normCnpj14(r.cnpjClean);
        return {
          company: r.data as CompanyDto,
          cnpjClean: key,
          processos: processosByCnpj[key] ?? null,
        };
      });
  }, [rows, processosByCnpj]);

  const processosTargets = useMemo(() => {
    if (!includeProcessos) return [];
    if (rows.some((r) => r.processosOnly)) {
      return rows.filter((r) => r.ok && r.processosOnly).map((r) => normCnpj14(r.cnpjClean));
    }
    return rows
      .filter((r) => r.ok && r.data)
      .map((r) => normCnpj14(String(r.data!.cnpj ?? r.cnpjClean)));
  }, [includeProcessos, rows]);

  const processosDisabled = (id: EmpresaDatasetOptionId) =>
    id === "processos" && cnpjList.length === 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex justify-end">
        {(hasChips || selected.size > 0) && (
          <SaveSearchButton
            searchType="empresa_cnpj"
            params={{
              cnpjs: hasChips ? cnpjList : null,
              datasets: companyDatasets,
              includeProcessos,
            }}
          />
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="cnpj-chips" className="block text-sm font-medium text-muted-foreground">
            CNPJ (um ou mais)
          </label>
          <CnpjChipsField
            id="cnpj-chips"
            value={cnpjList}
            onChange={setCnpjList}
            disabled={loading}
            className="mt-2"
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-muted-foreground">Datasets</span>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyPreset("completo")}
              className={
                isPresetCompleto
                  ? "rounded-lg border border-[#34C759]/50 bg-[#34C759]/15 px-4 py-2 text-sm font-medium text-[#34C759]"
                  : "rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:border-[#D5B170]/40 hover:bg-muted/50"
              }
            >
              Completo
            </button>
            <button
              type="button"
              onClick={() => applyPreset("basico")}
              className={
                isPresetBasico
                  ? "rounded-lg border border-[#34C759]/50 bg-[#34C759]/15 px-4 py-2 text-sm font-medium text-[#34C759]"
                  : "rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:border-[#D5B170]/40 hover:bg-muted/50"
              }
            >
              Básico
            </button>
            <button
              type="button"
              onClick={() => applyPreset("processos")}
              className={
                isPresetProcessos
                  ? "rounded-lg border border-[#34C759]/50 bg-[#34C759]/15 px-4 py-2 text-sm font-medium text-[#34C759]"
                  : "rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:border-[#D5B170]/40 hover:bg-muted/50"
              }
            >
              Processos
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EMPRESA_DATASET_OPTIONS.map((opt) => {
              const disabled = processosDisabled(opt.id);
              return (
                <DatasetOptionCard
                  key={opt.id}
                  title={opt.label}
                  subtitle={
                    disabled
                      ? `${opt.subtitle} — adicione ao menos um CNPJ acima.`
                      : opt.subtitle
                  }
                  icon={opt.icon}
                  checked={selected.has(opt.id)}
                  disabled={disabled}
                  onCheckedChange={(on) => {
                    if (disabled && on) return;
                    toggleOption(opt.id);
                  }}
                />
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="fenix-btn-primary w-full rounded-xl px-6 py-3 text-sm font-semibold transition disabled:opacity-50"
        >
          {loading && (
            <span className="inline-flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Consultando…
            </span>
          )}
          {!loading && "Consultar"}
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

      {rows.length > 0 && (
        <div className="mt-10 space-y-8">
          {exportItems.length > 0 && exportDatasets.length > 0 && (
            <CompanyExportToolbar items={exportItems} datasets={exportDatasets} />
          )}

          {rows.map((row) => (
            <section
              key={row.cnpjClean}
              className="rounded-xl border border-border/60 bg-card/40 p-4 shadow-sm"
            >
              <h2 className="mb-4 font-mono text-sm font-semibold text-foreground">
                {/^\d{14}$/.test(normCnpj14(row.cnpjClean))
                  ? formatCnpjBr(normCnpj14(row.cnpjClean))
                  : row.cnpjClean}
              </h2>
              {row.processosOnly ? (
                <p className="text-sm text-muted-foreground">
                  Apenas processos judiciais (nenhum dataset cadastral selecionado).
                </p>
              ) : row.ok && row.data ? (
                <ResultDisplay
                  type="company"
                  data={row.data}
                  costFormatted={row.costFormatted}
                />
              ) : (
                <ErrorAlert
                  message={row.error?.message ?? "Falha na consulta"}
                  code={row.error?.code}
                  onDismiss={() => setRows((prev) => prev.filter((r) => r.cnpjClean !== row.cnpjClean))}
                />
              )}
            </section>
          ))}

          {includeProcessos &&
            processosTargets.map((cnpj14) => (
              <ProcessosCard
                key={cnpj14}
                cnpj={cnpj14}
                autoFetch
                hideFetchButton
                onFetchComplete={({ success, items }) => {
                  setProcessosByCnpj((prev) => ({ ...prev, [cnpj14]: items }));
                  if (success) {
                    addCost(
                      "Processos judiciais",
                      KIPFLOW_PROCESSOS_CONSULTA_ESTIMATE_BRL,
                      formatBrlEstimate(KIPFLOW_PROCESSOS_CONSULTA_ESTIMATE_BRL),
                      `q=${cnpj14}`
                    );
                  }
                }}
              />
            ))}
        </div>
      )}
    </div>
  );
}
