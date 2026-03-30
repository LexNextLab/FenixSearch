import type { LegalProcessoItem, LegalProcessoValorCausa } from "@/lib/kipflow";

/** Formata número de processo no padrão CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO */
export function formatNumeroCNJ(raw: string | number | undefined): string {
  const s = typeof raw === "number" ? String(raw) : raw ?? "";
  const digits = s.replace(/\D/g, "");
  if (digits.length < 20) return s || "—";
  return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13, 14)}.${digits.slice(14, 16)}.${digits.slice(16, 20)}`;
}

export function getProcessoNumeroRaw(p: LegalProcessoItem): string {
  const n = p.numeroProcesso ?? p.numeroProcessoUnico ?? p.numero ?? (p as Record<string, unknown>).numero;
  return typeof n === "string" || typeof n === "number" ? String(n) : "";
}

export function formatProcessoNumero(p: LegalProcessoItem): string {
  const raw = getProcessoNumeroRaw(p);
  if (!raw) return "—";
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 20 ? formatNumeroCNJ(raw) : raw;
}

export function formatValorCausa(valorCausa: LegalProcessoItem["valorCausa"]): string | null {
  if (valorCausa == null) return null;
  const valor =
    typeof valorCausa === "object" && "valor" in valorCausa
      ? (valorCausa as LegalProcessoValorCausa).valor
      : typeof valorCausa === "number"
        ? valorCausa
        : null;
  if (valor == null || typeof valor !== "number" || Number.isNaN(valor)) return null;
  const moeda =
    typeof valorCausa === "object" && "moeda" in valorCausa
      ? (valorCausa as LegalProcessoValorCausa).moeda ?? "R$"
      : "R$";
  return `${moeda} ${valor.toLocaleString("pt-BR")}`;
}

export function formatLegalProcessoData(data: string | undefined): string {
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

/** Ano da distribuição no formato AAAA (ex.: 2026). */
export function formatDataDistribuicaoAno(data: string | undefined): string {
  if (!data) return "";
  const d = new Date(data);
  if (!Number.isNaN(d.getTime())) return String(d.getFullYear());
  const m = String(data).match(/\b(19|20)\d{2}\b/);
  return m ? m[0] : "";
}

function classifyPoloParte(poloRaw: string | undefined): "ativo" | "passivo" | "neither" {
  const polo = (poloRaw ?? "").toUpperCase().trim();
  if (polo.includes("PASSIVO")) return "passivo";
  if (polo.includes("ATIVO")) return "ativo";
  return "neither";
}

/**
 * Polos a partir da lista `partes`, na ordem em que aparecem na API:
 * nomes únicos com polo ATIVO e com polo PASSIVO, separados por "; ".
 */
export function formatPolosPrincipaisFromPartes(
  partes: LegalProcessoItem["partes"]
): { poloAtivoPrincipal: string; poloPassivoPrincipal: string } {
  const ativos: string[] = [];
  const passivos: string[] = [];
  const seenAtivo = new Set<string>();
  const seenPassivo = new Set<string>();
  for (const pt of partes ?? []) {
    const nome = (pt.nome ?? "").replace(/\s+/g, " ").trim();
    if (!nome) continue;
    const kind = classifyPoloParte(pt.polo);
    if (kind === "ativo") {
      if (!seenAtivo.has(nome)) {
        seenAtivo.add(nome);
        ativos.push(nome);
      }
    } else if (kind === "passivo") {
      if (!seenPassivo.has(nome)) {
        seenPassivo.add(nome);
        passivos.push(nome);
      }
    }
  }
  return {
    poloAtivoPrincipal: ativos.join("; "),
    poloPassivoPrincipal: passivos.join("; "),
  };
}

export function getAreaProcesso(p: LegalProcessoItem): string {
  const ramo = p.statusPredictus?.ramoDireito;
  if (ramo) return ramo;
  const seg = p.segmento ?? "";
  if (seg.includes("TRABALH") || seg.includes("TRT")) return "Trabalhista";
  if (seg.includes("FEDERAL") || seg.includes("TRF")) return "Federal";
  if (seg.includes("ESTADUAL") || seg.includes("TJ")) return "Estadual";
  if (seg.includes("ELEITORAL")) return "Eleitoral";
  return seg || "Outros";
}

export function getPoloEmpresa(p: LegalProcessoItem, cnpjClean: string): "ativo" | "passivo" | "outro" {
  const cnpj14 = cnpjClean.replace(/\D/g, "").padStart(14, "0").slice(-14);
  const cnpjRaiz = cnpj14.slice(0, 8);
  for (const parte of p.partes ?? []) {
    const parteCnpj = parte.cnpj?.replace(/\D/g, "");
    const parteRaiz = parte.cnpjRaiz;
    const match =
      (parteCnpj && parteCnpj.slice(-14) === cnpj14) ||
      (parteRaiz && parteRaiz === cnpjRaiz) ||
      (parteCnpj && parteCnpj.startsWith(cnpjRaiz));
    if (match) {
      const polo = (parte.polo ?? "").toUpperCase();
      if (polo.includes("PASSIVO")) return "passivo";
      if (polo.includes("ATIVO")) return "ativo";
    }
  }
  return "outro";
}

export function escapeCsvCell(val: string | number | null | undefined): string {
  const s = val == null ? "" : String(val);
  if (s.includes(";") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export const PROCESSOS_CSV_COLUMNS = [
  "Número",
  "Tribunal",
  "UF",
  "Segmento",
  "Data Distribuição",
  "Valor da Causa",
  "Assunto",
  "Classe Processual",
  "Juiz",
  "Órgão Julgador",
  "URL",
  "Polo Empresa",
  "Área",
  "Status",
  "Data Arquivamento",
  "Ramo Direito",
  "POLO ATIVO PRINCIPAL",
  "POLO PASSIVO PRINCIPAL",
] as const;

export function processoToCsvRow(p: LegalProcessoItem, cnpjClean: string): string[] {
  const valor = formatValorCausa(p.valorCausa);
  const assuntos =
    p.assuntosCNJ?.filter((a) => a.ePrincipal).map((a) => a.titulo).join("; ") ??
    p.assuntosCNJ?.[0]?.titulo ??
    p.assunto;
  const polo = getPoloEmpresa(p, cnpjClean);
  const area = getAreaProcesso(p);
  const { poloAtivoPrincipal, poloPassivoPrincipal } = formatPolosPrincipaisFromPartes(p.partes);
  return [
    formatProcessoNumero(p),
    p.tribunal ?? "",
    p.uf ?? "",
    p.segmento ?? "",
    formatDataDistribuicaoAno(p.dataDistribuicao),
    valor ?? "",
    assuntos ?? "",
    p.classeProcessual?.nome ?? "",
    p.juiz ?? "",
    p.orgaoJulgador ?? "",
    p.urlProcesso ?? "",
    polo,
    area,
    p.statusPredictus?.statusProcesso ?? "",
    p.statusPredictus?.dataArquivamento
      ? formatLegalProcessoData(p.statusPredictus.dataArquivamento)
      : "",
    p.statusPredictus?.ramoDireito ?? "",
    poloAtivoPrincipal,
    poloPassivoPrincipal,
  ];
}

export function buildProcessosCsvContent(processos: LegalProcessoItem[], cnpjClean: string): string {
  const rows = [PROCESSOS_CSV_COLUMNS.join(";")];
  for (const p of processos) {
    const row = processoToCsvRow(p, cnpjClean).map(escapeCsvCell).join(";");
    rows.push(row);
  }
  return "\uFEFF" + rows.join("\r\n");
}

export function downloadProcessosCsv(processos: LegalProcessoItem[], cnpjClean: string): void {
  const csv = buildProcessosCsvContent(processos, cnpjClean);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `processos-${cnpjClean}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
