import * as XLSX from "xlsx";
import type { CompanyDataset, CompanyDto } from "@/lib/types";
import type { EmpresaConsultaProcessosExport } from "@/lib/empresa-export-types";
import {
  ADDRESS_KEYS,
  BASIC_KEYS,
  CNAE_SEC_COL_PT,
  COMPLETE_KEYS,
  DATASET_SHEET_NAME,
  DIVIDA_ITEM_COL_PT,
  EMAIL_COL_PT,
  EMPRESA_CAMPO_PT,
  EXPORT_DATASET_ORDER,
  type EmpresaExportSheetId,
  PROCESSO_COL_PT,
  REDE_COL_PT,
  SITE_COL_PT,
  SOCIO_COL_PT,
  TELEFONE_COL_PT,
} from "@/lib/empresa-excel-labels";
import { processoToCsvRow } from "@/lib/legal-processos-export";

function fmtCell(v: unknown): string | number {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  if (typeof v === "number") return Number.isFinite(v) ? v : "";
  return String(v);
}

/** Sempre string — evita o Excel tratar como número (notação científica em CNPJ etc.). */
function asExcelText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return "";
    if (Number.isInteger(v)) return String(v);
    return String(v);
  }
  return String(v);
}

/** Campos cadastrais que devem ir como texto formatado na planilha. */
function formatEmpresaScalarForExcel(key: keyof CompanyDto, v: unknown): string | number {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "boolean") return v ? "Sim" : "Não";

  switch (key) {
    case "cnpj": {
      const d = String(v).replace(/\D/g, "");
      return d ? d.padStart(14, "0").slice(-14) : asExcelText(v);
    }
    case "raiz_cnpj": {
      const d = String(v).replace(/\D/g, "");
      return d || asExcelText(v);
    }
    case "dv_cnpj": {
      const d = String(v).replace(/\D/g, "");
      return d || asExcelText(v);
    }
    case "cep": {
      const d = String(v).replace(/\D/g, "");
      return d ? d.padStart(8, "0").slice(-8) : asExcelText(v);
    }
    case "cnae_principal_classe":
    case "cnae_principal_subclasse":
      return asExcelText(v);
    default:
      return fmtCell(v);
  }
}

function sanitizeSheetName(name: string): string {
  const s = name.replace(/[*?:/\\[\]]/g, "-").trim();
  return s.slice(0, 31) || "Aba";
}

function uniqueSheetName(base: string, used: Set<string>): string {
  let candidate = sanitizeSheetName(base);
  let n = candidate;
  let i = 2;
  while (used.has(n)) {
    const suffix = ` (${i})`;
    n = sanitizeSheetName(candidate.slice(0, Math.max(1, 31 - suffix.length)) + suffix);
    i++;
  }
  used.add(n);
  return n;
}

/** Datasets efetivos: seleção do usuário; se vazia, usa o retorno da API (ex.: basic implícito). */
export function resolveExportDatasets(
  uiSelected: CompanyDataset[],
  apiDatasets: string[] | undefined
): EmpresaExportSheetId[] {
  const set = new Set<EmpresaExportSheetId>();
  if (uiSelected.length > 0) {
    for (const d of uiSelected) set.add(d);
  } else {
    const fromApi = apiDatasets?.length ? apiDatasets : ["basic"];
    for (const raw of fromApi) {
      if (EXPORT_DATASET_ORDER.includes(raw as EmpresaExportSheetId)) {
        set.add(raw as EmpresaExportSheetId);
      }
    }
  }
  return EXPORT_DATASET_ORDER.filter((d) => set.has(d));
}

function scalarFieldRows(company: CompanyDto, keys: readonly (keyof CompanyDto)[]): (string | number)[][] {
  const rows: (string | number)[][] = [];
  for (const k of keys) {
    const v = company[k];
    if (v === null || v === undefined || v === "") continue;
    if (Array.isArray(v)) continue;
    if (typeof v === "object") continue;
    rows.push([EMPRESA_CAMPO_PT[String(k)] ?? String(k), formatEmpresaScalarForExcel(k, v)]);
  }
  return rows;
}

function sheetCampoValor(company: CompanyDto, keys: readonly (keyof CompanyDto)[]): (string | number)[][] {
  const rows = scalarFieldRows(company, keys);
  const aoa: (string | number)[][] = [["Campo", "Valor"]];
  if (rows.length === 0) {
    aoa.push(["—", "Sem dados para este conjunto na resposta."]);
  } else {
    aoa.push(...rows);
  }
  return aoa;
}

function buildCompleteSheet(company: CompanyDto): (string | number)[][] {
  const scalarRows = scalarFieldRows(company, COMPLETE_KEYS);
  const aoa: (string | number)[][] = [];
  if (scalarRows.length > 0) {
    aoa.push(["Campo", "Valor"]);
    aoa.push(...scalarRows);
  } else if (!company.atividades_secundarias?.length) {
    return [["Campo", "Valor"], ["—", "Sem dados para este conjunto na resposta."]];
  }
  if (company.atividades_secundarias?.length) {
    if (aoa.length > 0) aoa.push([]);
    aoa.push(["Atividades secundárias (CNAE)"]);
    aoa.push([...CNAE_SEC_COL_PT]);
    for (const a of company.atividades_secundarias) {
      aoa.push([
        a.classe != null ? asExcelText(a.classe) : "",
        a.desc_classe ?? "",
        a.desc_subclasse ?? "",
        a.divisao != null ? asExcelText(a.divisao) : "",
        a.grupo != null ? asExcelText(a.grupo) : "",
        a.secao ?? "",
        a.subclasse != null ? asExcelText(a.subclasse) : "",
        a.ramo_de_atividade ?? "",
        a.segmento ?? "",
      ]);
    }
  }
  return aoa.length > 0 ? aoa : [["—", "Sem dados."]];
}

function buildOnlinePresenceSheet(company: CompanyDto): (string | number)[][] {
  const aoa: (string | number)[][] = [];
  let any = false;
  if (company.telefones?.length) {
    any = true;
    aoa.push(["Telefones"]);
    aoa.push([...TELEFONE_COL_PT]);
    for (const t of company.telefones) {
      aoa.push([
        asExcelText(t.telefone_completo ?? ""),
        t.whatsapp ? "Sim" : "Não",
        asExcelText(t.fixo_movel ?? ""),
      ]);
    }
    aoa.push([]);
  }
  if (company.sites?.length) {
    any = true;
    aoa.push(["Sites"]);
    aoa.push([...SITE_COL_PT]);
    for (const s of company.sites) {
      aoa.push([s.site ?? ""]);
    }
    aoa.push([]);
  }
  if (company.emails?.length) {
    any = true;
    aoa.push(["E-mails"]);
    aoa.push([...EMAIL_COL_PT]);
    for (const e of company.emails) {
      aoa.push([e.nome ?? "", e.email ?? ""]);
    }
    aoa.push([]);
  }
  const redes: (string | number)[][] = [];
  company.facebook?.forEach((f) => redes.push(["Facebook", f.url ?? ""]));
  company.instagram?.forEach((f) => redes.push(["Instagram", f.url ?? ""]));
  if (company.linkedin_url) redes.push(["LinkedIn", company.linkedin_url]);
  if (company.twitter) redes.push(["Twitter", company.twitter]);
  if (redes.length) {
    any = true;
    aoa.push(["Redes sociais"]);
    aoa.push([...REDE_COL_PT]);
    aoa.push(...redes);
  }
  if (!any) {
    return [["—", "Sem dados de presença online nesta resposta."]];
  }
  return aoa;
}

function buildPartnersSheet(company: CompanyDto): (string | number)[][] {
  if (!company.socios?.length) {
    return [["—", "Sem sócios nesta resposta."]];
  }
  const aoa: (string | number)[][] = [[...SOCIO_COL_PT]];
  for (const s of company.socios) {
    aoa.push([
      s.nome_socio ?? "",
      s.nome_com_cnpj_cpf ?? "",
      s.qualificacao_socio ?? "",
      s.data_entrada_sociedade ?? "",
      s.faixa_etaria_socio ?? "",
      s.sexo ?? "",
      s.cpf != null && s.cpf !== "" ? asExcelText(s.cpf) : "",
      s.cnpj_cpf_socio != null && s.cnpj_cpf_socio !== "" ? asExcelText(s.cnpj_cpf_socio) : "",
      s.qualificacao_representante_legal ?? "",
    ]);
  }
  return aoa;
}

function buildDebtsSheet(company: CompanyDto): (string | number)[][] {
  const d = company.divida;
  if (!d) {
    return [["—", "Sem dados de dívida ativa nesta resposta."]];
  }
  const aoa: (string | number)[][] = [];
  aoa.push(["Totais da dívida (resumo)"]);
  aoa.push(["Campo", "Valor"]);
  const totals: [string, string | number][] = [];
  if (d.total != null) totals.push([EMPRESA_CAMPO_PT.divida_total, fmtCell(d.total)]);
  if (d.total_previdenciaria != null) {
    totals.push([EMPRESA_CAMPO_PT.divida_total_previdenciaria, fmtCell(d.total_previdenciaria)]);
  }
  if (d.total_nao_previdenciaria != null) {
    totals.push([EMPRESA_CAMPO_PT.divida_total_nao_previdenciaria, fmtCell(d.total_nao_previdenciaria)]);
  }
  if (d.total_fgts != null) totals.push([EMPRESA_CAMPO_PT.divida_total_fgts, fmtCell(d.total_fgts)]);
  if (totals.length === 0) {
    aoa.push(["—", "Nenhum total consolidado retornado."]);
  } else {
    aoa.push(...totals);
  }
  aoa.push([]);
  aoa.push(["Inscrições em dívida"]);
  if (d.dividas?.length) {
    aoa.push([...DIVIDA_ITEM_COL_PT]);
    for (const di of d.dividas) {
      aoa.push([
        di.nome_devedor ?? "",
        di.valor_consolidado != null ? fmtCell(di.valor_consolidado) : "",
        di.tipo_divida ?? "",
        di.data_inscricao ?? "",
        di.situacao_inscricao ?? "",
        di.numero_inscricao != null && di.numero_inscricao !== ""
          ? asExcelText(di.numero_inscricao)
          : "",
        di.uf_devedor ?? "",
        di.receita_principal ?? "",
        di.tipo_devedor ?? "",
        di.tipo_pessoa ?? "",
        di.indicador_ajuizado ?? "",
      ]);
    }
  } else {
    aoa.push(["—", "Nenhuma inscrição detalhada retornada."]);
  }
  return aoa;
}

function buildProcessosSheet(
  processosExport: EmpresaConsultaProcessosExport,
  cnpjClean: string
): (string | number)[][] {
  if (processosExport.mode === "error") {
    return [["Erro na consulta de processos"], [processosExport.message]];
  }
  if (processosExport.mode === "data") {
    if (processosExport.items.length === 0) {
      return [["Nenhum processo retornado para este CNPJ."]];
    }
    const aoa: (string | number)[][] = [[...PROCESSO_COL_PT]];
    for (const p of processosExport.items) {
      aoa.push(processoToCsvRow(p, cnpjClean));
    }
    return aoa;
  }
  return [["—", "Processos não incluídos nesta exportação."]];
}

function buildDatasetAoA(dataset: CompanyDataset, company: CompanyDto): (string | number)[][] {
  switch (dataset) {
    case "basic":
      return sheetCampoValor(company, BASIC_KEYS);
    case "complete":
      return buildCompleteSheet(company);
    case "address":
      return sheetCampoValor(company, ADDRESS_KEYS);
    case "online_presence":
      return buildOnlinePresenceSheet(company);
    case "partners":
      return buildPartnersSheet(company);
    case "debts":
      return buildDebtsSheet(company);
    default:
      return [["—", "Dataset não aplicável."]];
  }
}

export function downloadEmpresaConsultaXlsx(
  company: CompanyDto,
  cnpjClean: string,
  processosExport: EmpresaConsultaProcessosExport,
  opts: {
    datasetsFromUi: CompanyDataset[];
    apiDatasets?: string[];
  }
): void {
  const datasets = resolveExportDatasets(opts.datasetsFromUi, opts.apiDatasets);
  const wb = XLSX.utils.book_new();
  const usedNames = new Set<string>();

  for (const ds of datasets) {
    if (ds === "processos") {
      if (processosExport.mode === "omit") continue;
      const aoa = buildProcessosSheet(processosExport, cnpjClean);
      const name = uniqueSheetName(DATASET_SHEET_NAME.processos, usedNames);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), name);
      continue;
    }
    const aoa = buildDatasetAoA(ds, company);
    const name = uniqueSheetName(DATASET_SHEET_NAME[ds], usedNames);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), name);
  }

  if (wb.SheetNames.length === 0) {
    const fallback = XLSX.utils.aoa_to_sheet([
      ["Exportação"],
      ["Nenhuma aba gerada — verifique os datasets selecionados."],
    ]);
    XLSX.utils.book_append_sheet(wb, fallback, sanitizeSheetName("Exportação"));
  }

  const fname = `consulta-empresa-${cnpjClean}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fname);
}
