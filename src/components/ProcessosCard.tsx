"use client";

import { useEffect, useMemo, useState } from "react";
import type { LegalProcessoItem, LegalProcessoValorCausa } from "@/lib/kipflow";
import { processoToCsvRow } from "@/lib/legal-processos-export";
import { PROCESSO_COL_PT } from "@/lib/empresa-excel-labels";
import { FileDown } from "lucide-react";

/** Formata número de processo no padrão CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO */
function formatNumeroCNJ(raw: string | number | undefined): string {
  const s = typeof raw === "number" ? String(raw) : raw ?? "";
  const digits = s.replace(/\D/g, "");
  if (digits.length < 20) return s || "—";
  return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13, 14)}.${digits.slice(14, 16)}.${digits.slice(16, 20)}`;
}

function getProcessoNumeroRaw(p: LegalProcessoItem): string {
  const n = p.numeroProcesso ?? p.numeroProcessoUnico ?? p.numero ?? (p as Record<string, unknown>).numero;
  return typeof n === "string" || typeof n === "number" ? String(n) : "";
}

function formatProcessoNumero(p: LegalProcessoItem): string {
  const raw = getProcessoNumeroRaw(p);
  if (!raw) return "—";
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 20 ? formatNumeroCNJ(raw) : raw;
}

function formatValorCausa(valorCausa: LegalProcessoItem["valorCausa"]): string | null {
  if (valorCausa == null) return null;
  const valor = typeof valorCausa === "object" && "valor" in valorCausa
    ? (valorCausa as LegalProcessoValorCausa).valor
    : typeof valorCausa === "number"
      ? valorCausa
      : null;
  if (valor == null || typeof valor !== "number" || Number.isNaN(valor)) return null;
  const moeda = typeof valorCausa === "object" && "moeda" in valorCausa
    ? (valorCausa as LegalProcessoValorCausa).moeda ?? "R$"
    : "R$";
  return `${moeda} ${valor.toLocaleString("pt-BR")}`;
}

function formatData(data: string | undefined): string {
  if (!data) return "—";
  try {
    const d = new Date(data);
    if (Number.isNaN(d.getTime())) return data;
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return data;
  }
}

function getArea(p: LegalProcessoItem): string {
  const ramo = p.statusPredictus?.ramoDireito;
  if (ramo) return ramo;
  const seg = p.segmento ?? "";
  if (seg.includes("TRABALH") || seg.includes("TRT")) return "Trabalhista";
  if (seg.includes("FEDERAL") || seg.includes("TRF")) return "Federal";
  if (seg.includes("ESTADUAL") || seg.includes("TJ")) return "Estadual";
  if (seg.includes("ELEITORAL")) return "Eleitoral";
  return seg || "Outros";
}

function getPoloEmpresa(p: LegalProcessoItem, cnpjClean: string): "ativo" | "passivo" | "outro" {
  const cnpj14 = cnpjClean.replace(/\D/g, "").padStart(14, "0").slice(-14);
  const cnpjRaiz = cnpj14.slice(0, 8);
  for (const parte of p.partes ?? []) {
    const parteCnpj = parte.cnpj?.replace(/\D/g, "");
    const parteRaiz = parte.cnpjRaiz;
    const match = (parteCnpj && parteCnpj.slice(-14) === cnpj14)
      || (parteRaiz && parteRaiz === cnpjRaiz)
      || (parteCnpj && parteCnpj.startsWith(cnpjRaiz));
    if (match) {
      const polo = (parte.polo ?? "").toUpperCase();
      if (polo.includes("PASSIVO")) return "passivo";
      if (polo.includes("ATIVO")) return "ativo";
    }
  }
  return "outro";
}

function escapeCsvCell(val: string | number | null | undefined): string {
  const s = val == null ? "" : String(val);
  if (s.includes(";") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function exportProcessosToExcel(processos: LegalProcessoItem[], cnpjClean: string) {
  const rows = [[...PROCESSO_COL_PT].join(";")];
  for (const p of processos) {
    const row = processoToCsvRow(p, cnpjClean).map(escapeCsvCell).join(";");
    rows.push(row);
  }
  const csv = "\uFEFF" + rows.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `processos-${cnpjClean}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface ProcessosCardProps {
  cnpj: string;
  /** Se true, busca automaticamente ao montar (ex: em buscas salvas) */
  autoFetch?: boolean;
  /** Se true, não registra no histórico (visualização de dados já salvos) */
  skipHistory?: boolean;
  /** Chamado ao concluir busca. `success` falso em erro HTTP ou resposta de erro da API. */
  onFetchComplete?: (payload: { success: boolean; items: LegalProcessoItem[] }) => void;
  /** Esconde o botão manual; use com autoFetch na consulta unificada. */
  hideFetchButton?: boolean;
}

export function ProcessosCard({
  cnpj,
  autoFetch,
  skipHistory,
  onFetchComplete,
  hideFetchButton,
}: ProcessosCardProps) {
  const [loading, setLoading] = useState(false);
  const [processos, setProcessos] = useState<LegalProcessoItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cnpjClean = cnpj.replace(/\D/g, "");

  const stats = useMemo(() => {
    if (!processos || processos.length === 0) return null;
    const porRegiao: Record<string, number> = {};
    const porArea: Record<string, number> = {};
    const porAno: Record<string, number> = {};
    let ativo = 0;
    let passivo = 0;
    let outro = 0;
    for (const p of processos) {
      const regiao = p.uf ?? p.tribunal ?? "Não informado";
      porRegiao[regiao] = (porRegiao[regiao] ?? 0) + 1;
      const area = getArea(p);
      porArea[area] = (porArea[area] ?? 0) + 1;
      const ano = p.dataDistribuicao ? p.dataDistribuicao.slice(0, 4) : "Sem data";
      porAno[ano] = (porAno[ano] ?? 0) + 1;
      const polo = getPoloEmpresa(p, cnpjClean);
      if (polo === "ativo") ativo++;
      else if (polo === "passivo") passivo++;
      else outro++;
    }
    return {
      total: processos.length,
      porRegiao: Object.entries(porRegiao).sort((a, b) => b[1] - a[1]),
      porArea: Object.entries(porArea).sort((a, b) => b[1] - a[1]),
      porAno: Object.entries(porAno).sort((a, b) => b[0].localeCompare(a[0])),
      polo: { ativo, passivo, outro },
    };
  }, [processos, cnpjClean]);

  const handleFetch = async () => {
    setError(null);
    setProcessos(null);
    setLoading(true);
    try {
      const url = `/api/empresas/processos?cnpj=${cnpjClean}&limite=1000${skipHistory ? "&skip_history=1" : ""}`;
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? `Erro ${res.status}: ao buscar processos`);
        onFetchComplete?.({ success: false, items: [] });
        return;
      }
      if (data?.success === false && data?.error) {
        setError(data.error.message ?? "Erro ao buscar processos");
        onFetchComplete?.({ success: false, items: [] });
        return;
      }
      const list = data.data ?? data.processos ?? (Array.isArray(data) ? data : []);
      const arr = Array.isArray(list) ? list : [];
      setProcessos(arr);
      onFetchComplete?.({ success: true, items: arr });
    } catch {
      setError("Erro ao conectar. Tente novamente.");
      onFetchComplete?.({ success: false, items: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch && cnpjClean.length === 14) {
      handleFetch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- autoFetch initial only
  }, [autoFetch, cnpjClean]);

  return (
    <div className="fenix-card-full mt-6 rounded-xl border p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="font-display text-lg font-semibold text-[#f1f1f1]">
          Processos Judiciais
        </h3>
        {!hideFetchButton && (
          <button
            type="button"
            onClick={handleFetch}
            disabled={loading}
            className="fenix-btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50"
          >
            {loading && (
              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {loading ? "Buscando…" : "Buscar processos"}
          </button>
        )}
        {hideFetchButton && loading && (
          <span className="inline-flex items-center gap-2 text-sm text-[#f1f1f1]/70">
            <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Buscando processos…
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-[#f1f1f1]/60">
        Processos onde a empresa é parte (ativa ou passiva). Custo por consulta.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-[#D5B170]/40 bg-[#D5B170]/10 px-4 py-3 text-sm text-[#D5B170]">
          {error}
        </div>
      )}

      {processos !== null && (
        <div className="mt-6 space-y-6">
          {processos.length === 0 ? (
            <p className="text-sm text-[#f1f1f1]/60">
              Nenhum processo encontrado para este CNPJ.
            </p>
          ) : (
            <>
              {stats && (
                <div className="rounded-lg border border-[#D5B170]/20 bg-[#101F2E]/50 p-4">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#D5B170]">
                    Resumo
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs text-[#f1f1f1]/60">Total</p>
                      <p className="text-lg font-semibold text-[#f1f1f1]">{stats.total} processos</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#f1f1f1]/60">Polo da empresa</p>
                      <p className="text-sm text-[#f1f1f1]">
                        {stats.polo.ativo > 0 && <span>Ativo: {stats.polo.ativo}</span>}
                        {stats.polo.ativo > 0 && stats.polo.passivo > 0 && " · "}
                        {stats.polo.passivo > 0 && <span>Passivo: {stats.polo.passivo}</span>}
                        {stats.polo.outro > 0 && (stats.polo.ativo > 0 || stats.polo.passivo > 0 ? " · " : "")}
                        {stats.polo.outro > 0 && <span>Outros: {stats.polo.outro}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="mb-1 text-xs font-medium text-[#f1f1f1]/60">Por região (UF/Tribunal)</p>
                      <ul className="space-y-0.5 text-xs text-[#f1f1f1]">
                        {stats.porRegiao.slice(0, 6).map(([reg, qtd]) => (
                          <li key={reg}>{reg}: {qtd}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium text-[#f1f1f1]/60">Por área</p>
                      <ul className="space-y-0.5 text-xs text-[#f1f1f1]">
                        {stats.porArea.slice(0, 6).map(([area, qtd]) => (
                          <li key={area}>{area}: {qtd}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium text-[#f1f1f1]/60">Por ano de distribuição</p>
                      <ul className="space-y-0.5 text-xs text-[#f1f1f1]">
                        {stats.porAno.slice(0, 6).map(([ano, qtd]) => (
                          <li key={ano}>{ano}: {qtd}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-[#f1f1f1]">Lista de processos</h4>
                  <button
                    type="button"
                    onClick={() => exportProcessosToExcel(processos, cnpjClean)}
                    className="fenix-btn-primary inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-90"
                  >
                    <FileDown className="h-4 w-4" aria-hidden />
                    Exportar Excel
                  </button>
                </div>
                <ul className="space-y-3">
                  {processos.map((p, i) => {
                    const valor = formatValorCausa(p.valorCausa);
                    const assuntos = p.assuntosCNJ?.filter((a) => a.ePrincipal).map((a) => a.titulo).join(", ")
                      ?? p.assuntosCNJ?.[0]?.titulo
                      ?? p.assunto;
                    const rawNum = getProcessoNumeroRaw(p);
                    const uniqueKey = `${p.tribunal ?? "x"}-${rawNum}-${i}`;
                    return (
                      <li
                        key={uniqueKey}
                        className="rounded-lg border border-[#D5B170]/20 px-4 py-3 text-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-sm font-medium text-[#f1f1f1]" title={rawNum || undefined}>
                            {formatProcessoNumero(p)}
                          </span>
                          {p.urlProcesso && (
                            <a
                              href={p.urlProcesso}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="fenix-link text-xs hover:underline"
                            >
                              Ver processo
                            </a>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#f1f1f1]/60">
                          {p.tribunal && <span>Tribunal: {p.tribunal}</span>}
                          {p.dataDistribuicao && <span>Distribuição: {formatData(p.dataDistribuicao)}</span>}
                          {valor && <span>Valor: {valor}</span>}
                          {p.classeProcessual?.nome && <span>Classe: {p.classeProcessual.nome}</span>}
                          {assuntos && <span>Assunto: {assuntos}</span>}
                          {p.juiz && <span>Juiz: {p.juiz}</span>}
                          {p.orgaoJulgador && <span>Órgão: {p.orgaoJulgador}</span>}
                        </div>
                        {p.statusPredictus?.statusProcesso && (
                          <div className="mt-4 border-t border-[#D5B170]/10 pt-2 text-xs">
                            <span className="text-[#f1f1f1]/60">Status: </span>
                            <span className="text-[#f1f1f1]">{p.statusPredictus.statusProcesso}</span>
                            {p.statusPredictus.dataArquivamento && (
                              <span className="ml-2 text-[#f1f1f1]/60">
                                (Arquivamento: {formatData(p.statusPredictus.dataArquivamento)})
                              </span>
                            )}
                          </div>
                        )}
                        {p.partes && p.partes.length > 0 && (
                          <div className="mt-2 space-y-1 text-xs">
                            {p.partes.map((parte, j) => (
                              <div key={j} className="text-[#f1f1f1]/70">
                                <span className="text-[#f1f1f1]/60">{parte.tipo}:</span> {parte.nome}
                                {parte.polo && <span className="ml-1">({parte.polo})</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
