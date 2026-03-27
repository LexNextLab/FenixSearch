import * as XLSX from "xlsx";
import type { LegalProcessoItem } from "./kipflow";
import { PROCESSOS_CSV_COLUMNS, processoToCsvRow } from "./legal-processos-export";
import type { CompanyDataset, CompanyDto, DividaItemDto, SocioDto } from "./types";

/** Nome da aba no Excel (máx. 31 caracteres; sem * ? : \\ / [ ]). */
export const DATASET_SHEET_NAME: Record<CompanyDataset, string> = {
  basic: "Básico",
  complete: "Completo",
  address: "Endereço",
  online_presence: "Presença online",
  partners: "Sócios",
  debts: "Dívida ativa",
};

function padCnpj(v: unknown): string {
  if (v == null || v === "") return "";
  const d = String(v).replace(/\D/g, "");
  return d.length ? d.padStart(14, "0") : "";
}

function padCep(v: unknown): string {
  if (v == null || v === "") return "";
  const d = String(v).replace(/\D/g, "");
  return d.length ? d.padStart(8, "0") : "";
}

/**
 * Valor para planilha Excel: preserva número, booleano; CNPJ/CEP como texto;
 * datas ISO como string ou Date quando parseável.
 */
export function cellToExcelValue(
  columnKey: string,
  value: unknown
): string | number | boolean | Date {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value;
  const key = columnKey.toLowerCase();
  if (key === "cnpj" || key.includes("cnpj_cpf")) {
    return padCnpj(value);
  }
  if (key === "cep") {
    return padCep(value);
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : "";
  }
  if (typeof value === "string") {
    const t = value.trim();
    if (/^\d{4}-\d{2}-\d{2}(T|$)/.test(t)) {
      const d = new Date(t);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return value;
  }
  return String(value);
}

function companyRef(c: CompanyDto) {
  return {
    CNPJ: padCnpj(c.cnpj),
    razao_social: c.razao_social ?? "",
    nome_fantasia: c.nome_fantasia ?? "",
  };
}

function joinSecondaryActivities(c: CompanyDto): string {
  const list = c.atividades_secundarias;
  if (!list?.length) return "";
  return list
    .map((a) => a.desc_subclasse ?? a.desc_classe ?? String(a.classe ?? ""))
    .filter(Boolean)
    .join(" | ");
}

export function buildBasicRows(companies: CompanyDto[]): Record<string, string | number | boolean | Date>[] {
  return companies.map((c) => {
    const r = companyRef(c);
    return {
      ...r,
      raiz_cnpj: c.raiz_cnpj ?? "",
      dv_cnpj: c.dv_cnpj ?? "",
      situacao_cadastral: c.situacao_cadastral ?? "",
      data_inicio_atividade: c.data_inicio_atividade ?? "",
      natureza_juridica: c.natureza_juridica ?? "",
      porte: c.porte ?? "",
      empresa_publico_privada: c.empresa_publico_privada ?? "",
      matriz: c.matriz ?? "",
      qtde_filiais: c.qtde_filiais ?? "",
      segmento: c.segmento ?? "",
      cnae_principal_classe: c.cnae_principal_classe ?? "",
      cnae_principal_subclasse: c.cnae_principal_subclasse ?? "",
      cnae_principal_desc_subclasse: c.cnae_principal_desc_subclasse ?? "",
      cnae_principal_desc_classe: c.cnae_principal_desc_classe ?? "",
      cnae_principal_desc_grupo: c.cnae_principal_desc_grupo ?? "",
      cnae_principal_desc_secao: c.cnae_principal_desc_secao ?? "",
      cnae_principal_desc_divisao: c.cnae_principal_desc_divisao ?? "",
      atividades_secundarias: joinSecondaryActivities(c),
    };
  });
}

export function buildCompleteRows(companies: CompanyDto[]): Record<string, string | number | boolean>[] {
  return companies.map((c) => ({
    ...companyRef(c),
    capital_social: c.capital_social ?? "",
    faturamento: c.faturamento ?? "",
    faturamento_grupo: c.faturamento_grupo ?? "",
    faixa_faturamento_grupo: c.faixa_faturamento_grupo ?? "",
    faixa_funcionarios_grupo: c.faixa_funcionarios_grupo ?? "",
    forma_de_tributacao: c.forma_de_tributacao ?? "",
    forma_de_tributacao_ajustada: c.forma_de_tributacao_ajustada ?? "",
    opcao_pelo_simples: c.opcao_pelo_simples ?? "",
    opcao_pelo_mei: c.opcao_pelo_mei ?? "",
    aliquota_percentual_rat: c.aliquota_percentual_rat ?? "",
    possui_pat: c.possui_pat ?? "",
    qtde_beneficiarios_pat: c.qtde_beneficiarios_pat ?? "",
    qtde_registros_inpi: c.qtde_registros_inpi ?? "",
  }));
}

export function buildAddressRows(companies: CompanyDto[]): Record<string, string | number | boolean>[] {
  return companies.map((c) => ({
    ...companyRef(c),
    endereco: c.endereco ?? "",
    bairro: c.bairro ?? "",
    CEP: padCep(c.cep),
    municipio: c.municipio ?? "",
    uf: c.uf ?? "",
    macrorregiao: c.macrorregiao ?? "",
    lat: c.lat ?? "",
    lon: c.lon ?? "",
    perfil_socioeconomico_bairro_desc: c.perfil_socioeconomico_bairro_desc ?? "",
  }));
}

function formatSites(c: CompanyDto): string {
  if (!c.sites?.length) return "";
  return c.sites.map((s) => s.site ?? "").filter(Boolean).join(" | ");
}

function formatEmails(c: CompanyDto): string {
  if (!c.emails?.length) return "";
  return c.emails.map((e) => (e.nome ? `${e.nome}: ${e.email}` : e.email ?? "")).filter(Boolean).join(" | ");
}

function formatPhones(c: CompanyDto): string {
  if (!c.telefones?.length) return "";
  return c.telefones
    .map((t) => {
      const base = t.telefone_completo ?? "";
      const tags = [t.whatsapp ? "WhatsApp" : "", t.fixo_movel ?? ""].filter(Boolean).join(" ");
      return tags ? `${base} (${tags})` : base;
    })
    .filter(Boolean)
    .join(" | ");
}

function formatSocialUrls(label: string, urls: { url?: string }[] | undefined): string {
  if (!urls?.length) return "";
  return urls.map((u) => u.url ?? "").filter(Boolean).map((u) => `${label}:${u}`).join(" | ");
}

export function buildOnlinePresenceRows(companies: CompanyDto[]): Record<string, string | number | boolean>[] {
  return companies.map((c) => ({
    ...companyRef(c),
    sites: formatSites(c),
    emails: formatEmails(c),
    telefones: formatPhones(c),
    facebook: formatSocialUrls("facebook", c.facebook),
    instagram: formatSocialUrls("instagram", c.instagram),
    linkedin_url: c.linkedin_url ?? "",
    twitter: c.twitter ?? "",
  }));
}

function socioRow(c: CompanyDto, s: SocioDto): Record<string, string | number | boolean> {
  return {
    ...companyRef(c),
    nome_socio: s.nome_socio ?? s.nome_com_cnpj_cpf ?? "",
    cnpj_cpf_socio: s.cnpj_cpf_socio ?? s.cpf ?? "",
    qualificacao_socio: s.qualificacao_socio ?? "",
    qualificacao_representante_legal: s.qualificacao_representante_legal ?? "",
    data_entrada_sociedade: s.data_entrada_sociedade ?? "",
    data_nascimento: s.data_nascimento ?? "",
    faixa_etaria_socio: s.faixa_etaria_socio ?? "",
    sexo: s.sexo ?? "",
    identificador_socio: s.identificador_socio ?? "",
  };
}

export function buildPartnersRows(companies: CompanyDto[]): Record<string, string | number | boolean>[] {
  const rows: Record<string, string | number | boolean>[] = [];
  for (const c of companies) {
    const list = c.socios;
    if (list?.length) {
      for (const s of list) rows.push(socioRow(c, s));
    } else {
      rows.push({
        ...companyRef(c),
        nome_socio: "",
        cnpj_cpf_socio: "",
        qualificacao_socio: "",
        qualificacao_representante_legal: "",
        data_entrada_sociedade: "",
        data_nascimento: "",
        faixa_etaria_socio: "",
        sexo: "",
        identificador_socio: "",
      });
    }
  }
  return rows;
}

function dividaItemRow(
  c: CompanyDto,
  d: DividaItemDto,
  totals: CompanyDto["divida"]
): Record<string, string | number | boolean> {
  return {
    ...companyRef(c),
    total_consolidado: totals?.total ?? "",
    total_previdenciaria: totals?.total_previdenciaria ?? "",
    total_nao_previdenciaria: totals?.total_nao_previdenciaria ?? "",
    total_fgts: totals?.total_fgts ?? "",
    nome_devedor: d.nome_devedor ?? "",
    valor_consolidado: d.valor_consolidado ?? "",
    tipo_divida: d.tipo_divida ?? "",
    tipo_devedor: d.tipo_devedor ?? "",
    tipo_pessoa: d.tipo_pessoa ?? "",
    data_inscricao: d.data_inscricao ?? "",
    numero_inscricao: d.numero_inscricao ?? "",
    situacao_inscricao: d.situacao_inscricao ?? "",
    tipo_situacao_inscricao: d.tipo_situacao_inscricao ?? "",
    receita_principal: d.receita_principal ?? "",
    uf_devedor: d.uf_devedor ?? "",
    unidade_responsavel: d.unidade_responsavel ?? "",
    indicador_ajuizado: d.indicador_ajuizado ?? "",
  };
}

export function buildDebtsRows(companies: CompanyDto[]): Record<string, string | number | boolean>[] {
  const rows: Record<string, string | number | boolean>[] = [];
  for (const c of companies) {
    const div = c.divida;
    const items = div?.dividas;
    if (items?.length) {
      for (const d of items) rows.push(dividaItemRow(c, d, div));
    } else {
      rows.push({
        ...companyRef(c),
        total_consolidado: div?.total ?? "",
        total_previdenciaria: div?.total_previdenciaria ?? "",
        total_nao_previdenciaria: div?.total_nao_previdenciaria ?? "",
        total_fgts: div?.total_fgts ?? "",
        nome_devedor: "",
        valor_consolidado: "",
        tipo_divida: "",
        tipo_devedor: "",
        tipo_pessoa: "",
        data_inscricao: "",
        numero_inscricao: "",
        situacao_inscricao: "",
        tipo_situacao_inscricao: "",
        receita_principal: "",
        uf_devedor: "",
        unidade_responsavel: "",
        indicador_ajuizado: "",
      });
    }
  }
  return rows;
}

export function getRowsForDataset(dataset: CompanyDataset, companies: CompanyDto[]) {
  switch (dataset) {
    case "basic":
      return buildBasicRows(companies);
    case "complete":
      return buildCompleteRows(companies);
    case "address":
      return buildAddressRows(companies);
    case "online_presence":
      return buildOnlinePresenceRows(companies);
    case "partners":
      return buildPartnersRows(companies);
    case "debts":
      return buildDebtsRows(companies);
    default:
      return [];
  }
}

/** Aplica tipos adequados por coluna para o Excel (CNPJ/CEP texto). */
function rowsForXlsxSheet(rows: Record<string, string | number | boolean | Date>[]) {
  if (rows.length === 0) return [];
  const keys = Object.keys(rows[0]);
  return rows.map((row) => {
    const out: Record<string, string | number | boolean | Date> = {};
    for (const k of keys) {
      out[k] = cellToExcelValue(k, row[k]) as string | number | boolean | Date;
    }
    return out;
  });
}

function sanitizeSheetName(base: string, used: Set<string>): string {
  let s = base.replace(/[*?:/\\[\]]/g, "-").trim();
  s = s.slice(0, 31) || "Aba";
  let candidate = s;
  let n = 2;
  while (used.has(candidate)) {
    const suffix = ` (${n})`;
    candidate = (s.slice(0, Math.max(1, 31 - suffix.length)) + suffix).replace(
      /[*?:/\\[\]]/g,
      "-"
    );
    n++;
  }
  used.add(candidate);
  return candidate;
}

function processosToJsonRows(
  items: LegalProcessoItem[],
  cnpjClean: string
): Record<string, string>[] {
  return items.map((p) => {
    const cells = processoToCsvRow(p, cnpjClean.replace(/\D/g, "").padStart(14, "0"));
    const row: Record<string, string> = {};
    PROCESSOS_CSV_COLUMNS.forEach((col, i) => {
      row[col] = cells[i] ?? "";
    });
    return row;
  });
}

/** Um único arquivo .xlsx: uma aba por dataset consultado; opcional aba Processos. */
export function downloadXlsxWorkbook(
  datasets: CompanyDataset[],
  companies: CompanyDto[],
  baseFileName: string,
  opts?: { processos?: LegalProcessoItem[]; cnpjClean?: string }
) {
  const wb = XLSX.utils.book_new();
  const usedNames = new Set<string>();

  for (const dataset of datasets) {
    const raw = getRowsForDataset(dataset, companies);
    if (raw.length === 0) continue;
    const rows = rowsForXlsxSheet(raw as Record<string, string | number | boolean | Date>[]);
    const ws = XLSX.utils.json_to_sheet(rows);
    const sheetName = sanitizeSheetName(DATASET_SHEET_NAME[dataset], usedNames);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  const proc = opts?.processos;
  const cnpj = opts?.cnpjClean?.replace(/\D/g, "") ?? "";
  if (proc?.length && cnpj.length === 14) {
    const pr = processosToJsonRows(proc, cnpj);
    const wsP = XLSX.utils.json_to_sheet(pr);
    const name = sanitizeSheetName("Processos", usedNames);
    XLSX.utils.book_append_sheet(wb, wsP, name);
  }

  if (wb.SheetNames.length === 0) return;

  XLSX.writeFile(wb, `${baseFileName}.xlsx`);
}
