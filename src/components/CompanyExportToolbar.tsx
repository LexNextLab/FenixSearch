"use client";

import type { LegalProcessoItem } from "@/lib/kipflow";
import type { CompanyDataset, CompanyDto } from "@/lib/types";
import { downloadXlsxWorkbook } from "@/lib/company-export";

const DATASET_UI_LABEL: Record<CompanyDataset, string> = {
  basic: "Básico",
  complete: "Completo",
  address: "Endereço",
  online_presence: "Presença online",
  partners: "Sócios",
  debts: "Dívida ativa",
};

function sanitizeBaseName(name: string) {
  return name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").trim().slice(0, 180) || "exportacao";
}

export type CompanyExportItem = {
  company: CompanyDto;
  cnpjClean: string;
  processos?: LegalProcessoItem[] | null;
};

interface CompanyExportToolbarProps {
  items: CompanyExportItem[];
  datasets: CompanyDataset[];
  /** Prefixo opcional no nome do arquivo (ex. busca avançada). */
  fileNamePrefix?: string;
}

async function downloadSequentially(
  items: CompanyExportItem[],
  datasets: CompanyDataset[],
  fileNamePrefix: string
) {
  const p = fileNamePrefix ? `${fileNamePrefix}_` : "";
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const base = sanitizeBaseName(`${p}empresa_${it.cnpjClean.replace(/\D/g, "").slice(-14)}`);
    const cnpj = it.cnpjClean.replace(/\D/g, "").padStart(14, "0").slice(-14);
    const proc = it.processos;
    downloadXlsxWorkbook(
      datasets,
      [it.company],
      base,
      proc?.length && cnpj.length === 14 ? { processos: proc, cnpjClean: cnpj } : undefined
    );
    if (i < items.length - 1) {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
}

export function CompanyExportToolbar({
  items,
  datasets,
  fileNamePrefix = "",
}: CompanyExportToolbarProps) {
  const exportable = items.filter((it) => it.company != null);
  if (exportable.length === 0 || datasets.length === 0) return null;

  const multi = exportable.length > 1;
  const tabHint = [...datasets.map((d) => DATASET_UI_LABEL[d]), "Processos (se carregado)"].join(" · ");

  return (
    <div className="rounded-xl border border-[#D5B170]/25 bg-[#0a0a0a]/80 p-4">
      <p className="mb-2 text-sm font-medium text-[#f1f1f1]">Exportar resultados</p>
      <p className="mb-3 text-xs text-[#f1f1f1]/60">
        {multi
          ? `${exportable.length} arquivos .xlsx (um por CNPJ), cada um com abas dos datasets selecionados e processos quando já estiverem disponíveis.`
          : "Um arquivo .xlsx com uma aba por dataset selecionado e processos quando já estiverem disponíveis."}
      </p>
      <p className="mb-4 text-xs text-[#f1f1f1]/50">Abas por arquivo: {tabHint}</p>
      <button
        type="button"
        onClick={() => void downloadSequentially(exportable, datasets, fileNamePrefix)}
        className="fenix-btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
      >
        {multi ? `Baixar ${exportable.length} Excel (.xlsx)` : "Baixar Excel (.xlsx)"}
      </button>
    </div>
  );
}
